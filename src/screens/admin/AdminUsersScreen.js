import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, RefreshControl, Modal,
    ScrollView, Alert, Switch, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, ROLE_COLORS, shadow } from '../../theme';

import { API_BASE_URL as API } from '../../config';
const ROLES = ['super_admin', 'business_user', 'salesperson'];
const FILTER_TABS = ['All', 'business_user', 'salesperson', 'Pending'];
const CREATE_ROLES = ['super_admin', 'business_user'];
const EMPTY = { name: '', email: '', password: '', role: 'salesperson', phone: '', isActive: true };

export default function AdminUsersScreen() {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const getToken = async () => await AsyncStorage.getItem('token');

    const fetchUsers = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            const list = data.users || data || [];
            setUsers(list);
            setFiltered(list);
        } catch (e) { console.log(e); }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    // useEffect(() => {
    //     if (!search) { setFiltered(users); return; }
    //     const q = search.toLowerCase();
    //     setFiltered(users.filter(u =>
    //         u.name?.toLowerCase().includes(q) ||
    //         u.email?.toLowerCase().includes(q) ||
    //         u.role?.toLowerCase().includes(q)
    //     ));
    // }, [search, users]);
    useEffect(() => {
        let list = [...users];

        // Role/Pending filter
        if (activeFilter === 'Pending') {
            list = list.filter(u => u.status === 'pending');
        } else if (activeFilter !== 'All') {
            list = list.filter(u => u.role === activeFilter);
        }

        // Search filter
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q)
            );
        }

        setFiltered(list);
    }, [search, users, activeFilter]);   // ← activeFilter add

    const openAdd = () => { setEditUser(null); setForm(EMPTY); setShowModal(true); };
    const openEdit = (u) => {
        setEditUser(u);
        setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', isActive: u.isActive });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email || (!editUser && !form.password)) {
            Alert.alert('Missing fields', 'Name, email and password are required.');
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
                setShowModal(false); fetchUsers();
                Alert.alert('Success', editUser ? 'User updated!' : 'User created!');
            } else { Alert.alert('Error', data.message || 'Failed'); }
        } catch { Alert.alert('Error', 'Server error'); }
        setSaving(false);
    };

    const handleAssign = async (userId) => {
        try {
            const token = await getToken();
            // Business users fetch karo
            const res = await fetch(`${API}/admin/business-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const businessUsers = data.users || [];

            if (businessUsers.length === 0) {
                Alert.alert('No Business Users', 'Pehle ek Business User create karo.');
                return;
            }

            const options = [
                ...businessUsers.map(u => ({
                    text: u.name,
                    onPress: async () => {
                        const r = await fetch(`${API}/admin/users/${userId}/assign`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ businessUserId: u._id }),
                        });
                        if (r.ok) { Alert.alert('Done!', `${u.name} ki team mein add ho gaya`); fetchUsers(); }
                    }
                })),
                { text: 'Remove Assignment', style: 'destructive', onPress: async () => {
                    await fetch(`${API}/admin/users/${userId}/assign`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ businessUserId: null }),
                    });
                    fetchUsers();
                }},
                { text: 'Cancel', style: 'cancel' }
            ];

                Alert.alert('Assign to Business User', 'Kis team mein add karna hai?', options);
            } catch (e) {
                Alert.alert('Error', 'Server error');
            }
        };

    const handleDelete = (u) => {
        Alert.alert('Delete User', `Delete "${u.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const token = await getToken();
                    await fetch(`${API}/admin/users/${u._id}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchUsers();
                }
            }
        ]);
    };

    const handleApprove = (u) => {
        Alert.alert('Approve User', `Approve "${u.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    setActionLoading(u._id + 'approve');
                    try {
                        const token = await getToken();
                        const res = await fetch(`${API}/admin/users/${u._id}/approve`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        if (res.ok) { fetchUsers(); Alert.alert('Done', 'User approved!'); }
                        else Alert.alert('Error', data.message);
                    } catch { Alert.alert('Error', 'Server error'); }
                    setActionLoading(null);
                }
            },
        ]);
    };

    const handleReject = (u) => {
        Alert.alert('Reject User', `Reject "${u.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reject', style: 'destructive', onPress: async () => {
                    setActionLoading(u._id + 'reject');
                    try {
                        const token = await getToken();
                        const res = await fetch(`${API}/admin/users/${u._id}/reject`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        if (res.ok) { fetchUsers(); Alert.alert('Done', 'User rejected.'); }
                        else Alert.alert('Error', data.message);
                    } catch { Alert.alert('Error', 'Server error'); }
                    setActionLoading(null);
                }
            },
        ]);
    };

    const renderUser = ({ item }) => {
        // const cfg = ROLE_COLORS[item.role] || ROLE_COLORS.agent;
        const cfg = ROLE_COLORS[item.role] || ROLE_COLORS.business_user;
        const isPending = item.status === 'pending';
        const isApproving = actionLoading === item._id + 'approve';
        const isRejecting = actionLoading === item._id + 'reject';
        return (
            <View style={styles.userCard}>
                <View style={[styles.avatar, { backgroundColor: cfg.soft }]}>
                    <Text style={[styles.avatarText, { color: cfg.color }]}>
                        {(item.name || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <View style={[styles.rolePill, { backgroundColor: cfg.soft }]}>
                            <Text style={[styles.rolePillText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        {isPending && (
                            <View style={[styles.rolePill, { backgroundColor: C.amberSoft }]}>
                                <Text style={[styles.rolePillText, { color: C.amber }]}>⏳ Pending</Text>
                            </View>
                        )}
                    </View> 
                    {isPending && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleApprove(item)}
                                disabled={isApproving || isRejecting}
                            >
                                {isApproving
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={styles.approveBtnText}>✓ Approve</Text>
                                }
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleReject(item)}
                                disabled={isApproving || isRejecting}
                            >
                                {isRejecting
                                    ? <ActivityIndicator size="small" color={C.red} />
                                    : <Text style={styles.rejectBtnText}>✗ Reject</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )} 
                </View>
                <View style={styles.actions}>
                    <View style={[styles.statusDot, { backgroundColor: item.isActive ? C.green : C.red }]} />
                    {item.role === 'salesperson' && (
                        <TouchableOpacity onPress={() => handleAssign(item._id)} style={styles.iconBtn}>
                            <Text style={{ fontSize: 16 }}>🔗</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                        <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            <View style={styles.header}>
                <Text style={styles.title}>Manage Users</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, email, role…"
                    placeholderTextColor={C.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}>
                {FILTER_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                        onPress={() => setActiveFilter(tab)}
                    >
                        <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                            {tab === 'Pending' ? '⏳ Pending' :
                            tab === 'business_user' ? '👤 Business Users' :
                            tab === 'salesperson' ? '💼 Salespersons' : 'All'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.countText}>{filtered.length} users</Text>

            <FlatList
                data={filtered}
                keyExtractor={item => item._id}
                renderItem={renderUser}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={C.primary} />}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
                ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
            />

            {/* Add / Edit Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editUser ? 'Edit User' : 'Add New User'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
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
                                        placeholderTextColor={C.textMuted}
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
                                    {ROLES.map(r => {
                                        const cfg = ROLE_COLORS[r] || ROLE_COLORS.business_user;
                                        const active = form.role === r;
                                        return (
                                            <TouchableOpacity
                                                key={r}
                                                style={[styles.roleChip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                                                onPress={() => setForm(p => ({ ...p, role: r }))}
                                            >
                                                <Text style={[styles.roleChipText, active && { color: '#fff' }]}>{cfg.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            <View style={[styles.field, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <View>
                                    <Text style={styles.fieldLabel}>Active</Text>
                                    <Text style={styles.fieldSub}>User can log in</Text>
                                </View>
                                <Switch
                                    value={form.isActive}
                                    onValueChange={v => setForm(p => ({ ...p, isActive: v }))}
                                    trackColor={{ true: C.primary, false: C.border }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.saveBtnText}>{editUser ? 'Update User' : 'Create User'}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    addBtn: { backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
    addBtnText: { color: '#fff', fontWeight: '700' },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
        marginHorizontal: 16, marginTop: 14, marginBottom: 4,
        borderRadius: 12, paddingHorizontal: 12, borderWidth: 1.5, borderColor: C.border,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.text },
    countText: { paddingHorizontal: 20, fontSize: 13, color: C.textMuted, marginBottom: 8, marginTop: 6 },

    userCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, ...shadow,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontWeight: '800', fontSize: 18 },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '700', color: C.text },
    userEmail: { fontSize: 12, color: C.textSub, marginVertical: 3 },
    rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
    rolePillText: { fontSize: 11, fontWeight: '700' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    iconBtn: { padding: 6 },
    empty: { color: C.textMuted, textAlign: 'center', marginTop: 60, fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    closeText: { fontSize: 14, color: C.textSub },

    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 6 },
    fieldSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
    fieldInput: {
        borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt,
    },
    roleChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
        backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
    },
    roleChipText: { fontSize: 12, fontWeight: '600', color: C.textSub },
        saveBtn: { backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
        saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
        filterTab: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
    },
    filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    filterTabText: { fontSize: 13, fontWeight: '600', color: C.textSub },
    filterTabTextActive: { color: '#fff' },
    approveBtn: {
        backgroundColor: C.green, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    },
    approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    rejectBtn: {
        borderWidth: 1.5, borderColor: C.red, paddingHorizontal: 12,
        paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    },
    rejectBtnText: { color: C.red, fontSize: 12, fontWeight: '700' },
});
