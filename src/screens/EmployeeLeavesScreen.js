import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert, RefreshControl, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const fmt = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CFG = {
    pending: { color: '#f59e0b', bg: '#f59e0b15', icon: '⏳', label: 'Pending' },
    approved: { color: '#22c55e', bg: '#22c55e15', icon: '✅', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#ef444415', icon: '❌', label: 'Rejected' },
};

const LEAVE_CFG = {
    sick: { color: '#ef4444', bg: '#ef444415', icon: '🤒', label: 'Sick Leave' },
    casual: { color: '#3b82f6', bg: '#3b82f615', icon: '🌴', label: 'Casual Leave' },
    earned: { color: '#8b5cf6', bg: '#8b5cf615', icon: '💼', label: 'Earned Leave' },
    unpaid: { color: '#64748b', bg: '#64748b15', icon: '💸', label: 'Unpaid Leave' },
};

const today = () => new Date().toISOString().split('T')[0];
const calcWorkingDays = (from, to) => {
    if (!from || !to) return 0;
    let days = 0;
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) days++;
        cur.setDate(cur.getDate() + 1);
    }
    return days || 1;
};

// ── Apply Leave Modal ─────────────────────────────────────────
const ApplyModal = ({ visible, onClose, onDone }) => {
    const [form, setForm] = useState({ leaveType: 'sick', fromDate: today(), toDate: today(), reason: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const days = calcWorkingDays(form.fromDate, form.toDate);

    const handleSubmit = async () => {
        if (!form.fromDate || !form.toDate) { setError('Please select dates'); return; }
        if (form.toDate < form.fromDate) { setError('End date must be after start date'); return; }
        setSaving(true); setError('');
        try {
            const res = await api.applyLeave(form);
            console.log('applyLeave response:', JSON.stringify(res));
            // Accept any non-error response as success
            if (res.error || res.message?.toLowerCase().includes('access') || res.message?.toLowerCase().includes('unauthorized')) {
                setError(res.message || res.error || 'Failed to apply');
            } else {
                onDone();
            }
        } catch (e) {
            console.log('applyLeave error:', e);
            setError('Server error. Please try again.');
        }
        finally { setSaving(false); }
    };

    const leaveTypes = ['sick', 'casual', 'earned', 'unpaid'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={mStyles.container}>
                <View style={mStyles.header}>
                    <View>
                        <Text style={mStyles.title}>Apply for Leave</Text>
                        <Text style={mStyles.subtitle}>Submit request for HR approval</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
                        <Text style={mStyles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={mStyles.body} showsVerticalScrollIndicator={false}>
                    {error ? (
                        <View style={mStyles.errorBox}>
                            <Text style={mStyles.errorIcon}>⚠️</Text>
                            <Text style={mStyles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Leave Type</Text>
                        <View style={mStyles.typeGrid}>
                            {leaveTypes.map(type => {
                                const cfg = LEAVE_CFG[type];
                                const active = form.leaveType === type;
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[mStyles.typeBtn, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                                        onPress={() => set('leaveType', type)}
                                    >
                                        <Text style={mStyles.typeIcon}>{cfg.icon}</Text>
                                        <Text style={[mStyles.typeLabel, active && { color: cfg.color, fontWeight: '700' }]}>
                                            {cfg.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Duration</Text>
                        <View style={mStyles.dateRow}>
                            <View style={mStyles.dateField}>
                                <Text style={mStyles.dateFieldLabel}>From Date</Text>
                                <TextInput
                                    style={mStyles.dateInput}
                                    value={form.fromDate}
                                    onChangeText={v => { set('fromDate', v); if (form.toDate < v) set('toDate', v); }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#64748b"
                                />
                            </View>
                            <View style={mStyles.dateSeparator}>
                                <Text style={mStyles.dateSeparatorText}>→</Text>
                            </View>
                            <View style={mStyles.dateField}>
                                <Text style={mStyles.dateFieldLabel}>To Date</Text>
                                <TextInput
                                    style={mStyles.dateInput}
                                    value={form.toDate}
                                    onChangeText={v => set('toDate', v)}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#64748b"
                                />
                            </View>
                        </View>
                        {form.fromDate && form.toDate && (
                            <View style={mStyles.daysPreview}>
                                <Text style={mStyles.daysPreviewIcon}>📅</Text>
                                <Text style={mStyles.daysPreviewText}>
                                    <Text style={{ fontWeight: '800' }}>{days}</Text> working day{days !== 1 ? 's' : ''} requested
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Reason (Optional)</Text>
                        <TextInput
                            style={mStyles.textarea}
                            value={form.reason}
                            onChangeText={v => set('reason', v)}
                            placeholder="Briefly describe the reason..."
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                    <View style={{ height: 30 }} />
                </ScrollView>
                <View style={mStyles.footer}>
                    <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose}>
                        <Text style={mStyles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[mStyles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                                <Text style={mStyles.submitIcon}>📤</Text>
                                <Text style={mStyles.submitBtnText}>Submit Request</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Leave Card ────────────────────────────────────────────────
const LeaveCard = ({ leave, onCancel }) => {
    const status = STATUS_CFG[leave.status] || STATUS_CFG.pending;
    const type = LEAVE_CFG[leave.leaveType] || LEAVE_CFG.casual;

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={[styles.typeBadge, { backgroundColor: type.bg, borderColor: type.color + '30' }]}>
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color + '30' }]}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            <View style={styles.cardMid}>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateValue}>{fmt(leave.fromDate)}</Text>
                </View>
                <View style={styles.dateArrow}>
                    <Text style={styles.dateArrowText}>→</Text>
                </View>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{fmt(leave.toDate)}</Text>
                </View>
                <View style={styles.daysBlock}>
                    <Text style={styles.daysValue}>{leave.days || 1}</Text>
                    <Text style={styles.daysLabel}>days</Text>
                </View>
            </View>

            {leave.reason ? (
                <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason</Text>
                    <Text style={styles.reasonText} numberOfLines={2}>{leave.reason}</Text>
                </View>
            ) : null}

            {leave.remarks ? (
                <View style={styles.remarksBox}>
                    <Text style={styles.remarksLabel}>HR Remarks</Text>
                    <Text style={styles.remarksText}>"{leave.remarks}"</Text>
                </View>
            ) : null}

            <View style={styles.cardFooter}>
                <Text style={styles.appliedIcon}>📅</Text>
                <Text style={styles.appliedOn}>Applied {fmt(leave.createdAt)}</Text>
                {leave.status === 'pending' && onCancel && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => onCancel(leave._id)}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────────
export default function EmployeeLeavesScreen() {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState({ sick: 12, casual: 12, earned: 15 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');

    const fetchLeaves = useCallback(async () => {
        setError('');
        try {
            const data = await api.getMyLeaves();
            console.log('🍃 MyLeaves API response:', JSON.stringify(data, null, 2));
            // Multiple response formats handle karo
            const leavesData =
                data.leaves ||
                data.data ||
                data.leaveRequests ||
                data.requests ||
                (Array.isArray(data) ? data : []);
            setLeaves(leavesData);
            if (data.leaveBalance) setBalance(data.leaveBalance);
            if (data.balance) setBalance(data.balance);
        } catch (e) { setError('Could not load leave data.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const onRefresh = () => { setRefreshing(true); fetchLeaves(); };
    const handleApplied = () => { setShowModal(false); Alert.alert('Success', 'Your leave request has been submitted!'); fetchLeaves(); };
    const handleCancel = (id) => {
        Alert.alert(
            'Cancel Leave',
            'Are you sure you want to cancel this leave request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.cancelLeave(id);
                            Alert.alert('Done', 'Leave request cancelled.');
                            fetchLeaves();
                        } catch {
                            Alert.alert('Error', 'Could not cancel. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const counts = {
        all: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };
    const displayed = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    const BALANCE_ITEMS = [
        { key: 'sick', label: 'Sick', icon: '🤒', total: 12, color: '#ef4444' },
        { key: 'casual', label: 'Casual', icon: '🌴', total: 12, color: '#3b82f6' },
        { key: 'earned', label: 'Earned', icon: '💼', total: 15, color: '#8b5cf6' },
    ];

    const FILTER_TABS = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Leave Management</Text>
                        <Text style={styles.subtitle}>Track and manage your leaves</Text>
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => setShowModal(true)}>
                        <Text style={styles.applyBtnIcon}>+</Text>
                        <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchLeaves} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Leave Balance Section */}
                <View style={styles.balanceSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleBar} />
                        <Text style={styles.sectionTitle}>Leave Balance</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        {BALANCE_ITEMS.map(item => {
                            const remaining = balance[item.key] ?? item.total;
                            const used = item.total - remaining;
                            const pct = Math.max(0, Math.min(100, (remaining / item.total) * 100));
                            return (
                                <View key={item.key} style={[styles.balanceCard, { borderTopColor: item.color }]}>
                                    <Text style={styles.balanceIcon}>{item.icon}</Text>
                                    <Text style={[styles.balanceValue, { color: item.color }]}>
                                        {remaining}<Text style={styles.balanceTotal}>/{item.total}</Text>
                                    </Text>
                                    <Text style={styles.balanceLabel}>{item.label}</Text>
                                    <View style={styles.balanceBarBg}>
                                        <View style={[styles.balanceBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                                    </View>
                                    <Text style={styles.balanceUsed}>{used} used</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabsSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsScroll}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {FILTER_TABS.map(tab => {
                            const isActive = filter === tab.key;
                            const statusColor = tab.key === 'pending' ? '#f59e0b' : tab.key === 'approved' ? '#22c55e' : tab.key === 'rejected' ? '#ef4444' : '#6366f1';
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.tab, isActive && { backgroundColor: statusColor, borderColor: statusColor }]}
                                    onPress={() => setFilter(tab.key)}
                                >
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                        {tab.label}
                                    </Text>
                                    <View style={[styles.tabCount, isActive && { backgroundColor: '#ffffff20' }]}>
                                        <Text style={[styles.tabCountText, isActive && { color: '#fff' }]}>
                                            {counts[tab.key]}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Leave List */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#f59e0b" />
                            <Text style={styles.loadingText}>Loading your leaves...</Text>
                        </View>
                    ) : displayed.length === 0 ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconContainer}>
                                <Text style={styles.emptyIcon}>📭</Text>
                            </View>
                            <Text style={styles.emptyTitle}>
                                {filter !== 'all' ? `No ${filter} leaves found` : 'No leave requests yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {filter === 'all' ? 'Apply for your first leave request' : 'Try a different filter'}
                            </Text>
                            {filter === 'all' && (
                                <TouchableOpacity style={styles.applyFirstBtn} onPress={() => setShowModal(true)}>
                                    <Text style={styles.applyFirstBtnText}>Apply for Leave →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        displayed.map((leave, i) => <LeaveCard key={leave._id || i} leave={leave} onCancel={handleCancel} />)
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
            <ApplyModal visible={showModal} onClose={() => setShowModal(false)} onDone={handleApplied} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 20,
        backgroundColor: '#0f172a',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    applyBtnIcon: { color: '#fff', fontSize: 18, fontWeight: '600' },
    applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorIcon: { fontSize: 18 },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },
    retryBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    retryText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    balanceSection: { marginTop: 16, marginBottom: 8 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
    sectionTitleBar: { width: 4, height: 18, backgroundColor: '#f59e0b', borderRadius: 2, marginRight: 10 },
    sectionTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700' },

    balanceRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 10 },
    balanceCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderTopWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    balanceIcon: { fontSize: 24, marginBottom: 8 },
    balanceValue: { fontSize: 22, fontWeight: '800' },
    balanceTotal: { fontSize: 12, color: '#94a3b8', fontWeight: 'normal' },
    balanceLabel: { color: '#64748b', fontSize: 12, marginTop: 4, marginBottom: 8 },
    balanceBarBg: { width: '100%', backgroundColor: '#f1f5f9', borderRadius: 4, height: 5, marginBottom: 4, overflow: 'hidden' },
    balanceBarFill: { height: 5, borderRadius: 4 },
    balanceUsed: { color: '#94a3b8', fontSize: 10 },

    tabsSection: { marginVertical: 12 },
    tabsScroll: { flexGrow: 0 },
    tabsContent: { paddingHorizontal: 16, gap: 8 },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#ffffff' },
    tabCount: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    tabCountText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

    listContainer: { paddingHorizontal: 16, paddingTop: 8 },
    center: { paddingTop: 60, alignItems: 'center', gap: 12 },
    loadingText: { color: '#64748b', fontSize: 14 },

    empty: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { color: '#1e293b', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { color: '#64748b', fontSize: 14, marginBottom: 20 },
    applyFirstBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    applyFirstBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    typeIcon: { fontSize: 12 },
    typeBadgeText: { fontSize: 12, fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    statusIcon: { fontSize: 10 },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },

    cardMid: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
    dateBlock: { flex: 1 },
    dateLabel: { color: '#94a3b8', fontSize: 10, marginBottom: 4, fontWeight: '500' },
    dateValue: { color: '#1e293b', fontWeight: '700', fontSize: 13 },
    dateArrow: { paddingHorizontal: 8 },
    dateArrowText: { color: '#cbd5e1', fontSize: 14 },
    daysBlock: { alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    daysValue: { color: '#f59e0b', fontWeight: '800', fontSize: 16 },
    daysLabel: { color: '#64748b', fontSize: 9, marginTop: 2 },

    reasonBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginBottom: 8 },
    reasonLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    reasonText: { color: '#475569', fontSize: 13, lineHeight: 18 },

    remarksBox: { backgroundColor: '#fef2f2', padding: 10, borderRadius: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
    remarksLabel: { color: '#dc2626', fontSize: 10, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    remarksText: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    appliedIcon: { fontSize: 12 },
    appliedOn: { color: '#94a3b8', fontSize: 11, flex: 1 },
    cancelBtn: {
        backgroundColor: '#fef2f2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    cancelBtnText: { color: '#dc2626', fontSize: 11, fontWeight: '700' },
});

const mStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: { color: '#1e293b', fontSize: 20, fontWeight: '700' },
    subtitle: { color: '#64748b', fontSize: 13, marginTop: 4 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    closeText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
    body: { flex: 1 },
    section: { paddingHorizontal: 20, paddingTop: 20 },
    label: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 10 },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        width: '47%',
    },
    typeIcon: { fontSize: 18 },
    typeLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateField: { flex: 1 },
    dateFieldLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
    dateInput: { backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    dateSeparator: { paddingTop: 20 },
    dateSeparatorText: { color: '#cbd5e1', fontSize: 16 },

    daysPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f59e0b10',
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#f59e0b30',
    },
    daysPreviewIcon: { fontSize: 14 },
    daysPreviewText: { color: '#f59e0b', fontSize: 13 },

    textarea: {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 90
    },

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        margin: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    errorIcon: { fontSize: 14 },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13 },

    footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', padding: 16, borderRadius: 14, alignItems: 'center' },
    cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
    submitBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f59e0b',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    submitIcon: { fontSize: 16 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

