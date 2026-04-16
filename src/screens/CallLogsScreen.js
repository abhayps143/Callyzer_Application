// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     View, Text, FlatList, StyleSheet, ActivityIndicator,
//     TextInput, RefreshControl, TouchableOpacity, Modal,
//     ScrollView, Alert, Platform
// } from 'react-native';
// import { api } from '../services/api';

// // ── Helpers ───────────────────────────────────────────────────
// const fmtDuration = (s) => {
//     if (!s && s !== 0) return '—';
//     const sec = Number(s);
//     if (isNaN(sec)) return '—';
//     const m = Math.floor(sec / 60);
//     const remainingSec = sec % 60;
//     return m > 0 ? `${m}m ${remainingSec}s` : `${remainingSec}s`;
// };

// const fmtDate = (d) => {
//     if (!d) return '—';
//     const date = new Date(d);
//     if (isNaN(date.getTime())) return '—';
//     return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// };

// const fmtTime = (d) => {
//     if (!d) return '';
//     const date = new Date(d);
//     if (isNaN(date.getTime())) return '';
//     return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
// };

// // ── Badges ────────────────────────────────────────────────────
// const TypeBadge = ({ type }) => {
//     const cfg = {
//         Incoming: { bg: '#3b82f620', color: '#3b82f6', icon: '↙' },
//         Outgoing: { bg: '#8b5cf620', color: '#8b5cf6', icon: '↗' },
//     };
//     const c = cfg[type] || cfg.Outgoing;
//     return (
//         <View style={[styles.badge, { backgroundColor: c.bg }]}>
//             <Text style={[styles.badgeText, { color: c.color }]}>{c.icon} {type}</Text>
//         </View>
//     );
// };

// const StatusBadge = ({ status }) => {
//     const cfg = {
//         Connected: { bg: '#22c55e20', color: '#22c55e' },
//         Missed: { bg: '#ef444420', color: '#ef4444' },
//         Rejected: { bg: '#f59e0b20', color: '#f59e0b' },
//     };
//     const c = cfg[status] || cfg.Missed;
//     return (
//         <View style={[styles.badge, { backgroundColor: c.bg }]}>
//             <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
//         </View>
//     );
// };

// const DispositionBadge = ({ disposition }) => {
//     if (!disposition) return null;
//     const colors = {
//         'Interested': '#22c55e',
//         'Not Interested': '#ef4444',
//         'Sale Done': '#8b5cf6',
//         'Callback': '#f59e0b',
//         'Wrong Number': '#64748b',
//         'Follow-up': '#3b82f6',
//     };
//     const color = colors[disposition] || '#64748b';
//     return (
//         <View style={[styles.badge, { backgroundColor: color + '20', marginTop: 3 }]}>
//             <Text style={[styles.badgeText, { color }]}>{disposition}</Text>
//         </View>
//     );
// };

// // ── Add Call Modal ────────────────────────────────────────────
// const AddCallModal = ({ visible, onClose, onDone }) => {
//     const [form, setForm] = useState({
//         customerName: '',
//         customerNumber: '',
//         callType: 'Outgoing',
//         callStatus: 'Connected',
//         durationSeconds: '',
//         notes: '',
//         disposition: '',
//     });
//     const [saving, setSaving] = useState(false);

//     const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//     const handleSubmit = async () => {
//         if (!form.customerNumber) {
//             Alert.alert('Error', 'Phone number required');
//             return;
//         }
//         setSaving(true);
//         try {
//             const callData = {
//                 customerName: form.customerName || 'Unknown',
//                 customerNumber: form.customerNumber,
//                 callType: form.callType,
//                 callStatus: form.callStatus,
//                 durationSeconds: Number(form.durationSeconds) || 0,
//                 calledAt: new Date().toISOString(),
//                 notes: form.notes,
//                 disposition: form.disposition,
//             };

//             const res = await api.addCallLog(callData);

//             if (res._id || res.message === 'Call log created') {
//                 Alert.alert('Success', 'Call log added successfully');
//                 onDone();
//             } else {
//                 Alert.alert('Error', res.message || 'Failed to add call');
//             }
//         } catch (err) {
//             console.log('Add call error:', err);
//             Alert.alert('Error', 'Something went wrong: ' + (err.message || 'Unknown error'));
//         } finally {
//             setSaving(false);
//         }
//     };

