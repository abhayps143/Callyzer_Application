// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     View, Text, ScrollView, StyleSheet, TouchableOpacity,
//     ActivityIndicator, Modal, TextInput, RefreshControl, Alert
// } from 'react-native';
// import { api } from '../../services/api';

// const ROLE_COLORS = {
//     agent: { bg: '#22c55e20', color: '#22c55e' },
//     team_leader: { bg: '#06b6d420', color: '#06b6d4' },
//     manager: { bg: '#6366f120', color: '#6366f1' },
// };

// // ── HR Record Edit Modal ───────────────────────────────────────
// const EditHrModal = ({ visible, employee, onClose, onSaved }) => {
//     const hr = employee?.hrRecord;
//     const [form, setForm] = useState({
//         department: '', designation: '', joiningDate: '',
//         employmentType: 'full_time',
//         salary: { basic: '0', hra: '0', allowance: '0', deduction: '0' },
//         leaveBalance: { sick: '12', casual: '12', earned: '15' },
//         emergencyContact: { name: '', relation: '', phone: '' },
//         notes: '',
//     });
//     const [saving, setSaving] = useState(false);

//     useEffect(() => {
//         if (hr) {
//             setForm({
//                 department: hr.department || '',
//                 designation: hr.designation || '',
//                 joiningDate: hr.joiningDate ? hr.joiningDate.slice(0, 10) : '',
//                 employmentType: hr.employmentType || 'full_time',
//                 salary: {
//                     basic: String(hr.salary?.basic || 0),
//                     hra: String(hr.salary?.hra || 0),
//                     allowance: String(hr.salary?.allowance || 0),
//                     deduction: String(hr.salary?.deduction || 0),
//                 },
//                 leaveBalance: {
//                     sick: String(hr.leaveBalance?.sick ?? 12),
//                     casual: String(hr.leaveBalance?.casual ?? 12),
//                     earned: String(hr.leaveBalance?.earned ?? 15),
//                 },
//                 emergencyContact: {
//                     name: hr.emergencyContact?.name || '',
//                     relation: hr.emergencyContact?.relation || '',
//                     phone: hr.emergencyContact?.phone || '',
//                 },
//                 notes: hr.notes || '',
//             });
//         }
//     }, [employee]);

//     const totalSalary =
//         (parseInt(form.salary.basic) || 0) +
//         (parseInt(form.salary.hra) || 0) +
//         (parseInt(form.salary.allowance) || 0) -
//         (parseInt(form.salary.deduction) || 0);

//     const handleSave = async () => {
//         setSaving(true);
//         try {
//             const payload = {
//                 ...form,
//                 salary: {
//                     basic: parseInt(form.salary.basic) || 0,
//                     hra: parseInt(form.salary.hra) || 0,
//                     allowance: parseInt(form.salary.allowance) || 0,
//                     deduction: parseInt(form.salary.deduction) || 0,
//                 },
//                 leaveBalance: {
//                     sick: parseInt(form.leaveBalance.sick) || 0,
//                     casual: parseInt(form.leaveBalance.casual) || 0,
//                     earned: parseInt(form.leaveBalance.earned) || 0,
//                 },
//             };
//             await api.updateHrRecord(employee._id, payload);
//             onSaved();
//         } catch {
//             Alert.alert('Error', 'Save nahi hua. Dobara try karo.');
//         } finally {
//             setSaving(false);
//         }
//     };

//     const Field = ({ label, value, onChange, keyboardType = 'default' }) => (
//         <View style={editStyles.fieldWrap}>
//             <Text style={editStyles.fieldLabel}>{label}</Text>
//             <TextInput
//                 style={editStyles.input}
//                 value={value}
//                 onChangeText={onChange}
//                 placeholderTextColor="#475569"
//                 keyboardType={keyboardType}
//             />
//         </View>
//     );

//     return (
//         <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//             <View style={editStyles.overlay}>
//                 <View style={editStyles.container}>
//                     <View style={editStyles.header}>
//                         <Text style={editStyles.title}>Edit HR Record</Text>
//                         <TouchableOpacity onPress={onClose}>
//                             <Text style={editStyles.close}>✕</Text>
//                         </TouchableOpacity>
//                     </View>

