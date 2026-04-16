import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Email aur password daalo');
            return;
        }
        setLoading(true);
        try {
            const data = await api.login(email, password);
            if (data.token) {
                await login(data.token, data.user);
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid credentials');
            }
        } catch (e) {
            Alert.alert('Error', 'Server se connect nahi ho pa raha. IP check karo.');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <Text style={styles.logo}>📞</Text>
                <Text style={styles.title}>Callyzer</Text>
                <Text style={styles.subtitle}>Call Management System</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Login</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    inner: { flex: 1, justifyContent: 'center', padding: 24 },
    logo: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
    title: { fontSize: 36, fontWeight: 'bold', color: '#6366f1', textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 40 },
    input: {
        backgroundColor: '#1e293b', color: '#fff', padding: 16,
        borderRadius: 12, marginBottom: 16, fontSize: 16,
        borderWidth: 1, borderColor: '#334155',
    },
    button: {
        backgroundColor: '#6366f1', padding: 16,
        borderRadius: 12, alignItems: 'center', marginTop: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});