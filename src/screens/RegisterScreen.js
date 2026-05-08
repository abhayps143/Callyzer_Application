import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, StatusBar,
    ScrollView, Dimensions,
} from 'react-native';
import { api } from '../services/api';
import { C, shadow, shadowMd, rs, fs, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [pwdVisible, setPwdVisible] = useState(false);
    const [confirmPwdVisible, setConfirmPwdVisible] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const validate = () => {
        if (!form.name.trim()) return 'Full name is required.';
        if (!form.email.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
            return 'Please enter a valid email address.';
        if (!form.phone.trim()) return 'Phone number is required.';
        if (!/^\d{10}$/.test(form.phone.trim()))
            return 'Please enter a valid 10-digit phone number.';
        if (!form.password) return 'Password is required.';
        if (form.password.length < 6) return 'Password must be at least 6 characters.';
        if (form.password !== form.confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleRegister = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }
        setLoading(true);
        try {
            const data = await api.register({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
            });

            if (data.status === 'pending' || data.message?.toLowerCase().includes('pending')) {
                // Success — go to pending screen
                navigation.replace('PendingApproval');
            } else if (data.message?.toLowerCase().includes('already')) {
                Alert.alert('Already Registered', 'This email is already registered. Please login.');
            } else {
                Alert.alert('Error', data.message || 'Registration failed. Please try again.');
            }
        } catch {
            Alert.alert('Connection Error', 'Unable to reach server. Check your network.');
        }
        setLoading(false);
    };

    const inputStyle = (field) => [
        styles.inputRow,
        focusedField === field && styles.inputFocused,
    ];

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: C.bg }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}   
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Logo / Header */}
                <View style={styles.logoArea}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoEmoji}>📞</Text>
                    </View>
                    <Text style={styles.appName}>Callyzer</Text>
                    <Text style={styles.tagline}>Register as Team Lead</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Create Account</Text>
                    <Text style={styles.cardSubtitle}>
                        Fill in your details below. Your account will be reviewed by the admin before activation.
                    </Text>

                    {/* Full Name */}
                    <Text style={styles.label}>Full Name</Text>
                    <View style={inputStyle('name')}>
                        <Text style={styles.fieldIcon}>👤</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="Enter your full name"
                            placeholderTextColor={C.textMuted}
                            value={form.name}
                            onChangeText={v => setField('name', v)}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email */}
                    <Text style={styles.label}>Email Address</Text>
                    <View style={inputStyle('email')}>
                        <Text style={styles.fieldIcon}>✉️</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="you@company.com"
                            placeholderTextColor={C.textMuted}
                            value={form.email}
                            onChangeText={v => setField('email', v)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Phone */}
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={inputStyle('phone')}>
                        <Text style={styles.fieldIcon}>📱</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="10-digit mobile number"
                            placeholderTextColor={C.textMuted}
                            value={form.phone}
                            onChangeText={v => setField('phone', v)}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>

                    {/* Password */}
                    <Text style={styles.label}>Password</Text>
                    <View style={inputStyle('password')}>
                        <Text style={styles.fieldIcon}>🔒</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="Min. 6 characters"
                            placeholderTextColor={C.textMuted}
                            value={form.password}
                            onChangeText={v => setField('password', v)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            secureTextEntry={!pwdVisible}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setPwdVisible(p => !p)}
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

                    {/* Confirm Password */}
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={inputStyle('confirmPassword')}>
                        <Text style={styles.fieldIcon}>🔒</Text>
                        <TextInput
                            style={styles.fieldInput}
                            placeholder="Re-enter your password"
                            placeholderTextColor={C.textMuted}
                            value={form.confirmPassword}
                            onChangeText={v => setField('confirmPassword', v)}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            secureTextEntry={!confirmPwdVisible}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={() => setConfirmPwdVisible(p => !p)}
                            style={styles.eyeBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name={confirmPwdVisible ? 'eye-outline' : 'eye-off-outline'}
                                size={fs(20)}
                                color={C.textSub}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Info Note */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoText}>
                            After registration, your account will be reviewed by the Super Admin. You will be able to login once approved.
                        </Text>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        style={[styles.registerBtn, loading && styles.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.registerBtnText}>Create Account</Text>
                        }
                    </TouchableOpacity>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backRow}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backText}>Already have an account? </Text>
                        <Text style={styles.backLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: rs(20), paddingBottom: rs(40), paddingTop: rs(40) },

    logoArea: { alignItems: 'center', marginBottom: rs(24) },
    logoBox: {
        width: rs(64), height: rs(64), borderRadius: rs(18),
        backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
        marginBottom: rs(12), ...shadow,
    },
    logoEmoji: { fontSize: fs(30) },
    appName: { fontSize: fs(26), fontWeight: '800', color: C.text, letterSpacing: 0.5 },
    tagline: { fontSize: fs(13), color: C.textMuted, marginTop: rs(4) },

    card: {
        backgroundColor: C.surface, borderRadius: rs(20),
        padding: rs(24), ...shadowMd,
        borderWidth: 1, borderColor: C.border,
    },
    cardTitle: { fontSize: fs(20), fontWeight: '800', color: C.text, marginBottom: rs(6) },
    cardSubtitle: { fontSize: fs(13), color: C.textSub, lineHeight: fs(19), marginBottom: rs(20) },

    label: { fontSize: fs(13), fontWeight: '600', color: C.textSub, marginBottom: rs(6), marginTop: rs(12) },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surfaceAlt, borderRadius: rs(14),
        borderWidth: 1.5, borderColor: C.border,
        paddingHorizontal: rs(14), paddingVertical: rs(13), gap: rs(10),
    },
    inputFocused: { borderColor: C.primary, backgroundColor: C.primarySoft },
    fieldIcon: { fontSize: fs(16), width: rs(22), textAlign: 'center' },
    fieldInput: { flex: 1, fontSize: fs(15), color: C.text, paddingVertical: 0 },
    eyeBtn: { paddingLeft: rs(8) },

    infoBox: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: C.primarySoft, borderRadius: rs(12),
        padding: rs(12), marginTop: rs(20), gap: rs(8),
    },
    infoIcon: { fontSize: fs(14) },
    infoText: { flex: 1, fontSize: fs(12), color: C.primary, lineHeight: fs(18) },

    registerBtn: {
        backgroundColor: C.primary, borderRadius: rs(14),
        paddingVertical: rs(16), alignItems: 'center',
        marginTop: rs(20), ...shadow,
    },
    btnDisabled: { opacity: 0.65 },
    registerBtnText: { color: '#fff', fontSize: fs(16), fontWeight: '700', letterSpacing: 0.4 },

    backRow: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', marginTop: rs(16),
    },
    backText: { fontSize: fs(14), color: C.textMuted },
    backLink: { fontSize: fs(14), color: C.primary, fontWeight: '700' },
});