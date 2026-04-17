import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, RefreshControl, Alert
} from 'react-native';
import { api } from '../../services/api';

const ROLE_COLORS = {
    agent: { bg: '#22c55e20', color: '#22c55e' },
    team_leader: { bg: '#06b6d420', color: '#06b6d4' },
    manager: { bg: '#6366f120', color: '#6366f1' },
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
                placeholderTextColor="#475569"
                keyboardType={keyboardType}
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={editStyles.overlay}>
                <View style={editStyles.container}>
                    <View style={editStyles.header}>
                        <Text style={editStyles.title}>Edit HR Record</Text>
                        <TouchableOpacity onPress={onClose}>
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
                                <View>
                                    <Text style={editStyles.empName}>{employee.name}</Text>
                                    <Text style={editStyles.empEmail}>{employee.email}</Text>
                                </View>
                            </View>
                        )}

                        <Text style={editStyles.sectionTitle}>Employment Details</Text>
                        <View style={editStyles.row}>
                            <View style={editStyles.half}>
                                <Field label="Department" value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} />
                            </View>
                            <View style={editStyles.half}>
                                <Field label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} />
                            </View>
                        </View>

                        <Text style={editStyles.sectionTitle}>Salary (₹/month) — Total: ₹{totalSalary.toLocaleString()}</Text>
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

                        <Text style={editStyles.sectionTitle}>Leave Balance (days)</Text>
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

                        <Text style={editStyles.sectionTitle}>Emergency Contact</Text>
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

                        <Text style={editStyles.fieldLabel}>Notes</Text>
                        <TextInput
                            style={[editStyles.input, { minHeight: 70, textAlignVertical: 'top', marginBottom: 16 }]}
                            value={form.notes}
                            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                            placeholder="Additional notes..."
                            placeholderTextColor="#475569"
                            multiline
                        />

                        <TouchableOpacity
                            style={[editStyles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#0f172a" />
                                : <Text style={editStyles.saveBtnText}>Save HR Record</Text>
                            }
                        </TouchableOpacity>
                        <View style={{ height: 24 }} />
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
            {/* Search */}
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={v => { setSearch(v); setPage(1); }}
                    placeholder="🔍 Search name / email..."
                    placeholderTextColor="#475569"
                />
            </View>

            {/* Role Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
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

            <Text style={styles.countText}>Total: {pagination.total} employees</Text>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#eab308" />
                </View>
            ) : employees.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>Koi employee nahi mila</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />}
                >
                    {employees.map((emp) => {
                        const hr = emp.hrRecord;
                        const total = hr
                            ? (hr.salary?.basic || 0) + (hr.salary?.hra || 0) +
                            (hr.salary?.allowance || 0) - (hr.salary?.deduction || 0)
                            : 0;

                        return (
                            <View key={emp._id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.empInfo}>
                                        <Text style={styles.empName}>{emp.name}</Text>
                                        <Text style={styles.empEmail}>{emp.email}</Text>
                                    </View>
                                    <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[emp.role]?.bg }]}>
                                        <Text style={[styles.roleText, { color: ROLE_COLORS[emp.role]?.color }]}>
                                            {emp.role?.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={styles.detailItem}>🏢 {hr?.department || '—'}</Text>
                                    <Text style={styles.detailItem}>👤 {hr?.designation || '—'}</Text>
                                    <Text style={styles.detailItem}>💰 {total > 0 ? `₹${total.toLocaleString()}` : '—'}</Text>
                                </View>

                                <View style={styles.cardFooter}>
                                    <View style={[styles.statusBadge, { backgroundColor: emp.isActive ? '#22c55e20' : '#ef444420' }]}>
                                        <Text style={[styles.statusText, { color: emp.isActive ? '#22c55e' : '#ef4444' }]}>
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
                            <Text style={styles.pageInfo}>Page {page} / {pagination.pages}</Text>
                            <TouchableOpacity
                                style={[styles.pageBtn, page === pagination.pages && styles.pageBtnDisabled]}
                                onPress={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                            >
                                <Text style={styles.pageBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: '#475569', fontSize: 14 },
    countText: { color: '#475569', fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },

    searchBar: { padding: 12, paddingBottom: 6 },
    searchInput: {
        backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
        borderWidth: 1, borderColor: '#334155',
    },
    filterBar: { maxHeight: 50, paddingBottom: 6 },
    filterContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
    filterChipActive: { backgroundColor: '#eab308', borderColor: '#eab308' },
    filterText: { color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    filterTextActive: { color: '#0f172a' },

    list: { padding: 12, gap: 10 },
    card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155' },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
    empInfo: { flex: 1 },
    empName: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
    empEmail: { color: '#64748b', fontSize: 11, marginTop: 2 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

    detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    detailItem: { color: '#94a3b8', fontSize: 12 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '600' },
    editBtn: { backgroundColor: '#eab30820', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    editBtnText: { color: '#eab308', fontSize: 12, fontWeight: '700' },

    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 8 },
    pageBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { color: '#94a3b8', fontSize: 13 },
    pageInfo: { color: '#64748b', fontSize: 13 },
});

const editStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
    container: {
        backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, maxHeight: '90%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
    close: { color: '#64748b', fontSize: 18, padding: 4 },

    empBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#0f172a', borderRadius: 12, padding: 12, marginBottom: 16,
    },
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
    empName: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
    empEmail: { color: '#64748b', fontSize: 12 },

    sectionTitle: { color: '#eab308', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    half: { flex: 1, minWidth: '45%' },
    third: { flex: 1, minWidth: '30%' },

    fieldWrap: { marginBottom: 8 },
    fieldLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4, fontWeight: '500' },
    input: {
        backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 9, fontSize: 13,
        borderWidth: 1, borderColor: '#334155',
    },

    saveBtn: { backgroundColor: '#eab308', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
});
