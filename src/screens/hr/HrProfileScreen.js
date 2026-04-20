import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { C, shadow, shadowMd } from '../../theme';
import { api } from '../../services/api';

const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export default function HrProfileScreen() {
    const [hr, setHr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });

    const showMsg = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 3500);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await api.getHrProfile();
            setHr(data.hr);
            setName(data.hr?.name || '');
            setPhone(data.hr?.phone || '');
        } catch (e) {
            showMsg('Profile load nahi hua', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) { showMsg('Name required hai', 'error'); return; }
        setSaving(true);
        try {
            const data = await api.updateHrProfile({ name, phone });
            if (data.hr) {
                setHr(data.hr);
                setEditing(false);
                showMsg('Profile update ho gaya! ✅');
            } else {
                showMsg(data.message || 'Update failed', 'error');
            }
        } catch {
            showMsg('Server error. Try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.amber} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <Text style={styles.headerSubtitle}>Apni profile information update karo</Text>
                </View>

                {/* Message Banner */}
                {msg.text ? (
                    <View style={[styles.msgBox, msg.type === 'error' ? styles.msgError : styles.msgSuccess]}>
                        <Text style={[styles.msgText, { color: msg.type === 'error' ? '#b91c1c' : '#15803d' }]}>
                            {msg.text}
                        </Text>
                    </View>
                ) : null}

                {/* Avatar Card */}
                <View style={styles.card}>
                    <View style={styles.avatarRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {hr?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hrName}>{hr?.name}</Text>
                            <Text style={styles.hrEmail}>{hr?.email}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{hr?.role?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Account Info Grid */}
                    <Text style={styles.sectionLabel}>Account Information</Text>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoKey}>Email</Text>
                            <Text style={styles.infoVal}>{hr?.email}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoKey}>Role</Text>
                            <Text style={[styles.infoVal, { textTransform: 'capitalize' }]}>{hr?.role}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoKey}>Status</Text>
                            <View style={[styles.statusBadge, {
                                backgroundColor: hr?.isActive ? C.greenSoft : C.redSoft
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: hr?.isActive ? C.green : C.red
                                }]}>
                                    {hr?.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoKey}>Member Since</Text>
                            <Text style={styles.infoVal}>{fmt(hr?.createdAt)}</Text>
                        </View>
                        {hr?.phone ? (
                            <View style={styles.infoItem}>
                                <Text style={styles.infoKey}>Phone</Text>
                                <Text style={styles.infoVal}>{hr.phone}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Edit Profile Card */}
                <View style={styles.card}>
                    <View style={styles.editHeader}>
                        <Text style={styles.sectionLabel}>Edit Profile</Text>
                        {!editing && (
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => setEditing(true)}
                            >
                                <Text style={styles.editBtnText}>✏️ Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Name Field */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <TextInput
                            style={[styles.input, !editing && styles.inputDisabled]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Apna naam likho"
                            placeholderTextColor={C.textMuted}
                            editable={editing}
                        />
                    </View>

                    {/* Phone Field */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Phone</Text>
                        <TextInput
                            style={[styles.input, !editing && styles.inputDisabled]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone number"
                            placeholderTextColor={C.textMuted}
                            keyboardType="phone-pad"
                            editable={editing}
                        />
                    </View>

                    {/* Email (read-only) */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={hr?.email || ''}
                            editable={false}
                        />
                        <Text style={styles.fieldHint}>
                            Email change karne ke liye admin se contact karo
                        </Text>
                    </View>

                    {editing && (
                        <View style={styles.btnRow}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setEditing(false);
                                    setName(hr?.name || '');
                                    setPhone(hr?.phone || '');
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.saveBtnText}>Save Changes</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: C.surface,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: C.text },
    headerSubtitle: { fontSize: 13, color: C.textSub, marginTop: 2 },

    msgBox: {
        marginHorizontal: 16, marginTop: 12,
        padding: 14, borderRadius: 12, borderWidth: 1,
    },
    msgSuccess: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
    msgError: { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
    msgText: { fontSize: 13, fontWeight: '600' },

    card: {
        backgroundColor: C.surface, marginHorizontal: 16,
        marginTop: 16, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: C.border, ...shadow,
    },

    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    avatar: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: C.amberSoft,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: C.amber,
    },
    avatarText: { color: C.amber, fontWeight: '800', fontSize: 26 },
    hrName: { fontSize: 18, fontWeight: '700', color: C.text },
    hrEmail: { fontSize: 13, color: C.textSub, marginTop: 2 },
    roleBadge: {
        marginTop: 6, alignSelf: 'flex-start',
        backgroundColor: C.amberSoft, paddingHorizontal: 10,
        paddingVertical: 3, borderRadius: 20,
    },
    roleBadgeText: { fontSize: 11, fontWeight: '700', color: C.amber },

    divider: { height: 1, backgroundColor: C.border, marginBottom: 16 },

    sectionLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 },

    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    infoItem: { width: '45%' },
    infoKey: { fontSize: 11, color: C.textMuted, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
    infoVal: { fontSize: 13, fontWeight: '600', color: C.text },

    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700' },

    editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    editBtn: { backgroundColor: C.amberSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    editBtnText: { color: C.amber, fontWeight: '700', fontSize: 13 },

    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 6 },
    input: {
        backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: C.text,
    },
    inputDisabled: { backgroundColor: C.bg, color: C.textSub, borderColor: C.border },
    fieldHint: { fontSize: 11, color: C.textMuted, marginTop: 4 },

    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: { flex: 1, backgroundColor: C.surfaceAlt, padding: 14, borderRadius: 14, alignItems: 'center' },
    cancelBtnText: { color: C.textSub, fontWeight: '600', fontSize: 14 },
    saveBtn: {
        flex: 2, backgroundColor: C.amber, padding: 14,
        borderRadius: 14, alignItems: 'center',
        shadowColor: C.amber, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});