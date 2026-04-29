import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Switch,
    TouchableOpacity, TextInput, StatusBar,
    ActivityIndicator, Alert,
} from 'react-native';
import { C, shadow } from '../../theme';
import { api } from '../../services/api';

const SectionCard = ({ title, icon, color, soft, children }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: soft }]}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const ToggleRow = ({ label, desc, value, onChange, isLast }) => (
    <View style={[styles.toggleRow, !isLast && styles.toggleDivider]}>
        <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>{label}</Text>
            {desc && <Text style={styles.toggleDesc}>{desc}</Text>}
        </View>
        <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ true: C.primary, false: C.border }}
            thumbColor="#fff"
        />
    </View>
);

const DEFAULT = {
    companyName: 'Callyzer',
    workStartTime: '09:00',
    workEndTime: '18:00',
    allowBusinessUserRegistration: true,
    requireAdminApproval: true,
    leaderboardVisible: true,
    autoLogoutMinutes: 30,
};

export default function AdminSettingsScreen() {
    const [s, setS] = useState(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // ── Load from API on mount ──────────────
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            if (data && !data.message) {
                setS({
                    companyName:                    data.companyName                    ?? DEFAULT.companyName,
                    workStartTime:                  data.workStartTime                  ?? DEFAULT.workStartTime,
                    workEndTime:                    data.workEndTime                    ?? DEFAULT.workEndTime,
                    allowBusinessUserRegistration:  data.allowBusinessUserRegistration  ?? DEFAULT.allowBusinessUserRegistration,
                    requireAdminApproval:           data.requireAdminApproval           ?? DEFAULT.requireAdminApproval,
                    leaderboardVisible:             data.leaderboardVisible             ?? DEFAULT.leaderboardVisible,
                    autoLogoutMinutes:              data.autoLogoutMinutes              ?? DEFAULT.autoLogoutMinutes,
                });
            }
        } catch (e) {
            console.log('Load settings error:', e);
        }
        setLoading(false);
    };

    const update = (key, value) => {
        setS(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };
    const toggle = (key) => update(key, !s[key]);

    // ── Save to API ─────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.updateSettings({
                companyName:                   s.companyName,
                workStartTime:                 s.workStartTime,
                workEndTime:                   s.workEndTime,
                allowBusinessUserRegistration: s.allowBusinessUserRegistration,
                requireAdminApproval:          s.requireAdminApproval,
                leaderboardVisible:            s.leaderboardVisible,
                autoLogoutMinutes:             parseInt(s.autoLogoutMinutes) || 30,
            });
            if (res.message === 'Settings saved successfully') {
                setHasChanges(false);
                Alert.alert('✅ Saved', 'Settings have been updated successfully.');
            } else {
                Alert.alert('Error', res.message || 'Could not save settings.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        }
        setSaving(false);
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>System Configuration</Text>
            </View>

            {/* Unsaved Changes Banner */}
            {hasChanges && (
                <View style={styles.unsavedBanner}>
                    <Text style={styles.unsavedText}>⚠️ You have unsaved changes</Text>
                </View>
            )}

            {/* General */}
            <SectionCard title="General" icon="🏢" color={C.blue} soft={C.blueSoft}>
                <Text style={styles.fieldLabel}>Company Name</Text>
                <TextInput
                    style={styles.input}
                    value={s.companyName}
                    onChangeText={v => update('companyName', v)}
                    placeholderTextColor={C.textMuted}
                />
                <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Work Start</Text>
                        <TextInput
                            style={styles.input}
                            value={s.workStartTime}
                            onChangeText={v => update('workStartTime', v)}
                            placeholder="09:00"
                            placeholderTextColor={C.textMuted}
                        />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Work End</Text>
                        <TextInput
                            style={styles.input}
                            value={s.workEndTime}
                            onChangeText={v => update('workEndTime', v)}
                            placeholder="18:00"
                            placeholderTextColor={C.textMuted}
                        />
                    </View>
                </View>
                <Text style={styles.fieldLabel}>Auto Logout (minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={String(s.autoLogoutMinutes)}
                    onChangeText={v => update('autoLogoutMinutes', v)}
                    keyboardType="number-pad"
                    placeholderTextColor={C.textMuted}
                />
            </SectionCard>

            {/* Access Control */}
            <SectionCard title="Access Control" icon="🔐" color={C.purple} soft={C.purpleSoft}>
                <ToggleRow
                    label="Allow Registration"
                    desc="New Business Users can self-register"
                    value={s.allowBusinessUserRegistration}
                    onChange={() => toggle('allowBusinessUserRegistration')}
                />
                <ToggleRow
                    label="Require Admin Approval"
                    desc="Admin must approve new accounts before login"
                    value={s.requireAdminApproval}
                    onChange={() => toggle('requireAdminApproval')}
                    isLast
                />
            </SectionCard>

            {/* Features */}
            <SectionCard title="Features" icon="⚙️" color={C.green} soft={C.greenSoft}>
                <ToggleRow
                    label="Show Leaderboard"
                    desc="Team ranking visible to all users"
                    value={s.leaderboardVisible}
                    onChange={() => toggle('leaderboardVisible')}
                    isLast
                />
            </SectionCard>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, (saving || !hasChanges) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving || !hasChanges}
                activeOpacity={0.85}
            >
                {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>
                        {hasChanges ? '💾  Save Settings' : '✓  All Changes Saved'}
                    </Text>
                }
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: C.bg },
    content:    { paddingBottom: 20 },
    center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
        backgroundColor: C.surface, borderBottomWidth: 1,
        borderBottomColor: C.border, marginBottom: 16,
    },
    title:      { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle:   { fontSize: 13, color: C.textSub, marginTop: 4 },

    unsavedBanner: {
        backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F59E0B',
        marginHorizontal: 16, marginBottom: 12,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    },
    unsavedText: { fontSize: 13, color: '#92400E', fontWeight: '600' },

    card:       { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    cardIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle:  { fontSize: 15, fontWeight: '700', color: C.text },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 6 },
    input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt, marginBottom: 12 },
    timeRow:    { flexDirection: 'row' },

    toggleRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
    toggleDivider:  { borderBottomWidth: 1, borderBottomColor: C.border },
    toggleLabel:    { fontSize: 14, fontWeight: '600', color: C.text },
    toggleDesc:     { fontSize: 12, color: C.textMuted, marginTop: 2 },

    saveBtn:        { backgroundColor: C.primary, marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 14, alignItems: 'center', ...shadow },
    saveBtnDisabled:{ opacity: 0.5 },
    saveBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});