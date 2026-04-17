import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, Alert
} from 'react-native';
import { api } from '../../services/api';

const STATUS_COLORS = {
    pending: { bg: '#eab30820', color: '#eab308' },
    approved: { bg: '#22c55e20', color: '#22c55e' },
    rejected: { bg: '#ef444420', color: '#ef4444' },
};

const LEAVE_TYPE_COLORS = {
    sick: { bg: '#ef444415', color: '#ef4444' },
    casual: { bg: '#3b82f615', color: '#3b82f6' },
    earned: { bg: '#a855f715', color: '#a855f7' },
    unpaid: { bg: '#64748b20', color: '#64748b' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Action Modal ───────────────────────────────────────────────
const ActionModal = ({ visible, leave, onClose, onDone }) => {
    const [action, setAction] = useState('approved');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (action === 'rejected' && !remarks.trim()) {
            Alert.alert('Error', 'Rejection reason daalna zaroori hai');
            return;
        }
        setLoading(true);
        try {
            const data = await api.hrLeaveAction(leave.hrRecordId, leave._id, action, remarks);
            if (data.message) {
                onDone();
            }
        } catch {
            Alert.alert('Error', 'Kuch gadbad hua. Dobara try karo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Leave Review</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={modalStyles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {leave && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Leave Details */}
                            <View style={modalStyles.detailBox}>
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Employee</Text>
                                    <Text style={modalStyles.detailValue}>{leave.employee?.name}</Text>
                                </View>
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Type</Text>
                                    <View style={[modalStyles.typeBadge, { backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType]?.bg }]}>
                                        <Text style={[modalStyles.typeBadgeText, { color: LEAVE_TYPE_COLORS[leave.leaveType]?.color }]}>
                                            {leave.leaveType}
                                        </Text>
                                    </View>
                                </View>
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Duration</Text>
                                    <Text style={modalStyles.detailValue}>{leave.days} day(s)</Text>
                                </View>
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>From</Text>
                                    <Text style={modalStyles.detailValue}>{fmt(leave.fromDate)} → {fmt(leave.toDate)}</Text>
                                </View>
                                {leave.reason && (
                                    <View style={modalStyles.detailRow}>
                                        <Text style={modalStyles.detailLabel}>Reason</Text>
                                        <Text style={[modalStyles.detailValue, { flex: 1, marginLeft: 8 }]}>{leave.reason}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Decision Buttons */}
                            <Text style={modalStyles.label}>Decision</Text>
                            <View style={modalStyles.decisionRow}>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'approved' && modalStyles.approveActive]}
                                    onPress={() => setAction('approved')}
                                >
                                    <Text style={[modalStyles.decisionText, action === 'approved' && { color: '#22c55e' }]}>✅ Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'rejected' && modalStyles.rejectActive]}
                                    onPress={() => setAction('rejected')}
                                >
                                    <Text style={[modalStyles.decisionText, action === 'rejected' && { color: '#ef4444' }]}>❌ Reject</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={modalStyles.label}>
                                {action === 'rejected' ? 'Rejection Reason *' : 'Remarks (Optional)'}
                            </Text>
                            <TextInput
                                style={modalStyles.textarea}
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder={action === 'rejected' ? 'Reason likho...' : 'Note add karo...'}
                                placeholderTextColor="#475569"
                                multiline
                                numberOfLines={3}
                            />

                            <TouchableOpacity
                                style={[modalStyles.submitBtn, loading && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={modalStyles.submitText}>Submit Decision</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ── Main Component ─────────────────────────────────────────────
export default function HrLeavesScreen() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [actionLeave, setActionLeave] = useState(null);

    const TABS = ['', 'pending', 'approved', 'rejected'];
    const TAB_LABELS = { '': 'All', pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected' };

    const fetchLeaves = useCallback(async () => {
        try {
            const data = await api.getHrLeaves(filterStatus);
            setLeaves(data.leaves || []);
        } catch {
            Alert.alert('Error', 'Leaves load nahi hui');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const onRefresh = () => { setRefreshing(true); fetchLeaves(); };

    const handleActionDone = () => {
        setActionLeave(null);
        fetchLeaves();
    };

    return (
        <View style={styles.container}>
            {/* Status Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabs}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, filterStatus === tab && styles.tabActive]}
                        onPress={() => setFilterStatus(tab)}
                    >
                        <Text style={[styles.tabText, filterStatus === tab && styles.tabTextActive]}>
                            {TAB_LABELS[tab]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#eab308" />
                </View>
            ) : leaves.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyText}>Koi leave request nahi mili</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />}
                >
                    {leaves.map((leave) => (
                        <View key={leave._id} style={styles.card}>
                            {/* Employee Info */}
                            <View style={styles.cardTop}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{leave.employee?.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.empInfo}>
                                    <Text style={styles.empName}>{leave.employee?.name}</Text>
                                    <Text style={styles.empRole}>{leave.employee?.role?.replace('_', ' ')}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[leave.status]?.bg }]}>
                                    <Text style={[styles.statusText, { color: STATUS_COLORS[leave.status]?.color }]}>
                                        {leave.status}
                                    </Text>
                                </View>
                            </View>

                            {/* Leave Info */}
                            <View style={styles.infoRow}>
                                <View style={[styles.typeBadge, { backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType]?.bg }]}>
                                    <Text style={[styles.typeText, { color: LEAVE_TYPE_COLORS[leave.leaveType]?.color }]}>
                                        {leave.leaveType}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>{fmt(leave.fromDate)} → {fmt(leave.toDate)}</Text>
                                <Text style={styles.daysText}>{leave.days}d</Text>
                            </View>

                            {leave.reason ? (
                                <Text style={styles.reason} numberOfLines={2}>{leave.reason}</Text>
                            ) : null}

                            {/* Action */}
                            {leave.status === 'pending' && (
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.approveBtn}
                                        onPress={() => setActionLeave(leave)}
                                    >
                                        <Text style={styles.approveBtnText}>Review</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {leave.status !== 'pending' && leave.approvedBy?.name && (
                                <Text style={styles.approvedBy}>
                                    {leave.status === 'approved' ? '✅' : '❌'} by {leave.approvedBy.name}
                                </Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}

            <ActionModal
                visible={!!actionLeave}
                leave={actionLeave}
                onClose={() => setActionLeave(null)}
                onDone={handleActionDone}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: '#475569', fontSize: 14 },

    tabsContainer: { maxHeight: 52, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
    tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
    tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0f172a' },
    tabActive: { backgroundColor: '#eab308' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#0f172a' },

    list: { padding: 16, gap: 12 },

    card: {
        backgroundColor: '#1e293b', borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: '#334155',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 15 },
    empInfo: { flex: 1 },
    empName: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
    empRole: { color: '#64748b', fontSize: 11, marginTop: 1, textTransform: 'capitalize' },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    dateText: { flex: 1, color: '#94a3b8', fontSize: 12 },
    daysText: { color: '#f8fafc', fontWeight: 'bold', fontSize: 13 },

    reason: { color: '#64748b', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },

    actionRow: { marginTop: 8 },
    approveBtn: {
        backgroundColor: '#eab30820', borderRadius: 10, paddingVertical: 8,
        alignItems: 'center', borderWidth: 1, borderColor: '#eab30840',
    },
    approveBtnText: { color: '#eab308', fontSize: 13, fontWeight: '700' },

    approvedBy: { color: '#475569', fontSize: 11, marginTop: 6 },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 16 },
    container: {
        backgroundColor: '#1e293b', borderRadius: 20, padding: 20,
        maxHeight: '85%', borderWidth: 1, borderColor: '#334155',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
    close: { color: '#64748b', fontSize: 18, padding: 4 },

    detailBox: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    detailLabel: { color: '#64748b', fontSize: 13 },
    detailValue: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    typeBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

    label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },

    decisionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    decisionBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        alignItems: 'center', backgroundColor: '#0f172a',
        borderWidth: 2, borderColor: '#334155',
    },
    approveActive: { borderColor: '#22c55e', backgroundColor: '#22c55e15' },
    rejectActive: { borderColor: '#ef4444', backgroundColor: '#ef444415' },
    decisionText: { color: '#64748b', fontWeight: '600', fontSize: 13 },

    textarea: {
        backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 10,
        padding: 12, fontSize: 13, borderWidth: 1, borderColor: '#334155',
        marginBottom: 16, minHeight: 80, textAlignVertical: 'top',
    },

    submitBtn: {
        backgroundColor: '#eab308', borderRadius: 12, paddingVertical: 13,
        alignItems: 'center',
    },
    submitText: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
});
