import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, ScrollView, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, shadow } from '../../theme';

const API = 'http://192.168.1.51:5000/api';

const STATUS_CFG = {
  present: { label: 'Present', color: C.green, soft: C.greenSoft },
  absent: { label: 'Absent', color: C.red, soft: C.redSoft },
  half_day: { label: 'Half Day', color: C.amber, soft: C.amberSoft },
  work_from_home: { label: 'WFH', color: C.blue, soft: C.blueSoft },
  holiday: { label: 'Holiday', color: C.purple, soft: C.purpleSoft },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtHours = (h) => { if (!h) return '—'; const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${hrs}h ${mins}m`; };

export default function AdminAttendanceScreen() {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const getToken = async () => await AsyncStorage.getItem('token');

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/hr/employees?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const emps = data.employees || [];
        setEmployees(emps);
        if (emps.length) setSelectedEmp(emps[0]);
      } catch (e) { console.log(e); }
      setLoadingEmps(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedEmp) return;
    (async () => {
      setLoadingAtt(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API}/attendance/employee/${selectedEmp._id}?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const att = data.attendance || data || [];
        setAttendance(Array.isArray(att) ? att : []);
      } catch { setAttendance([]); }
      setLoadingAtt(false);
    })();
  }, [selectedEmp, month, year]);

  const filteredEmps = employees.filter(e =>
    !empSearch || e.name?.toLowerCase().includes(empSearch.toLowerCase())
  );

  const stats = Array.isArray(attendance) && attendance.length > 0
    ? attendance.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
    : {};

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
          <ScrollView>
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
                style={[styles.monthChip, month === i + 1 && { backgroundColor: C.primary }]}
                onPress={() => setMonth(i + 1)}
              >
                <Text style={[styles.monthText, month === i + 1 && { color: '#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stats Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) =>
              stats[key] > 0 ? (
                <View key={key} style={[styles.statChip, { backgroundColor: cfg.soft }]}>
                  <Text style={[styles.statChipVal, { color: cfg.color }]}>{stats[key]}</Text>
                  <Text style={[styles.statChipLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              ) : null
            )}
          </ScrollView>

          {/* Records */}
          {loadingAtt
            ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
            : <FlatList
              data={attendance}
              keyExtractor={(item, i) => item._id || i.toString()}
              renderItem={({ item }) => {
                const s = STATUS_CFG[item.status] || { label: item.status || 'Unknown', color: C.textSub, soft: C.surfaceAlt };
                return (
                  <View style={styles.attRow}>
                    <View style={[styles.dateBox, { backgroundColor: s.soft }]}>
                      <Text style={[styles.dateText, { color: s.color }]}>
                        {item.date ? new Date(item.date).getDate() : '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.attPill, { backgroundColor: s.soft }]}>
                        <Text style={[styles.attPillText, { color: s.color }]}>{s.label}</Text>
                      </View>
                      <Text style={styles.timeText}>
                        {fmtTime(item.punchIn)} — {fmtTime(item.punchOut)}
                        {item.workHours ? `  ·  ${fmtHours(item.workHours)}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No records</Text>}
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
  monthRow: { marginBottom: 8 },
  monthChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6, backgroundColor: C.surfaceAlt },
  monthText: { fontSize: 12, fontWeight: '600', color: C.textSub },

  statsRow: { marginBottom: 10 },
  statChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 6, alignItems: 'center' },
  statChipVal: { fontSize: 16, fontWeight: '800' },
  statChipLabel: { fontSize: 10, fontWeight: '600' },

  attRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  dateBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateText: { fontSize: 14, fontWeight: '800' },
  attPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 2 },
  attPillText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: C.textMuted },
  empty: { color: C.textMuted, textAlign: 'center', marginTop: 40 },
});