//     const PickerRow = ({ label, options, value, onChange }) => (
//         <View style={styles.inputGroup}>
//             <Text style={styles.inputLabel}>{label}</Text>
//             <View style={styles.pickerRow}>
//                 {options.map(opt => (
//                     <TouchableOpacity
//                         key={opt}
//                         style={[styles.pickerOpt, value === opt && styles.pickerOptActive]}
//                         onPress={() => onChange(opt)}
//                     >
//                         <Text style={[styles.pickerOptText, value === opt && styles.pickerOptTextActive]}>
//                             {opt}
//                         </Text>
//                     </TouchableOpacity>
//                 ))}
//             </View>
//         </View>
//     );

//     return (
//         <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
//             <View style={styles.modalContainer}>
//                 <View style={styles.modalHeader}>
//                     <Text style={styles.modalTitle}>Add Call Log</Text>
//                     <TouchableOpacity onPress={onClose}>
//                         <Text style={styles.modalClose}>✕</Text>
//                     </TouchableOpacity>
//                 </View>
//                 <ScrollView style={styles.modalBody}>
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.inputLabel}>Customer Name</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={form.customerName}
//                             onChangeText={v => set('customerName', v)}
//                             placeholder="Rahul Sharma"
//                             placeholderTextColor="#475569"
//                         />
//                     </View>
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.inputLabel}>Phone Number *</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={form.customerNumber}
//                             onChangeText={v => set('customerNumber', v)}
//                             placeholder="+91 98765 43210"
//                             placeholderTextColor="#475569"
//                             keyboardType="phone-pad"
//                         />
//                     </View>
//                     <PickerRow label="Call Type" options={['Outgoing', 'Incoming']} value={form.callType} onChange={v => set('callType', v)} />
//                     <PickerRow label="Status" options={['Connected', 'Missed', 'Rejected']} value={form.callStatus} onChange={v => set('callStatus', v)} />

//                     <View style={styles.inputGroup}>
//                         <Text style={styles.inputLabel}>Disposition</Text>
//                         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                             {['', 'Interested', 'Not Interested', 'Callback', 'Sale Done', 'Wrong Number', 'Follow-up'].map(opt => (
//                                 <TouchableOpacity
//                                     key={opt}
//                                     style={[styles.pickerOpt, { marginRight: 8 }, form.disposition === opt && styles.pickerOptActive]}
//                                     onPress={() => set('disposition', opt)}
//                                 >
//                                     <Text style={[styles.pickerOptText, form.disposition === opt && styles.pickerOptTextActive]}>
//                                         {opt || 'None'}
//                                     </Text>
//                                 </TouchableOpacity>
//                             ))}
//                         </ScrollView>
//                     </View>

//                     <View style={styles.inputGroup}>
//                         <Text style={styles.inputLabel}>Duration (seconds)</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={form.durationSeconds}
//                             onChangeText={v => set('durationSeconds', v)}
//                             placeholder="120"
//                             placeholderTextColor="#475569"
//                             keyboardType="numeric"
//                         />
//                     </View>

//                     <View style={styles.inputGroup}>
//                         <Text style={styles.inputLabel}>Notes</Text>
//                         <TextInput
//                             style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
//                             value={form.notes}
//                             onChangeText={v => set('notes', v)}
//                             placeholder="Optional notes..."
//                             placeholderTextColor="#475569"
//                             multiline
//                         />
//                     </View>
//                     <View style={{ height: 20 }} />
//                 </ScrollView>
//                 <View style={styles.modalFooter}>
//                     <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
//                         <Text style={styles.cancelBtnText}>Cancel</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
//                         <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Add Call'}</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// // ── Main Screen ───────────────────────────────────────────────
// export default function CallLogsScreen() {
//     const [calls, setCalls] = useState([]);
//     const [stats, setStats] = useState(null);
//     const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 20 });
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [search, setSearch] = useState('');
//     const [typeFilter, setTypeFilter] = useState('All');
//     const [statusFilter, setStatusFilter] = useState('All');
//     const [page, setPage] = useState(1);
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [loadingMore, setLoadingMore] = useState(false);
//     const [error, setError] = useState(null);

//     const fetchCalls = useCallback(async (reset = false) => {
//         if (reset) {
//             setLoading(true);
//             setError(null);
//         }
//         try {
//             const currentPage = reset ? 1 : page;

