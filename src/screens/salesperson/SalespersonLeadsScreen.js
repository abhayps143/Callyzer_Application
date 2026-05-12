
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Alert, Modal, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { api } from '../../services/api';

const STATUSES = ['Fresh Lead', 'Interested', 'Not Interested', 'DNP'];

const STATUS_COLORS = {
    'Fresh Lead': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    'Interested': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    'Not Interested': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
    'DNP': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
};

export default function SalespersonLeadsScreen() {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');

    // Follow-up modal
    const [followupLead, setFollowupLead] = useState(null);
    const [followupForm, setFollowupForm] = useState({ description: '', followUpDate: '', status: '' });
    const [followupSaving, setFollowupSaving] = useState(false);

    // History modal
    const [historyLead, setHistoryLead] = useState(null);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getLeads({ status: filter, search, page, limit: 20 });
            setLeads(data.leads || []);
            setTotal(data.total || 0);
        } catch { Alert.alert('Error', 'Failed to load leads'); }
        finally { setLoading(false); }
    }, [filter, search, page]);

    const fetchStats = useCallback(async () => {
        try { const s = await api.getLeadStats(); setStats(s); } catch { }
    }, []);

    useEffect(() => { fetchLeads(); fetchStats(); }, [fetchLeads, fetchStats]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLeads(); await fetchStats();
        setRefreshing(false);
    };

    const handleStatusChange = async (lead, newStatus) => {
        try {
            await api.updateLead(lead._id, { status: newStatus });
            fetchLeads(); fetchStats();
        } catch { Alert.alert('Error', 'Failed to update status'); }
    };

    const handleFollowupSubmit = async () => {
        if (!followupForm.description.trim())
            return Alert.alert('Error', 'Please enter a description');
        setFollowupSaving(true);
        try {
            await api.addFollowUp(followupLead._id, {
                description: followupForm.description,
                followUpDate: followupForm.followUpDate || undefined,
                status: followupForm.status || undefined,
            });
            Alert.alert('Success', 'Follow-up saved');
            setFollowupLead(null);
            setFollowupForm({ description: '', followUpDate: '', status: '' });
            fetchLeads(); fetchStats();
        } catch { Alert.alert('Error', 'Failed to save follow-up'); }
        finally { setFollowupSaving(false); }
    };

    const openFollowup = (lead) => {
        setFollowupLead(lead);
        setFollowupForm({
            description: '', followUpDate: '',
            status: lead.status || 'Fresh Lead',
        });
    };

    const openHistory = async (lead) => {
        try {
            const full = await api.getLeadById(lead._id);
            setHistoryLead(full);
        } catch { Alert.alert('Error', 'Failed to load history'); }
    };

    const renderLead = ({ item: lead }) => {
        const sc = STATUS_COLORS[lead.status] || STATUS_COLORS['Fresh Lead'];
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>{lead.customerName}</Text>
                        <Text style={styles.mobileText}>📞 {lead.mobileNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{lead.status}</Text>
                    </View>
                </View>

                {lead.courseName && <Text style={styles.courseText}>📚 {lead.courseName}</Text>}
                {lead.followUpDescription && (
                    <Text style={styles.followupText} numberOfLines={2}>💬 {lead.followUpDescription}</Text>
                )}
                {lead.followUpDate && (
                    <Text style={styles.dateText}>
                        📅 Next: {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                    </Text>
                )}

                {/* Status quick change */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {STATUSES.map(s => (
                        <TouchableOpacity key={s}
                            onPress={() => handleStatusChange(lead, s)}
                            style={[styles.statusChip, lead.status === s && { backgroundColor: sc.bg, borderColor: sc.border }]}>
                            <Text style={[styles.statusChipText, lead.status === s && { color: sc.text, fontWeight: '700' }]}>
                                {s}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.followupBtn} onPress={() => openFollowup(lead)}>
                        <Text style={styles.followupBtnText}>＋ Follow-up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.historyBtn} onPress={() => openHistory(lead)}>
                        <Text style={styles.historyBtnText}>📋 History</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Stats */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Total', value: stats.total || 0, color: '#1F2937' },
                    { label: 'Interested', value: stats.interested || 0, color: '#065F46' },
                    { label: 'Not Int.', value: stats.notInterested || 0, color: '#991B1B' },
                    { label: 'Follow-ups', value: stats.pendingFollowups || 0, color: '#92400E' },
                ].map(s => (
                    <View key={s.label} style={styles.statCard}>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* Search + Filter */}
            <View style={styles.filterRow}>
                <TextInput
                    value={search} onChangeText={t => { setSearch(t); setPage(1); }}
                    placeholder="Search name / number…"
                    style={styles.searchInput}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {['', ...STATUSES].map(s => (
                        <TouchableOpacity key={s} onPress={() => { setFilter(s); setPage(1); }}
                            style={[styles.filterChip, filter === s && styles.filterChipActive]}>
                            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
                                {s || 'All'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={leads}
                    keyExtractor={i => i._id}
                    renderItem={renderLead}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No leads assigned yet</Text>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            {total > 20 && (
                <View style={styles.pagination}>
                    <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}>
                        <Text style={styles.pageBtnText}>← Prev</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>Page {page}</Text>
                    <TouchableOpacity onPress={() => setPage(p => p + 1)} disabled={leads.length < 20}
                        style={[styles.pageBtn, leads.length < 20 && { opacity: 0.4 }]}>
                        <Text style={styles.pageBtnText}>Next →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Follow-up Modal ── */}
            <Modal visible={!!followupLead} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Add Follow-up</Text>
                                {followupLead && (
                                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                        {followupLead.customerName} · {followupLead.mobileNumber}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setFollowupLead(null)}>
                                <Text style={{ fontSize: 20, color: '#6B7280' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {STATUSES.map(s => {
                                    const sc2 = STATUS_COLORS[s];
                                    return (
                                        <TouchableOpacity key={s}
                                            onPress={() => setFollowupForm(p => ({ ...p, status: s }))}
                                            style={[styles.assignChip, followupForm.status === s && { backgroundColor: sc2.bg, borderColor: sc2.border }]}>
                                            <Text style={[styles.assignChipText, followupForm.status === s && { color: sc2.text, fontWeight: '700' }]}>
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Notes *</Text>
                            <TextInput
                                value={followupForm.description}
                                onChangeText={t => setFollowupForm(p => ({ ...p, description: t }))}
                                placeholder="What happened? Next steps?"
                                multiline numberOfLines={3}
                                style={[styles.fieldInput, { height: 90, textAlignVertical: 'top' }]}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Next Follow-up Date</Text>
                            <TextInput
                                value={followupForm.followUpDate}
                                onChangeText={t => setFollowupForm(p => ({ ...p, followUpDate: t }))}
                                placeholder="YYYY-MM-DD"
                                style={styles.fieldInput}
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFollowupLead(null)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleFollowupSubmit} disabled={followupSaving}>
                                <Text style={styles.saveBtnText}>{followupSaving ? 'Saving…' : 'Save Follow-up'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── History Modal ── */}
            <Modal visible={!!historyLead} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { maxHeight: '75%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Follow-up History</Text>
                                {historyLead && (
                                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                        {historyLead.customerName} · {historyLead.mobileNumber}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setHistoryLead(null)}>
                                <Text style={{ fontSize: 20, color: '#6B7280' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {(!historyLead?.followUpHistory || historyLead.followUpHistory.length === 0) ? (
                                <Text style={styles.emptyText}>No history yet</Text>
                            ) : (
                                [...historyLead.followUpHistory].reverse().map((h, i) => (
                                    <View key={i} style={styles.historyItem}>
                                        <Text style={styles.historyDesc}>{h.description}</Text>
                                        {h.followUpDate && (
                                            <Text style={styles.historyDate}>
                                                📅 Next: {new Date(h.followUpDate).toLocaleDateString('en-IN')}
                                            </Text>
                                        )}
                                        <Text style={styles.historyMeta}>
                                            {new Date(h.createdAt).toLocaleDateString('en-IN')}
                                            {h.updatedBy?.name ? ` · ${h.updatedBy.name}` : ''}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <TouchableOpacity style={[styles.saveBtn, { marginTop: 12 }]} onPress={() => setHistoryLead(null)}>
                            <Text style={styles.saveBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
    filterRow: { paddingHorizontal: 12 },
    searchInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB' },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    filterChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    filterChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    filterChipTextActive: { color: '#fff' },
    card: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 12, marginBottom: 10, padding: 14, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    customerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    mobileText: { fontSize: 13, color: '#059669', marginTop: 2, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '700' },
    courseText: { fontSize: 12, color: '#6B7280', marginTop: 6 },
    followupText: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
    dateText: { fontSize: 12, color: '#4F46E5', marginTop: 4 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    statusChipText: { fontSize: 11, color: '#374151' },
    cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    followupBtn: { flex: 1, backgroundColor: '#EEF2FF', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    followupBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
    historyBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    historyBtnText: { color: '#374151', fontWeight: '600', fontSize: 13 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
    pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#F3F4F6' },
    pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
    pageBtnText: { color: '#374151', fontWeight: '600' },
    pageInfo: { color: '#6B7280', fontSize: 13 },
    historyItem: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    historyDesc: { fontSize: 13, color: '#1F2937', fontWeight: '500' },
    historyDate: { fontSize: 12, color: '#4F46E5', marginTop: 4 },
    historyMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    formField: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 },
    fieldInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    assignChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    assignChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    assignChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
    modalFooter: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: { flex: 1, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: '#6B7280', fontWeight: '700' },
    saveBtn: { flex: 1, backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});