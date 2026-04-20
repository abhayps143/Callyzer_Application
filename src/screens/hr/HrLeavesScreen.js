import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, Alert
} from 'react-native';
import { api } from '../../services/api';

const STATUS_COLORS = {
    pending: { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
    approved: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    rejected: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
};

const LEAVE_TYPE_COLORS = {
    sick: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    casual: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    earned: { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' },
    unpaid: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
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
                        <View>
                            <Text style={modalStyles.title}>Leave Review</Text>
                            <Text style={modalStyles.subtitle}>Approve or reject this request</Text>
                        </View>
                        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
                            <Text style={modalStyles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {leave && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Employee header */}
                            <View style={modalStyles.empBox}>
                                <View style={modalStyles.avatar}>
                                    <Text style={modalStyles.avatarText}>{leave.employee?.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={modalStyles.empName}>{leave.employee?.name}</Text>
                                    <Text style={modalStyles.empRole}>{leave.employee?.role?.replace('_', ' ')}</Text>
                                </View>
                            </View>

                            {/* Leave Details */}
                            <View style={modalStyles.detailBox}>
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Leave Type</Text>
                                    <View style={[modalStyles.typeBadge, {
                                        backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType]?.bg,
                                        borderColor: LEAVE_TYPE_COLORS[leave.leaveType]?.border,
                                    }]}>
                                        <Text style={[modalStyles.typeBadgeText, { color: LEAVE_TYPE_COLORS[leave.leaveType]?.color }]}>
                                            {leave.leaveType}
                                        </Text>
                                    </View>
                                </View>
                                <View style={modalStyles.divider} />
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Duration</Text>
                                    <Text style={modalStyles.detailValue}>{leave.days} day(s)</Text>
                                </View>
                                <View style={modalStyles.divider} />
                                <View style={modalStyles.detailRow}>
                                    <Text style={modalStyles.detailLabel}>Period</Text>
                                    <Text style={modalStyles.detailValue}>{fmt(leave.fromDate)} → {fmt(leave.toDate)}</Text>
                                </View>
                                {leave.reason && (
                                    <>
                                        <View style={modalStyles.divider} />
                                        <View style={modalStyles.detailRow}>
                                            <Text style={modalStyles.detailLabel}>Reason</Text>
                                            <Text style={[modalStyles.detailValue, { flex: 1, marginLeft: 8, textAlign: 'right' }]}>{leave.reason}</Text>
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Decision Buttons */}
                            <Text style={modalStyles.label}>Decision</Text>
                            <View style={modalStyles.decisionRow}>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'approved' && modalStyles.approveActive]}
                                    onPress={() => setAction('approved')}
                                >
                                    <Text style={modalStyles.decisionIcon}>✅</Text>
                                    <Text style={[modalStyles.decisionText, action === 'approved' && { color: '#15803d', fontWeight: '700' }]}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'rejected' && modalStyles.rejectActive]}
                                    onPress={() => setAction('rejected')}
                                >
                                    <Text style={modalStyles.decisionIcon}>❌</Text>
                                    <Text style={[modalStyles.decisionText, action === 'rejected' && { color: '#b91c1c', fontWeight: '700' }]}>Reject</Text>
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
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
                            />

                            <TouchableOpacity
                                style={[
                                    modalStyles.submitBtn,
                                    action === 'rejected' && modalStyles.submitBtnReject,
                                    loading && { opacity: 0.6 }
                                ]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={modalStyles.submitText}>
                                        {action === 'approved' ? '✅ Approve Leave' : '❌ Reject Leave'}
                                    </Text>
                                }
                            </TouchableOpacity>
                            <View style={{ height: 16 }} />
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
    const TAB_LABELS = { '': 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
    const TAB_DOTS = { pending: '#a16207', approved: '#15803d', rejected: '#b91c1c' };

    const fetchLeaves = useCallback(async () => {
        try {
            const data = await api.getHrLeaves({ status: filterStatus });
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
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Leave Management</Text>
                    <Text style={styles.headerSubtitle}>Review and manage employee leaves</Text>
                </View>
            </View>

            {/* Status Tabs - FIXED HEIGHT */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsContainer}
                    contentContainerStyle={styles.tabs}
                >
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, filterStatus === tab && styles.tabActive]}
                            onPress={() => setFilterStatus(tab)}
                        >
                            {tab !== '' && (
                                <View style={[styles.tabDot, { backgroundColor: filterStatus === tab ? '#ffffff' : TAB_DOTS[tab] }]} />
                            )}
                            <Text style={[styles.tabText, filterStatus === tab && styles.tabTextActive]}>
                                {TAB_LABELS[tab]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={styles.loadingText}>Loading leaves...</Text>
                </View>
            ) : leaves.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconWrap}>
                        <Text style={styles.emptyIcon}>📋</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No leave requests</Text>
                    <Text style={styles.emptyText}>No requests found for this filter</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
                >
                    {leaves.map((leave) => {
                        const statusStyle = STATUS_COLORS[leave.status] || {};
                        const typeStyle = LEAVE_TYPE_COLORS[leave.leaveType] || {};

                        return (
                            <View key={leave._id} style={styles.card}>
                                {/* Card Top */}
                                <View style={styles.cardTop}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{leave.employee?.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.empInfo}>
                                        <Text style={styles.empName}>{leave.employee?.name}</Text>
                                        <Text style={styles.empRole}>{leave.employee?.role?.replace('_', ' ')}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, {
                                        backgroundColor: statusStyle.bg,
                                        borderColor: statusStyle.border,
                                    }]}>
                                        <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                            {leave.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Leave Info */}
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Type</Text>
                                        <View style={[styles.typeBadge, {
                                            backgroundColor: typeStyle.bg,
                                            borderColor: typeStyle.border,
                                        }]}>
                                            <Text style={[styles.typeText, { color: typeStyle.color }]}>
                                                {leave.leaveType}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Duration</Text>
                                        <Text style={styles.infoValue}>{leave.days} day(s)</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Period</Text>
                                        <Text style={styles.infoValue} numberOfLines={1}>
                                            {fmt(leave.fromDate)}
                                        </Text>
                                        <Text style={styles.infoDash}>→ {fmt(leave.toDate)}</Text>
                                    </View>
                                </View>

                                {leave.reason ? (
                                    <View style={styles.reasonBox}>
                                        <Text style={styles.reasonLabel}>Reason</Text>
                                        <Text style={styles.reasonText} numberOfLines={2}>{leave.reason}</Text>
                                    </View>
                                ) : null}

                                {/* Action */}
                                {leave.status === 'pending' && (
                                    <TouchableOpacity
                                        style={styles.reviewBtn}
                                        onPress={() => setActionLeave(leave)}
                                    >
                                        <Text style={styles.reviewBtnText}>Review Request</Text>
                                    </TouchableOpacity>
                                )}

                                {leave.status !== 'pending' && leave.approvedBy?.name && (
                                    <View style={styles.approvedByRow}>
                                        <Text style={styles.approvedByText}>
                                            {leave.status === 'approved' ? '✅' : '❌'} {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.approvedBy.name}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 24 }} />
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
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    loadingText: { color: '#6b7280', fontSize: 14, marginTop: 8 },

    // Header
    header: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    // Tabs - FIXED HEIGHT SECTION
    tabsWrapper: {
        height: 60, // Fixed height for the tabs container
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabsContainer: {
        flexGrow: 0, // Prevents ScrollView from expanding
    },
    tabs: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
        height: 44, // Fixed height for the content
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    tabDot: { width: 6, height: 6, borderRadius: 3 },
    tabText: { color: '#374151', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#ffffff' },

    // Empty
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
    emptyText: { color: '#9ca3af', fontSize: 13, marginTop: 4 },

    // List
    list: { padding: 16, gap: 12 },

    // Card
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#eef2ff',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
        borderWidth: 2, borderColor: '#c7d2fe',
    },
    avatarText: { color: '#4f46e5', fontWeight: '700', fontSize: 17 },
    empInfo: { flex: 1 },
    empName: { color: '#111827', fontSize: 15, fontWeight: '700' },
    empRole: { color: '#6b7280', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },

    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 14 },

    // Info grid
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    infoItem: { flex: 1 },
    infoLabel: {
        color: '#9ca3af', fontSize: 10, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
    },
    infoValue: { color: '#374151', fontSize: 12, fontWeight: '600' },
    infoDash: { color: '#6b7280', fontSize: 11, marginTop: 2 },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 9, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    typeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    // Reason
    reasonBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderLeftWidth: 3,
        borderLeftColor: '#c7d2fe',
    },
    reasonLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
    reasonText: { color: '#374151', fontSize: 13, lineHeight: 18 },

    // Review button
    reviewBtn: {
        backgroundColor: '#4f46e5',
        borderRadius: 12,
        paddingVertical: 11,
        alignItems: 'center',
        marginTop: 4,
    },
    reviewBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

    // Approved by
    approvedByRow: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7,
        marginTop: 4,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    approvedByText: { color: '#6b7280', fontSize: 12 },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        maxHeight: '88%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center', alignItems: 'center',
    },
    close: { color: '#374151', fontSize: 14, fontWeight: '600' },

    empBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb',
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#eef2ff',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#c7d2fe',
    },
    avatarText: { color: '#4f46e5', fontWeight: '700', fontSize: 17 },
    empName: { color: '#111827', fontWeight: '700', fontSize: 14 },
    empRole: { color: '#6b7280', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },

    detailBox: {
        backgroundColor: '#f8fafc', borderRadius: 14,
        padding: 14, marginBottom: 20,
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 6,
    },
    divider: { height: 1, backgroundColor: '#e5e7eb' },
    detailLabel: { color: '#6b7280', fontSize: 13 },
    detailValue: { color: '#111827', fontSize: 13, fontWeight: '600' },
    typeBadge: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 4 },

    decisionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    decisionBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 6,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5, borderColor: '#e5e7eb',
    },
    approveActive: { borderColor: '#86efac', backgroundColor: '#dcfce7' },
    rejectActive: { borderColor: '#fca5a5', backgroundColor: '#fee2e2' },
    decisionIcon: { fontSize: 16 },
    decisionText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },

    textarea: {
        backgroundColor: '#f8fafc', color: '#111827',
        borderRadius: 12, padding: 12, fontSize: 13,
        borderWidth: 1, borderColor: '#d1d5db',
        marginBottom: 16, minHeight: 80, textAlignVertical: 'top',
    },

    submitBtn: {
        backgroundColor: '#16a34a',
        borderRadius: 14, paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnReject: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
    },
    submitText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});