//             // Build params
//             const params = {
//                 page: currentPage,
//                 limit: 20,
//                 sortField: 'calledAt',
//                 sortDir: 'desc',
//             };

//             if (search.trim()) params.search = search.trim();
//             if (typeFilter !== 'All') params.callType = typeFilter;
//             if (statusFilter !== 'All') params.callStatus = statusFilter;

//             console.log('📞 Fetching calls with params:', params);

//             // Fetch calls
//             const callsResponse = await api.getCallLogs(params);
//             console.log('📞 Calls response:', JSON.stringify(callsResponse, null, 2));

//             // Handle response
//             let logs = [];
//             let paginationData = { total: 0, pages: 1, page: currentPage, limit: 20 };

//             if (callsResponse && callsResponse.success === false) {
//                 setError(callsResponse.message || 'Failed to fetch calls');
//                 logs = [];
//             } else if (callsResponse && callsResponse.logs) {
//                 logs = callsResponse.logs;
//                 paginationData = callsResponse.pagination || { total: 0, pages: 1, page: currentPage, limit: 20 };
//             } else if (Array.isArray(callsResponse)) {
//                 logs = callsResponse;
//             } else {
//                 logs = [];
//             }

//             console.log(`✅ Fetched ${logs.length} calls, Total: ${paginationData.total}`);

//             if (reset || currentPage === 1) {
//                 setCalls(logs);
//             } else {
//                 setCalls(prev => [...prev, ...logs]);
//             }
//             setPagination(paginationData);

//             // Fetch stats only on refresh or first load
//             if (reset) {
//                 try {
//                     const statsResponse = await api.getCallStats();
//                     console.log('📊 Stats response:', statsResponse);
//                     if (statsResponse && statsResponse.success !== false) {
//                         setStats(statsResponse);
//                     }
//                 } catch (statsErr) {
//                     console.log('Stats fetch error:', statsErr);
//                 }
//             }

//         } catch (err) {
//             console.log('❌ CallLogs error:', err);
//             setError(err.message || 'Network error. Please check your connection.');
//             Alert.alert('Error', 'Failed to load call logs: ' + (err.message || 'Unknown error'));
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//             setLoadingMore(false);
//         }
//     }, [page, search, typeFilter, statusFilter]);

//     // Initial load and filter changes
//     useEffect(() => {
//         fetchCalls(true);
//     }, [search, typeFilter, statusFilter]);

//     // Load more when page changes
//     useEffect(() => {
//         if (page > 1) {
//             fetchCalls(false);
//         }
//     }, [page]);

//     const onRefresh = () => {
//         setRefreshing(true);
//         setPage(1);
//         fetchCalls(true);
//     };

//     const loadMore = () => {
//         if (page < pagination.pages && !loadingMore && !loading) {
//             setLoadingMore(true);
//             setPage(p => p + 1);
//         }
//     };

//     const renderItem = ({ item, index }) => {
//         const avatarColors = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
//         const avatarColor = avatarColors[index % avatarColors.length];
//         const initials = (item.customerName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

//         return (
//             <View style={styles.callCard}>
//                 <View style={[styles.callAvatar, { backgroundColor: avatarColor + '30' }]}>
//                     <Text style={[styles.callAvatarText, { color: avatarColor }]}>{initials}</Text>
//                 </View>
//                 <View style={styles.callInfo}>
//                     <Text style={styles.callName}>{item.customerName || 'Unknown'}</Text>
//                     <Text style={styles.callNumber}>{item.customerNumber || '—'}</Text>
//                     <Text style={styles.callDate}>{fmtDate(item.calledAt)} {fmtTime(item.calledAt)}</Text>
//                     {item.notes ? <Text style={styles.callNotes} numberOfLines={1}>{item.notes}</Text> : null}
//                 </View>
//                 <View style={styles.callRight}>
//                     <TypeBadge type={item.callType} />
//                     <StatusBadge status={item.callStatus} />
//                     <Text style={styles.callDuration}>{fmtDuration(item.durationSeconds)}</Text>
//                     <DispositionBadge disposition={item.disposition} />
//                 </View>
//             </View>
//         );
//     };

