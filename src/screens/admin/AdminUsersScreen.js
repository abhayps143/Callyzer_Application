import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, RefreshControl, Modal,
  ScrollView, Alert, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Vianayk IP-Adress
const API = 'http://192.168.1.65:5000/api';

//Abhay IP-Adress
// const API = 'http://192.168.1.51:5000/api';

const ROLE_CONFIG = {
  super_admin: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Super Admin' },
  admin: { color: '#3B82F6', bg: '#DBEAFE', label: 'Admin' },
  manager: { color: '#6366F1', bg: '#E0E7FF', label: 'Manager' },
  team_leader: { color: '#0EA5E9', bg: '#E0F2FE', label: 'Team Leader' },
  agent: { color: '#10B981', bg: '#D1FAE5', label: 'Agent' },
  hr: { color: '#F59E0B', bg: '#FEF3C7', label: 'HR' },
  finance: { color: '#F97316', bg: '#FFEDD5', label: 'Finance' },
};
const ROLES = ['agent', 'team_leader', 'manager', 'hr', 'finance', 'admin'];

const EMPTY = { name: '', email: '', password: '', role: 'agent', phone: '', isActive: true };

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.users || data || [];
      setUsers(list);
      setFiltered(list);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const openAdd = () => { setEditUser(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || (!editUser && !form.password)) {
      Alert.alert('Error', 'Name, email aur password zaroori hai');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const url = editUser ? `${API}/admin/users/${editUser._id}` : `${API}/admin/users`;
      const method = editUser ? 'PUT' : 'POST';
      const body = { ...form };
      if (editUser && !body.password) delete body.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        Alert.alert('✅ Success', editUser ? 'User updated!' : 'User created!');
      } else {
        Alert.alert('Error', data.message || 'Failed');
      }
    } catch (e) { Alert.alert('Error', 'Server error'); }
    setSaving(false);
  };

  const handleDelete = (u) => {
    Alert.alert('Delete User', `"${u.name}" ko delete karna chahte ho?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const token = await getToken();
          await fetch(`${API}/admin/users/${u._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchUsers();
        }
      }
    ]);
  };

  const RoleBadge = ({ role }) => {
    const c = ROLE_CONFIG[role] || { color: '#64748b', bg: '#F1F5F9', label: role };
    return (
      <View style={[styles.badge, { backgroundColor: c.bg }]}>
        <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
      </View>
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={[styles.avatar, { backgroundColor: (ROLE_CONFIG[item.role]?.color || '#3B82F6') }]}>
        <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <RoleBadge role={item.role} />
      </View>
      <View style={styles.actions}>
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }]} />
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
          <Text style={styles.delBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Manage Users</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search name, email, role..."
        placeholderTextColor="#94A3B8"
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.countText}>{filtered.length} users</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={renderUser}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#3B82F6" />}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={<Text style={styles.empty}>Koi user nahi mila</Text>}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editUser ? 'Edit User' : 'Add New User'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 450 }}>
              {[
                { label: 'Full Name *', key: 'name', placeholder: 'Enter name' },
                { label: 'Email *', key: 'email', placeholder: 'Enter email', keyboard: 'email-address' },
                { label: editUser ? 'New Password (optional)' : 'Password *', key: 'password', placeholder: 'Enter password', secure: true },
                { label: 'Phone', key: 'phone', placeholder: 'Enter phone', keyboard: 'phone-pad' },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={f.placeholder}
                    placeholderTextColor="#94A3B8"
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard || 'default'}
                    secureTextEntry={f.secure}
                  />
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {ROLES.map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, form.role === r && { backgroundColor: ROLE_CONFIG[r]?.color || '#3B82F6' }]}
                      onPress={() => setForm(p => ({ ...p, role: r }))}
                    >
                      <Text style={[styles.roleChipText, form.role === r && { color: '#fff' }]}>
                        {ROLE_CONFIG[r]?.label || r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.field, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => setForm(p => ({ ...p, isActive: v }))}
                  trackColor={{ true: '#3B82F6', false: '#E2E8F0' }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editUser ? 'Update User' : 'Create User'}</Text>}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  search: {
    backgroundColor: '#fff', margin: 12, padding: 13, borderRadius: 12,
    fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0',
  },
  countText: { paddingHorizontal: 16, fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  userCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 5,
    padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 12, color: '#94A3B8', marginVertical: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 18 },
  delBtn: { padding: 6 },
  delBtnText: { fontSize: 18 },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 60, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalClose: { fontSize: 20, color: '#64748B' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  roleChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});