//                     <ScrollView showsVerticalScrollIndicator={false}>
//                         {/* Employee Info */}
//                         {employee && (
//                             <View style={editStyles.empBox}>
//                                 <View style={editStyles.avatar}>
//                                     <Text style={editStyles.avatarText}>{employee.name?.charAt(0).toUpperCase()}</Text>
//                                 </View>
//                                 <View>
//                                     <Text style={editStyles.empName}>{employee.name}</Text>
//                                     <Text style={editStyles.empEmail}>{employee.email}</Text>
//                                 </View>
//                             </View>
//                         )}

//                         <Text style={editStyles.sectionTitle}>Employment Details</Text>
//                         <View style={editStyles.row}>
//                             <View style={editStyles.half}>
//                                 <Field label="Department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} />
//                             </View>
//                             <View style={editStyles.half}>
//                                 <Field label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} />
//                             </View>
//                         </View>

//                         <Text style={editStyles.sectionTitle}>Salary (₹/month) — Total: ₹{totalSalary.toLocaleString()}</Text>
//                         <View style={editStyles.row}>
//                             {['basic', 'hra', 'allowance', 'deduction'].map(key => (
//                                 <View key={key} style={editStyles.half}>
//                                     <Field
//                                         label={key.charAt(0).toUpperCase() + key.slice(1)}
//                                         value={form.salary[key]}
//                                         onChange={v => setForm(f => ({ ...f, salary: { ...f.salary, [key]: v } }))}
//                                         keyboardType="numeric"
//                                     />
//                                 </View>
//                             ))}
//                         </View>

//                         <Text style={editStyles.sectionTitle}>Leave Balance (days)</Text>
//                         <View style={editStyles.row}>
//                             {['sick', 'casual', 'earned'].map(key => (
//                                 <View key={key} style={editStyles.third}>
//                                     <Field
//                                         label={key.charAt(0).toUpperCase() + key.slice(1)}
//                                         value={form.leaveBalance[key]}
//                                         onChange={v => setForm(f => ({ ...f, leaveBalance: { ...f.leaveBalance, [key]: v } }))}
//                                         keyboardType="numeric"
//                                     />
//                                 </View>
//                             ))}
//                         </View>

//                         <Text style={editStyles.sectionTitle}>Emergency Contact</Text>
//                         <View style={editStyles.row}>
//                             {['name', 'relation', 'phone'].map(key => (
//                                 <View key={key} style={editStyles.third}>
//                                     <Field
//                                         label={key.charAt(0).toUpperCase() + key.slice(1)}
//                                         value={form.emergencyContact[key]}
//                                         onChange={v => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [key]: v } }))}
//                                     />
//                                 </View>
//                             ))}
//                         </View>

//                         <Text style={editStyles.fieldLabel}>Notes</Text>
//                         <TextInput
//                             style={[editStyles.input, { minHeight: 70, textAlignVertical: 'top', marginBottom: 16 }]}
//                             value={form.notes}
//                             onChangeText={v => setForm(f => ({ ...f, notes: v }))}
//                             placeholder="Additional notes..."
//                             placeholderTextColor="#475569"
//                             multiline
//                         />

//                         <TouchableOpacity
//                             style={[editStyles.saveBtn, saving && { opacity: 0.6 }]}
//                             onPress={handleSave}
//                             disabled={saving}
//                         >
//                             {saving
//                                 ? <ActivityIndicator color="#0f172a" />
//                                 : <Text style={editStyles.saveBtnText}>Save HR Record</Text>
//                             }
//                         </TouchableOpacity>
//                         <View style={{ height: 24 }} />
//                     </ScrollView>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// // ── Main Component ─────────────────────────────────────────────
// export default function HrEmployeesScreen() {
//     const [employees, setEmployees] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [search, setSearch] = useState('');
//     const [filterRole, setFilterRole] = useState('');
//     const [page, setPage] = useState(1);
//     const [pagination, setPagination] = useState({ total: 0, pages: 1 });
//     const [editEmployee, setEditEmployee] = useState(null);

//     const fetchEmployees = useCallback(async () => {
//         try {
//             const data = await api.getHrEmployees({ search, role: filterRole, page });
//             setEmployees(data.employees || []);
//             setPagination(data.pagination || { total: 0, pages: 1 });
//         } catch {
//             Alert.alert('Error', 'Employees load nahi hue');
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     }, [search, filterRole, page]);