//     return (
//         <View style={styles.container}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <View>
//                     <Text style={styles.title}>📞 Call Logs</Text>
//                     <Text style={styles.subtitle}>{pagination.total} total calls</Text>
//                 </View>
//                 <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
//                     <Text style={styles.addBtnText}>+ Add</Text>
//                 </TouchableOpacity>
//             </View>

//             {/* Stats Row */}
//             {stats && (
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
//                     {[
//                         { label: 'Total', value: stats.total, color: '#6366f1' },
//                         { label: 'Incoming', value: stats.incoming, color: '#3b82f6' },
//                         { label: 'Outgoing', value: stats.outgoing, color: '#8b5cf6' },
//                         { label: 'Connected', value: stats.connected, color: '#22c55e' },
//                         { label: 'Missed', value: stats.missed, color: '#ef4444' },
//                         { label: 'Today', value: stats.todayCalls, color: '#f59e0b' },
//                     ].map(s => (
//                         <View key={s.label} style={[styles.statChip, { borderColor: s.color + '40' }]}>
//                             <Text style={[styles.statChipValue, { color: s.color }]}>{s.value ?? 0}</Text>
//                             <Text style={styles.statChipLabel}>{s.label}</Text>
//                         </View>
//                     ))}
//                 </ScrollView>
//             )}

//             {/* Search */}
//             <TextInput
//                 style={styles.search}
//                 placeholder="🔍 Search by name or number..."
//                 placeholderTextColor="#475569"
//                 value={search}
//                 onChangeText={setSearch}
//             />

//             {/* Filters */}
//             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
//                 {['All', 'Incoming', 'Outgoing'].map(t => (
//                     <TouchableOpacity
//                         key={t}
//                         style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]}
//                         onPress={() => { setTypeFilter(t); setPage(1); }}
//                     >
//                         <Text style={[styles.filterBtnText, typeFilter === t && styles.filterBtnTextActive]}>{t}</Text>
//                     </TouchableOpacity>
//                 ))}
//                 <View style={styles.filterDivider} />
//                 {['All', 'Connected', 'Missed', 'Rejected'].map(s => (
//                     <TouchableOpacity
//                         key={s}
//                         style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
//                         onPress={() => { setStatusFilter(s); setPage(1); }}
//                     >
//                         <Text style={[styles.filterBtnText, statusFilter === s && styles.filterBtnTextActive]}>{s}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>

//             {/* List */}
//             {loading && !refreshing ? (
//                 <View style={styles.center}>
//                     <ActivityIndicator size="large" color="#6366f1" />
//                     <Text style={styles.loadingText}>Loading calls...</Text>
//                 </View>
//             ) : error && calls.length === 0 ? (
//                 <View style={styles.center}>
//                     <Text style={styles.emptyIcon}>⚠️</Text>
//                     <Text style={styles.emptyText}>{error}</Text>
//                     <TouchableOpacity onPress={() => fetchCalls(true)} style={styles.retryBtn}>
//                         <Text style={styles.retryBtnText}>Retry</Text>
//                     </TouchableOpacity>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={calls}
//                     keyExtractor={(item, index) => item._id || index.toString()}
//                     renderItem={renderItem}
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
//                     onEndReached={loadMore}
//                     onEndReachedThreshold={0.3}
//                     contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
//                     ListFooterComponent={
//                         loadingMore ? (
//                             <View style={{ padding: 20 }}>
//                                 <ActivityIndicator color="#6366f1" />
//                             </View>
//                         ) : null
//                     }
//                     ListEmptyComponent={
//                         !loading && (
//                             <View style={styles.empty}>
//                                 <Text style={styles.emptyIcon}>📞</Text>
//                                 <Text style={styles.emptyText}>No call logs found</Text>
//                                 {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
//                                     <TouchableOpacity onPress={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }}>
//                                         <Text style={styles.emptyReset}>Reset filters</Text>
//                                     </TouchableOpacity>
//                                 )}
//                                 <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addFirstBtn}>
//                                     <Text style={styles.addFirstBtnText}>+ Add your first call</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         )
//                     }
//                 />
//             )}

//             {/* Add Call Modal */}
//             <AddCallModal
//                 visible={showAddModal}
//                 onClose={() => setShowAddModal(false)}
//                 onDone={() => {
//                     setShowAddModal(false);
//                     onRefresh();
//                 }}
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
//     loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

