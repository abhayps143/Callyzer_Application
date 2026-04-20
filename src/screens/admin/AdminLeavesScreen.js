
import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView, StatusBar
} from 'react-native';
import { C, shadow } from '../../theme';
import { api } from '../../services/api';

const STATUS_CFG = {
    pending: { color: C.amber, soft: C.amberSoft, label: 'Pending' },
    approved: { color: C.green, soft: C.greenSoft, label: 'Approved' },
    rejected: { color: C.red, soft: C.redSoft, label: 'Rejected' },
};
const LEAVE_TYPES = {
    sick: { color: C.red, label: 'Sick' },
    casual: { color: C.blue, label: 'Casual' },
    earned: { color: C.purple, label: 'Earned' },
    unpaid: { color: C.textSub, label: 'Unpaid' },
};

const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export default function AdminLeavesScreen() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('pending');
    const [selected, setSelected] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [action, setAction] = useState('approved');
    const [saving, setSaving] = useState(false);

    const fetchLeaves = async () => {
        try {
            const data = await api.getAdminLeaves({ status: filter });
            setLeaves(data.leaves || data || []);
        } catch (e) { console.log(e); }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { setLoading(true); fetchLeaves(); }, [filter]);

    const handleAction = async () => {
        if (action === 'rejected' && !remarks.trim()) {
            Alert.alert('Required', 'Please provide a rejection reason.');
            return;
        }
        setSaving(true);
        try {
            await api.updateLeaveStatus(selected._id, action, remarks);
            setSelected(null); setRemarks(''); fetchLeaves();
            Alert.alert('Done', `Leave ${action}.`);
        } catch { Alert.alert('Error', 'Server error'); }
        setSaving(false);
    };

    const renderLeave = ({ item }) => {
        const s = STATUS_CFG[item.status] || STATUS_CFG.pending;
        const lt = LEAVE_TYPES[item.leaveType] || { color: C.textSub, label: item.leaveType };
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => { setSelected(item); setAction('approved'); setRemarks(''); }}
                activeOpacity={0.75}
            >
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <View style={styles.empAvatar}>
                            <Text style={styles.empAvatarText}>{(item.employeeName || '?').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.empName}>{item.employeeName || 'Employee'}</Text>
                            <Text style={styles.empRole}>{item.employeeRole || ''}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: s.soft }]}>
                        <Text style={[styles.statusPillText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                <View style={styles.cardMeta}>
                    <View style={[styles.typePill, { backgroundColor: lt.color + '18' }]}>
                        <Text style={[styles.typePillText, { color: lt.color }]}>{lt.label}</Text>
                    </View>
                    <Text style={styles.dates}>{fmt(item.startDate)} → {fmt(item.endDate)}</Text>
                    <Text style={styles.dayCount}>{item.days || 1}d</Text>
                </View>

                {item.reason ? (
                    <Text style={styles.reason} numberOfLines={2}>"{item.reason}"</Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            <View style={styles.header}>
                <Text style={styles.title}>Leave Management</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabs}>
                {['All', 'pending', 'approved', 'rejected'].map(s => {
                    const cfg = s === 'All'
                        ? { color: C.primary, soft: C.primarySoft, label: 'All' }
                        : STATUS_CFG[s];
                    const active = filter === s;
                    return (
                        <TouchableOpacity
                            key={s}
                            style={[styles.tab, active && { backgroundColor: cfg.color }]}
                            onPress={() => setFilter(s)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, active && { color: '#fff' }]}>{cfg.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loading
                ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60 }} />
                : <FlatList
                    data={leaves}
                    keyExtractor={(item, i) => item._id || i.toString()}
                    renderItem={renderLeave}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaves(); }} tintColor={C.primary} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 }}
                    ListEmptyComponent={<Text style={styles.empty}>No leave requests</Text>}
                />
            }

            {/* Review Modal */}
            <Modal visible={!!selected} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Review Leave</Text>
                            <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selected && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoName}>{selected.employeeName}</Text>
                                    {[
                                        ['Leave Type', selected.leaveType],
                                        ['From', fmt(selected.startDate)],
                                        ['To', fmt(selected.endDate)],
                                        ['Days', selected.days],
                                    ].map(([k, v]) => (
                                        <View key={k} style={styles.infoRow}>
                                            <Text style={styles.infoKey}>{k}</Text>
                                            <Text style={styles.infoVal}>{v}</Text>
                                        </View>
                                    ))}
                                    {selected.reason && (
                                        <Text style={styles.infoReason}>"{selected.reason}"</Text>
                                    )}
                                </View>

                                <Text style={styles.fieldLabel}>Decision</Text>
                                <View style={styles.decisionRow}>
                                    {['approved', 'rejected'].map(a => (
                                        <TouchableOpacity
                                            key={a}
                                            style={[
                                                styles.decisionBtn,
                                                action === a && { backgroundColor: a === 'approved' ? C.green : C.red, borderColor: 'transparent' }
                                            ]}
                                            onPress={() => setAction(a)}
                                        >
                                            <Text style={[styles.decisionText, action === a && { color: '#fff' }]}>
                                                {a === 'approved' ? '✅ Approve' : '❌ Reject'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.fieldLabel}>
                                    Remarks {action === 'rejected' ? '(required)' : '(optional)'}
                                </Text>
                                <TextInput
                                    style={[styles.remarksInput, action === 'rejected' && { borderColor: C.red }]}
                                    placeholder="Add remarks…"
                                    placeholderTextColor={C.textMuted}
                                    value={remarks}
                                    onChangeText={setRemarks}
                                    multiline
                                    numberOfLines={3}
                                />

                                <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={saving}>
                                    {saving
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.submitBtnText}>Submit Decision</Text>
                                    }
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    title: { fontSize: 22, fontWeight: '800', color: C.text },

    tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: C.surfaceAlt },
    tabText: { fontSize: 13, fontWeight: '700', color: C.textSub, textTransform: 'capitalize' },

    card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, ...shadow },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    empAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
    empAvatarText: { color: C.primary, fontWeight: '800', fontSize: 16 },
    empName: { fontSize: 15, fontWeight: '700', color: C.text },
    empRole: { fontSize: 12, color: C.textSub, textTransform: 'capitalize' },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusPillText: { fontSize: 12, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    typePillText: { fontSize: 11, fontWeight: '700' },
    dates: { fontSize: 12, color: C.textSub },
    dayCount: { fontSize: 12, color: C.textMuted, marginLeft: 'auto' },
    reason: { fontSize: 12, color: C.textMuted, marginTop: 8, fontStyle: 'italic' },
    empty: { color: C.textMuted, textAlign: 'center', marginTop: 60, fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '88%' },
    sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    closeText: { fontSize: 14, color: C.textSub },

    infoBox: { backgroundColor: C.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 16 },
    infoName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    infoKey: { fontSize: 13, color: C.textSub },
    infoVal: { fontSize: 13, fontWeight: '600', color: C.text },
    infoReason: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginTop: 8 },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 10 },
    decisionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    decisionBtn: { flex: 1, padding: 13, borderRadius: 12, alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border },
    decisionText: { fontSize: 14, fontWeight: '700', color: C.textSub },

    remarksInput: { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt, textAlignVertical: 'top', marginBottom: 16 },
    submitBtn: { backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

