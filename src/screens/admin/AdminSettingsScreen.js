import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput } from 'react-native';

const ROLES = ['agent', 'team_leader', 'manager', 'hr', 'finance', 'admin', 'super_admin'];
const ROLE_COLORS = {
  super_admin: '#8B5CF6', admin: '#3B82F6', manager: '#6366F1',
  team_leader: '#0EA5E9', hr: '#F59E0B', finance: '#F97316', agent: '#10B981',
};
const ROLE_LABELS = {
  super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager',
  team_leader: 'Team Leader', hr: 'HR', finance: 'Finance', agent: 'Agent',
};
const PAGE_NAMES = ['Dashboard', 'Call Logs', 'Reports', 'Admin Panel', 'Manage Users', 'Settings'];
const PERMISSIONS = {
  super_admin: [true, true, true, true, true, true],
  admin: [true, true, true, true, true, false],
  manager: [true, true, true, true, false, false],
  team_leader: [true, true, false, true, false, false],
  hr: [true, false, true, false, false, false],
  finance: [true, false, true, false, false, false],
  agent: [true, true, false, false, false, false],
};

const Section = ({ title, icon, color, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <View style={styles.toggleRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {desc && <Text style={styles.toggleDesc}>{desc}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: '#3B82F6', false: '#E2E8F0' }}
      thumbColor="#fff"
    />
  </View>
);

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState({
    allowSignup: false,
    requireApproval: true,
    callLogsPublic: false,
    autoLogout: true,
    emailNotifications: true,
    attendanceRequired: true,
    companyName: 'Callyzer',
    workStart: '09:00',
    workEnd: '18:00',
  });

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>System Configuration</Text>
      </View>

      {/* General */}
      <Section title="General Settings" icon="🏢" color="#3B82F6">
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={settings.companyName}
            onChangeText={v => setSettings(p => ({ ...p, companyName: v }))}
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={styles.timeRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Work Start</Text>
            <TextInput style={styles.input} value={settings.workStart} onChangeText={v => setSettings(p => ({ ...p, workStart: v }))} placeholderTextColor="#94A3B8" />
          </View>
          <View style={{ width: 12 }} />
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Work End</Text>
            <TextInput style={styles.input} value={settings.workEnd} onChangeText={v => setSettings(p => ({ ...p, workEnd: v }))} placeholderTextColor="#94A3B8" />
          </View>
        </View>
      </Section>

      {/* Access Control */}
      <Section title="Access Control" icon="🔐" color="#8B5CF6">
        <Toggle label="Allow Signup" desc="New users can register" value={settings.allowSignup} onChange={() => toggle('allowSignup')} />
        <Toggle label="Require Approval" desc="Admin must approve new accounts" value={settings.requireApproval} onChange={() => toggle('requireApproval')} />
        <Toggle label="Call Logs Public" desc="All roles can see call logs" value={settings.callLogsPublic} onChange={() => toggle('callLogsPublic')} />
        <Toggle label="Auto Logout" desc="Logout after 30 mins idle" value={settings.autoLogout} onChange={() => toggle('autoLogout')} />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon="🔔" color="#F59E0B">
        <Toggle label="Email Notifications" desc="Send email alerts" value={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
        <Toggle label="Attendance Alerts" desc="Alert when employee misses punch-in" value={settings.attendanceRequired} onChange={() => toggle('attendanceRequired')} />
      </Section>

      {/* Role Permissions */}
      <Section title="Role Permissions" icon="👥" color="#10B981">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={styles.permRow}>
              <Text style={[styles.permCell, { width: 100, color: '#94A3B8', fontWeight: '700' }]}>Role</Text>
              {PAGE_NAMES.map(p => (
                <Text key={p} style={[styles.permCell, { color: '#64748B', fontSize: 10 }]} numberOfLines={1}>{p}</Text>
              ))}
            </View>
            {ROLES.map(role => (
              <View key={role} style={styles.permRow}>
                <View style={[styles.permRoleCell, { backgroundColor: ROLE_COLORS[role] + '20' }]}>
                  <Text style={[styles.permRoleText, { color: ROLE_COLORS[role] }]}>{ROLE_LABELS[role]}</Text>
                </View>
                {PERMISSIONS[role]?.map((has, i) => (
                  <View key={i} style={styles.permCell}>
                    <Text style={{ fontSize: 16 }}>{has ? '✅' : '❌'}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </Section>

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>💾 Save Settings</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 20, paddingTop: 50, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  sectionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC' },
  timeRow: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  toggleDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  permRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  permCell: { width: 72, textAlign: 'center', fontSize: 11, alignItems: 'center', justifyContent: 'center' },
  permRoleCell: { width: 100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
  permRoleText: { fontSize: 11, fontWeight: '700' },
  saveBtn: { backgroundColor: '#3B82F6', margin: 16, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});