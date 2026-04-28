import React, { useContext } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, SafeAreaView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { C, shadow, shadowMd, rs, fs } from '../theme';

export default function PendingScreen({ navigation }) {
    const { logout } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
            <View style={styles.container}>

                {/* Illustration */}
                <View style={styles.iconCircle}>
                    <Text style={styles.iconEmoji}>⏳</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>Account Under Review</Text>
                <Text style={styles.subtitle}>
                    Your registration has been submitted successfully. The Super Admin will review and approve your account shortly.
                </Text>

                {/* Steps */}
                <View style={styles.stepsCard}>
                    <Text style={styles.stepsTitle}>What happens next?</Text>

                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, { backgroundColor: C.green }]}>
                            <Text style={styles.stepDotText}>✓</Text>
                        </View>
                        <View style={styles.stepInfo}>
                            <Text style={styles.stepLabel}>Registration Submitted</Text>
                            <Text style={styles.stepSub}>Your details have been received</Text>
                        </View>
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, { backgroundColor: C.amber }]}>
                            <Text style={styles.stepDotText}>2</Text>
                        </View>
                        <View style={styles.stepInfo}>
                            <Text style={styles.stepLabel}>Admin Review</Text>
                            <Text style={styles.stepSub}>Super Admin will verify your account</Text>
                        </View>
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, { backgroundColor: C.textMuted }]}>
                            <Text style={styles.stepDotText}>3</Text>
                        </View>
                        <View style={styles.stepInfo}>
                            <Text style={styles.stepLabel}>Account Activated</Text>
                            <Text style={styles.stepSub}>You can then login with your credentials</Text>
                        </View>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        💡 This usually takes a few hours. Contact your Callyzer admin if you need faster access.
                    </Text>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: {
        flex: 1, paddingHorizontal: rs(24),
        justifyContent: 'center', alignItems: 'center',
        paddingBottom: rs(40),
    },

    iconCircle: {
        width: rs(100), height: rs(100), borderRadius: rs(50),
        backgroundColor: C.amberSoft, justifyContent: 'center',
        alignItems: 'center', marginBottom: rs(24), ...shadowMd,
    },
    iconEmoji: { fontSize: rs(44) },

    title: {
        fontSize: fs(24), fontWeight: '800', color: C.text,
        textAlign: 'center', marginBottom: rs(10),
    },
    subtitle: {
        fontSize: fs(14), color: C.textSub, textAlign: 'center',
        lineHeight: fs(22), marginBottom: rs(28), paddingHorizontal: rs(8),
    },

    stepsCard: {
        backgroundColor: C.surface, borderRadius: rs(18),
        padding: rs(20), width: '100%', ...shadow,
        borderWidth: 1, borderColor: C.border, marginBottom: rs(16),
    },
    stepsTitle: {
        fontSize: fs(14), fontWeight: '700', color: C.text,
        marginBottom: rs(16),
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: rs(14) },
    stepLine: {
        width: 2, height: rs(20), backgroundColor: C.border,
        marginLeft: rs(15), marginVertical: rs(4),
    },
    stepDot: {
        width: rs(32), height: rs(32), borderRadius: rs(16),
        justifyContent: 'center', alignItems: 'center',
    },
    stepDotText: { fontSize: fs(13), fontWeight: '700', color: '#fff' },
    stepInfo: { flex: 1 },
    stepLabel: { fontSize: fs(14), fontWeight: '600', color: C.text },
    stepSub: { fontSize: fs(12), color: C.textMuted, marginTop: rs(2) },

    infoBox: {
        backgroundColor: C.primarySoft, borderRadius: rs(12),
        padding: rs(14), width: '100%', marginBottom: rs(28),
    },
    infoText: { fontSize: fs(13), color: C.primary, lineHeight: fs(20), textAlign: 'center' },

    logoutBtn: {
        backgroundColor: C.surface, borderRadius: rs(14),
        paddingVertical: rs(14), paddingHorizontal: rs(40),
        borderWidth: 1.5, borderColor: C.border, ...shadow,
    },
    logoutText: { fontSize: fs(15), fontWeight: '700', color: C.textSub },
});