//     useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

//     const onRefresh = () => { setRefreshing(true); setPage(1); fetchEmployees(); };

//     const handleSaved = () => {
//         setEditEmployee(null);
//         fetchEmployees();
//     };

//     return (
//         <View style={styles.container}>
//             {/* Search */}
//             <View style={styles.searchBar}>
//                 <TextInput
//                     style={styles.searchInput}
//                     value={search}
//                     onChangeText={v => { setSearch(v); setPage(1); }}
//                     placeholder="🔍 Search name / email..."
//                     placeholderTextColor="#475569"
//                 />
//             </View>

//             {/* Role Filter */}
//             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
//                 {['', 'agent', 'team_leader', 'manager'].map(role => (
//                     <TouchableOpacity
//                         key={role}
//                         style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
//                         onPress={() => { setFilterRole(role); setPage(1); }}
//                     >
//                         <Text style={[styles.filterText, filterRole === role && styles.filterTextActive]}>
//                             {role === '' ? 'All Roles' : role.replace('_', ' ')}
//                         </Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>

//             <Text style={styles.countText}>Total: {pagination.total} employees</Text>

//             {loading ? (
//                 <View style={styles.center}>
//                     <ActivityIndicator size="large" color="#eab308" />
//                 </View>
//             ) : employees.length === 0 ? (
//                 <View style={styles.center}>
//                     <Text style={styles.emptyIcon}>🔍</Text>
//                     <Text style={styles.emptyText}>Koi employee nahi mila</Text>
//                 </View>
//             ) : (
//                 <ScrollView
//                     contentContainerStyle={styles.list}
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />}
//                 >
//                     {employees.map((emp) => {
//                         const hr = emp.hrRecord;
//                         const total = hr
//                             ? (hr.salary?.basic || 0) + (hr.salary?.hra || 0) +
//                             (hr.salary?.allowance || 0) - (hr.salary?.deduction || 0)
//                             : 0;

//                         return (
//                             <View key={emp._id} style={styles.card}>
//                                 <View style={styles.cardTop}>
//                                     <View style={styles.avatar}>
//                                         <Text style={styles.avatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
//                                     </View>
//                                     <View style={styles.empInfo}>
//                                         <Text style={styles.empName}>{emp.name}</Text>
//                                         <Text style={styles.empEmail}>{emp.email}</Text>
//                                     </View>
//                                     <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[emp.role]?.bg }]}>
//                                         <Text style={[styles.roleText, { color: ROLE_COLORS[emp.role]?.color }]}>
//                                             {emp.role?.replace('_', ' ')}
//                                         </Text>
//                                     </View>
//                                 </View>

//                                 <View style={styles.detailRow}>
//                                     <Text style={styles.detailItem}>🏢 {hr?.department || '—'}</Text>
//                                     <Text style={styles.detailItem}>👤 {hr?.designation || '—'}</Text>
//                                     <Text style={styles.detailItem}>💰 {total > 0 ? `₹${total.toLocaleString()}` : '—'}</Text>
//                                 </View>

//                                 <View style={styles.cardFooter}>
//                                     <View style={[styles.statusBadge, { backgroundColor: emp.isActive ? '#22c55e20' : '#ef444420' }]}>
//                                         <Text style={[styles.statusText, { color: emp.isActive ? '#22c55e' : '#ef4444' }]}>
//                                             {emp.isActive ? 'Active' : 'Inactive'}
//                                         </Text>
//                                     </View>
//                                     <TouchableOpacity
//                                         style={styles.editBtn}
//                                         onPress={() => setEditEmployee(emp)}
//                                     >
//                                         <Text style={styles.editBtnText}>Edit HR Record</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>
//                         );
//                     })}

