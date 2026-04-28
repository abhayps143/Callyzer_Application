import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, shadow, shadowMd, rs, fs } from '../../theme';
import { API_BASE_URL as API } from '../../config';

const getToken = () => AsyncStorage.getItem('token');

const authHeaders = async () => {
    const token = await getToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

export default function AdminApprovalsScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // stores id being actioned

    const fetchPending = async () => {
        try {
            const headers = await authHeaders();
            const res = await fetch(`${API}/admin/pending-approvals`, { headers });
            const data = await res.json();
            setUsers(data.users || []);
        } catch (e) {
            console.log('Fetch pending error:', e);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchPending(); }, []);

    const handleApprove = (user) => {
        Alert.alert(
            'Approve Account',
            `Approve "${user.name}" as a Business User? They will be able to login immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Approve', onPress: () => doAction(user._id, 'approve') },
            ]
        );
    };

    const handleReject = (user) => {
        Alert.alert(
            'Reject Account',
            `Reject "${user.name}"? They will not be able to login.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reject', style: 'destructive', onPress: () => doAction(user._id, 'reject') },
            ]
        );
    };

    const doAction = async (id, action) => {
        setActionLoading(id + action);
        try {
            const headers = await authHeaders();
            const res = await fetch(`${API}/admin/users/${id}/${action}`, {
                method: 'PATCH', headers,
            });
            const data = await res.json();
            if (res.ok) {
                Alert.alert('Done', data.message || `User ${action}d successfully.`);
                fetchPending(); // refresh list
            } else {
                Alert.alert('Error', data.message || 'Something went wrong.');
            }
        } catch {
            Alert.alert('Error', 'Network error. Please try again.');
        }
        setActionLoading(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const renderItem = ({ item }) => {
        const isApproving = actionLoading === item._id + 'approve';
        const isRejecting = actionLoading === item._id + 'reject';
        const isBusy = isApproving || isRejecting;

        return (
            <View style={styles.card}>
                {/* Avatar + Info */}
                <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(item.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                        {item.phone ? (
                            <Text style={styles.userPhone}>📱 {item.phone}</Text>
                        ) : null}
                    </View>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pending</Text>
                    </View>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>🗓️ Registered: {formatDate(item.createdAt)}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.rejectBtn, isBusy && styles.btnDisabled]}
                        onPress={() => handleReject(item)}
                        disabled={isBusy}
                        activeOpacity={0.8}
                    >
                        {isRejecting
                            ? <ActivityIndicator color={C.red} size="small" />
                            : <Text style={styles.rejectText}>✗  Reject</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.approveBtn, isBusy && styles.btnDisabled]}
                        onPress={() => handleApprove(item)}
                        disabled={isBusy}
                        activeOpacity={0.8}
                    >
                        {isApproving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.approveBtnText}>✓  Approve</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Header summary */}
            <View style={styles.headerBox}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerCount}>{users.length}</Text>
                    <Text style={styles.headerLabel}>Pending Approval{users.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={[styles.headerBadge, { backgroundColor: users.length > 0 ? C.amberSoft : C.greenSoft }]}>
                    <Text style={[styles.headerBadgeText, { color: users.length > 0 ? C.amber : C.green }]}>
                        {users.length > 0 ? '⚠️ Action needed' : '✓ All clear'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchPending(); }}
                        tintColor={C.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🎉</Text>
                        <Text style={styles.emptyTitle}>No Pending Approvals</Text>
                        <Text style={styles.emptySub}>All Business User registrations have been reviewed.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    list: { padding: rs(16), paddingBottom: rs(40) },

    headerBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: rs(16), paddingVertical: rs(14),
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
    headerCount: { fontSize: fs(28), fontWeight: '800', color: C.text },
    headerLabel: { fontSize: fs(14), color: C.textSub, fontWeight: '500' },
    headerBadge: { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(20) },
    headerBadgeText: { fontSize: fs(12), fontWeight: '600' },

    card: {
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(16), marginBottom: rs(12),
        ...shadowMd, borderWidth: 1, borderColor: C.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12), marginBottom: rs(10) },
    avatar: {
        width: rs(48), height: rs(48), borderRadius: rs(24),
        backgroundColor: C.amberSoft, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: fs(20), fontWeight: '700', color: C.amber },
    userInfo: { flex: 1 },
    userName: { fontSize: fs(16), fontWeight: '700', color: C.text, marginBottom: rs(2) },
    userEmail: { fontSize: fs(13), color: C.textSub, marginBottom: rs(2) },
    userPhone: { fontSize: fs(12), color: C.textMuted },
    pendingBadge: {
        backgroundColor: C.amberSoft, paddingHorizontal: rs(10),
        paddingVertical: rs(4), borderRadius: rs(20),
    },
    pendingText: { fontSize: fs(11), fontWeight: '700', color: C.amber },

    metaRow: { marginBottom: rs(14) },
    metaText: { fontSize: fs(12), color: C.textMuted },

    actions: { flexDirection: 'row', gap: rs(10) },
    rejectBtn: {
        flex: 1, paddingVertical: rs(12), borderRadius: rs(12),
        borderWidth: 1.5, borderColor: C.red, alignItems: 'center', justifyContent: 'center',
    },
    rejectText: { fontSize: fs(14), fontWeight: '700', color: C.red },
    approveBtn: {
        flex: 1, paddingVertical: rs(12), borderRadius: rs(12),
        backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', ...shadow,
    },
    approveBtnText: { fontSize: fs(14), fontWeight: '700', color: '#fff' },
    btnDisabled: { opacity: 0.5 },

    empty: { alignItems: 'center', paddingTop: rs(60) },
    emptyIcon: { fontSize: rs(52), marginBottom: rs(16) },
    emptyTitle: { fontSize: fs(18), fontWeight: '700', color: C.text, marginBottom: rs(8) },
    emptySub: { fontSize: fs(14), color: C.textMuted, textAlign: 'center' },
});