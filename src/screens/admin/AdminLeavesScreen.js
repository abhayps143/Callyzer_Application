
// import React, { useState, useEffect } from 'react';
// import {
//     View, Text, FlatList, StyleSheet, TouchableOpacity,
//     ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView, StatusBar
// } from 'react-native';
// import { C, shadow } from '../../theme';
// import { api } from '../../services/api';

// const STATUS_CFG = {
//     pending: { color: C.amber, soft: C.amberSoft, label: 'Pending' },
//     approved: { color: C.green, soft: C.greenSoft, label: 'Approved' },
//     rejected: { color: C.red, soft: C.redSoft, label: 'Rejected' },
// };
// const LEAVE_TYPES = {
//     sick: { color: C.red, label: 'Sick' },
//     casual: { color: C.blue, label: 'Casual' },
//     earned: { color: C.purple, label: 'Earned' },
//     unpaid: { color: C.textSub, label: 'Unpaid' },
// };

// const fmt = (d) => d
//     ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//     : '—';

// export default function AdminLeavesScreen() {
//     const [leaves, setLeaves] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [filter, setFilter] = useState('pending');
//     const [selected, setSelected] = useState(null);
//     const [remarks, setRemarks] = useState('');
//     const [action, setAction] = useState('approved');
//     const [saving, setSaving] = useState(false);

//     const fetchLeaves = async () => {
//         try {
//             const data = await api.getAdminLeaves({ status: filter === 'All' ? '' : filter });
//             console.log('Admin leaves response:', JSON.stringify(data));
//             setLeaves(data.leaves || data || []);
//         } catch (e) { console.log('fetchLeaves error:', e); }
//         setLoading(false);
//         setRefreshing(false);
//     };

//     useEffect(() => { setLoading(true); fetchLeaves(); }, [filter]);

//     const handleAction = async () => {
//         if (action === 'rejected' && !remarks.trim()) {
//             Alert.alert('Required', 'Please provide a rejection reason.');
//             return;
//         }
//         setSaving(true);
//         try {
//             // const res = await api.hrLeaveAction(selected.hrRecordId, selected._id, action, remarks);
//             // hrRecordId backend se alag field name se aata hai, fallback lagao
//             const hrRecordId = selected.hrRecordId || selected.hrRecord || selected.hrRecord?._id;
//             const res = await api.hrLeaveAction(hrRecordId, selected._id, action, remarks);
//             console.log('hrRecordId used:', hrRecordId, 'leaveId:', selected._id);
//             console.log('leaveAction response:', JSON.stringify(res));
//             setSelected(null); setRemarks(''); fetchLeaves();
//             Alert.alert('Done', `Leave ${action}.`);
//         } catch (e) {
//             console.log('handleAction error:', e);
//             Alert.alert('Error', 'Server error');
//         }
//         setSaving(false);
//     };

//     const renderLeave = ({ item }) => {
//         const s = STATUS_CFG[item.status] || STATUS_CFG.pending;
//         const lt = LEAVE_TYPES[item.leaveType] || { color: C.textSub, label: item.leaveType };
//         return (
//             <TouchableOpacity
//                 style={styles.card}
//                 onPress={() => { setSelected(item); setAction('approved'); setRemarks(''); }}
//                 activeOpacity={0.75}
//             >
//                 <View style={styles.cardTop}>
//                     <View style={styles.cardLeft}>
//                         <View style={styles.empAvatar}>
//                             <Text style={styles.empAvatarText}>{(item.employeeName || '?').charAt(0).toUpperCase()}</Text>
//                         </View>
//                         <View>
//                             <Text style={styles.empName}>{item.employeeName || 'Employee'}</Text>
//                             <Text style={styles.empRole}>{item.employeeRole || ''}</Text>
//                         </View>
//                     </View>
//                     <View style={[styles.statusPill, { backgroundColor: s.soft }]}>
//                         <Text style={[styles.statusPillText, { color: s.color }]}>{s.label}</Text>
//                     </View>
//                 </View>