//     header: {
//         flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//         padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
//         backgroundColor: '#1e293b',
//         borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 8,
//     },
//     title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
//     subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
//     addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
//     addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

//     statsRow: { flexGrow: 0, marginVertical: 8 },
//     statChip: {
//         backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14,
//         paddingVertical: 8, marginRight: 8, alignItems: 'center', borderWidth: 1,
//     },
//     statChipValue: { fontWeight: 'bold', fontSize: 16 },
//     statChipLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },

//     search: {
//         backgroundColor: '#1e293b', color: '#fff', marginHorizontal: 12, marginBottom: 8,
//         padding: 12, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: '#334155',
//     },

//     filtersRow: { flexGrow: 0, marginBottom: 8 },
//     filterBtn: {
//         paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
//         borderWidth: 1, borderColor: '#334155', marginRight: 8,
//     },
//     filterBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
//     filterBtnText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
//     filterBtnTextActive: { color: '#fff' },
//     filterDivider: { width: 1, backgroundColor: '#334155', marginRight: 8, height: 28, alignSelf: 'center' },

//     callCard: {
//         backgroundColor: '#1e293b', marginHorizontal: 12, marginVertical: 4,
//         padding: 14, borderRadius: 12, flexDirection: 'row',
//     },
//     callAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//     callAvatarText: { fontWeight: 'bold', fontSize: 14 },
//     callInfo: { flex: 1 },
//     callName: { color: '#fff', fontWeight: '600', fontSize: 15 },
//     callNumber: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
//     callDate: { color: '#475569', fontSize: 11, marginTop: 3 },
//     callNotes: { color: '#64748b', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
//     callRight: { alignItems: 'flex-end', gap: 4 },
//     callDuration: { color: '#64748b', fontSize: 12, marginTop: 4 },

//     badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
//     badgeText: { fontSize: 11, fontWeight: '600' },

//     empty: { alignItems: 'center', paddingTop: 80, flex: 1 },
//     emptyIcon: { fontSize: 48, marginBottom: 12, color: '#64748b' },
//     emptyText: { color: '#64748b', fontSize: 16, textAlign: 'center' },
//     emptyReset: { color: '#6366f1', marginTop: 10, fontWeight: '600' },
//     addFirstBtn: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
//     addFirstBtnText: { color: '#fff', fontWeight: '600' },
//     retryBtn: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
//     retryBtnText: { color: '#fff', fontWeight: '600' },

//     // Modal styles
//     modalContainer: { flex: 1, backgroundColor: '#0f172a' },
//     modalHeader: {
//         flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//         padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
//         borderBottomWidth: 1, borderBottomColor: '#1e293b',
//     },
//     modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
//     modalClose: { color: '#64748b', fontSize: 20 },
//     modalBody: { flex: 1 },
//     modalFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },

//     inputGroup: { paddingHorizontal: 16, marginBottom: 16 },
//     inputLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
//     input: {
//         backgroundColor: '#1e293b', color: '#fff', borderRadius: 12,
//         padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#334155',
//     },
//     pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//     pickerOpt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
//     pickerOptActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
//     pickerOptText: { color: '#64748b', fontSize: 13 },
//     pickerOptTextActive: { color: '#fff' },

//     cancelBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
//     cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
//     saveBtn: { flex: 1, backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
//     saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
// });

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Modal, ScrollView, Alert, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Helpers ───────────────────────────────────────────────────
const fmtDuration = (s) => {
  if (!s && s !== 0) return '—';
  const sec = Number(s);
  if (isNaN(sec)) return '—';
  const m = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  return m > 0 ? `${m}m ${remainingSec}s` : `${remainingSec}s`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Badges ────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const isIncoming = type === 'Incoming';
  return (
    <View style={[styles.badge, { backgroundColor: isIncoming ? '#3b82f620' : '#8b5cf620' }]}>
      <Text style={[styles.badgeText, { color: isIncoming ? '#3b82f6' : '#8b5cf6' }]}>
        {isIncoming ? '↙ Incoming' : '↗ Outgoing'}
      </Text>
    </View>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    Connected: { bg: '#22c55e20', color: '#22c55e' },
    Missed: { bg: '#ef444420', color: '#ef4444' },
    Rejected: { bg: '#f59e0b20', color: '#f59e0b' },
  };
  const c = config[status] || config.Missed;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
    </View>
  );
};

