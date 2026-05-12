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

const EMPTY_FORM = {
    customerName: '', mobileNumber: '', courseName: '', leadSource: '', assignedTo: '',
};

export default function BusinessLeadsScreen({ navigation }) {
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [salespersons, setSalespersons] = useState([]);

    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [editLead, setEditLead] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

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

    const fetchTeam = useCallback(async () => {
        try {
            const data = await api.getMyTeam();
            setSalespersons(data.salespersons || []);
        } catch { }
    }, []);

    useEffect(() => { fetchLeads(); fetchStats(); fetchTeam(); }, [fetchLeads, fetchStats, fetchTeam]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLeads(); await fetchStats();
        setRefreshing(false);
    };

    const handleSubmit = async () => {
        if (!form.customerName.trim() || !form.mobileNumber.trim()) {
            return Alert.alert('Error', 'Customer name and mobile number are required');
        }
        setSaving(true);
        try {
            if (editLead) {
                await api.updateLead(editLead._id, form);
                Alert.alert('Success', 'Lead updated');
            } else {
                await api.createLead(form);
                Alert.alert('Success', 'Lead created');
            }
            setShowAdd(false); setEditLead(null); setForm(EMPTY_FORM);
            fetchLeads(); fetchStats();
        } catch { Alert.alert('Error', 'Failed to save lead'); }
        finally { setSaving(false); }
    };

    const openEdit = (lead) => {
        setForm({
            customerName: lead.customerName, mobileNumber: lead.mobileNumber,
            courseName: lead.courseName || '', leadSource: lead.leadSource || '',
            assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
        });
        setEditLead(lead); setShowAdd(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Lead', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.deleteLead(id);
                        fetchLeads(); fetchStats();
                    } catch { Alert.alert('Error', 'Failed to delete'); }
                },
            },
        ]);
    };

    const renderLead = ({ item: lead }) => {
        const sc = STATUS_COLORS[lead.status] || STATUS_COLORS['Fresh Lead'];
        const assignedName = lead.assignedTo?.name || null;
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

                {(lead.courseName || lead.leadSource) && (
                    <View style={styles.cardMeta}>
                        {lead.courseName && <Text style={styles.metaText}>📚 {lead.courseName}</Text>}
                        {lead.leadSource && <Text style={styles.metaText}>🔗 {lead.leadSource}</Text>}
                    </View>
                )}

                {assignedName && (
                    <Text style={styles.assignedText}>👤 Assigned to: {assignedName}</Text>
                )}

                {lead.followUpDescription && (
                    <Text style={styles.followupText} numberOfLines={2}>💬 {lead.followUpDescription}</Text>
                )}

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(lead)}>
                        <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(lead._id)}>
                        <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
                {[
                    { label: 'Total', value: stats.total || 0, color: '#1F2937' },
                    { label: 'Fresh', value: stats.freshLeads || 0, color: '#1D4ED8' },
                    { label: 'Interested', value: stats.interested || 0, color: '#065F46' },
                    { label: 'Not Int.', value: stats.notInterested || 0, color: '#991B1B' },
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
                        <TouchableOpacity
                            key={s} onPress={() => { setFilter(s); setPage(1); }}
                            style={[styles.filterChip, filter === s && styles.filterChipActive]}>
                            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
                                {s || 'All'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addBtn} onPress={() => { setShowAdd(true); setEditLead(null); setForm(EMPTY_FORM); }}>
                <Text style={styles.addBtnText}>＋ Add Lead</Text>
            </TouchableOpacity>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={leads}
                    keyExtractor={i => i._id}
                    renderItem={renderLead}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No leads found</Text>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            {/* Pagination */}
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

            {/* ── Add/Edit Modal ── */}
            <Modal visible={showAdd} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editLead ? 'Edit Lead' : 'Add New Lead'}</Text>
                            <TouchableOpacity onPress={() => { setShowAdd(false); setEditLead(null); }}>
                                <Text style={{ fontSize: 20, color: '#6B7280' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {[
                                { label: 'Customer Name *', key: 'customerName', placeholder: 'Full name' },
                                { label: 'Mobile Number *', key: 'mobileNumber', placeholder: '10-digit mobile', keyboard: 'phone-pad' },
                                { label: 'Course / Product', key: 'courseName', placeholder: 'e.g. MBA, Web Dev' },
                                { label: 'Lead Source', key: 'leadSource', placeholder: 'e.g. Facebook, Referral' },
                            ].map(f => (
                                <View key={f.key} style={styles.formField}>
                                    <Text style={styles.fieldLabel}>{f.label}</Text>
                                    <TextInput
                                        value={form[f.key]}
                                        onChangeText={t => setForm(p => ({ ...p, [f.key]: t }))}
                                        placeholder={f.placeholder}
                                        keyboardType={f.keyboard || 'default'}
                                        style={styles.fieldInput}
                                    />
                                </View>
                            ))}

                            {/* Assign To */}
                            <View style={styles.formField}>
                                <Text style={styles.fieldLabel}>Assign To (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <TouchableOpacity
                                        onPress={() => setForm(p => ({ ...p, assignedTo: '' }))}
                                        style={[styles.assignChip, !form.assignedTo && styles.assignChipActive]}>
                                        <Text style={[styles.assignChipText, !form.assignedTo && { color: '#fff' }]}>
                                            Unassigned
                                        </Text>
                                    </TouchableOpacity>
                                    {salespersons.map(sp => (
                                        <TouchableOpacity key={sp._id}
                                            onPress={() => setForm(p => ({ ...p, assignedTo: sp._id }))}
                                            style={[styles.assignChip, form.assignedTo === sp._id && styles.assignChipActive]}>
                                            <Text style={[styles.assignChipText, form.assignedTo === sp._id && { color: '#fff' }]}>
                                                {sp.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setEditLead(null); }}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : editLead ? 'Update' : 'Add Lead'}</Text>
                            </TouchableOpacity>
                        </View>
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
    addBtn: { margin: 12, backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    card: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 12, marginBottom: 10, padding: 14, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    customerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    mobileText: { fontSize: 13, color: '#059669', marginTop: 2, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
    metaText: { fontSize: 12, color: '#6B7280' },
    assignedText: { fontSize: 12, color: '#4F46E5', marginTop: 6 },
    followupText: { fontSize: 12, color: '#6B7280', marginTop: 6, fontStyle: 'italic' },
    cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
    editBtn: { flex: 1, backgroundColor: '#EEF2FF', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
    editBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
    deleteBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
    deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
    pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#F3F4F6' },
    pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
    pageBtnText: { color: '#374151', fontWeight: '600' },
    pageInfo: { color: '#6B7280', fontSize: 13 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
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