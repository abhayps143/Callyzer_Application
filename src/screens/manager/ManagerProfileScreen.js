import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';

import { API_BASE_URL as API } from '../../config';


export default function ManagerProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getToken = async () => await AsyncStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/manager/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const m = data.manager || data;
        setManager(m);
        setName(m.name || '');
        setPhone(m.phone || '');
      } catch (e) {
        Alert.alert('Error', 'Profile load nahi hua');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name zaroori hai'); return; }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setManager(data.manager || data);
        Alert.alert('✅ Success', 'Profile update ho gayi!');
      } else {
        Alert.alert('Error', data.message || 'Update failed');
      }
    } catch (e) { Alert.alert('Error', 'Network error'); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Sabhi fields zaroori hain'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords match nahi karte'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password kam se kam 6 characters ka hona chahiye'); return;
    }
    setSavingPwd(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Success', 'Password change ho gaya!');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        Alert.alert('Error', data.message || 'Password change failed');
      }
    } catch (e) { Alert.alert('Error', 'Network error'); }
    setSavingPwd(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  const initials = (manager?.name || 'M').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{manager?.name}</Text>
        <Text style={styles.profileEmail}>{manager?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Manager</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Email', value: manager?.email, icon: '📧' },
            { label: 'Phone', value: manager?.phone || 'Not set', icon: '📞' },
            { label: 'Role', value: 'Manager', icon: '🏷️' },
            { label: 'Status', value: manager?.isActive ? 'Active ✅' : 'Inactive', icon: '🔘' },
            { label: 'Joined', value: manager?.createdAt ? new Date(manager.createdAt).toLocaleDateString('en-IN') : '—', icon: '📅' },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Edit Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Edit Karo</Text>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Apna naam likho"
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Mobile number"
              keyboardType="phone-pad"
              placeholderTextColor="#CBD5E1"
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>✅ Profile Save Karo</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Change Karo</Text>
        <View style={styles.card}>
          {[
            { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, placeholder: '••••••' },
            { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'Min 6 characters' },
            { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Password confirm karo' },
          ].map(f => (
            <View key={f.label} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.placeholder}
                secureTextEntry
                placeholderTextColor="#CBD5E1"
              />
            </View>
          ))}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#0EA5E9' }, savingPwd && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={savingPwd}
          >
            {savingPwd ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>🔑 Password Change Karo</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    backgroundColor: '#6366F1', alignItems: 'center',
    paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { color: '#C7D2FE', fontSize: 13, marginBottom: 10 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16,
    paddingVertical: 5, borderRadius: 20,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  infoSection: { paddingHorizontal: 16, marginTop: 20 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoIcon: { fontSize: 16, marginRight: 12, width: 24 },
  infoLabel: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
