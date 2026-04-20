import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, ScrollView, StatusBar, RefreshControl
} from 'react-native';
import { api } from '../../services/api';
import { C } from '../../theme';

const STATUS_CFG = {
    present:        { label: 'Present',  color: C.green,  soft: C.greenSoft },
    absent:         { label: 'Absent',   color: C.red,    soft: C.redSoft },
    half_day:       { label: 'Half Day', color: C.amber,  soft: C.amberSoft },
    work_from_home: { label: 'WFH',      color: C.blue,   soft: C.blueSoft },
    holiday:        { label: 'Holiday',  color: C.purple, soft: C.purpleSoft },
};

const FILTER_TABS = ['', 'present', 'absent', 'half_day', 'work_from_home'];
const FILTER_LABELS = { '': 'All', present: 'Present', absent: 'Absent', half_day: 'Half Day', work_from_home: 'WFH' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtHours = (h) => { if (!h) return '—'; const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${hrs}h ${mins}m`; };

export default function HrAttendanceScreen() {
    const now = new Date();
    const [employees, setEmployees] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loadingEmps, setLoadingEmps] = useState(true);
    const [loadingAtt, setLoadingAtt] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [empSearch, setEmpSearch] = useState('');
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const data = await api.getHrEmployees({ limit: 100 });
                const emps = data.employees || [];
                setEmployees(emps);
                if (emps.length) setSelectedEmp(emps[0]);
            } catch { }
            setLoadingEmps(false);
        })();
    }, []);

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
        } catch { setAttendance([]); }
        finally { setLoadingAtt(false); setRefreshing(false); }
    }, [selectedEmp, month, year]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

    const onRefresh = () => { setRefreshing(true); fetchAttendance(); };

    const filteredEmps = employees.filter(e =>
        !empSearch || e.name?.toLowerCase().includes(empSearch.toLowerCase())
    );

    const stats = attendance.length > 0
        ? attendance.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
        : {};

    const displayedRecords = filterStatus
        ? attendance.filter(a => a.status === filterStatus)
        : attendance;

    if (loadingEmps) return <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            <View style={styles.header}>
                <Text style={styles.title}>Attendance</Text>
            </View>

            <View style={styles.body}>
                {/* Employee Panel */}
                <View style={styles.empPanel}>
                    <View style={styles.empSearchWrap}>
                        <TextInput
                            style={styles.empSearchInput}
                            placeholder="Search…"
                            placeholderTextColor={C.textMuted}
                            value={empSearch}
                            onChangeText={setEmpSearch}
                        />
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {filteredEmps.map(emp => {
                            const active = selectedEmp?._id === emp._id;
                            return (
                                <TouchableOpacity
                                    key={emp._id}
                                    style={[styles.empItem, active && styles.empItemActive]}
                                    onPress={() => setSelectedEmp(emp)}
                                >
                                    <View style={[styles.empAvatar, active && { backgroundColor: C.primary }]}>
                                        <Text style={styles.empAvatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <Text style={[styles.empName, active && { color: C.primary }]} numberOfLines={1}>
                                        {emp.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Attendance Detail */}
                <View style={styles.attPanel}>
                    {/* Month Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
                        {MONTHS.map((m, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.chip, month === i + 1 && { backgroundColor: C.primary }]}
                                onPress={() => setMonth(i + 1)}
                            >
                                <Text style={[styles.chipText, month === i + 1 && { color: '#fff' }]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Year Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearRow}>
                        {[2024, 2025, 2026].map(y => (
                            <TouchableOpacity
                                key={y}
                                style={[styles.chip, year === y && { backgroundColor: C.textSub }]}
                                onPress={() => setYear(y)}
                            >
                                <Text style={[styles.chipText, year === y && { color: '#fff' }]}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Stats Row */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
                        {Object.entries(STATUS_CFG).map(([key, cfg]) =>
                            stats[key] > 0 ? (
                                <View key={key} style={[styles.statChip, { backgroundColor: cfg.soft }]}>
                                    <Text style={[styles.statVal, { color: cfg.color }]}>{stats[key]}</Text>
                                    <Text style={[styles.statLabel, { color: cfg.color }]}>{cfg.label}</Text>
                                </View>
                            ) : null
                        )}
                    </ScrollView>

                    {/* Filter Tabs */}
                    <View style={styles.filterWrap}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                            {FILTER_TABS.map(tab => {
                                const cfg = STATUS_CFG[tab];
                                const active = filterStatus === tab;
                                return (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.filterTab,
                                            active && { backgroundColor: cfg ? cfg.color : C.primary, borderColor: cfg ? cfg.color : C.primary }
                                        ]}
                                        onPress={() => setFilterStatus(tab)}
                                    >
                                        {tab !== '' && (
                                            <View style={[styles.filterDot, { backgroundColor: active ? '#fff' : cfg.color }]} />
                                        )}
                                        <Text style={[styles.filterTabText, active && { color: '#fff' }]}>
                                            {FILTER_LABELS[tab]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Records */}
                    {loadingAtt
                        ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
                        : <FlatList
                            data={displayedRecords}
                            keyExtractor={(item, i) => item._id || i.toString()}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                            renderItem={({ item }) => {
                                const s = STATUS_CFG[item.status] || { label: item.status || 'Unknown', color: C.textSub, soft: C.surfaceAlt };
                                return (
                                    <View style={styles.attRow}>
                                        <View style={[styles.dateBox, { backgroundColor: s.soft }]}>
                                            <Text style={[styles.dateText, { color: s.color }]}>
                                                {item.date ? item.date.split('-')[2] : '?'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={[styles.attPill, { backgroundColor: s.soft }]}>
                                                <Text style={[styles.attPillText, { color: s.color }]}>{s.label}</Text>
                                            </View>
                                            <Text style={styles.timeText}>
                                                {fmtTime(item.punchIn?.time)} — {fmtTime(item.punchOut?.time)}
                                                {item.hoursWorked ? `  ·  ${fmtHours(item.hoursWorked)}` : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.empty}>No records found</Text>}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    }
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    header: {
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    title: { fontSize: 22, fontWeight: '800', color: C.text },

    body: { flex: 1, flexDirection: 'row' },

    empPanel: { width: 112, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border },
    empSearchWrap: { margin: 6 },
    empSearchInput: { padding: 8, borderRadius: 10, backgroundColor: C.surfaceAlt, fontSize: 12, color: C.text, borderWidth: 1, borderColor: C.border },
    empItem: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
    empItemActive: { backgroundColor: C.primarySoft },
    empAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    empAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    empName: { fontSize: 11, color: C.textSub, fontWeight: '500', flex: 1 },

    attPanel: { flex: 1, padding: 10 },

    monthRow: { marginBottom: 6 },
    yearRow: { marginBottom: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6, backgroundColor: C.surfaceAlt },
    chipText: { fontSize: 12, fontWeight: '600', color: C.textSub },

    statsRow: { marginBottom: 8 },
    statChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 6, alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600' },

    filterWrap: { marginBottom: 10 },
    filterTabs: { gap: 6, paddingVertical: 2 },
    filterTab: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, backgroundColor: C.surfaceAlt,
        borderWidth: 1, borderColor: C.border,
    },
    filterDot: { width: 6, height: 6, borderRadius: 3 },
    filterTabText: { fontSize: 12, fontWeight: '600', color: C.textSub },

    attRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    dateBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    dateText: { fontSize: 14, fontWeight: '800' },
    attPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 2 },
    attPillText: { fontSize: 11, fontWeight: '700' },
    timeText: { fontSize: 11, color: C.textMuted },
    empty: { color: C.textMuted, textAlign: 'center', marginTop: 40 },
});
