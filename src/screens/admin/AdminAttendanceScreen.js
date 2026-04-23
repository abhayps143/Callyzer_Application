// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, FlatList, StyleSheet, TouchableOpacity,
//   ActivityIndicator, RefreshControl, TextInput, ScrollView, StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { C, shadow } from '../../theme';

// const API = 'http://192.168.1.51:5000/api';

// const STATUS_CFG = {
//   present: { label: 'Present', color: C.green, soft: C.greenSoft },
//   absent: { label: 'Absent', color: C.red, soft: C.redSoft },
//   half_day: { label: 'Half Day', color: C.amber, soft: C.amberSoft },
//   work_from_home: { label: 'WFH', color: C.blue, soft: C.blueSoft },
//   holiday: { label: 'Holiday', color: C.purple, soft: C.purpleSoft },
// };

// const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
// const fmtHours = (h) => { if (!h) return '—'; const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return `${hrs}h ${mins}m`; };

// export default function AdminAttendanceScreen() {
//   const now = new Date();
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmp, setSelectedEmp] = useState(null);
//   const [attendance, setAttendance] = useState([]);
//   const [loadingEmps, setLoadingEmps] = useState(true);
//   const [loadingAtt, setLoadingAtt] = useState(false);
//   const [empSearch, setEmpSearch] = useState('');
//   const [month, setMonth] = useState(now.getMonth() + 1);
//   const [year, setYear] = useState(now.getFullYear());

//   const getToken = async () => await AsyncStorage.getItem('token');

//   useEffect(() => {
//     (async () => {
//       try {
//         const token = await getToken();
//         const res = await fetch(`${API}/hr/employees?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
//         const data = await res.json();
//         const emps = data.employees || [];
//         setEmployees(emps);
//         if (emps.length) setSelectedEmp(emps[0]);
//       } catch (e) { console.log(e); }
//       setLoadingEmps(false);
//     })();
//   }, []);

//   useEffect(() => {
//     if (!selectedEmp) return;
//     (async () => {
//       setLoadingAtt(true);
//       try {
//         const token = await getToken();
//         const res = await fetch(`${API}/attendance/employee/${selectedEmp._id}?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
//         const data = await res.json();
//         const att = data.attendance || data || [];
//         setAttendance(Array.isArray(att) ? att : []);
//       } catch { setAttendance([]); }
//       setLoadingAtt(false);
//     })();
//   }, [selectedEmp, month, year]);

//   const filteredEmps = employees.filter(e =>
//     !empSearch || e.name?.toLowerCase().includes(empSearch.toLowerCase())
//   );

//   const stats = Array.isArray(attendance) && attendance.length > 0
//     ? attendance.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
//     : {};

//   if (loadingEmps) return <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>;

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

//       <View style={styles.header}>
//         <Text style={styles.title}>Attendance</Text>
//       </View>

//       <View style={styles.body}>
//         {/* Employee Panel */}
//         <View style={styles.empPanel}>
//           <View style={styles.empSearchWrap}>
//             <TextInput
//               style={styles.empSearchInput}
//               placeholder="Search…"
//               placeholderTextColor={C.textMuted}
//               value={empSearch}
//               onChangeText={setEmpSearch}
//             />
//           </View>
//           <ScrollView>
//             {filteredEmps.map(emp => {
//               const active = selectedEmp?._id === emp._id;
//               return (
//                 <TouchableOpacity
//                   key={emp._id}
//                   style={[styles.empItem, active && styles.empItemActive]}
//                   onPress={() => setSelectedEmp(emp)}
//                 >
//                   <View style={[styles.empAvatar, active && { backgroundColor: C.primary }]}>
//                     <Text style={styles.empAvatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
//                   </View>
//                   <Text style={[styles.empName, active && { color: C.primary }]} numberOfLines={1}>
//                     {emp.name}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </ScrollView>
//         </View>

//         {/* Attendance Detail */}
//         <View style={styles.attPanel}>
//           {/* Month Selector */}
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
//             {MONTHS.map((m, i) => (
//               <TouchableOpacity
//                 key={i}
//                 style={[styles.monthChip, month === i + 1 && { backgroundColor: C.primary }]}
//                 onPress={() => setMonth(i + 1)}
//               >
//                 <Text style={[styles.monthText, month === i + 1 && { color: '#fff' }]}>{m}</Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>

