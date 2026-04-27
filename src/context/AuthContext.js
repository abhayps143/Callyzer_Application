import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const isTokenExpired = (token) => {
        try {
            const { exp } = jwtDecode(token);
            return Date.now() >= exp * 1000; // exp milliseconds mein compare
        } catch {
            return true; // decode fail = treat as expired
        }
    };

    useEffect(() => {
        const loadToken = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');
                if (savedToken && !isTokenExpired(savedToken)) {
                const savedUserParsed = JSON.parse(savedUser);
                const validRoles = ['super_admin', 'business_user'];
                if (validRoles.includes(savedUserParsed?.role)) {
                    setToken(savedToken);
                    setUser(savedUserParsed);
                } else {
                    // Invalid role — clear session
                    await AsyncStorage.multiRemove(['token', 'user']);
                    console.log('[Auth] Invalid role, auto-logout');
                }
            } else if (savedToken) {
                await AsyncStorage.multiRemove(['token', 'user']);
                console.log('[Auth] Token expired, auto-logout');
            }

            } catch (e) {
                console.log('Token load error:', e);
            }
            setLoading(false);
        };
        loadToken();
    }, []);

    const login = async (tokenValue, userData) => {
        console.log('[Auth] Saving token');
        await AsyncStorage.setItem('token', tokenValue);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setToken(tokenValue);
        setUser(userData);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};