//                     {/* Pagination */}
//                     {pagination.pages > 1 && (
//                         <View style={styles.pagination}>
//                             <TouchableOpacity
//                                 style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
//                                 onPress={() => setPage(p => Math.max(1, p - 1))}
//                                 disabled={page === 1}
//                             >
//                                 <Text style={styles.pageBtnText}>← Prev</Text>
//                             </TouchableOpacity>
//                             <Text style={styles.pageInfo}>Page {page} / {pagination.pages}</Text>
//                             <TouchableOpacity
//                                 style={[styles.pageBtn, page === pagination.pages && styles.pageBtnDisabled]}
//                                 onPress={() => setPage(p => Math.min(pagination.pages, p + 1))}
//                                 disabled={page === pagination.pages}
//                             >
//                                 <Text style={styles.pageBtnText}>Next →</Text>
//                             </TouchableOpacity>
//                         </View>
//                     )}
//                 </ScrollView>
//             )}

//             <EditHrModal
//                 visible={!!editEmployee}
//                 employee={editEmployee}
//                 onClose={() => setEditEmployee(null)}
//                 onSaved={handleSaved}
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     emptyIcon: { fontSize: 48, marginBottom: 12 },
//     emptyText: { color: '#475569', fontSize: 14 },
//     countText: { color: '#475569', fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },

//     searchBar: { padding: 12, paddingBottom: 6 },
//     searchInput: {
//         backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 12,
//         paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
//         borderWidth: 1, borderColor: '#334155',
//     },
//     filterBar: { maxHeight: 50, paddingBottom: 6 },
//     filterContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
//     filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
//     filterChipActive: { backgroundColor: '#eab308', borderColor: '#eab308' },
//     filterText: { color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
//     filterTextActive: { color: '#0f172a' },

//     list: { padding: 12, gap: 10 },
//     card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
//     cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
//     avatar: {
//         width: 40, height: 40, borderRadius: 20,
//         backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center', marginRight: 10,
//     },
//     avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
//     empInfo: { flex: 1 },
//     empName: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
//     empEmail: { color: '#64748b', fontSize: 11, marginTop: 2 },
//     roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//     roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

//     detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
//     detailItem: { color: '#94a3b8', fontSize: 12 },

//     cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//     statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//     statusText: { fontSize: 11, fontWeight: '600' },
//     editBtn: { backgroundColor: '#eab30820', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
//     editBtnText: { color: '#eab308', fontSize: 12, fontWeight: '700' },

//     pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 8 },
//     pageBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
//     pageBtnDisabled: { opacity: 0.4 },
//     pageBtnText: { color: '#94a3b8', fontSize: 13 },
//     pageInfo: { color: '#64748b', fontSize: 13 },
// });

// const editStyles = StyleSheet.create({
//     overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
//     container: {
//         backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
//         padding: 20, maxHeight: '90%',
//     },
//     header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
//     title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
//     close: { color: '#64748b', fontSize: 18, padding: 4 },

//     empBox: {
//         flexDirection: 'row', alignItems: 'center', gap: 10,
//         backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginBottom: 16,
//     },
//     avatar: {
//         width: 42, height: 42, borderRadius: 21,
//         backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center',
//     },
//     avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
//     empName: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
//     empEmail: { color: '#64748b', fontSize: 12 },

//     sectionTitle: { color: '#eab308', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
//     row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
//     half: { flex: 1, minWidth: '45%' },
//     third: { flex: 1, minWidth: '30%' },

//     fieldWrap: { marginBottom: 8 },
//     fieldLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4, fontWeight: '500' },
//     input: {
//         backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 10,
//         paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
//         borderWidth: 1, borderColor: '#334155',
//     },

//     saveBtn: { backgroundColor: '#eab308', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
//     saveBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
// });

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, Alert
} from 'react-native';
import { api } from '../../services/api';

