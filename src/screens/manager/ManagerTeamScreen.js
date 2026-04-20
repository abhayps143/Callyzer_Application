import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Modal,
  ScrollView, Alert, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Vianayk IP-Adress
// const API = 'http://192.168.1.65:5000/api';

//Abhay IP-Adress
const API = 'http://192.168.1.51:5000/api';

const ROLE_CONFIG = {
  agent: { color: '#10B981', bg: '#D1FAE5', label: 'Agent' },
  team_leader: { color: '#0EA5E9', bg: '#E0F2FE', label: 'Team Leader' },
  manager: { color: '#6366F1', bg: '#E0E7FF', label: 'Manager' },
};
const ALLOWED_ROLES = ['agent', 'team_leader'];
const EMPTY = { name: '', email: '', password: '', role: 'agent', phone: '', isActive: true };

export default function ManagerTeamScreen() {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPwd, setNewPwd] = useState('');

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchMembers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.members || data || [];
      setMembers(list);
      setFiltered(list);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(members); return; }
    const q = search.toLowerCase();
    setFiltered(members.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    ));
  }, [search, members]);

  const openAdd = () => { setEditMember(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (m) => {
    setEditMember(m);
    setForm({ name: m.name, email: m.email, password: '', role: m.role, phone: m.phone || '', isActive: m.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editMember && !form.password)) {
      Alert.alert('Error', 'Name, email aur password zaroori hai');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const url = editMember ? `${API}/manager/team/${editMember._id}` : `${API}/manager/team`;
      const method = editMember ? 'PUT' : 'POST';
      const body = { ...form };
      if (editMember && !body.password) delete body.password;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchMembers();
        Alert.alert('✅ Success', editMember ? 'Member updated!' : 'Member added!');
      } else {
        Alert.alert('Error', data.message || 'Failed');
      }
    } catch (e) { Alert.alert('Error', 'Network error'); }
    setSaving(false);
  };

  const handleDelete = (m) => {
    Alert.alert('Delete Member', `"${m.name}" ko delete karna chahte hain?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${API}/manager/team/${m._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchMembers();
          } catch (e) { Alert.alert('Error', 'Delete failed'); }
        }
      }
    ]);
  };

  const handleResetPassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      Alert.alert('Error', 'Password kam se kam 6 characters ka hona chahiye');
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/team/${resetTarget._id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      if (res.ok) {
        Alert.alert('✅ Success', 'Password reset ho gaya!');
        setShowResetPwd(false);
        setNewPwd('');
      } else {
        Alert.alert('Error', 'Password reset failed');
      }
    } catch (e) { Alert.alert('Error', 'Network error'); }
  };

  const renderMember = ({ item: m }) => {
    const rc = ROLE_CONFIG[m.role] || { color: '#6B7280', bg: '#F3F4F6', label: m.role };
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberTop}>
          <View style={[styles.avatar, { backgroundColor: rc.bg }]}>
            <Text style={[styles.avatarText, { color: rc.color }]}>
              {(m.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{m.name}</Text>
            <Text style={styles.memberEmail}>{m.email}</Text>
            {m.phone ? <Text style={styles.memberPhone}>📞 {m.phone}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[styles.roleText, { color: rc.color }]}>{rc.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: m.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: m.isActive ? '#10B981' : '#EF4444' }}>
                {m.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EEF2FF' }]} onPress={() => openEdit(m)}>
            <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '600' }}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => { setResetTarget(m); setNewPwd(''); setShowResetPwd(true); }}>
            <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600' }}>🔑 Reset Pwd</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDelete(m)}>
            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search members..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{filtered.length} member(s)</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderMember}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} tintColor="#6366F1" />}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Koi member nahi mila</Text>}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMember ? '✏️ Edit Member' : '➕ Add Member'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Name *', key: 'name', placeholder: 'Full name' },
                { label: 'Email *', key: 'email', placeholder: 'Email address', keyboard: 'email-address' },
                { label: editMember ? 'New Password (optional)' : 'Password *', key: 'password', placeholder: '••••••', secure: true },
                { label: 'Phone', key: 'phone', placeholder: 'Mobile number', keyboard: 'phone-pad' },
              ].map(f => (
                <View key={f.key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    secureTextEntry={f.secure}
                    keyboardType={f.keyboard || 'default'}
                    placeholderTextColor="#CBD5E1"
                    autoCapitalize="none"
                  />
                </View>
              ))}

              {/* Role */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Role</Text>
                <View style={styles.roleRow}>
                  {ALLOWED_ROLES.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, form.role === r && styles.roleChipActive]}
                      onPress={() => setForm(p => ({ ...p, role: r }))}
                    >
                      <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextActive]}>
                        {ROLE_CONFIG[r]?.label || r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active toggle */}
              <View style={[styles.fieldGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text style={styles.fieldLabel}>Active Status</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => setForm(p => ({ ...p, isActive: v }))}
                  trackColor={{ true: '#6366F1', false: '#CBD5E1' }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editMember ? 'Update Member' : 'Add Member'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={showResetPwd} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: 280 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Reset Password</Text>
              <TouchableOpacity onPress={() => setShowResetPwd(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resetName}>{resetTarget?.name} ka password reset karo</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Naya password (min 6)"
              value={newPwd}
              onChangeText={setNewPwd}
              secureTextEntry
              placeholderTextColor="#CBD5E1"
            />
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]} onPress={handleResetPassword}>
              <Text style={styles.saveBtnText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', padding: 12, gap: 10 },
  searchInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B',
  },
  addBtn: { backgroundColor: '#6366F1', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  count: { fontSize: 12, color: '#94A3B8', paddingHorizontal: 16, marginBottom: 4 },
  memberCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  memberTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  memberEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  memberPhone: { fontSize: 12, color: '#64748B', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 30, fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  modalClose: { fontSize: 18, color: '#94A3B8', padding: 4 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E293B',
  },
  roleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  roleChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  roleChipActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  roleChipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  roleChipTextActive: { color: '#6366F1', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resetName: { fontSize: 14, color: '#64748B', marginBottom: 16 },
});
