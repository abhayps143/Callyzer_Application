import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { C, ROLE_COLORS, shadow } from '../../theme';

const ROLES = ['agent','team_leader','manager','hr','finance','admin','super_admin'];
const PAGE_NAMES = ['Dashboard','Call Logs','Reports','Admin Panel','Manage Users','Settings'];
const PERMISSIONS = {
    super_admin: [true,true,true,true,true,true],
    admin:       [true,true,true,true,true,false],
    manager:     [true,true,true,true,false,false],
    team_leader: [true,true,false,true,false,false],
    hr:          [true,false,true,false,false,false],
    finance:     [true,false,true,false,false,false],
    agent:       [true,true,false,false,false,false],
};

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

export default function AdminSettingsScreen() {
    const [s, setS] = useState({
        allowSignup: false, requireApproval: true, callLogsPublic: false,
        autoLogout: true, emailNotifications: true, attendanceRequired: true,
        companyName: 'Callyzer', workStart: '09:00', workEnd: '18:00',
    });
    const toggle = (key) => setS(p => ({ ...p, [key]: !p[key] }));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>System Configuration</Text>
            </View>

            {/* General */}
            <SectionCard title="General" icon="🏢" color={C.blue} soft={C.blueSoft}>
                <Text style={styles.fieldLabel}>Company Name</Text>
                <TextInput
                    style={styles.input}
                    value={s.companyName}
                    onChangeText={v => setS(p => ({ ...p, companyName: v }))}
                    placeholderTextColor={C.textMuted}
                />
                <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Work Start</Text>
                        <TextInput style={styles.input} value={s.workStart} onChangeText={v => setS(p => ({ ...p, workStart: v }))} placeholderTextColor={C.textMuted} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Work End</Text>
                        <TextInput style={styles.input} value={s.workEnd} onChangeText={v => setS(p => ({ ...p, workEnd: v }))} placeholderTextColor={C.textMuted} />
                    </View>
                </View>
            </SectionCard>

            {/* Access Control */}
            <SectionCard title="Access Control" icon="🔐" color={C.purple} soft={C.purpleSoft}>
                <ToggleRow label="Allow Signup"     desc="New users can register"            value={s.allowSignup}          onChange={() => toggle('allowSignup')}          />
                <ToggleRow label="Require Approval" desc="Admin must approve new accounts"   value={s.requireApproval}      onChange={() => toggle('requireApproval')}      />
                <ToggleRow label="Call Logs Public" desc="All roles can see call logs"       value={s.callLogsPublic}       onChange={() => toggle('callLogsPublic')}       />
                <ToggleRow label="Auto Logout"      desc="Logout after 30 mins idle"         value={s.autoLogout}           onChange={() => toggle('autoLogout')}           isLast />
            </SectionCard>

            {/* Notifications */}
            <SectionCard title="Notifications" icon="🔔" color={C.amber} soft={C.amberSoft}>
                <ToggleRow label="Email Notifications" desc="Send email alerts"                       value={s.emailNotifications}  onChange={() => toggle('emailNotifications')}  />
                <ToggleRow label="Attendance Alerts"   desc="Alert when employee misses punch-in"     value={s.attendanceRequired}  onChange={() => toggle('attendanceRequired')}   isLast />
            </SectionCard>

            {/* Role Permissions */}
            <SectionCard title="Role Permissions" icon="👥" color={C.green} soft={C.greenSoft}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                        <View style={styles.permRow}>
                            <Text style={[styles.permRoleCell, { color: C.textMuted }]}>Role</Text>
                            {PAGE_NAMES.map(p => (
                                <Text key={p} style={styles.permPageCell} numberOfLines={1}>{p}</Text>
                            ))}
                        </View>
                        {ROLES.map(role => {
                            const cfg = ROLE_COLORS[role] || ROLE_COLORS.agent;
                            return (
                                <View key={role} style={styles.permRow}>
                                    <View style={[styles.rolePillCell, { backgroundColor: cfg.soft }]}>
                                        <Text style={[styles.rolePillText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                    {PERMISSIONS[role]?.map((has, i) => (
                                        <View key={i} style={styles.permCell}>
                                            <View style={[styles.permDot, { backgroundColor: has ? C.greenSoft : C.redSoft }]}>
                                                <Text style={{ fontSize: 12 }}>{has ? '✓' : '✕'}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SectionCard>

            <TouchableOpacity style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Settings</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: C.bg },
    content:    { paddingBottom: 20 },
    header: {
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16,
    },
    title:      { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle:   { fontSize: 13, color: C.textSub, marginTop: 4 },

    card:       { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    cardIcon:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle:  { fontSize: 15, fontWeight: '700', color: C.text },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 6 },
    input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt, marginBottom: 12 },
    timeRow:    { flexDirection: 'row' },

    toggleRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
    toggleDivider:{ borderBottomWidth: 1, borderBottomColor: C.border },
    toggleLabel:{ fontSize: 14, fontWeight: '600', color: C.text },
    toggleDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },

    permRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    permRoleCell:{ width: 104, fontSize: 12, fontWeight: '700' },
    permPageCell:{ width: 72, textAlign: 'center', fontSize: 10, color: C.textSub },
    permCell:   { width: 72, alignItems: 'center' },
    permDot:    { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rolePillCell:{ width: 100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
    rolePillText:{ fontSize: 11, fontWeight: '700' },

    saveBtn:    { backgroundColor: C.primary, marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 14, alignItems: 'center' },
    saveBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },
});
