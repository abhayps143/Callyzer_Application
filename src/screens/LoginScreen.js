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

    // const handleLogin = async () => {
    //     if (!email || !password) {
    //         Alert.alert('Missing fields', 'Please enter your email and password.');
    //         return;
    //     }
    //     setLoading(true);
    //     try {
    //         const data = await api.login(email, password);
    //         if (data.token) {
    //             await login(data.token, data.user);
    //         } else {
    //             Alert.alert('Login Failed', data.message || 'Invalid credentials');
    //         }
    //     } catch {
    //         Alert.alert('Connection Error', 'Unable to reach server. Check your network.');
    //     }
    //     setLoading(false);
    // };

    const validateInputs = () => {
        const trimEmail = email.trim();
        const trimPwd = password.trim();
        if (!trimEmail)
            return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail))
            return 'Please enter a valid email address (user@company.com).';
        if (!trimPwd)
            return 'Password is required.';
        if (trimPwd.length < 6)
            return 'Password must be at least 6 characters long.';
        return null;  // null = no error
    };

    const handleLogin = async () => {
        const validationError = validateInputs();
        if (validationError) {
            Alert.alert('Validation Error', validationError);
            return;
        }
        setLoading(true);
        try {
            const data = await api.login(email.trim(), password.trim());
            if (data.token) {
                await login(data.token, data.user);
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Connection Error', error.message || 'Unable to reach the server.');
        } finally {
            setLoading(false);
        }
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