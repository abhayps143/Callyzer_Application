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


// import React, { useState, useContext } from 'react';
// import {
//     View, Text, TextInput, TouchableOpacity,
//     StyleSheet, Alert, ActivityIndicator,
//     KeyboardAvoidingView, Platform, StatusBar
// } from 'react-native';
// import { AuthContext } from '../context/AuthContext';
// import { api } from '../services/api';
// import { C, shadow } from '../theme';

// export default function LoginScreen() {
//     const [email, setEmail]       = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading]   = useState(false);
//     const [pwdVisible, setPwdVisible] = useState(false);
//     const { login } = useContext(AuthContext);

//     const handleLogin = async () => {
//         if (!email || !password) {
//             Alert.alert('Missing fields', 'Please enter your email and password.');
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
//         } catch {
//             Alert.alert('Connection Error', 'Unable to reach server. Check your network.');
//         }
//         setLoading(false);
//     };

//     return (
//         <KeyboardAvoidingView
//             style={styles.container}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//             <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//             <View style={styles.inner}>
//                 {/* Logo */}
//                 <View style={styles.logoWrap}>
//                     <View style={styles.logoIcon}>
//                         <Text style={styles.logoEmoji}>📞</Text>
//                     </View>
//                 </View>

//                 {/* Headline */}
//                 <Text style={styles.title}>Callyzer</Text>
//                 <Text style={styles.subtitle}>Sign in to your workspace</Text>

//                 {/* Card */}
//                 <View style={styles.card}>
//                     <Text style={styles.fieldLabel}>Email</Text>
//                     <TextInput
//                         style={styles.input}
//                         placeholder="you@company.com"
//                         placeholderTextColor={C.textMuted}
//                         value={email}
//                         onChangeText={setEmail}
//                         autoCapitalize="none"
//                         keyboardType="email-address"
//                     />

//                     <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
//                     <View style={styles.pwdRow}>
//                         <TextInput
//                             style={[styles.input, { flex: 1, marginBottom: 0 }]}
//                             placeholder="••••••••"
//                             placeholderTextColor={C.textMuted}
//                             value={password}
//                             onChangeText={setPassword}
//                             secureTextEntry={!pwdVisible}
//                         />
//                         <TouchableOpacity
//                             style={styles.eyeBtn}
//                             onPress={() => setPwdVisible(v => !v)}
//                         >
//                             <Text style={styles.eyeText}>{pwdVisible ? '🙈' : '👁️'}</Text>
//                         </TouchableOpacity>
//                     </View>

//                     <TouchableOpacity
//                         style={[styles.btn, loading && styles.btnDisabled]}
//                         onPress={handleLogin}
//                         disabled={loading}
//                         activeOpacity={0.85}
//                     >
//                         {loading
//                             ? <ActivityIndicator color="#fff" />
//                             : <Text style={styles.btnText}>Sign In</Text>
//                         }
//                     </TouchableOpacity>
//                 </View>

//                 <Text style={styles.footer}>Call Management System</Text>
//             </View>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container:  { flex: 1, backgroundColor: C.bg },
//     inner:      { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },

//     logoWrap:   { alignItems: 'center', marginBottom: 20 },
//     logoIcon:   {
//         width: 72, height: 72, borderRadius: 22,
//         backgroundColor: C.primarySoft,
//         justifyContent: 'center', alignItems: 'center',
//     },
//     logoEmoji:  { fontSize: 36 },

//     title:      { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', letterSpacing: -0.5 },
//     subtitle:   { fontSize: 15, color: C.textSub, textAlign: 'center', marginTop: 6, marginBottom: 32 },

//     card: {
//         backgroundColor: C.surface,
//         borderRadius: 20, padding: 24,
//         ...shadow,
//     },
//     fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 8 },
//     input: {
//         backgroundColor: C.surfaceAlt,
//         borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
//         fontSize: 15, color: C.text,
//         borderWidth: 1.5, borderColor: C.border,
//         marginBottom: 4,
//     },
//     pwdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
//     eyeBtn:     { paddingHorizontal: 10, paddingVertical: 14 },
//     eyeText:    { fontSize: 18 },

//     btn: {
//         backgroundColor: C.primary,
//         borderRadius: 14, paddingVertical: 16,
//         alignItems: 'center', marginTop: 20,
//     },
//     btnDisabled: { opacity: 0.7 },
//     btnText:    { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

//     footer:     { color: C.textMuted, textAlign: 'center', fontSize: 13, marginTop: 28 },
// });


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


