import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert,
    RefreshControl, Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

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

const today = () => new Date().toISOString().split('T')[0];

// ── Status / Type configs ─────────────────────────────────────
const STATUS_CFG = {
    pending:  { color: '#f59e0b', bg: '#f59e0b20', icon: '⏳', label: 'Pending' },
    approved: { color: '#22c55e', bg: '#22c55e20', icon: '✅', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#ef444420', icon: '❌', label: 'Rejected' },
};

const LEAVE_CFG = {
    sick:    { color: '#ef4444', bg: '#ef444415', icon: '🤒', label: 'Sick Leave' },
    casual:  { color: '#3b82f6', bg: '#3b82f615', icon: '🌴', label: 'Casual Leave' },
    earned:  { color: '#8b5cf6', bg: '#8b5cf615', icon: '💼', label: 'Earned Leave' },
    unpaid:  { color: '#64748b', bg: '#64748b15', icon: '💸', label: 'Unpaid Leave' },
};

// ── Apply Leave Modal ─────────────────────────────────────────
const ApplyModal = ({ visible, onClose, onDone }) => {
    const [form, setForm] = useState({
        leaveType: 'sick',
        fromDate: today(),
        toDate: today(),
        reason: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const days = calcWorkingDays(form.fromDate, form.toDate);

    const handleSubmit = async () => {
        if (!form.fromDate || !form.toDate) { setError('Please select dates'); return; }
        if (form.toDate < form.fromDate) { setError('End date must be after start date'); return; }
        setSaving(true);
        setError('');
        try {
            const res = await api.applyLeave(form);
            if (res.leave || res._id || res.message?.toLowerCase().includes('success')) {
                onDone();
            } else {
                setError(res.message || 'Failed to apply. Please try again.');
            }
        } catch (e) {
            setError('Server error. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    const leaveTypes = ['sick', 'casual', 'earned', 'unpaid'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={mStyles.container}>
                {/* Header */}
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
                            <Text style={mStyles.errorText}>⚠️ {error}</Text>
                        </View>
                    ) : null}

                    {/* Leave Type */}
                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Leave Type *</Text>
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

                    {/* Date Inputs */}
                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Duration *</Text>
                        <View style={mStyles.dateRow}>
                            <View style={mStyles.dateField}>
                                <Text style={mStyles.dateFieldLabel}>From Date</Text>
                                <TextInput
                                    style={mStyles.dateInput}
                                    value={form.fromDate}
                                    onChangeText={v => {
                                        set('fromDate', v);
                                        if (form.toDate < v) set('toDate', v);
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#475569"
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
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>

                        {/* Days Preview */}
                        {form.fromDate && form.toDate && (
                            <View style={mStyles.daysPreview}>
                                <Text style={mStyles.daysPreviewText}>
                                    📅 <Text style={{ fontWeight: 'bold' }}>{days}</Text> working day{days !== 1 ? 's' : ''} requested
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Reason */}
                    <View style={mStyles.section}>
                        <Text style={mStyles.label}>Reason (Optional)</Text>
                        <TextInput
                            style={mStyles.textarea}
                            value={form.reason}
                            onChangeText={v => set('reason', v)}
                            placeholder="Briefly describe the reason for your leave..."
                            placeholderTextColor="#475569"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Footer */}
                <View style={mStyles.footer}>
                    <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose}>
                        <Text style={mStyles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[mStyles.submitBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={mStyles.submitBtnText}>📤 Submit Request</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Leave Card ────────────────────────────────────────────────
const LeaveCard = ({ leave }) => {
    const status = STATUS_CFG[leave.status] || STATUS_CFG.pending;
    const type = LEAVE_CFG[leave.leaveType] || LEAVE_CFG.casual;

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                {/* Type badge */}
                <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: type.color }]}>
                        {type.icon} {type.label}
                    </Text>
                </View>
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: status.color }]}>
                        {status.icon} {status.label}
                    </Text>
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
                    <Text style={styles.daysValue}>{leave.days || 1}d</Text>
                    <Text style={styles.daysLabel}>days</Text>
                </View>
            </View>

            {leave.reason ? (
                <Text style={styles.reason} numberOfLines={2}>{leave.reason}</Text>
            ) : null}

            {leave.remarks ? (
                <View style={styles.remarksBox}>
                    <Text style={styles.remarksLabel}>HR Remarks:</Text>
                    <Text style={styles.remarksText}>"{leave.remarks}"</Text>
                </View>
            ) : null}

            <Text style={styles.appliedOn}>Applied {fmt(leave.createdAt)}</Text>
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
            setLeaves(data.leaves || []);
            if (data.leaveBalance) setBalance(data.leaveBalance);
        } catch (e) {
            setError('Could not load leave data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

    const onRefresh = () => { setRefreshing(true); fetchLeaves(); };

    const handleApplied = () => {
        setShowModal(false);
        Alert.alert('✅ Success', 'Your leave request has been submitted!');
        fetchLeaves();
    };

    const counts = {
        all: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const displayed = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

    const BALANCE_ITEMS = [
        { key: 'sick',   label: 'Sick',    icon: '🤒', total: 12, color: '#ef4444' },
        { key: 'casual', label: 'Casual',  icon: '🌴', total: 12, color: '#3b82f6' },
        { key: 'earned', label: 'Earned',  icon: '💼', total: 15, color: '#8b5cf6' },
    ];

    const FILTER_TABS = [
        { key: 'all',      label: 'All' },
        { key: 'pending',  label: '⏳ Pending' },
        { key: 'approved', label: '✅ Approved' },
        { key: 'rejected', label: '❌ Rejected' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>🗓️ My Leaves</Text>
                        <Text style={styles.subtitle}>Track and apply for leave</Text>
                    </View>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => setShowModal(true)}>
                        <Text style={styles.applyBtnText}>+ Apply</Text>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                        <TouchableOpacity onPress={fetchLeaves}>
                            <Text style={styles.retryText}>Retry →</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Leave Balance */}
                <Text style={styles.sectionTitle}>Leave Balance</Text>
                <View style={styles.balanceRow}>
                    {BALANCE_ITEMS.map(item => {
                        const remaining = balance[item.key] ?? item.total;
                        const used = item.total - remaining;
                        const pct = Math.max(0, Math.min(100, (remaining / item.total) * 100));
                        return (
                            <View key={item.key} style={styles.balanceCard}>
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

                {/* Filter Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabsScroll}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                    {FILTER_TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, filter === tab.key && styles.tabActive]}
                            onPress={() => setFilter(tab.key)}
                        >
                            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
                                {tab.label} ({counts[tab.key]})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Leave List */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#f59e0b" />
                            <Text style={styles.loadingText}>Loading leaves...</Text>
                        </View>
                    ) : displayed.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>
                                {filter !== 'all' ? `No ${filter} leaves found` : 'No leave requests yet'}
                            </Text>
                            {filter === 'all' && (
                                <TouchableOpacity
                                    style={styles.applyFirstBtn}
                                    onPress={() => setShowModal(true)}
                                >
                                    <Text style={styles.applyFirstBtnText}>Apply for your first leave →</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        displayed.map((leave, i) => (
                            <LeaveCard key={leave._id || i} leave={leave} />
                        ))
                    )}
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            <ApplyModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                onDone={handleApplied}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16,
    },
    title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
    applyBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    errorBox: { backgroundColor: '#ef444415', margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' },
    errorText: { color: '#ef4444', fontSize: 14 },
    retryText: { color: '#ef4444', fontWeight: '600', marginTop: 6 },
    sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', paddingHorizontal: 16, marginBottom: 10 },
    balanceRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
    balanceCard: {
        flex: 1, backgroundColor: '#1e293b', borderRadius: 14,
        padding: 14, alignItems: 'center',
    },
    balanceIcon: { fontSize: 22, marginBottom: 6 },
    balanceValue: { fontSize: 20, fontWeight: 'bold' },
    balanceTotal: { fontSize: 13, color: '#475569', fontWeight: 'normal' },
    balanceLabel: { color: '#64748b', fontSize: 11, marginTop: 3, marginBottom: 8 },
    balanceBarBg: { width: '100%', backgroundColor: '#0f172a', borderRadius: 3, height: 5, marginBottom: 4 },
    balanceBarFill: { height: 5, borderRadius: 3 },
    balanceUsed: { color: '#475569', fontSize: 10 },
    tabsScroll: { flexGrow: 0, marginBottom: 12 },
    tab: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', marginRight: 8,
    },
    tabActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    listContainer: { paddingHorizontal: 16 },
    center: { paddingTop: 60, alignItems: 'center' },
    loadingText: { color: '#64748b', marginTop: 12 },
    empty: { paddingTop: 60, alignItems: 'center' },
    emptyIcon: { fontSize: 44, marginBottom: 12 },
    emptyText: { color: '#64748b', fontSize: 16 },
    applyFirstBtn: { marginTop: 16 },
    applyFirstBtnText: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },
    // Card
    card: {
        backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
        marginBottom: 10,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    typeBadgeText: { fontSize: 12, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusBadgeText: { fontSize: 12, fontWeight: '600' },
    cardMid: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dateBlock: { flex: 1 },
    dateLabel: { color: '#475569', fontSize: 11, marginBottom: 2 },
    dateValue: { color: '#fff', fontWeight: '600', fontSize: 13 },
    dateArrow: { paddingHorizontal: 10 },
    dateArrowText: { color: '#475569', fontSize: 16 },
    daysBlock: { alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    daysValue: { color: '#f59e0b', fontWeight: 'bold', fontSize: 18 },
    daysLabel: { color: '#64748b', fontSize: 10, marginTop: 1 },
    reason: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
    remarksBox: { backgroundColor: '#0f172a', padding: 10, borderRadius: 8, marginBottom: 8 },
    remarksLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', marginBottom: 2 },
    remarksText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
    appliedOn: { color: '#334155', fontSize: 11, textAlign: 'right' },
});

// ── Modal Styles ──────────────────────────────────────────────
const mStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1, borderBottomColor: '#334155',
    },
    title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    subtitle: { color: '#64748b', fontSize: 13, marginTop: 3 },
    closeBtn: { padding: 4 },
    closeText: { color: '#64748b', fontSize: 20, fontWeight: '600' },
    body: { flex: 1 },
    section: { paddingHorizontal: 16, paddingTop: 20 },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 10 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 12, borderWidth: 2, borderColor: '#334155',
        backgroundColor: '#1e293b',
        width: '47%',
    },
    typeIcon: { fontSize: 18 },
    typeLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateField: { flex: 1 },
    dateFieldLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
    dateInput: {
        backgroundColor: '#1e293b', color: '#fff', borderRadius: 10,
        padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#334155',
    },
    dateSeparator: { paddingTop: 20 },
    dateSeparatorText: { color: '#475569', fontSize: 18 },
    daysPreview: {
        backgroundColor: '#3b82f615', borderRadius: 10, padding: 12, marginTop: 12,
        borderWidth: 1, borderColor: '#3b82f630',
    },
    daysPreviewText: { color: '#3b82f6', fontSize: 14, textAlign: 'center' },
    textarea: {
        backgroundColor: '#1e293b', color: '#fff', borderRadius: 12,
        padding: 14, fontSize: 14, borderWidth: 1, borderColor: '#334155',
        minHeight: 90,
    },
    errorBox: { margin: 16, backgroundColor: '#ef444415', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ef444440' },
    errorText: { color: '#ef4444', fontSize: 13 },
    footer: {
        flexDirection: 'row', padding: 16, gap: 10,
        borderTopWidth: 1, borderTopColor: '#1e293b',
    },
    cancelBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
    submitBtn: { flex: 1.5, backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
