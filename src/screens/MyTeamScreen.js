import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, RefreshControl,
    Modal, ScrollView, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { C, shadow, shadowMd, rs, fs } from '../theme';
import { API_BASE_URL as API } from '../config';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '' };

const getToken = () => AsyncStorage.getItem('token');
const authHeaders = async () => {
    const token = await getToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

export default function MyTeamScreen() {
    const { user } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [pwdVisible, setPwdVisible] = useState(false);

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const fetchTeam = async () => {
        try {
            const headers = await authHeaders();
            const res = await fetch(`${API}/business/team`, { headers });
            const data = await res.json();
            const list = data.salespersons || data.users || data || [];
            setMembers(list);
            setFiltered(list);
        } catch (e) { console.log('MyTeam fetch error:', e); }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchTeam(); }, []);

    useEffect(() => {
        if (!search.trim()) { setFiltered(members); return; }
        const q = search.toLowerCase();
        setFiltered(members.filter(m =>
            m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
        ));
    }, [search, members]);

    const openAdd = () => {
        setEditMember(null);
        setForm(EMPTY_FORM);
        setPwdVisible(false);
        setShowModal(true);
    };

    const openEdit = (m) => {
        setEditMember(m);
        setForm({ name: m.name, email: m.email, password: '', phone: m.phone || '' });
        setPwdVisible(false);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.email.trim() || (!editMember && !form.password)) {
            Alert.alert('Missing fields', 'Name, email and password are required.');
            return;
        }
        if (!editMember && form.password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }
        setSaving(true);
        try {
            const headers = await authHeaders();
            let res, data;
            if (editMember) {
                const body = { name: form.name, phone: form.phone };
                if (form.password) body.password = form.password;
                res = await fetch(`${API}/business/salespersons/${editMember._id}`, {
                    method: 'PUT', headers, body: JSON.stringify(body),
                });
            } else {
                res = await fetch(`${API}/business/salespersons`, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        password: form.password,
                        phone: form.phone.trim(),
                    }),
                });
            }
            data = await res.json();
            if (res.ok) {
                Alert.alert('Success', data.message || 'Saved successfully.');
                setShowModal(false);
                fetchTeam();
            } else {
                Alert.alert('Error', data.message || 'Something went wrong.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        }
        setSaving(false);
    };

    const handleToggleStatus = (m) => {
        const action = m.isActive ? 'Deactivate' : 'Activate';
        Alert.alert(
            `${action} Member`,
            `${action} "${m.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action, style: m.isActive ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const headers = await authHeaders();
                            const res = await fetch(`${API}/business/salespersons/${m._id}/toggle-status`, {
                                method: 'PATCH', headers,
                            });
                            const data = await res.json();
                            if (res.ok) fetchTeam();
                            else Alert.alert('Error', data.message);
                        } catch { Alert.alert('Error', 'Network error.'); }
                    }
                },
            ]
        );
    };

    const handleResetPassword = (m) => {
        Alert.alert(
            'Reset Password',
            `Reset password for "${m.name}"? A new temporary password will be set.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset', style: 'destructive',
                    onPress: async () => {
                        try {
                            const headers = await authHeaders();
                            const res = await fetch(`${API}/business/salespersons/${m._id}/reset-password`, {
                                method: 'PATCH', headers,
                                body: JSON.stringify({ newPassword: 'Welcome@123' }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                                Alert.alert('Password Reset', `Password reset to: Welcome@123\nAsk ${m.name} to change it after login.`);
                            } else Alert.alert('Error', data.message);
                        } catch { Alert.alert('Error', 'Network error.'); }
                    }
                },
            ]
        );
    };

    const renderMember = ({ item, index }) => (
        <View style={styles.memberCard}>
            <View style={styles.memberTop}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: item.isActive ? C.primarySoft : C.surfaceAlt }]}>
                    <Text style={[styles.avatarText, { color: item.isActive ? C.primary : C.textMuted }]}>
                        {(item.name || 'S').charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Info */}
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                    {item.phone ? <Text style={styles.memberPhone}>📱 {item.phone}</Text> : null}
                </View>

                {/* Status badge */}
                <View style={[styles.statusBadge, {
                    backgroundColor: item.isActive ? C.greenSoft : C.redSoft
                }]}>
                    <Text style={[styles.statusText, { color: item.isActive ? C.green : C.red }]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            {/* Call count today */}
            {item.todayCalls !== undefined && (
                <View style={styles.todayRow}>
                    <Text style={styles.todayText}>📞 Today's calls: </Text>
                    <Text style={styles.todayCount}>{item.todayCalls ?? 0}</Text>
                </View>
            )}

            {/* Action buttons */}
            <View style={styles.memberActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                    <Text style={styles.actionBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: item.isActive ? C.red : C.green }]}
                    onPress={() => handleToggleStatus(item)} activeOpacity={0.7}
                >
                    <Text style={[styles.actionBtnText, { color: item.isActive ? C.red : C.green }]}>
                        {item.isActive ? '🚫 Deactivate' : '✅ Activate'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleResetPassword(item)} activeOpacity={0.7}>
                    <Text style={styles.actionBtnText}>🔑 Reset Pwd</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Search + Add */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or email..."
                        placeholderTextColor={C.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <Text style={styles.summaryText}>
                    {filtered.length} member{filtered.length !== 1 ? 's' : ''} ·{' '}
                    {members.filter(m => m.isActive).length} active
                </Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item._id}
                renderItem={renderMember}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTeam(); }} tintColor={C.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>No Team Members Yet</Text>
                        <Text style={styles.emptySub}>Tap "+ Add" to add your first salesperson.</Text>
                    </View>
                }
            />

            {/* Add / Edit Modal */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {editMember ? '✏️ Edit Member' : '➕ Add Salesperson'}
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Name */}
                            <Text style={styles.fieldLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter full name"
                                placeholderTextColor={C.textMuted}
                                value={form.name}
                                onChangeText={v => setField('name', v)}
                                autoCapitalize="words"
                            />

                            {/* Email — only when adding */}
                            {!editMember && (
                                <>
                                    <Text style={styles.fieldLabel}>Email *</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="salesperson@company.com"
                                        placeholderTextColor={C.textMuted}
                                        value={form.email}
                                        onChangeText={v => setField('email', v)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}

                            {/* Phone */}
                            <Text style={styles.fieldLabel}>Phone</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="10-digit number"
                                placeholderTextColor={C.textMuted}
                                value={form.phone}
                                onChangeText={v => setField('phone', v)}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />

                            {/* Password */}
                            <Text style={styles.fieldLabel}>
                                Password {editMember ? '(leave blank to keep current)' : '*'}
                            </Text>
                            <View style={styles.pwdRow}>
                                <TextInput
                                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                                    placeholder={editMember ? 'New password (optional)' : 'Min. 6 characters'}
                                    placeholderTextColor={C.textMuted}
                                    value={form.password}
                                    onChangeText={v => setField('password', v)}
                                    secureTextEntry={!pwdVisible}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setPwdVisible(p => !p)} style={styles.pwdEye}>
                                    <Text>{pwdVisible ? '🙈' : '👁️'}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Buttons */}
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.saveText}>{editMember ? 'Save Changes' : 'Add Member'}</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    list: { padding: rs(16), paddingBottom: rs(40) },

    toolbar: {
        flexDirection: 'row', gap: rs(10),
        paddingHorizontal: rs(16), paddingVertical: rs(12),
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surfaceAlt, borderRadius: rs(12),
        paddingHorizontal: rs(12), paddingVertical: rs(10),
        borderWidth: 1, borderColor: C.border, gap: rs(8),
    },
    searchIcon: { fontSize: fs(16) },
    searchInput: { flex: 1, fontSize: fs(14), color: C.text },
    addBtn: {
        backgroundColor: C.primary, borderRadius: rs(12),
        paddingHorizontal: rs(18), justifyContent: 'center', ...shadow,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: fs(14) },

    summary: { paddingHorizontal: rs(16), paddingVertical: rs(8) },
    summaryText: { fontSize: fs(12), color: C.textMuted },

    memberCard: {
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(16), marginBottom: rs(12),
        ...shadowMd, borderWidth: 1, borderColor: C.border,
    },
    memberTop: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(10) },
    avatar: {
        width: rs(46), height: rs(46), borderRadius: rs(23),
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: fs(18), fontWeight: '700' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: fs(15), fontWeight: '700', color: C.text },
    memberEmail: { fontSize: fs(12), color: C.textSub },
    memberPhone: { fontSize: fs(12), color: C.textMuted },
    statusBadge: {
        paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(20),
    },
    statusText: { fontSize: fs(11), fontWeight: '700' },

    todayRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.primarySoft, borderRadius: rs(10),
        paddingHorizontal: rs(10), paddingVertical: rs(6), marginBottom: rs(10),
    },
    todayText: { fontSize: fs(12), color: C.primary },
    todayCount: { fontSize: fs(14), fontWeight: '800', color: C.primary },

    memberActions: { flexDirection: 'row', gap: rs(8), flexWrap: 'wrap' },
    actionBtn: {
        paddingHorizontal: rs(12), paddingVertical: rs(8),
        borderRadius: rs(10), borderWidth: 1.5, borderColor: C.border,
    },
    actionBtnText: { fontSize: fs(12), fontWeight: '600', color: C.textSub },

    empty: { alignItems: 'center', paddingTop: rs(60) },
    emptyIcon: { fontSize: rs(52), marginBottom: rs(16) },
    emptyTitle: { fontSize: fs(18), fontWeight: '700', color: C.text, marginBottom: rs(8) },
    emptySub: { fontSize: fs(14), color: C.textMuted, textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: C.surface, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
        padding: rs(24), maxHeight: '85%',
    },
    modalTitle: { fontSize: fs(18), fontWeight: '800', color: C.text, marginBottom: rs(20) },
    fieldLabel: { fontSize: fs(13), fontWeight: '600', color: C.textSub, marginBottom: rs(6), marginTop: rs(12) },
    modalInput: {
        backgroundColor: C.surfaceAlt, borderRadius: rs(12), padding: rs(14),
        fontSize: fs(14), color: C.text, borderWidth: 1.5, borderColor: C.border, marginBottom: rs(4),
    },
    pwdRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
    pwdEye: { padding: rs(14) },
    modalBtns: { flexDirection: 'row', gap: rs(12), marginTop: rs(20) },
    cancelBtn: {
        flex: 1, paddingVertical: rs(14), borderRadius: rs(12),
        borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
    },
    cancelText: { fontSize: fs(15), fontWeight: '600', color: C.textSub },
    saveBtn: {
        flex: 2, paddingVertical: rs(14), borderRadius: rs(12),
        backgroundColor: C.primary, alignItems: 'center', ...shadow,
    },
    saveText: { fontSize: fs(15), fontWeight: '700', color: '#fff' },
});