//           {/* Stats Row */}
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
//             {Object.entries(STATUS_CFG).map(([key, cfg]) =>
//               stats[key] > 0 ? (
//                 <View key={key} style={[styles.statChip, { backgroundColor: cfg.soft }]}>
//                   <Text style={[styles.statChipVal, { color: cfg.color }]}>{stats[key]}</Text>
//                   <Text style={[styles.statChipLabel, { color: cfg.color }]}>{cfg.label}</Text>
//                 </View>
//               ) : null
//             )}
//           </ScrollView>

//           {/* Records */}
//           {loadingAtt
//             ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} />
//             : <FlatList
//               data={attendance}
//               keyExtractor={(item, i) => item._id || i.toString()}
//               renderItem={({ item }) => {
//                 const s = STATUS_CFG[item.status] || { label: item.status || 'Unknown', color: C.textSub, soft: C.surfaceAlt };
//                 return (
//                   <View style={styles.attRow}>
//                     <View style={[styles.dateBox, { backgroundColor: s.soft }]}>
//                       <Text style={[styles.dateText, { color: s.color }]}>
//                         {item.date ? new Date(item.date).getDate() : '?'}
//                       </Text>
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <View style={[styles.attPill, { backgroundColor: s.soft }]}>
//                         <Text style={[styles.attPillText, { color: s.color }]}>{s.label}</Text>
//                       </View>
//                       <Text style={styles.timeText}>
//                         {fmtTime(item.punchIn)} — {fmtTime(item.punchOut)}
//                         {item.workHours ? `  ·  ${fmtHours(item.workHours)}` : ''}
//                       </Text>
//                     </View>
//                   </View>
//                 );
//               }}
//               ListEmptyComponent={<Text style={styles.empty}>No records</Text>}
//               contentContainerStyle={{ paddingBottom: 20 }}
//             />
//           }
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: C.bg },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
//   header: {
//     paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
//     backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
//   },
//   title: { fontSize: 22, fontWeight: '800', color: C.text },

//   body: { flex: 1, flexDirection: 'row' },

//   empPanel: { width: 112, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border },
//   empSearchWrap: { margin: 6 },
//   empSearchInput: { padding: 8, borderRadius: 10, backgroundColor: C.surfaceAlt, fontSize: 12, color: C.text, borderWidth: 1, borderColor: C.border },
//   empItem: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
//   empItemActive: { backgroundColor: C.primarySoft },
//   empAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
//   empAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
//   empName: { fontSize: 11, color: C.textSub, fontWeight: '500', flex: 1 },

//   attPanel: { flex: 1, padding: 10 },
//   monthRow: { marginBottom: 8 },
//   monthChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 6, backgroundColor: C.surfaceAlt },
//   monthText: { fontSize: 12, fontWeight: '600', color: C.textSub },

//   statsRow: { marginBottom: 10 },
//   statChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 6, alignItems: 'center' },
//   statChipVal: { fontSize: 16, fontWeight: '800' },
//   statChipLabel: { fontSize: 10, fontWeight: '600' },

//   attRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
//   dateBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
//   dateText: { fontSize: 14, fontWeight: '800' },
//   attPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 2 },
//   attPillText: { fontSize: 11, fontWeight: '700' },
//   timeText: { fontSize: 11, color: C.textMuted },
//   empty: { color: C.textMuted, textAlign: 'center', marginTop: 40 },
// });


import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, StatusBar, RefreshControl,
  Modal, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { api } from '../../services/api';
import { C } from '../../theme';

const API = 'http://192.168.1.51:5000/api';