// import React, { useState, useContext } from 'react';
// import {
//     View, Text, TextInput, TouchableOpacity,
//     StyleSheet, Alert, ActivityIndicator,
//     KeyboardAvoidingView, Platform, StatusBar
// } from 'react-native';
// import { AuthContext } from '../context/AuthContext';
// import { api } from '../services/api';
// import { C, shadow } from '../theme';

// export default function LoginScreen() {
//     const [email, setEmail]       = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading]   = useState(false);
//     const [pwdVisible, setPwdVisible] = useState(false);
//     const { login } = useContext(AuthContext);

//     const handleLogin = async () => {
//         if (!email || !password) {
//             Alert.alert('Missing fields', 'Please enter your email and password.');
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
//         } catch {
//             Alert.alert('Connection Error', 'Unable to reach server. Check your network.');
//         }
//         setLoading(false);
//     };

//     return (
//         <KeyboardAvoidingView
//             style={styles.container}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         >
//             <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//             <View style={styles.inner}>
//                 {/* Logo */}
//                 <View style={styles.logoWrap}>
//                     <View style={styles.logoIcon}>
//                         <Text style={styles.logoEmoji}>📞</Text>
//                     </View>
//                 </View>

//                 {/* Headline */}
//                 <Text style={styles.title}>Callyzer</Text>
//                 <Text style={styles.subtitle}>Sign in to your workspace</Text>

//                 {/* Card */}
//                 <View style={styles.card}>
//                     <Text style={styles.fieldLabel}>Email</Text>
//                     <TextInput
//                         style={styles.input}
//                         placeholder="you@company.com"
//                         placeholderTextColor={C.textMuted}
//                         value={email}
//                         onChangeText={setEmail}
//                         autoCapitalize="none"
//                         keyboardType="email-address"
//                     />

//                     <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
//                     <View style={styles.pwdRow}>
//                         <TextInput
//                             style={[styles.input, { flex: 1, marginBottom: 0 }]}
//                             placeholder="••••••••"
//                             placeholderTextColor={C.textMuted}
//                             value={password}
//                             onChangeText={setPassword}
//                             secureTextEntry={!pwdVisible}
//                         />
//                         <TouchableOpacity
//                             style={styles.eyeBtn}
//                             onPress={() => setPwdVisible(v => !v)}
//                         >
//                             <Text style={styles.eyeText}>{pwdVisible ? '🙈' : '👁️'}</Text>
//                         </TouchableOpacity>
//                     </View>

//                     <TouchableOpacity
//                         style={[styles.btn, loading && styles.btnDisabled]}
//                         onPress={handleLogin}
//                         disabled={loading}
//                         activeOpacity={0.85}
//                     >
//                         {loading
//                             ? <ActivityIndicator color="#fff" />
//                             : <Text style={styles.btnText}>Sign In</Text>
//                         }
//                     </TouchableOpacity>
//                 </View>

//                 <Text style={styles.footer}>Call Management System</Text>
//             </View>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container:  { flex: 1, backgroundColor: C.bg },
//     inner:      { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },

//     logoWrap:   { alignItems: 'center', marginBottom: 20 },
//     logoIcon:   {
//         width: 72, height: 72, borderRadius: 22,
//         backgroundColor: C.primarySoft,
//         justifyContent: 'center', alignItems: 'center',
//     },
//     logoEmoji:  { fontSize: 36 },

//     title:      { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', letterSpacing: -0.5 },
//     subtitle:   { fontSize: 15, color: C.textSub, textAlign: 'center', marginTop: 6, marginBottom: 32 },

//     card: {
//         backgroundColor: C.surface,
//         borderRadius: 20, padding: 24,
//         ...shadow,
//     },
//     fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 8 },
//     input: {
//         backgroundColor: C.surfaceAlt,
//         borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
//         fontSize: 15, color: C.text,
//         borderWidth: 1.5, borderColor: C.border,
//         marginBottom: 4,
//     },
//     pwdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
//     eyeBtn:     { paddingHorizontal: 10, paddingVertical: 14 },
//     eyeText:    { fontSize: 18 },

//     btn: {
//         backgroundColor: C.primary,
//         borderRadius: 14, paddingVertical: 16,
//         alignItems: 'center', marginTop: 20,
//     },
//     btnDisabled: { opacity: 0.7 },
//     btnText:    { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

//     footer:     { color: C.textMuted, textAlign: 'center', fontSize: 13, marginTop: 28 },
// });


