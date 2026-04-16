// import React, { createContext, useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [token, setToken] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const loadToken = async () => {
//             try {
//                 const savedToken = await AsyncStorage.getItem('token');
//                 const savedUser = await AsyncStorage.getItem('user');
//                 if (savedToken) {
//                     setToken(savedToken);
//                     setUser(JSON.parse(savedUser));
//                 }
//             } catch (e) {
//                 console.log('Token load error:', e);
//             }
//             setLoading(false);
//         };
//         loadToken();
//     }, []);

//     const login = async (tokenValue, userData) => {
//         await AsyncStorage.setItem('token', tokenValue);
//         await AsyncStorage.setItem('user', JSON.stringify(userData));
//         setToken(tokenValue);
//         setUser(userData);
//     };

//     const logout = async () => {
//         await AsyncStorage.removeItem('token');
//         await AsyncStorage.removeItem('user');
//         setToken(null);
//         setUser(null);
//     };

//     return (
//         <AuthContext.Provider value={{ user, token, login, logout, loading }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');
                if (savedToken) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (e) {
                console.log('Token load error:', e);
            }
            setLoading(false);
        };
        loadToken();
    }, []);

    const login = async (tokenValue, userData) => {
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