//                 <View style={styles.cardMeta}>
//                     <View style={[styles.typePill, { backgroundColor: lt.color + '18' }]}>
//                         <Text style={[styles.typePillText, { color: lt.color }]}>{lt.label}</Text>
//                     </View>
//                     {/* <Text style={styles.dates}>{fmt(item.startDate)} → {fmt(item.endDate)}</Text> */}
//                     <Text style={styles.dates}>{fmt(item.fromDate)} → {fmt(item.toDate)}</Text>
//                     <Text style={styles.dayCount}>{item.days || 1}d</Text>
//                 </View>

//                 {item.reason ? (
//                     <Text style={styles.reason} numberOfLines={2}>"{item.reason}"</Text>
//                 ) : null}
//             </TouchableOpacity>
//         );
//     };

//     return (
//         <View style={styles.container}>
//             <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

//             <View style={styles.header}>
//                 <Text style={styles.title}>Leave Management</Text>
//             </View>

//             {/* Filter Tabs */}
//             <View style={styles.tabs}>
//                 {['All', 'pending', 'approved', 'rejected'].map(s => {
//                     const cfg = s === 'All'
//                         ? { color: C.primary, soft: C.primarySoft, label: 'All' }
//                         : STATUS_CFG[s];
//                     const active = filter === s;
//                     return (
//                         <TouchableOpacity
//                             key={s}
//                             style={[styles.tab, active && { backgroundColor: cfg.color }]}
//                             onPress={() => setFilter(s)}
//                             activeOpacity={0.8}
//                         >
//                             <Text style={[styles.tabText, active && { color: '#fff' }]}>{cfg.label}</Text>
//                         </TouchableOpacity>
//                     );
//                 })}
//             </View>

//             {loading
//                 ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60 }} />
//                 : <FlatList
//                     data={leaves}
//                     keyExtractor={(item, i) => item._id || i.toString()}
//                     renderItem={renderLeave}
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaves(); }} tintColor={C.primary} />}
//                     contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 }}
//                     ListEmptyComponent={<Text style={styles.empty}>No leave requests</Text>}
//                 />
//             }

//             {/* Review Modal */}
//             <Modal visible={!!selected} animationType="slide" transparent>
//                 <View style={styles.modalOverlay}>
//                     <View style={styles.modalSheet}>
//                         <View style={styles.sheetHandle} />
//                         <View style={styles.modalHeader}>
//                             <Text style={styles.modalTitle}>Review Leave</Text>
//                             <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
//                                 <Text style={styles.closeText}>✕</Text>
//                             </TouchableOpacity>
//                         </View>

//                         {selected && (
//                             <ScrollView showsVerticalScrollIndicator={false}>
//                                 <View style={styles.infoBox}>
//                                     {/* <Text style={styles.infoName}>{selected.employeeName}</Text> */}
//                                     <Text style={styles.infoName}>
//                                         {selected.employeeName || selected.employee?.name || 'Employee'}
//                                     </Text>
//                                     {[
//                                         ['Leave Type', selected.leaveType],
//                                         // ['From', fmt(selected.startDate)],
//                                         // ['To', fmt(selected.endDate)],
//                                         ['From', fmt(selected.fromDate)],
//                                         ['To', fmt(selected.toDate)],
//                                         ['Days', selected.days],
//                                     ].map(([k, v]) => (
//                                         <View key={k} style={styles.infoRow}>
//                                             <Text style={styles.infoKey}>{k}</Text>
//                                             <Text style={styles.infoVal}>{v}</Text>
//                                         </View>
//                                     ))}
//                                     {selected.reason && (
//                                         <Text style={styles.infoReason}>"{selected.reason}"</Text>
//                                     )}
//                                 </View>