import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, StatusBar,
    ScrollView, Dimensions,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow, shadowMd, rs, fs, radius, space } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pwdVisible, setPwdVisible] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
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

    const inputStyle = (field) => [
        styles.input,
        focusedField === field && styles.inputFocused,
    ];

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Brand block ─────────────────── */}
                <View style={styles.brandBlock}>
                    <View style={styles.logoRing}>
                        <View style={styles.logoInner}>
                            <Text style={styles.logoEmoji}>📞</Text>
                        </View>
                    </View>
                    <Text style={styles.appName}>Callyzer</Text>
                    <Text style={styles.tagline}>Call Management System</Text>
                </View>

                {/* ── Login card ──────────────────── */}
                <View style={styles.card}>
                    <Text style={styles.cardHeading}>Welcome back</Text>
                    <Text style={styles.cardSubtext}>Sign in to continue to your workspace</Text>

                    {/* Email */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Email address</Text>
                        <View style={inputStyle('email')}>
                            <Text style={styles.fieldIcon}>✉️</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="you@company.com"
                                placeholderTextColor={C.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Password</Text>
                        <View style={inputStyle('password')}>
                            <Text style={styles.fieldIcon}>🔒</Text>
                            <TextInput
                                style={[styles.fieldInput, { flex: 1 }]}
                                placeholder="Enter your password"
                                placeholderTextColor={C.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!pwdVisible}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity
                                onPress={() => setPwdVisible(v => !v)}
                                style={styles.eyeBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={pwdVisible ? 'eye-outline' : 'eye-off-outline'}
                                    size={fs(20)}
                                    color={C.textSub}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In button */}
                    <TouchableOpacity
                        style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.88}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.signInBtnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Footer ─────────────────────── */}
                <View style={styles.footer}>
                    <View style={styles.footerDot} />
                    <Text style={styles.footerText}>Secure · Encrypted · Reliable</Text>
                    <View style={styles.footerDot} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: rs(24),
        paddingVertical: rs(40),
    },

    // ── Brand ──────────────────────────────
    brandBlock: {
        alignItems: 'center',
        marginBottom: rs(32),
    },
    logoRing: {
        width: rs(88),
        height: rs(88),
        borderRadius: rs(28),
        backgroundColor: C.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rs(16),
        borderWidth: 1,
        borderColor: C.primaryMid,
        ...shadow,
    },
    logoInner: {
        width: rs(64),
        height: rs(64),
        borderRadius: rs(20),
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoEmoji: {
        fontSize: fs(30),
    },
    appName: {
        fontSize: fs(32),
        fontWeight: '800',
        color: C.text,
        letterSpacing: -0.8,
    },
    tagline: {
        fontSize: fs(14),
        color: C.textMuted,
        marginTop: rs(4),
        letterSpacing: 0.2,
    },

    // ── Card ───────────────────────────────
    card: {
        backgroundColor: C.surface,
        borderRadius: rs(24),
        padding: rs(24),
        ...shadowMd,
        borderWidth: 1,
        borderColor: C.border,
    },
    cardHeading: {
        fontSize: fs(22),
        fontWeight: '800',
        color: C.text,
        letterSpacing: -0.4,
    },
    cardSubtext: {
        fontSize: fs(14),
        color: C.textSub,
        marginTop: rs(4),
        marginBottom: rs(24),
        lineHeight: fs(20),
    },

    // ── Fields ─────────────────────────────
    fieldWrap: {
        marginBottom: rs(16),
    },
    label: {
        fontSize: fs(12),
        fontWeight: '700',
        color: C.textSub,
        marginBottom: rs(8),
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surfaceAlt,
        borderRadius: rs(14),
        borderWidth: 1.5,
        borderColor: C.border,
        paddingHorizontal: rs(14),
        paddingVertical: rs(13),
        gap: rs(10),
    },
    inputFocused: {
        borderColor: C.primary,
        backgroundColor: C.primarySoft,
    },
    fieldIcon: {
        fontSize: fs(16),
        width: rs(22),
        textAlign: 'center',
    },
    fieldInput: {
        flex: 1,
        fontSize: fs(15),
        color: C.text,
        paddingVertical: 0, // prevent Android extra padding
    },
    eyeBtn: {
        paddingLeft: rs(8),
    },

    // ── Sign In button ─────────────────────
    signInBtn: {
        backgroundColor: C.primary,
        borderRadius: rs(14),
        paddingVertical: rs(16),
        alignItems: 'center',
        marginTop: rs(8),
        ...shadow,
    },
    signInBtnDisabled: {
        opacity: 0.65,
    },
    signInBtnText: {
        color: '#FFFFFF',
        fontSize: fs(16),
        fontWeight: '700',
        letterSpacing: 0.4,
    },

    // ── Footer ─────────────────────────────
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: rs(28),
        gap: rs(8),
    },
    footerDot: {
        width: rs(4),
        height: rs(4),
        borderRadius: rs(2),
        backgroundColor: C.textMuted,
    },
    footerText: {
        fontSize: fs(12),
        color: C.textMuted,
        letterSpacing: 0.5,
    },
});