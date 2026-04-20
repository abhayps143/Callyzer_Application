// import React, { useState, useContext } from 'react';
// import {
//     View, Text, TextInput, TouchableOpacity,
//     StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
// } from 'react-native';
// import { AuthContext } from '../context/AuthContext';
// import { api } from '../services/api';

// export default function LoginScreen() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const { login } = useContext(AuthContext);

//     const handleLogin = async () => {
//         if (!email || !password) {
//             Alert.alert('Error', 'Email aur password daalo');
//             return;
//         }
//         setLoading(true);
//         try {
//             const data = await api.login(email, password);
//             if (data.token) {
//                 await login(data.token, data.user);
//             } else {
//                 Alert.alert('Login Failed', data.message || 'Invalid credentials');
//             }
//         } catch (e) {
//             Alert.alert('Error', 'Server se connect nahi ho pa raha. IP check karo.');
//         }
//         setLoading(false);
//     };

//     return (
//         <KeyboardAvoidingView
//             style={styles.container}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//             <View style={styles.inner}>
//                 <Text style={styles.logo}>📞</Text>
//                 <Text style={styles.title}>Callyzer</Text>
//                 <Text style={styles.subtitle}>Call Management System</Text>

//                 <TextInput
//                     style={styles.input}
//                     placeholder="Email"
//                     placeholderTextColor="#64748b"
//                     value={email}
//                     onChangeText={setEmail}
//                     autoCapitalize="none"
//                     keyboardType="email-address"
//                 />
//                 <TextInput
//                     style={styles.input}
//                     placeholder="Password"
//                     placeholderTextColor="#64748b"
//                     value={password}
//                     onChangeText={setPassword}
//                     secureTextEntry
//                 />
//                 <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//                     {loading
//                         ? <ActivityIndicator color="#fff" />
//                         : <Text style={styles.buttonText}>Login</Text>
//                     }
//                 </TouchableOpacity>
//             </View>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     inner: { flex: 1, justifyContent: 'center', padding: 24 },
//     logo: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
//     title: { fontSize: 36, fontWeight: 'bold', color: '#6366f1', textAlign: 'center' },
//     subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 40 },
//     input: {
//         backgroundColor: '#1e293b', color: '#fff', padding: 16,
//         borderRadius: 12, marginBottom: 16, fontSize: 16,
//         borderWidth: 1, borderColor: '#334155',
//     },
//     button: {
//         backgroundColor: '#6366f1', padding: 16,
//         borderRadius: 12, alignItems: 'center', marginTop: 8,
//     },
//     buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
// });


import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow } from '../theme';

export default function LoginScreen() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [pwdVisible, setPwdVisible] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
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
        } catch {
            Alert.alert('Connection Error', 'Unable to reach server. Check your network.');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <View style={styles.inner}>
                {/* Logo */}
                <View style={styles.logoWrap}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoEmoji}>📞</Text>
                    </View>
                </View>

                {/* Headline */}
                <Text style={styles.title}>Callyzer</Text>
                <Text style={styles.subtitle}>Sign in to your workspace</Text>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@company.com"
                        placeholderTextColor={C.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
                    <View style={styles.pwdRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="••••••••"
                            placeholderTextColor={C.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!pwdVisible}
                        />
                        <TouchableOpacity
                            style={styles.eyeBtn}
                            onPress={() => setPwdVisible(v => !v)}
                        >
                            <Text style={styles.eyeText}>{pwdVisible ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.btnText}>Sign In</Text>
                        }
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>Call Management System</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: C.bg },
    inner:      { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },

    logoWrap:   { alignItems: 'center', marginBottom: 20 },
    logoIcon:   {
        width: 72, height: 72, borderRadius: 22,
        backgroundColor: C.primarySoft,
        justifyContent: 'center', alignItems: 'center',
    },
    logoEmoji:  { fontSize: 36 },

    title:      { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', letterSpacing: -0.5 },
    subtitle:   { fontSize: 15, color: C.textSub, textAlign: 'center', marginTop: 6, marginBottom: 32 },

    card: {
        backgroundColor: C.surface,
        borderRadius: 20, padding: 24,
        ...shadow,
    },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 8 },
    input: {
        backgroundColor: C.surfaceAlt,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: C.text,
        borderWidth: 1.5, borderColor: C.border,
        marginBottom: 4,
    },
    pwdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    eyeBtn:     { paddingHorizontal: 10, paddingVertical: 14 },
    eyeText:    { fontSize: 18 },

    btn: {
        backgroundColor: C.primary,
        borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', marginTop: 20,
    },
    btnDisabled: { opacity: 0.7 },
    btnText:    { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

    footer:     { color: C.textMuted, textAlign: 'center', fontSize: 13, marginTop: 28 },
});