//                                 <Text style={styles.fieldLabel}>Decision</Text>
//                                 <View style={styles.decisionRow}>
//                                     {['approved', 'rejected'].map(a => (
//                                         <TouchableOpacity
//                                             key={a}
//                                             style={[
//                                                 styles.decisionBtn,
//                                                 action === a && { backgroundColor: a === 'approved' ? C.green : C.red, borderColor: 'transparent' }
//                                             ]}
//                                             onPress={() => setAction(a)}
//                                         >
//                                             <Text style={[styles.decisionText, action === a && { color: '#fff' }]}>
//                                                 {a === 'approved' ? '✅ Approve' : '❌ Reject'}
//                                             </Text>
//                                         </TouchableOpacity>
//                                     ))}
//                                 </View>

//                                 <Text style={styles.fieldLabel}>
//                                     Remarks {action === 'rejected' ? '(required)' : '(optional)'}
//                                 </Text>
//                                 <TextInput
//                                     style={[styles.remarksInput, action === 'rejected' && { borderColor: C.red }]}
//                                     placeholder="Add remarks…"
//                                     placeholderTextColor={C.textMuted}
//                                     value={remarks}
//                                     onChangeText={setRemarks}
//                                     multiline
//                                     numberOfLines={3}
//                                 />

//                                 <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={saving}>
//                                     {saving
//                                         ? <ActivityIndicator color="#fff" />
//                                         : <Text style={styles.submitBtnText}>Submit Decision</Text>
//                                     }
//                                 </TouchableOpacity>
//                             </ScrollView>
//                         )}
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: C.bg },
//     header: {
//         paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
//         backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
//     },
//     title: { fontSize: 22, fontWeight: '800', color: C.text },

//     tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
//     tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: C.surfaceAlt },
//     tabText: { fontSize: 13, fontWeight: '700', color: C.textSub, textTransform: 'capitalize' },

//     card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, ...shadow },
//     cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
//     cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//     empAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
//     empAvatarText: { color: C.primary, fontWeight: '800', fontSize: 16 },
//     empName: { fontSize: 15, fontWeight: '700', color: C.text },
//     empRole: { fontSize: 12, color: C.textSub, textTransform: 'capitalize' },
//     statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//     statusPillText: { fontSize: 12, fontWeight: '700' },
//     cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
//     typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
//     typePillText: { fontSize: 11, fontWeight: '700' },
//     dates: { fontSize: 12, color: C.textSub },
//     dayCount: { fontSize: 12, color: C.textMuted, marginLeft: 'auto' },
//     reason: { fontSize: 12, color: C.textMuted, marginTop: 8, fontStyle: 'italic' },
//     empty: { color: C.textMuted, textAlign: 'center', marginTop: 60, fontSize: 15 },

//     modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
//     modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '88%' },
//     sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
//     modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//     modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
//     closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
//     closeText: { fontSize: 14, color: C.textSub },

//     infoBox: { backgroundColor: C.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 16 },
//     infoName: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
//     infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
//     infoKey: { fontSize: 13, color: C.textSub },
//     infoVal: { fontSize: 13, fontWeight: '600', color: C.text },
//     infoReason: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginTop: 8 },

//     fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSub, marginBottom: 10 },
//     decisionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
//     decisionBtn: { flex: 1, padding: 13, borderRadius: 12, alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border },
//     decisionText: { fontSize: 14, fontWeight: '700', color: C.textSub },

//     remarksInput: { borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt, textAlignVertical: 'top', marginBottom: 16 },
//     submitBtn: { backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
//     submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
// });



import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, Alert, StatusBar
} from 'react-native';
import { api } from '../../services/api';
import { C } from '../../theme';

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

const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