const ROLE_COLORS = {
    agent: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    team_leader: { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
    manager: { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
};

// ── HR Record Edit Modal ───────────────────────────────────────
const EditHrModal = ({ visible, employee, onClose, onSaved }) => {
    const hr = employee?.hrRecord;
    const [form, setForm] = useState({
        department: '', designation: '', joiningDate: '',
        employmentType: 'full_time',
        salary: { basic: '0', hra: '0', allowance: '0', deduction: '0' },
        leaveBalance: { sick: '12', casual: '12', earned: '15' },
        emergencyContact: { name: '', relation: '', phone: '' },
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (hr) {
            setForm({
                department: hr.department || '',
                designation: hr.designation || '',
                joiningDate: hr.joiningDate ? hr.joiningDate.slice(0, 10) : '',
                employmentType: hr.employmentType || 'full_time',
                salary: {
                    basic: String(hr.salary?.basic || 0),
                    hra: String(hr.salary?.hra || 0),
                    allowance: String(hr.salary?.allowance || 0),
                    deduction: String(hr.salary?.deduction || 0),
                },
                leaveBalance: {
                    sick: String(hr.leaveBalance?.sick ?? 12),
                    casual: String(hr.leaveBalance?.casual ?? 12),
                    earned: String(hr.leaveBalance?.earned ?? 15),
                },
                emergencyContact: {
                    name: hr.emergencyContact?.name || '',
                    relation: hr.emergencyContact?.relation || '',
                    phone: hr.emergencyContact?.phone || '',
                },
                notes: hr.notes || '',
            });
        }
    }, [employee]);

    const totalSalary =
        (parseInt(form.salary.basic) || 0) +
        (parseInt(form.salary.hra) || 0) +
        (parseInt(form.salary.allowance) || 0) -
        (parseInt(form.salary.deduction) || 0);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                salary: {
                    basic: parseInt(form.salary.basic) || 0,
                    hra: parseInt(form.salary.hra) || 0,
                    allowance: parseInt(form.salary.allowance) || 0,
                    deduction: parseInt(form.salary.deduction) || 0,
                },
                leaveBalance: {
                    sick: parseInt(form.leaveBalance.sick) || 0,
                    casual: parseInt(form.leaveBalance.casual) || 0,
                    earned: parseInt(form.leaveBalance.earned) || 0,
                },
            };
            await api.updateHrRecord(employee._id, payload);
            onSaved();
        } catch {
            Alert.alert('Error', 'Save nahi hua. Dobara try karo.');
        } finally {
            setSaving(false);
        }
    };

    const Field = ({ label, value, onChange, keyboardType = 'default' }) => (
        <View style={editStyles.fieldWrap}>
            <Text style={editStyles.fieldLabel}>{label}</Text>
            <TextInput
                style={editStyles.input}
                value={value}
                onChangeText={onChange}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboardType}
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={editStyles.overlay}>
                <View style={editStyles.container}>
                    <View style={editStyles.handleBar} />
                    <View style={editStyles.header}>
                        <View>
                            <Text style={editStyles.title}>Edit HR Record</Text>
                            <Text style={editStyles.subtitle}>Update employee HR information</Text>
                        </View>
                        <TouchableOpacity style={editStyles.closeBtn} onPress={onClose}>
                            <Text style={editStyles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Employee Info */}
                        {employee && (
                            <View style={editStyles.empBox}>
                                <View style={editStyles.avatar}>
                                    <Text style={editStyles.avatarText}>{employee.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={editStyles.empName}>{employee.name}</Text>
                                    <Text style={editStyles.empEmail}>{employee.email}</Text>
                                </View>
                            </View>
                        )}

                        {/* Section */}
                        <View style={editStyles.section}>
                            <View style={editStyles.sectionHeader}>
                                <View style={editStyles.sectionDot} />
                                <Text style={editStyles.sectionTitle}>Employment Details</Text>
                            </View>
                            <View style={editStyles.row}>
                                <View style={editStyles.half}>
                                    <Field label="Department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} />
                                </View>
                                <View style={editStyles.half}>
                                    <Field label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} />
                                </View>
                            </View>
                        </View>

                        {/* Salary */}
                        <View style={editStyles.section}>
                            <View style={editStyles.sectionHeader}>
                                <View style={[editStyles.sectionDot, { backgroundColor: '#16a34a' }]} />
                                <Text style={editStyles.sectionTitle}>Salary (₹/month)</Text>
                                <View style={editStyles.totalPill}>
                                    <Text style={editStyles.totalPillText}>Total: ₹{totalSalary.toLocaleString()}</Text>
                                </View>
                            </View>
                            <View style={editStyles.row}>
                                {['basic', 'hra', 'allowance', 'deduction'].map(key => (
                                    <View key={key} style={editStyles.half}>
                                        <Field
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                            value={form.salary[key]}
                                            onChange={v => setForm(f => ({ ...f, salary: { ...f.salary, [key]: v } }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Leave Balance */}
                        <View style={editStyles.section}>
                            <View style={editStyles.sectionHeader}>
                                <View style={[editStyles.sectionDot, { backgroundColor: '#d97706' }]} />
                                <Text style={editStyles.sectionTitle}>Leave Balance (days)</Text>
                            </View>
                            <View style={editStyles.row}>
                                {['sick', 'casual', 'earned'].map(key => (
                                    <View key={key} style={editStyles.third}>
                                        <Field
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                            value={form.leaveBalance[key]}
                                            onChange={v => setForm(f => ({ ...f, leaveBalance: { ...f.leaveBalance, [key]: v } }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Emergency Contact */}
                        <View style={editStyles.section}>
                            <View style={editStyles.sectionHeader}>
                                <View style={[editStyles.sectionDot, { backgroundColor: '#dc2626' }]} />
                                <Text style={editStyles.sectionTitle}>Emergency Contact</Text>
                            </View>
                            <View style={editStyles.row}>
                                {['name', 'relation', 'phone'].map(key => (
                                    <View key={key} style={editStyles.third}>
                                        <Field
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                            value={form.emergencyContact[key]}
                                            onChange={v => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [key]: v } }))}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Notes */}
                        <View style={editStyles.section}>
                            <Text style={editStyles.fieldLabel}>Additional Notes</Text>
                            <TextInput
                                style={[editStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                                value={form.notes}
                                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                                placeholder="Add any additional notes..."
                                placeholderTextColor="#9ca3af"
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={[editStyles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#ffffff" />
                                : <Text style={editStyles.saveBtnText}>Save HR Record</Text>
                            }
                        </TouchableOpacity>
                        <View style={{ height: 32 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ── Main Component ─────────────────────────────────────────────
export default function HrEmployeesScreen() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [editEmployee, setEditEmployee] = useState(null);

    const fetchEmployees = useCallback(async () => {
        try {
            const data = await api.getHrEmployees({ search, role: filterRole, page });
            setEmployees(data.employees || []);
            setPagination(data.pagination || { total: 0, pages: 1 });
        } catch {
            Alert.alert('Error', 'Employees load nahi hue');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, filterRole, page]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const onRefresh = () => { setRefreshing(true); setPage(1); fetchEmployees(); };

    const handleSaved = () => {
        setEditEmployee(null);
        fetchEmployees();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>HR Employees</Text>
                    <Text style={styles.headerSubtitle}>{pagination.total} total employees</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <View style={styles.searchIconWrap}>
                    <Text style={styles.searchIcon}>🔍</Text>
                </View>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={v => { setSearch(v); setPage(1); }}
                    placeholder="Search by name or email..."
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Role Filter - FIXED HEIGHT */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterBar}
                    contentContainerStyle={styles.filterContent}
                >
                    {['', 'agent', 'team_leader', 'manager'].map(role => (
                        <TouchableOpacity
                            key={role}
                            style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
                            onPress={() => { setFilterRole(role); setPage(1); }}
                        >
                            <Text style={[styles.filterText, filterRole === role && styles.filterTextActive]}>
                                {role === '' ? 'All Roles' : role.replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={styles.loadingText}>Loading employees...</Text>
                </View>
            ) : employees.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconWrap}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No employees found</Text>
                    <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
                >
                    {employees.map((emp) => {
                        const hr = emp.hrRecord;
                        const total = hr
                            ? (hr.salary?.basic || 0) + (hr.salary?.hra || 0) +
                            (hr.salary?.allowance || 0) - (hr.salary?.deduction || 0)
                            : 0;
                        const roleStyle = ROLE_COLORS[emp.role] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };

                        return (
                            <View key={emp._id} style={styles.card}>
                                {/* Card Top */}
                                <View style={styles.cardTop}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.empInfo}>
                                        <Text style={styles.empName}>{emp.name}</Text>
                                        <Text style={styles.empEmail}>{emp.email}</Text>
                                    </View>
                                    <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
                                        <Text style={[styles.roleText, { color: roleStyle.color }]}>
                                            {emp.role?.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Details Row */}
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailIcon}>🏢</Text>
                                        <View>
                                            <Text style={styles.detailLabel}>Department</Text>
                                            <Text style={styles.detailValue}>{hr?.department || '—'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailIcon}>👤</Text>
                                        <View>
                                            <Text style={styles.detailLabel}>Designation</Text>
                                            <Text style={styles.detailValue}>{hr?.designation || '—'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailIcon}>💰</Text>
                                        <View>
                                            <Text style={styles.detailLabel}>Monthly CTC</Text>
                                            <Text style={[styles.detailValue, { color: '#16a34a', fontWeight: '700' }]}>
                                                {total > 0 ? `₹${total.toLocaleString()}` : '—'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Card Footer */}
                                <View style={styles.cardFooter}>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: emp.isActive ? '#dcfce7' : '#fee2e2', borderColor: emp.isActive ? '#86efac' : '#fca5a5' }
                                    ]}>
                                        <View style={[styles.statusDot, { backgroundColor: emp.isActive ? '#16a34a' : '#dc2626' }]} />
                                        <Text style={[styles.statusText, { color: emp.isActive ? '#15803d' : '#b91c1c' }]}>
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() => setEditEmployee(emp)}
                                    >
                                        <Text style={styles.editBtnText}>Edit HR Record</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <View style={styles.pagination}>
                            <TouchableOpacity
                                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                                onPress={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <Text style={styles.pageBtnText}>← Prev</Text>
                            </TouchableOpacity>
                            <View style={styles.pageInfo}>
                                <Text style={styles.pageInfoText}>{page} / {pagination.pages}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.pageBtn, page === pagination.pages && styles.pageBtnDisabled]}
                                onPress={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                            >
                                <Text style={styles.pageBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={{ height: 24 }} />
                </ScrollView>
            )}

            <EditHrModal
                visible={!!editEmployee}
                employee={editEmployee}
                onClose={() => setEditEmployee(null)}
                onSaved={handleSaved}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 14,
        paddingVertical: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIconWrap: { marginRight: 8 },
    searchIcon: { fontSize: 16 },
    searchInput: {
        flex: 1,
        color: '#111827',
        fontSize: 14,
        paddingVertical: 10,
    },

    // Filters - FIXED HEIGHT SECTION
    filterWrapper: {
        height: 60, // Fixed height for the filter container
        marginVertical: 8,
    },
    filterBar: {
        flexGrow: 0, // Prevents ScrollView from expanding
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
        height: 44, // Fixed height for the content
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    filterChipActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    filterText: { color: '#374151', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    filterTextActive: { color: '#ffffff' },

    // Empty state
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
    emptyText: { color: '#9ca3af', fontSize: 13, marginTop: 4 },

    // List & Cards
    list: { padding: 16, gap: 12 },
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
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#c7d2fe',
    },
    avatarText: { color: '#4f46e5', fontWeight: '700', fontSize: 18 },
    empInfo: { flex: 1 },
    empName: { color: '#111827', fontSize: 15, fontWeight: '700' },
    empEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 14 },

    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 4 },
    detailItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    detailIcon: { fontSize: 14, marginTop: 1 },
    detailLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    detailValue: { color: '#374151', fontSize: 13, fontWeight: '600', marginTop: 2 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: '600' },
    editBtn: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    editBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    pageBtn: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    pageBtnDisabled: { opacity: 0.35 },
    pageBtnText: { color: '#374151', fontSize: 13, fontWeight: '600' },
    pageInfo: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 10,
    },
    pageInfoText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
});

const editStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    container: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        maxHeight: '92%',
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#d1d5db',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    close: { color: '#374151', fontSize: 14, fontWeight: '600' },

    empBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#c7d2fe',
    },
    avatarText: { color: '#4f46e5', fontWeight: '700', fontSize: 18 },
    empName: { color: '#111827', fontWeight: '700', fontSize: 15 },
    empEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },

    // Section
    section: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4f46e5',
    },
    sectionTitle: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        flex: 1,
    },
    totalPill: {
        backgroundColor: '#dcfce7',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#86efac',
    },
    totalPillText: { color: '#15803d', fontSize: 12, fontWeight: '700' },

    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    half: { flex: 1, minWidth: '45%' },
    third: { flex: 1, minWidth: '30%' },

    fieldWrap: { marginBottom: 8 },
    fieldLabel: {
        color: '#6b7280',
        fontSize: 12,
        marginBottom: 5,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#ffffff',
        color: '#111827',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },

    saveBtn: {
        backgroundColor: '#4f46e5',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});