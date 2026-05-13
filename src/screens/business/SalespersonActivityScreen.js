// src/screens/business/SalespersonActivityScreen.js
// Business User only.
// Website WorkedLeads jaisa: Salesperson ne kis lead pe kaam kiya wo dikhao.

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Modal, Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { C, shadow, rs, fs } from '../../theme';

// ── Helpers ──────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

// ── Status Badge ─────────────────────────────────────────────────
const STATUS_STYLES = {
    'Interested':     { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    'Not Interested': { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    'DNP':            { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    'Fresh Lead':     { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES['Fresh Lead'];
    return (
        <View style={[styles.badge, {
            backgroundColor: s.bg,
            borderColor: s.border,
        }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{status || '—'}</Text>
        </View>
    );
};

// ── Avatar ───────────────────────────────────────────────────────
const Avatar = ({ name }) => {
    const colors = [C.blue || '#3B82F6', C.purple || '#8B5CF6', C.green || '#10B981',
        C.red || '#F43F5E', C.amber || '#F59E0B'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.avatarText, { color }]}>
                {(name || '?').charAt(0).toUpperCase()}
            </Text>
        </View>
    );
};

// ── History Modal ────────────────────────────────────────────────
function HistoryModal({ lead, onClose }) {
    const history = lead?.followUpHistory || [];
    const reversed = [...history].reverse();
    return (
        <Modal visible={!!lead} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Follow-up History</Text>
                            <Text style={styles.modalSub}>
                                {lead?.customerName} · {lead?.mobileNumber}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                            <Text style={styles.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {reversed.length === 0 ? (
                            <Text style={styles.modalEmpty}>Koi follow-up history nahi hai</Text>
                        ) : (
                            reversed.map((h, i) => (
                                <View key={i} style={styles.historyItem}>
                                    <View style={styles.historyTop}>
                                        <Text style={styles.historyDesc}>{h.description}</Text>
                                        <Text style={styles.historyDate}>{fmtDate(h.createdAt)}</Text>
                                    </View>
                                    {h.followUpDate && (
                                        <Text style={styles.historyNext}>
                                            Next: {fmtDate(h.followUpDate)}
                                        </Text>
                                    )}
                                    {h.updatedBy?.name && (
                                        <Text style={styles.historyBy}>By: {h.updatedBy.name}</Text>
                                    )}
                                </View>
                            ))
                        )}
                        <View style={{ height: rs(20) }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ── Filter Bar ───────────────────────────────────────────────────
function FilterBar({ team, salespersonId, setSalespersonId, status, setStatus,
    fromDate, setFromDate, toDate, setToDate, onClear }) {

    const hasFilter = salespersonId || status || fromDate || toDate;

    const pickDate = (current, onSet, label) => {
        Alert.prompt(
            `${label} (YYYY-MM-DD)`,
            `Current: ${current || 'Not set'}`,
            (text) => {
                if (!text) { onSet(''); return; }
                if (/^\d{4}-\d{2}-\d{2}$/.test(text)) onSet(text);
                else Alert.alert('Invalid', 'Format: YYYY-MM-DD\nExample: 2026-05-12');
            },
            'plain-text', current,
        );
    };

    return (
        <View style={styles.filterCard}>
            {/* Row 1: Salesperson + Status */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}>

                {/* Salesperson dropdown (simulated) */}
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => {
                        const options = [
                            { label: 'All Salespersons', value: '' },
                            ...team.map(sp => ({ label: sp.name, value: sp._id })),
                        ];
                        Alert.alert(
                            'Select Salesperson',
                            '',
                            options.map(o => ({
                                text: o.label,
                                onPress: () => setSalespersonId(o.value),
                            })),
                        );
                    }}
                >
                    <Text style={styles.filterBtnText}>
                        {salespersonId
                            ? (team.find(sp => sp._id === salespersonId)?.name || 'SP')
                            : 'All Salespersons'} ▾
                    </Text>
                </TouchableOpacity>

                {/* Status dropdown */}
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => {
                        Alert.alert('Select Status', '', [
                            { text: 'All Status', onPress: () => setStatus('') },
                            { text: 'Interested', onPress: () => setStatus('Interested') },
                            { text: 'Not Interested', onPress: () => setStatus('Not Interested') },
                            { text: 'DNP', onPress: () => setStatus('DNP') },
                        ]);
                    }}
                >
                    <Text style={styles.filterBtnText}>{status || 'All Status'} ▾</Text>
                </TouchableOpacity>

                {/* From Date */}
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => pickDate(fromDate, setFromDate, 'From Date')}
                >
                    <Text style={styles.filterBtnText}>
                        📅 {fromDate || 'From Date'}
                    </Text>
                </TouchableOpacity>

                {/* To Date */}
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => pickDate(toDate, setToDate, 'To Date')}
                >
                    <Text style={styles.filterBtnText}>
                        📅 {toDate || 'To Date'}
                    </Text>
                </TouchableOpacity>

                {/* Clear */}
                {hasFilter && (
                    <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
                        <Text style={styles.clearBtnText}>Clear ✕</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

// ── Lead Row ─────────────────────────────────────────────────────
function LeadRow({ lead, onViewHistory, isLast }) {
    return (
        <View style={[styles.leadRow, !isLast && styles.leadRowBorder]}>
            {/* Customer + Mobile */}
            <View style={styles.leadCol1}>
                <Text style={styles.leadName} numberOfLines={1}>{lead.customerName}</Text>
                <Text style={styles.leadMobile}>{lead.mobileNumber}</Text>
                <Text style={styles.leadCourse} numberOfLines={1}>{lead.courseName || '—'}</Text>
            </View>

            {/* Salesperson */}
            <View style={styles.leadCol2}>
                <Avatar name={lead.assignedTo?.name} />
                <Text style={styles.leadSP} numberOfLines={1}>
                    {lead.assignedTo?.name || 'Unassigned'}
                </Text>
            </View>

            {/* Status */}
            <View style={styles.leadCol3}>
                <StatusBadge status={lead.status} />
                <Text style={styles.leadDate}>{fmtDate(lead.updatedAt)}</Text>
            </View>

            {/* History button */}
            <TouchableOpacity style={styles.historyBtn} onPress={() => onViewHistory(lead)}>
                <Text style={styles.historyBtnText}>History</Text>
            </TouchableOpacity>
        </View>
    );
}

// ══════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ══════════════════════════════════════════════════════════════════
export default function SalespersonActivityScreen() {
    const { user } = useContext(AuthContext);

    const [leads,         setLeads]         = useState([]);
    const [team,          setTeam]          = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [total,         setTotal]         = useState(0);
    const [page,          setPage]          = useState(1);
    const [historyLead,   setHistoryLead]   = useState(null);

    const [salespersonId, setSalespersonId] = useState('');
    const [status,        setStatus]        = useState('');
    const [fromDate,      setFromDate]      = useState('');
    const [toDate,        setToDate]        = useState('');

    // Team fetch (for filter dropdown)
    useEffect(() => {
        api.getMyTeam()
            .then(d => setTeam(d?.salespersons || []))
            .catch(() => {});
    }, []);

    const fetchLeads = useCallback(async () => {
        try {
            const data = await api.getWorkedLeads({
                salespersonId, status, fromDate, toDate, page, limit: 30,
            });
            setLeads(data?.leads || []);
            setTotal(data?.total || 0);
        } catch {
            // silent fail
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [salespersonId, status, fromDate, toDate, page]);

    useEffect(() => { setLoading(true); fetchLeads(); }, [fetchLeads]);

    const onRefresh = () => { setRefreshing(true); fetchLeads(); };

    const openHistory = async (lead) => {
        try {
            const full = await api.getLeadById(lead._id);
            setHistoryLead(full);
        } catch {
            Alert.alert('Error', 'History load nahi hua.');
        }
    };

    const onClear = () => {
        setSalespersonId(''); setStatus('');
        setFromDate(''); setToDate(''); setPage(1);
    };

    if (user?.role !== 'business_user') {
        return (
            <View style={styles.center}>
                <Text style={styles.accessDenied}>Access denied.</Text>
            </View>
        );
    }

    return (
        <View style={styles.flex1}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                        tintColor={C.primary} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Page Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Salesperson Activity</Text>
                    <Text style={styles.pageSub}>
                        Track which salesperson worked on which lead
                    </Text>
                </View>

                {/* Filter Bar */}
                <FilterBar
                    team={team}
                    salespersonId={salespersonId} setSalespersonId={(v) => { setSalespersonId(v); setPage(1); }}
                    status={status}               setStatus={(v) => { setStatus(v); setPage(1); }}
                    fromDate={fromDate}           setFromDate={(v) => { setFromDate(v); setPage(1); }}
                    toDate={toDate}               setToDate={(v) => { setToDate(v); setPage(1); }}
                    onClear={onClear}
                />

                {/* Leads Table Card */}
                <View style={styles.tableCard}>
                    {/* Table Header */}
                    <View style={styles.tableHead}>
                        <Text style={[styles.tableHCell, { flex: 2 }]}>CUSTOMER</Text>
                        <Text style={[styles.tableHCell, { flex: 1.2 }]}>SALESPERSON</Text>
                        <Text style={[styles.tableHCell, { flex: 1.3 }]}>STATUS</Text>
                        <Text style={[styles.tableHCell, { flex: 0.8 }]}>HISTORY</Text>
                    </View>

                    {/* Rows */}
                    {loading ? (
                        <View style={styles.tableLoading}>
                            <ActivityIndicator size="large" color={C.primary} />
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : leads.length === 0 ? (
                        <View style={styles.tableEmpty}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>No worked leads found</Text>
                            <Text style={styles.emptySub}>Try changing the filters</Text>
                        </View>
                    ) : (
                        leads.map((lead, i) => (
                            <LeadRow
                                key={lead._id || i}
                                lead={lead}
                                onViewHistory={openHistory}
                                isLast={i === leads.length - 1}
                            />
                        ))
                    )}
                </View>

                {/* Pagination */}
                {total > 30 && (
                    <View style={styles.pagination}>
                        <Text style={styles.paginationInfo}>
                            Showing {leads.length} of {total}
                        </Text>
                        <View style={styles.paginationBtns}>
                            <TouchableOpacity
                                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                                onPress={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <Text style={styles.pageBtnText}>← Prev</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pageBtn, leads.length < 30 && styles.pageBtnDisabled]}
                                onPress={() => setPage(p => p + 1)}
                                disabled={leads.length < 30}
                            >
                                <Text style={styles.pageBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={{ height: rs(40) }} />
            </ScrollView>

            {/* History Modal */}
            <HistoryModal lead={historyLead} onClose={() => setHistoryLead(null)} />
        </View>
    );
}

// ══════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    flex1:        { flex: 1, backgroundColor: C.bg },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
    accessDenied: { fontSize: fs(14), color: C.textMuted },
    content:      { padding: rs(16) },

    // Page header
    pageHeader: { marginBottom: rs(16) },
    pageTitle:  { fontSize: fs(22), fontWeight: '800', color: C.text },
    pageSub:    { fontSize: fs(13), color: C.textMuted, marginTop: rs(3) },

    // Filter
    filterCard: {
        backgroundColor: C.surface, borderRadius: rs(14),
        borderWidth: 1, borderColor: C.border,
        marginBottom: rs(14), padding: rs(12), ...shadow,
    },
    filterRow:    { gap: rs(8), flexDirection: 'row', alignItems: 'center' },
    filterBtn: {
        paddingHorizontal: rs(12), paddingVertical: rs(8),
        borderRadius: rs(10), borderWidth: 1, borderColor: C.border,
        backgroundColor: C.surfaceAlt || '#F8FAFC',
    },
    filterBtnText: { fontSize: fs(13), color: C.text, fontWeight: '500' },
    clearBtn: {
        paddingHorizontal: rs(12), paddingVertical: rs(8),
        borderRadius: rs(10),
    },
    clearBtnText: { fontSize: fs(13), color: C.textMuted },

    // Table card
    tableCard: {
        backgroundColor: C.surface, borderRadius: rs(16),
        borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...shadow,
    },
    tableHead: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surfaceAlt || '#F8FAFC',
        paddingHorizontal: rs(12), paddingVertical: rs(10),
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    tableHCell: {
        fontSize: fs(10), fontWeight: '700', color: C.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    tableLoading: { alignItems: 'center', paddingVertical: rs(40) },
    loadingText:  { fontSize: fs(13), color: C.textMuted, marginTop: rs(10) },
    tableEmpty:   { alignItems: 'center', paddingVertical: rs(40) },
    emptyIcon:    { fontSize: rs(40), marginBottom: rs(10) },
    emptyTitle:   { fontSize: fs(15), fontWeight: '700', color: C.text },
    emptySub:     { fontSize: fs(13), color: C.textMuted, marginTop: rs(4) },

    // Lead Row
    leadRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: rs(12), paddingVertical: rs(12),
    },
    leadRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    leadCol1: { flex: 2, paddingRight: rs(6) },
    leadCol2: { flex: 1.2, alignItems: 'center', gap: rs(4) },
    leadCol3: { flex: 1.3, alignItems: 'center', gap: rs(4) },
    leadName:   { fontSize: fs(13), fontWeight: '700', color: C.text },
    leadMobile: { fontSize: fs(11), color: C.textMuted, marginTop: rs(1) },
    leadCourse: { fontSize: fs(11), color: C.textMuted, marginTop: rs(1) },
    leadSP:     { fontSize: fs(11), color: C.text, fontWeight: '600', textAlign: 'center' },
    leadDate:   { fontSize: fs(10), color: C.textMuted, marginTop: rs(3) },

    // Status Badge
    badge: {
        paddingHorizontal: rs(8), paddingVertical: rs(3),
        borderRadius: rs(20), borderWidth: 1,
    },
    badgeText: { fontSize: fs(10), fontWeight: '700' },

    // Avatar
    avatar: {
        width: rs(28), height: rs(28), borderRadius: rs(14),
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: fs(12), fontWeight: '800' },

    // History button
    historyBtn: {
        flex: 0.8, alignItems: 'center',
        paddingVertical: rs(6), paddingHorizontal: rs(8),
        backgroundColor: C.surfaceAlt || '#F1F5F9',
        borderRadius: rs(8), borderWidth: 1, borderColor: C.border,
    },
    historyBtnText: { fontSize: fs(11), fontWeight: '600', color: C.text },

    // Pagination
    pagination: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: rs(14),
    },
    paginationInfo:  { fontSize: fs(12), color: C.textMuted },
    paginationBtns:  { flexDirection: 'row', gap: rs(8) },
    pageBtn: {
        paddingHorizontal: rs(14), paddingVertical: rs(8),
        borderRadius: rs(10), borderWidth: 1, borderColor: C.border,
        backgroundColor: C.surface,
    },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText:     { fontSize: fs(13), fontWeight: '600', color: C.text },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: C.surface, borderTopLeftRadius: rs(24),
        borderTopRightRadius: rs(24), maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: rs(20), paddingVertical: rs(16),
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    modalTitle:     { fontSize: fs(17), fontWeight: '800', color: C.text },
    modalSub:       { fontSize: fs(12), color: C.textMuted, marginTop: rs(2) },
    modalClose: {
        width: rs(32), height: rs(32), borderRadius: rs(16),
        backgroundColor: C.surfaceAlt || '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    modalCloseText: { fontSize: fs(14), color: C.textMuted, fontWeight: '700' },
    modalBody:      { paddingHorizontal: rs(20), paddingTop: rs(12) },
    modalEmpty:     { fontSize: fs(14), color: C.textMuted, textAlign: 'center', paddingVertical: rs(32) },
    historyItem: {
        backgroundColor: C.surfaceAlt || '#F8FAFC', borderRadius: rs(12),
        padding: rs(14), borderWidth: 1, borderColor: C.border, marginBottom: rs(10),
    },
    historyTop:  { flexDirection: 'row', justifyContent: 'space-between', gap: rs(8) },
    historyDesc: { flex: 1, fontSize: fs(13), fontWeight: '500', color: C.text },
    historyDate: { fontSize: fs(11), color: C.textMuted, whiteSpace: 'nowrap' },
    historyNext: { fontSize: fs(12), color: C.primary || '#6366F1', marginTop: rs(6) },
    historyBy:   { fontSize: fs(11), color: C.textMuted, marginTop: rs(4) },
});