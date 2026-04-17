import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { api } from '../../services/api';

const STATUS_CONFIG = {
    present: { label: 'Present', bg: '#22c55e20', color: '#22c55e' },
    absent: { label: 'Absent', bg: '#ef444420', color: '#ef4444' },
    half_day: { label: 'Half Day', bg: '#eab30820', color: '#eab308' },
    work_from_home: { label: 'WFH', bg: '#3b82f620', color: '#3b82f6' },
    holiday: { label: 'Holiday', bg: '#a855f720', color: '#a855f7' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtTime = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtHours = (h) => {
    if (!h) return '—';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
};

export default function HrAttendanceScreen() {
    const now = new Date();
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [loadingAtt, setLoadingAtt] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    // Load employees
    useEffect(() => {
        const fetchEmps = async () => {
            try {
                const data = await api.getHrEmployees({ limit: 100 });
                const emps = data.employees || [];
                setEmployees(emps);
                if (emps.length) setSelectedEmp(emps[0]);
            } catch { }
            finally { setLoadingEmps(false); }
        };
        fetchEmps();
    }, []);

    // Load attendance
    const fetchAttendance = useCallback(async () => {
        if (!selectedEmp) return;
        setLoadingAtt(true);
        try {
            const mm = String(month).padStart(2, '0');
            const data = await api.getAllAttendance(`${year}-${mm}`);
            const empRecords = (data.records || []).filter(
                r => (r.employee?._id || r.employee) === selectedEmp._id
            );
            setAttendance(empRecords);
        } catch { }
        finally { setLoadingAtt(false); setRefreshing(false); }
    }, [selectedEmp, month, year]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    const onRefresh = () => { setRefreshing(true); fetchAttendance(); };

    const summary = {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        half_day: attendance.filter(a => a.status === 'half_day').length,
        work_from_home: attendance.filter(a => a.status === 'work_from_home').length,
    };

    return (
        <View style={styles.container}>
            <View style={styles.main}>
                {/* Employee List (Left Panel) */}
                <View style={styles.empPanel}>
                    <Text style={styles.panelTitle}>Employees</Text>
                    {loadingEmps ? (
                        <ActivityIndicator color="#eab308" style={{ marginTop: 20 }} />
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {employees.map(emp => (
                                <TouchableOpacity
                                    key={emp._id}
                                    style={[styles.empItem, selectedEmp?._id === emp._id && styles.empItemActive]}
                                    onPress={() => setSelectedEmp(emp)}
                                >
                                    <View style={styles.miniAvatar}>
                                        <Text style={styles.miniAvatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.empItemName} numberOfLines={1}>{emp.name}</Text>
                                        <Text style={styles.empItemRole}>{emp.role}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Right Panel */}
                <View style={styles.attPanel}>
                    {/* Month/Year Picker */}
                    <View style={styles.pickerRow}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {MONTHS.map((m, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.monthBtn, month === i + 1 && styles.monthBtnActive]}
                                    onPress={() => setMonth(i + 1)}
                                >
                                    <Text style={[styles.monthText, month === i + 1 && styles.monthTextActive]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                    <View style={styles.yearRow}>
                        {[2024, 2025, 2026].map(y => (
                            <TouchableOpacity
                                key={y}
                                style={[styles.yearBtn, year === y && styles.yearBtnActive]}
                                onPress={() => setYear(y)}
                            >
                                <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryRow}>
                        {Object.entries(summary).map(([key, val]) => (
                            <View key={key} style={[styles.summaryCard, { backgroundColor: STATUS_CONFIG[key]?.bg }]}>
                                <Text style={[styles.summaryVal, { color: STATUS_CONFIG[key]?.color }]}>{val}</Text>
                                <Text style={[styles.summaryLabel, { color: STATUS_CONFIG[key]?.color }]}>
                                    {STATUS_CONFIG[key]?.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Attendance Records */}
                    {loadingAtt ? (
                        <View style={styles.center}>
                            <ActivityIndicator color="#eab308" />
                        </View>
                    ) : attendance.length === 0 ? (
                        <View style={styles.center}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>Is mahine ka koi record nahi</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />}
                        >
                            {attendance.map((att) => (
                                <View key={att._id} style={styles.attCard}>
                                    <View style={styles.attTop}>
                                        <Text style={styles.attDate}>{att.date}</Text>
                                        <View style={[styles.attBadge, { backgroundColor: STATUS_CONFIG[att.status]?.bg }]}>
                                            <Text style={[styles.attBadgeText, { color: STATUS_CONFIG[att.status]?.color }]}>
                                                {STATUS_CONFIG[att.status]?.label || att.status}
                                            </Text>
                                        </View>
                                        <Text style={styles.attHours}>{fmtHours(att.hoursWorked)}</Text>
                                    </View>
                                    <View style={styles.attTimes}>
                                        <Text style={styles.punchIn}>🟢 {fmtTime(att.punchIn?.time)}</Text>
                                        <Text style={styles.punchOut}>🔴 {fmtTime(att.punchOut?.time)}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    main: { flex: 1, flexDirection: 'row' },

    empPanel: {
        width: 110, backgroundColor: '#1e293b',
        borderRightWidth: 1, borderRightColor: '#334155', padding: 8,
    },
    panelTitle: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    empItem: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 10, marginBottom: 4 },
    empItemActive: { backgroundColor: '#eab30815', borderWidth: 1, borderColor: '#eab30840' },
    miniAvatar: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center', marginRight: 6,
    },
    miniAvatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 11 },
    empItemName: { color: '#f8fafc', fontSize: 11, fontWeight: '600' },
    empItemRole: { color: '#475569', fontSize: 9, textTransform: 'capitalize' },

    attPanel: { flex: 1, padding: 10 },
    pickerRow: { marginBottom: 6 },
    monthBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6, backgroundColor: '#0f172a' },
    monthBtnActive: { backgroundColor: '#eab308' },
    monthText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
    monthTextActive: { color: '#0f172a' },

    yearRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    yearBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#0f172a' },
    yearBtnActive: { backgroundColor: '#6366f1' },
    yearText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
    yearTextActive: { color: '#fff' },

    summaryRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    summaryCard: { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center' },
    summaryVal: { fontSize: 18, fontWeight: 'bold' },
    summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 2 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 36, marginBottom: 8 },
    emptyText: { color: '#475569', fontSize: 12 },

    attCard: {
        backgroundColor: '#1e293b', borderRadius: 10, padding: 10,
        marginBottom: 8, borderWidth: 1, borderColor: '#334155',
    },
    attTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    attDate: { color: '#f8fafc', fontSize: 12, fontWeight: '700', flex: 1 },
    attBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginHorizontal: 6 },
    attBadgeText: { fontSize: 10, fontWeight: '600' },
    attHours: { color: '#64748b', fontSize: 11 },

    attTimes: { flexDirection: 'row', gap: 16 },
    punchIn: { color: '#22c55e', fontSize: 11 },
    punchOut: { color: '#ef4444', fontSize: 11 },
});