const DispositionBadge = ({ disposition }) => {
  if (!disposition) return null;
  const colors = {
    'Interested': '#22c55e',
    'Not Interested': '#ef4444',
    'Sale Done': '#8b5cf6',
    'Callback': '#f59e0b',
    'Wrong Number': '#64748b',
    'Follow-up': '#3b82f6',
  };
  const color = colors[disposition] || '#64748b';
  return (
    <View style={[styles.badgeSmall, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeSmallText, { color }]}>{disposition}</Text>
    </View>
  );
};

const avatarColors = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const Avatar = ({ name, index }) => {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const color = avatarColors[index % avatarColors.length];
  return (
    <View style={[styles.avatar, { backgroundColor: color + '30' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  );
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Add/Edit Call Modal ───────────────────────────────────────
const CallModal = ({ visible, onClose, onDone, log }) => {
  const isEdit = !!log;
  const [form, setForm] = useState({
    customerName: '',
    customerNumber: '',
    callType: 'Outgoing',
    callStatus: 'Connected',
    durationSeconds: '',
    notes: '',
    disposition: '',
    followUpDate: '',
    followUpNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (log) {
      setForm({
        customerName: log.customerName || '',
        customerNumber: log.customerNumber || '',
        callType: log.callType || 'Outgoing',
        callStatus: log.callStatus || 'Connected',
        durationSeconds: log.durationSeconds?.toString() || '',
        notes: log.notes || '',
        disposition: log.disposition || '',
        followUpDate: log.followUpDate || '',
        followUpNotes: log.followUpNotes || '',
      });
    } else {
      setForm({
        customerName: '',
        customerNumber: '',
        callType: 'Outgoing',
        callStatus: 'Connected',
        durationSeconds: '',
        notes: '',
        disposition: '',
        followUpDate: '',
        followUpNotes: '',
      });
    }
  }, [log]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.customerNumber) {
      setError('Phone number is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const callData = {
        customerName: form.customerName || 'Unknown',
        customerNumber: form.customerNumber,
        callType: form.callType,
        callStatus: form.callStatus,
        durationSeconds: Number(form.durationSeconds) || 0,
        calledAt: new Date().toISOString(),
        notes: form.notes,
        disposition: form.disposition,
        followUpDate: form.followUpDate,
        followUpNotes: form.followUpNotes,
      };

      let res;
      if (isEdit) {
        res = await api.updateCallLog(log._id, callData);
      } else {
        res = await api.addCallLog(callData);
      }

      if (res._id || res.message === 'Call log created') {
        onDone(isEdit ? 'Call log updated' : 'Call log added');
      } else {
        setError(res.message || 'Failed to save call');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const callTypes = ['Outgoing', 'Incoming'];
  const callStatuses = ['Connected', 'Missed', 'Rejected'];
  const dispositions = ['', 'Interested', 'Not Interested', 'Callback', 'Sale Done', 'Wrong Number', 'Follow-up'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{isEdit ? 'Edit Call' : 'Add Call'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modalStyles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body}>
            {error ? (
              <View style={modalStyles.errorBox}>
                <Text style={modalStyles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Customer Name</Text>
              <TextInput
                style={modalStyles.input}
                value={form.customerName}
                onChangeText={v => set('customerName', v)}
                placeholder="Enter name"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Phone Number *</Text>
              <TextInput
                style={modalStyles.input}
                value={form.customerNumber}
                onChangeText={v => set('customerNumber', v)}
                placeholder="+91 98765 43210"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
              />
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Call Type</Text>
              <View style={modalStyles.pickerRow}>
                {callTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[modalStyles.pickerOpt, form.callType === type && modalStyles.pickerOptActive]}
                    onPress={() => set('callType', type)}
                  >
                    <Text style={[modalStyles.pickerOptText, form.callType === type && modalStyles.pickerOptTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Call Status</Text>
              <View style={modalStyles.pickerRow}>
                {callStatuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[modalStyles.pickerOpt, form.callStatus === status && modalStyles.pickerOptActive]}
                    onPress={() => set('callStatus', status)}
                  >
                    <Text style={[modalStyles.pickerOptText, form.callStatus === status && modalStyles.pickerOptTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Disposition</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dispositions.map(disp => (
                  <TouchableOpacity
                    key={disp || 'none'}
                    style={[modalStyles.pickerOpt, form.disposition === disp && modalStyles.pickerOptActive, { marginRight: 8 }]}
                    onPress={() => set('disposition', disp)}
                  >
                    <Text style={[modalStyles.pickerOptText, form.disposition === disp && modalStyles.pickerOptTextActive]}>
                      {disp || 'None'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Duration (seconds)</Text>
              <TextInput
                style={modalStyles.input}
                value={form.durationSeconds}
                onChangeText={v => set('durationSeconds', v)}
                placeholder="0"
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Follow-up Date</Text>
              <TextInput
                style={modalStyles.input}
                value={form.followUpDate}
                onChangeText={v => set('followUpDate', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Follow-up Notes</Text>
              <TextInput
                style={[modalStyles.input, { height: 60, textAlignVertical: 'top' }]}
                value={form.followUpNotes}
                onChangeText={v => set('followUpNotes', v)}
                placeholder="Notes..."
                placeholderTextColor="#475569"
                multiline
              />
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Notes</Text>
              <TextInput
                style={[modalStyles.input, { height: 60, textAlignVertical: 'top' }]}
                value={form.notes}
                onChangeText={v => set('notes', v)}
                placeholder="Optional notes..."
                placeholderTextColor="#475569"
                multiline
              />
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSubmit} disabled={saving}>
              <Text style={modalStyles.saveBtnText}>{saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Call')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────
const DeleteConfirmModal = ({ visible, onClose, onConfirm, log }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteCallLog(log._id);
      onConfirm();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete');
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { width: '80%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Delete Call Log</Text>
          </View>
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🗑️</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' }}>
              {log?.customerName}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{log?.customerNumber}</Text>
          </View>
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.saveBtn, { backgroundColor: '#ef4444' }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={modalStyles.saveBtnText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Component ────────────────────────────────────────────
export default function CallLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [deleteLog, setDeleteLog] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('agent');

  // Get user role
  useEffect(() => {
    const getUser = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user?.role || 'agent');
      }
    };
    getUser();
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canAddCalls = userRole === 'agent' || userRole === 'team_leader';

  const fetchCalls = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setError(null);
    }
    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 20,
        sortField: 'calledAt',
        sortDir: 'desc',
      };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'All') params.callType = typeFilter;
      if (statusFilter !== 'All') params.callStatus = statusFilter;

      const response = await api.getCallLogs(params);
      let logsData = [];
      let paginationData = { total: 0, pages: 1, page: currentPage, limit: 20 };

      if (response && response.success === false) {
        setError(response.message);
      } else if (response && response.logs) {
        logsData = response.logs;
        paginationData = response.pagination || paginationData;
      } else if (Array.isArray(response)) {
        logsData = response;
      }

      if (reset || currentPage === 1) {
        setLogs(logsData);
      } else {
        setLogs(prev => [...prev, ...logsData]);
      }
      setPagination(paginationData);

      if (reset) {
        try {
          const statsResponse = await api.getCallStats();
          if (statsResponse && statsResponse.success !== false) {
            setStats(statsResponse);
          }
        } catch (statsErr) {
          console.log('Stats fetch error:', statsErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchCalls(true);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    if (page > 1) {
      fetchCalls(false);
    }
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchCalls(true);
  };

  const loadMore = () => {
    if (page < pagination.pages && !loadingMore && !loading) {
      setLoadingMore(true);
      setPage(p => p + 1);
    }
  };

  const onDone = (msg) => {
    setShowAddModal(false);
    setEditLog(null);
    setDeleteLog(null);
    Alert.alert('Success', msg || 'Done!');
    onRefresh();
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.callCard}>
      <Avatar name={item.customerName} index={index} />
      <View style={styles.callInfo}>
        <Text style={styles.callName}>{item.customerName || 'Unknown'}</Text>
        <Text style={styles.callNumber}>{item.customerNumber || '—'}</Text>
        <Text style={styles.callDate}>{fmtDate(item.calledAt)} {fmtTime(item.calledAt)}</Text>
        <DispositionBadge disposition={item.disposition} />
      </View>
      <View style={styles.callRight}>
        <TypeBadge type={item.callType} />
        <StatusBadge status={item.callStatus} />
        <Text style={styles.callDuration}>{fmtDuration(item.durationSeconds)}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => setEditLog(item)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity onPress={() => setDeleteLog(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const statsItems = stats ? [
    { label: 'Total', value: stats.total, icon: '📞', color: '#6366f1' },
    { label: 'Incoming', value: stats.incoming, icon: '↙️', color: '#3b82f6' },
    { label: 'Outgoing', value: stats.outgoing, icon: '↗️', color: '#8b5cf6' },
    { label: 'Connected', value: stats.connected, icon: '✅', color: '#22c55e' },
    { label: 'Missed', value: stats.missed, icon: '❌', color: '#ef4444' },
    { label: 'Today', value: stats.todayCalls, icon: '📅', color: '#f59e0b' },
  ] : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📞 Call Logs</Text>
          <Text style={styles.subtitle}>{pagination.total} total calls</Text>
        </View>
        {canAddCalls && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {statsItems.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
          ))}
        </ScrollView>
      )}

      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="🔍 Search by name or number..."
        placeholderTextColor="#475569"
        value={search}
        onChangeText={setSearch}
      />

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {['All', 'Incoming', 'Outgoing'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]}
            onPress={() => { setTypeFilter(t); setPage(1); }}
          >
            <Text style={[styles.filterBtnText, typeFilter === t && styles.filterBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {['All', 'Connected', 'Missed', 'Rejected'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
            onPress={() => { setStatusFilter(s); setPage(1); }}
          >
            <Text style={[styles.filterBtnText, statusFilter === s && styles.filterBtnTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading calls...</Text>
        </View>
      ) : error && logs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchCalls(true)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color="#6366f1" /> : null}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📞</Text>
                <Text style={styles.emptyText}>No call logs found</Text>
                {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
                  <TouchableOpacity onPress={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }}>
                    <Text style={styles.emptyReset}>Reset filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      )}

      {/* Modals */}
      <CallModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onDone={onDone}
      />
      <CallModal
        visible={!!editLog}
        onClose={() => setEditLog(null)}
        onDone={onDone}
        log={editLog}
      />
      <DeleteConfirmModal
        visible={!!deleteLog}
        onClose={() => setDeleteLog(null)}
        onConfirm={() => onDone('Call log deleted')}
        log={deleteLog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 8,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statsRow: { flexGrow: 0, paddingHorizontal: 12, marginVertical: 8 },
  statCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 12,
    marginRight: 8, alignItems: 'center', minWidth: 80, borderLeftWidth: 3,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  search: {
    backgroundColor: '#1e293b', color: '#fff', marginHorizontal: 12, marginBottom: 8,
    padding: 12, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: '#334155',
  },
  filtersRow: { flexGrow: 0, marginBottom: 8, paddingHorizontal: 12 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#334155', marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterBtnText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },
  filterDivider: { width: 1, backgroundColor: '#334155', marginRight: 8, height: 28, alignSelf: 'center' },
  callCard: {
    backgroundColor: '#1e293b', marginHorizontal: 12, marginVertical: 4,
    padding: 14, borderRadius: 12, flexDirection: 'row',
  },
  avatar: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: 'bold', fontSize: 16 },
  callInfo: { flex: 1 },
  callName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  callNumber: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  callDate: { color: '#475569', fontSize: 11, marginTop: 3 },
  callRight: { alignItems: 'flex-end', gap: 4 },
  callDuration: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  editBtn: { padding: 4 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2, alignSelf: 'flex-start' },
  badgeSmallText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, flex: 1 },
  emptyIcon: { fontSize: 48, marginBottom: 12, color: '#64748b' },
  emptyText: { color: '#64748b', fontSize: 16, textAlign: 'center' },
  emptyReset: { color: '#6366f1', marginTop: 10, fontWeight: '600' },
  retryBtn: { marginTop: 20, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  close: { color: '#64748b', fontSize: 20 },
  body: { padding: 16 },
  field: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1e293b', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#334155' },
  pickerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pickerOpt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  pickerOptActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pickerOptText: { color: '#64748b', fontSize: 13 },
  pickerOptTextActive: { color: '#fff' },
  errorBox: { backgroundColor: '#ef444420', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ef444440' },
  errorText: { color: '#ef4444', fontSize: 13 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  cancelBtn: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});