const STATUS_CFG = {
  present: { label: 'Present', color: '#15803d', soft: '#dcfce7', dot: '#16a34a', icon: '✅' },
  absent: { label: 'Absent', color: '#b91c1c', soft: '#fee2e2', dot: '#dc2626', icon: '❌' },
  half_day: { label: 'Half Day', color: '#a16207', soft: '#fef9c3', dot: '#ca8a04', icon: '🌓' },
  work_from_home: { label: 'WFH', color: '#1d4ed8', soft: '#dbeafe', dot: '#2563eb', icon: '🏠' },
  holiday: { label: 'Holiday', color: '#7e22ce', soft: '#f3e8ff', dot: '#9333ea', icon: '🎉' },
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  : '—';
const fmtHours = (h) => {
  if (!h) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
};
const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getToken = async () => await AsyncStorage.getItem('token');

export default function AdminAttendanceScreen() {
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
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // ── Load employees (original admin logic) ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/hr/employees?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const emps = data.employees || [];
        setEmployees(emps);
        if (emps.length) setSelectedEmp(emps[0]);
      } catch (e) { console.log(e); }
      setLoadingEmps(false);
    })();
  }, []);

  // ── Load attendance (original admin logic) ─────────────────────────────
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
    } catch (e) {
      console.log('attendance error:', e);
      setAttendance([]);
    } finally {
      setLoadingAtt(false);
      setRefreshing(false);
    }
  }, [selectedEmp, month, year]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  useEffect(() => { fetchAttendance(); }, [selectedEmp, month, year]);

  const onRefresh = () => { setRefreshing(true); fetchAttendance(); };

  const filteredEmps = employees.filter(e =>
    !empSearch || e.name?.toLowerCase().includes(empSearch.toLowerCase())
  );

  // ── Summary counts ─────────────────────────────────────────────────────
  const summary = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    half_day: attendance.filter(a => a.status === 'half_day').length,
    work_from_home: attendance.filter(a => a.status === 'work_from_home').length,
    holiday: attendance.filter(a => a.status === 'holiday').length,
  };

  // ── Sub-components ─────────────────────────────────────────────────────
  const EmployeeSelector = () => (
    <TouchableOpacity
      style={styles.employeeSelector}
      onPress={() => setShowEmployeeModal(true)}
    >
      <View style={styles.selectedEmpAvatar}>
        <Text style={styles.selectedEmpAvatarText}>
          {selectedEmp?.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.selectedEmpInfo}>
        <Text style={styles.selectedEmpName}>{selectedEmp?.name || 'Select Employee'}</Text>
        <Text style={styles.selectedEmpRole}>{selectedEmp?.role?.replace('_', ' ') || ''}</Text>
      </View>
      <Text style={styles.chevron}>▼</Text>
    </TouchableOpacity>
  );

  const EmployeeModal = () => (
    <Modal
      visible={showEmployeeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEmployeeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search employee..."
              placeholderTextColor="#94a3b8"
              value={empSearch}
              onChangeText={setEmpSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredEmps}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalEmployeeItem,
                  selectedEmp?._id === item._id && styles.modalEmployeeItemActive,
                ]}
                onPress={() => {
                  setSelectedEmp(item);
                  setShowEmployeeModal(false);
                  setEmpSearch('');
                }}
              >
                <View style={styles.modalEmpAvatar}>
                  <Text style={styles.modalEmpAvatarText}>
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalEmpInfo}>
                  <Text style={styles.modalEmpName}>{item.name}</Text>
                  <Text style={styles.modalEmpRole}>{item.role?.replace('_', ' ')}</Text>
                </View>
                {selectedEmp?._id === item._id && (
                  <Text style={styles.modalCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

  if (loadingEmps) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSub}>Employee punch-in / punch-out records</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      >
        {/* Employee Selector */}
        <EmployeeSelector />

        {/* Month & Year Filter */}
        <View style={styles.filterCard}>
          <Text style={styles.filterSectionTitle}>Select Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {MONTHS_SHORT.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, month === i + 1 && styles.chipActive]}
                onPress={() => setMonth(i + 1)}
              >
                <Text style={[styles.chipText, month === i + 1 && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.filterSectionTitle, { marginTop: 12 }]}>Select Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {[2024, 2025, 2026].map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, styles.yearChip, year === y && styles.yearChipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedEmp && (
            <View style={styles.monthLabel}>
              <Text style={styles.monthLabelText}>
                📅 {MONTHS_FULL[month - 1]} {year}
              </Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <View key={key} style={[styles.summaryCard, { backgroundColor: cfg.soft }]}>
              <Text style={styles.summaryIcon}>{cfg.icon}</Text>
              <Text style={[styles.summaryVal, { color: cfg.color }]}>{summary[key] || 0}</Text>
              <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        {/* Attendance Records Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.thDate]}>DATE</Text>
            <Text style={[styles.thText, styles.thStatus]}>STATUS</Text>
            <Text style={[styles.thText, styles.thTime]}>IN</Text>
            <Text style={[styles.thText, styles.thTime]}>OUT</Text>
            <Text style={[styles.thText, styles.thHours]}>HRS</Text>
          </View>

          {loadingAtt ? (
            <View style={styles.center2}>
              <ActivityIndicator color="#f59e0b" size="large" />
              <Text style={styles.loadingText}>Loading attendance...</Text>
            </View>
          ) : attendance.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No attendance records found</Text>
              <Text style={styles.emptySub}>Records appear when employee punches in</Text>
            </View>
          ) : (
            attendance.map((att, idx) => {
              const s = STATUS_CFG[att.status] || {
                label: att.status || 'Unknown',
                color: '#374151',
                soft: '#f3f4f6',
                icon: '📌',
              };
              // original admin uses att.workHours, hr uses att.hoursWorked — support both
              const hours = att.hoursWorked ?? att.workHours;
              return (
                <View
                  key={att._id || idx}
                  style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
                >
                  <Text style={[styles.tdText, styles.tdDate]}>{fmtDate(att.date)}</Text>
                  <View style={styles.tdStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: s.soft }]}>
                      <Text style={styles.statusIcon}>{s.icon}</Text>
                      <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdText, styles.tdTime, styles.timeIn]}>
                    {fmtTime(att.punchIn?.time ?? att.punchIn)}
                  </Text>
                  <Text style={[styles.tdText, styles.tdTime, styles.timeOut]}>
                    {fmtTime(att.punchOut?.time ?? att.punchOut)}
                  </Text>
                  <Text style={[styles.tdText, styles.tdHours]}>{fmtHours(hours)}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EmployeeModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center2: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 13 },

  // Header
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

  // Employee Selector
  employeeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedEmpAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#f59e0b',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  selectedEmpAvatarText: { color: '#ffffff', fontWeight: '800', fontSize: 20 },
  selectedEmpInfo: { flex: 1 },
  selectedEmpName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  selectedEmpRole: { fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  chevron: { fontSize: 14, color: '#94a3b8' },

  // Filter Card
  filterCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSectionTitle: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 },
  chipScroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 24, marginRight: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  yearChip: { paddingHorizontal: 20 },
  yearChipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  monthLabel: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  monthLabelText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    width: '18%',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryIcon: { fontSize: 20, marginBottom: 6 },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 9, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  // Table Card
  tableCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  thText: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  thDate: { flex: 1.2 },
  thStatus: { flex: 1 },
  thTime: { flex: 0.9 },
  thHours: { flex: 0.7, textAlign: 'center' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tdText: { fontSize: 12, color: '#334155' },
  tdDate: { flex: 1.2, fontWeight: '600' },
  tdStatus: { flex: 1 },
  tdTime: { flex: 0.9 },
  tdHours: { flex: 0.7, textAlign: 'center', fontWeight: '600' },
  timeIn: { color: '#15803d', fontWeight: '600' },
  timeOut: { color: '#b91c1c', fontWeight: '600' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusIcon: { fontSize: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalClose: { fontSize: 20, color: '#64748b', fontWeight: '600', padding: 4 },
  modalSearch: { paddingHorizontal: 16, paddingVertical: 12 },
  modalSearchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalList: { paddingHorizontal: 16, paddingBottom: 20 },
  modalEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalEmployeeItemActive: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  modalEmpAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  modalEmpAvatarText: { fontSize: 16, fontWeight: '700', color: '#475569' },
  modalEmpInfo: { flex: 1 },
  modalEmpName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  modalEmpRole: { fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  modalCheck: { fontSize: 18, color: '#f59e0b', fontWeight: '700' },
});