// ── Action Modal ──────────────────────────────────────────────
const ActionModal = ({ visible, leave, onClose, onDone }) => {
    const [action, setAction] = useState('approved');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (action === 'rejected' && !remarks.trim()) {
            Alert.alert('Error', 'Rejection reason required');
            return;
        }
        setLoading(true);
        try {
            const hrRecordId = leave.hrRecordId || leave.hrRecord?._id || leave.hrRecord;
            console.log('Action:', action, 'hrRecordId:', hrRecordId, 'leaveId:', leave._id);
            const data = await api.hrLeaveAction(hrRecordId, leave._id, action, remarks);
            console.log('hrLeaveAction response:', JSON.stringify(data));
            if (data.message || data.leave) {
                onDone();
            } else {
                Alert.alert('Error', data.error || 'Something went wrong');
            }
        } catch (e) {
            console.log('ActionModal error:', e);
            Alert.alert('Error', 'Server error. Try again.');
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
                            <Text style={modalStyles.title}>Review Leave</Text>
                            <Text style={modalStyles.subtitle}>Approve or reject this request</Text>
                        </View>
                        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
                            <Text style={modalStyles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {leave && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Employee Info */}
                            <View style={modalStyles.empBox}>
                                <View style={modalStyles.avatar}>
                                    <Text style={modalStyles.avatarText}>
                                        {(leave.employee?.name || leave.employeeName || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={modalStyles.empName}>
                                        {leave.employee?.name || leave.employeeName || 'Employee'}
                                    </Text>
                                    <Text style={modalStyles.empRole}>
                                        {leave.employee?.role?.replace('_', ' ') || leave.employeeRole || ''}
                                    </Text>
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
                                        <Text style={[modalStyles.typeBadgeText, {
                                            color: LEAVE_TYPE_COLORS[leave.leaveType]?.color
                                        }]}>
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
                                    <Text style={modalStyles.detailValue}>
                                        {fmt(leave.fromDate)} → {fmt(leave.toDate)}
                                    </Text>
                                </View>
                                {leave.reason ? (
                                    <>
                                        <View style={modalStyles.divider} />
                                        <View style={modalStyles.detailRow}>
                                            <Text style={modalStyles.detailLabel}>Reason</Text>
                                            <Text style={[modalStyles.detailValue, { flex: 1, marginLeft: 8, textAlign: 'right' }]}>
                                                {leave.reason}
                                            </Text>
                                        </View>
                                    </>
                                ) : null}
                            </View>

                            {/* Decision */}
                            <Text style={modalStyles.label}>Decision</Text>
                            <View style={modalStyles.decisionRow}>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'approved' && modalStyles.approveActive]}
                                    onPress={() => setAction('approved')}
                                >
                                    <Text style={modalStyles.decisionIcon}>✅</Text>
                                    <Text style={[modalStyles.decisionText, action === 'approved' && { color: '#15803d', fontWeight: '700' }]}>
                                        Approve
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[modalStyles.decisionBtn, action === 'rejected' && modalStyles.rejectActive]}
                                    onPress={() => setAction('rejected')}
                                >
                                    <Text style={modalStyles.decisionIcon}>❌</Text>
                                    <Text style={[modalStyles.decisionText, action === 'rejected' && { color: '#b91c1c', fontWeight: '700' }]}>
                                        Reject
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={modalStyles.label}>
                                {action === 'rejected' ? 'Rejection Reason *' : 'Remarks (Optional)'}
                            </Text>
                            <TextInput
                                style={modalStyles.textarea}
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder={action === 'rejected' ? 'Reason likhو...' : 'Note add karo...'}
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

// ── Main Screen ───────────────────────────────────────────────
export default function AdminLeavesScreen() {
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
            // HR route use kar rahe hain — admin ke paas bhi access hai
            const data = await api.getHrLeaves({ status: filterStatus });
            console.log('Admin(HR) leaves response:', JSON.stringify(data));
            setLeaves(data.leaves || []);
        } catch (e) {
            console.log('fetchLeaves error:', e);
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
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Leave Management</Text>
                <Text style={styles.headerSubtitle}>Review and manage employee leaves</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                >
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, filterStatus === tab && styles.tabActive]}
                            onPress={() => setFilterStatus(tab)}
                        >
                            {tab !== '' && (
                                <View style={[styles.tabDot, {
                                    backgroundColor: filterStatus === tab ? '#ffffff' : TAB_DOTS[tab]
                                }]} />
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
                    <Text style={styles.emptyIcon}>📋</Text>
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
                                        <Text style={styles.avatarText}>
                                            {(leave.employee?.name || leave.employeeName || '?').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.empInfo}>
                                        <Text style={styles.empName}>
                                            {leave.employee?.name || leave.employeeName || 'Employee'}
                                        </Text>
                                        <Text style={styles.empRole}>
                                            {leave.employee?.role?.replace('_', ' ') || leave.employeeRole || ''}
                                        </Text>
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

                                <View style={styles.divider} />

                                {/* Leave Info Grid */}
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>TYPE</Text>
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
                                        <Text style={styles.infoLabel}>DURATION</Text>
                                        <Text style={styles.infoValue}>{leave.days} day(s)</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>PERIOD</Text>
                                        <Text style={styles.infoValue}>{fmt(leave.fromDate)}</Text>
                                        <Text style={styles.infoDash}>→ {fmt(leave.toDate)}</Text>
                                    </View>
                                </View>

                                {leave.reason ? (
                                    <View style={styles.reasonBox}>
                                        <Text style={styles.reasonLabel}>Reason</Text>
                                        <Text style={styles.reasonText} numberOfLines={2}>{leave.reason}</Text>
                                    </View>
                                ) : null}

                                {/* Review Button — only for pending */}
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

    tabsWrapper: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 10,
    },
    tabs: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 7,
        borderRadius: 20, backgroundColor: '#f3f4f6',
        borderWidth: 1, borderColor: '#e5e7eb',
    },
    tabActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    tabDot: { width: 6, height: 6, borderRadius: 3 },
    tabText: { color: '#374151', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#ffffff' },

    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
    emptyText: { color: '#9ca3af', fontSize: 13, marginTop: 4 },

    list: { padding: 16, gap: 12 },

    card: {
        backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
        marginRight: 12, borderWidth: 2, borderColor: '#c7d2fe',
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

    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
    infoItem: { flex: 1 },
    infoLabel: {
        color: '#9ca3af', fontSize: 10, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
    },
    infoValue: { color: '#374151', fontSize: 12, fontWeight: '600' },
    infoDash: { color: '#6b7280', fontSize: 11, marginTop: 2 },
    typeBadge: {
        alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    typeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    reasonBox: {
        backgroundColor: '#f8fafc', borderRadius: 10, padding: 10,
        marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb',
        borderLeftWidth: 3, borderLeftColor: '#c7d2fe',
    },
    reasonLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
    reasonText: { color: '#374151', fontSize: 13, lineHeight: 18 },

    reviewBtn: {
        backgroundColor: '#4f46e5', borderRadius: 12,
        paddingVertical: 11, alignItems: 'center', marginTop: 4,
    },
    reviewBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

    approvedByRow: {
        backgroundColor: '#f8fafc', borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7,
        marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb',
    },
    approvedByText: { color: '#6b7280', fontSize: 12 },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
    container: {
        backgroundColor: '#ffffff', borderRadius: 24, padding: 20,
        maxHeight: '88%', borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
    },
    close: { color: '#374151', fontSize: 14, fontWeight: '600' },

    empBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
        marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb',
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#c7d2fe',
    },
    avatarText: { color: '#4f46e5', fontWeight: '700', fontSize: 17 },
    empName: { color: '#111827', fontWeight: '700', fontSize: 14 },
    empRole: { color: '#6b7280', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },

    detailBox: {
        backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
        marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb',
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 6,
    },
    divider: { height: 1, backgroundColor: '#e5e7eb' },
    detailLabel: { color: '#6b7280', fontSize: 13 },
    detailValue: { color: '#111827', fontSize: 13, fontWeight: '600' },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    typeBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 4 },

    decisionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    decisionBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: 6,
        backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e5e7eb',
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
        backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14,
        alignItems: 'center', shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
        shadowRadius: 8, elevation: 6,
    },
    submitBtnReject: { backgroundColor: '#dc2626', shadowColor: '#dc2626' },
    submitText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});