// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     View, Text, StyleSheet, TouchableOpacity,
//     ScrollView, ActivityIndicator, Alert, RefreshControl
// } from 'react-native';
// import * as Location from 'expo-location';
// import { api } from '../services/api';

// const fmt = (isoStr) => {
//     if (!isoStr) return '—';
//     return new Date(isoStr).toLocaleTimeString('en-IN', {
//         hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
//     });
// };

// const fmtDate = (dateStr) => {
//     if (!dateStr) return '';
//     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     const [y, m, d] = dateStr.split('-');
//     return `${d} ${months[+m - 1]} ${y}`;
// };

// const fmtHours = (h) => {
//     if (!h) return '0h 0m';
//     const hrs = Math.floor(h);
//     const mins = Math.round((h - hrs) * 60);
//     return `${hrs}h ${mins}m`;
// };

// const getMonthStr = () => {
//     const now = new Date();
//     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
// };

// export default function AttendanceScreen() {
//     const [record, setRecord] = useState(null);
//     const [today, setToday] = useState('');
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [actionLoading, setActionLoading] = useState(false);
//     const [histLoading, setHistLoading] = useState(false);
//     const [refreshing, setRefreshing] = useState(false);
//     const [location, setLocation] = useState(null);
//     const [locStatus, setLocStatus] = useState('idle');
//     const [clock, setClock] = useState(new Date());

//     useEffect(() => {
//         const t = setInterval(() => setClock(new Date()), 1000);
//         return () => clearInterval(t);
//     }, []);

//     const fetchToday = useCallback(async () => {
//         try {
//             const data = await api.getAttendanceToday();
//             setRecord(data.record || null);
//             setToday(data.today || '');
//         } catch (e) { console.log(e); }
//         finally { setLoading(false); setRefreshing(false); }
//     }, []);

//     const fetchHistory = useCallback(async () => {
//         setHistLoading(true);
//         try {
//             const data = await api.getAttendanceHistory(getMonthStr());
//             setHistory(data.records || []);
//         } catch (e) { console.log(e); }
//         finally { setHistLoading(false); }
//     }, []);

//     useEffect(() => { fetchToday(); fetchHistory(); }, [fetchToday, fetchHistory]);

//     const onRefresh = () => { setRefreshing(true); fetchToday(); fetchHistory(); };

//     const handleFetchLocation = async () => {
//         setLocStatus('fetching');
//         try {
//             const { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') { setLocStatus('denied'); return; }
//             const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
//             setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: Math.round(loc.coords.accuracy) });
//             setLocStatus('got');
//         } catch (e) { setLocStatus('denied'); }
//     };

//     const handlePunchIn = async () => {
//         setActionLoading(true);
//         try {
//             const data = await api.punchIn(location);
//             if (data.record) { setRecord(data.record); fetchHistory(); }
//             else Alert.alert('Error', data.message || 'Punch in failed');
//         } catch (e) { Alert.alert('Error', 'Server error'); }
//         finally { setActionLoading(false); }
//     };

//     const handlePunchOut = async () => {
//         setActionLoading(true);
//         try {
//             const data = await api.punchOut(location);
//             if (data.record) { setRecord(data.record); fetchHistory(); }
//             else Alert.alert('Error', data.message || 'Punch out failed');
//         } catch (e) { Alert.alert('Error', 'Server error'); }
//         finally { setActionLoading(false); }
//     };

//     const isPunchedIn = !!record?.punchIn?.time;
//     const isPunchedOut = !!record?.punchOut?.time;
//     const elapsed = isPunchedIn && !isPunchedOut ? ((clock - new Date(record.punchIn.time)) / (1000 * 60 * 60)) : null;

//     if (loading) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" color="#6366f1" />
//             </View>
//         );
//     }

//     const statusText = isPunchedOut ? 'Completed ✅' : isPunchedIn ? '🟢 Working' : 'Not Started';
//     const statusColor = isPunchedOut ? '#6366f1' : isPunchedIn ? '#22c55e' : '#64748b';

//     return (
//         <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
//             <View style={styles.header}>
//                 <Text style={styles.title}>📍 Attendance</Text>
//                 <Text style={styles.date}>{fmtDate(today)} · {clock.toLocaleTimeString('en-IN', { hour12: true })}</Text>
//             </View>

//             <View style={styles.todayCard}>
//                 <View style={styles.todayHeader}>
//                     <Text style={styles.todayLabel}>Today's Status</Text>
//                     <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
//                         <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
//                     </View>
//                 </View>

//                 <View style={styles.punchRow}>
//                     <View style={[styles.punchBox, { backgroundColor: '#22c55e15', borderColor: '#22c55e30' }]}>
//                         <Text style={styles.punchBoxLabel}>Punch In</Text>
//                         <Text style={[styles.punchBoxTime, { color: '#22c55e' }]}>{fmt(record?.punchIn?.time)}</Text>
//                         {record?.punchIn?.location?.latitude ? (
//                             <Text style={styles.locationHint}>📍 Location saved</Text>
//                         ) : null}
//                     </View>
//                     <View style={[styles.punchBox, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
//                         <Text style={styles.punchBoxLabel}>Punch Out</Text>
//                         <Text style={[styles.punchBoxTime, { color: '#ef4444' }]}>{fmt(record?.punchOut?.time)}</Text>
//                     </View>
//                 </View>

//                 {elapsed !== null ? (
//                     <View style={styles.elapsedBox}>
//                         <Text style={styles.elapsedText}>
//                             ⏱ Time elapsed: <Text style={{ fontWeight: 'bold' }}>{fmtHours(elapsed)}</Text>
//                         </Text>
//                     </View>
//                 ) : null}

//                 {isPunchedOut && record?.hoursWorked ? (
//                     <View style={[styles.elapsedBox, { backgroundColor: '#6366f115' }]}>
//                         <Text style={[styles.elapsedText, { color: '#6366f1' }]}>
//                             ✅ Total worked: <Text style={{ fontWeight: 'bold' }}>{fmtHours(record.hoursWorked)}</Text>
//                         </Text>
//                     </View>
//                 ) : null}

//                 {!isPunchedOut ? (
//                     <TouchableOpacity
//                         style={[
//                             styles.locBtn,
//                             locStatus === 'got' ? { backgroundColor: '#22c55e15', borderColor: '#22c55e40' } : 
//                             locStatus === 'denied' ? { backgroundColor: '#ef444415', borderColor: '#ef444440' } : 
//                             { borderColor: '#334155' }
//                         ]}
//                         onPress={handleFetchLocation}
//                         disabled={locStatus === 'fetching' || locStatus === 'got'}
//                     >
//                         <Text style={[
//                             styles.locBtnText,
//                             locStatus === 'got' ? { color: '#22c55e' } : 
//                             locStatus === 'denied' ? { color: '#ef4444' } : 
//                             { color: '#94a3b8' }
//                         ]}>
//                             {locStatus === 'fetching' ? '⏳ Fetching GPS...' : 
//                              locStatus === 'got' ? `✅ GPS Ready (±${location?.accuracy}m)` : 
//                              locStatus === 'denied' ? '❌ Location denied' : 
//                              '📍 Share My Location (Optional)'}
//                         </Text>
//                     </TouchableOpacity>
//                 ) : null}

//                 {!isPunchedIn ? (
//                     <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={handlePunchIn} disabled={actionLoading}>
//                         {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🟢 Punch In</Text>}
//                     </TouchableOpacity>
//                 ) : null}

//                 {isPunchedIn && !isPunchedOut ? (
//                     <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={handlePunchOut} disabled={actionLoading}>
//                         {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🔴 Punch Out</Text>}
//                     </TouchableOpacity>
//                 ) : null}

//                 {isPunchedOut ? (
//                     <View style={[styles.actionBtn, { backgroundColor: '#1e293b' }]}>
//                         <Text style={[styles.actionBtnText, { color: '#64748b' }]}>✅ Attendance Complete</Text>
//                     </View>
//                 ) : null}
//             </View>

//             <View style={styles.historyCard}>
//                 <Text style={styles.historyTitle}>This Month's History</Text>
//                 {histLoading ? (
//                     <ActivityIndicator color="#6366f1" style={{ marginVertical: 20 }} />
//                 ) : history.length === 0 ? (
//                     <Text style={styles.historyEmpty}>Koi record nahi is mahine</Text>
//                 ) : (
//                     history.map((r, i) => (
//                         <View key={r._id || i} style={[styles.histRow, i < history.length - 1 ? styles.histBorder : null]}>
//                             <View style={styles.histDate}>
//                                 <Text style={styles.histDateText}>{fmtDate(r.date)}</Text>
//                                 <View style={[styles.histStatus, { 
//                                     backgroundColor: r.status === 'present' ? '#22c55e20' : 
//                                                    r.status === 'half_day' ? '#f59e0b20' : '#ef444420' 
//                                 }]}>
//                                     <Text style={[styles.histStatusText, { 
//                                         color: r.status === 'present' ? '#22c55e' : 
//                                                r.status === 'half_day' ? '#f59e0b' : '#ef4444' 
//                                     }]}>
//                                         {r.status === 'present' ? 'Present' : 
//                                          r.status === 'half_day' ? 'Half Day' : 'Absent'}
//                                     </Text>
//                                 </View>
//                             </View>
//                             <View style={styles.histTimes}>
//                                 <Text style={styles.histIn}>
//                                     In: <Text style={{ color: '#22c55e' }}>{fmt(r.punchIn?.time)}</Text>
//                                 </Text>
//                                 <Text style={styles.histOut}>
//                                     Out: <Text style={{ color: '#ef4444' }}>{fmt(r.punchOut?.time)}</Text>
//                                 </Text>
//                             </View>
//                             <Text style={styles.histHours}>
//                                 {r.hoursWorked ? fmtHours(r.hoursWorked) : '—'}
//                             </Text>
//                         </View>
//                     ))
//                 )}
//             </View>
//             <View style={{ height: 30 }} />
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
//     header: { padding: 20, paddingTop: 50, backgroundColor: '#1e293b', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16 },
//     title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
//     date: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
//     todayCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
//     todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
//     todayLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
//     statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
//     statusText: { fontWeight: 'bold', fontSize: 13 },
//     punchRow: { flexDirection: 'row', marginBottom: 16, justifyContent: 'space-between' },
//     punchBox: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, marginHorizontal: 6 },
//     punchBoxLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
//     punchBoxTime: { fontWeight: 'bold', fontSize: 17 },
//     locationHint: { color: '#64748b', fontSize: 10, marginTop: 4 },
//     elapsedBox: { backgroundColor: '#3b82f615', padding: 12, borderRadius: 10, marginBottom: 12 },
//     elapsedText: { color: '#3b82f6', fontSize: 14, textAlign: 'center' },
//     locBtn: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
//     locBtnText: { fontSize: 14 },
//     actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
//     actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
//     historyCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
//     historyTitle: { color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 16 },
//     historyEmpty: { color: '#64748b', textAlign: 'center', paddingVertical: 20 },
//     histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
//     histBorder: { borderBottomWidth: 1, borderBottomColor: '#0f172a' },
//     histDate: { flex: 1 },
//     histDateText: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 4 },
//     histStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
//     histStatusText: { fontSize: 11, fontWeight: '600' },
//     histTimes: { flex: 1, paddingHorizontal: 8 },
//     histIn: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
//     histOut: { color: '#94a3b8', fontSize: 12 },
//     histHours: { color: '#6366f1', fontWeight: 'bold', fontSize: 13 },
// });

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, RefreshControl, StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import { api } from '../services/api';

const fmt = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};

const fmtDate = (dateStr) => {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = dateStr.split('-');
    return `${d} ${months[+m - 1]} ${y}`;
};

const fmtHours = (h) => {
    if (!h) return '0h 0m';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h ${mins}m`;
};

const getMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function AttendanceScreen() {
    const [record, setRecord] = useState(null);
    const [today, setToday] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [histLoading, setHistLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [location, setLocation] = useState(null);
    const [locStatus, setLocStatus] = useState('idle');
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchToday = useCallback(async () => {
        try {
            const data = await api.getAttendanceToday();
            setRecord(data.record || null);
            setToday(data.today || '');
        } catch (e) { console.log(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchHistory = useCallback(async () => {
        setHistLoading(true);
        try {
            const data = await api.getAttendanceHistory(getMonthStr());
            setHistory(data.records || []);
        } catch (e) { console.log(e); }
        finally { setHistLoading(false); }
    }, []);

    useEffect(() => { fetchToday(); fetchHistory(); }, [fetchToday, fetchHistory]);

    const onRefresh = () => { setRefreshing(true); fetchToday(); fetchHistory(); };

    const handleFetchLocation = async () => {
        setLocStatus('fetching');
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') { setLocStatus('denied'); return; }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: Math.round(loc.coords.accuracy) });
            setLocStatus('got');
        } catch (e) { setLocStatus('denied'); }
    };

    const handlePunchIn = async () => {
        setActionLoading(true);
        try {
            const data = await api.punchIn(location);
            if (data.record) { setRecord(data.record); fetchHistory(); }
            else Alert.alert('Error', data.message || 'Punch in failed');
        } catch (e) { Alert.alert('Error', 'Server error'); }
        finally { setActionLoading(false); }
    };

    const handlePunchOut = async () => {
        setActionLoading(true);
        try {
            const data = await api.punchOut(location);
            if (data.record) { setRecord(data.record); fetchHistory(); }
            else Alert.alert('Error', data.message || 'Punch out failed');
        } catch (e) { Alert.alert('Error', 'Server error'); }
        finally { setActionLoading(false); }
    };

    const isPunchedIn = !!record?.punchIn?.time;
    const isPunchedOut = !!record?.punchOut?.time;
    const elapsed = isPunchedIn && !isPunchedOut ? ((clock - new Date(record.punchIn.time)) / (1000 * 60 * 60)) : null;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading attendance...</Text>
            </View>
        );
    }

    const statusText = isPunchedOut ? 'Completed' : isPunchedIn ? 'Working' : 'Not Started';
    const statusColor = isPunchedOut ? '#6366f1' : isPunchedIn ? '#22c55e' : '#64748b';
    const statusIcon = isPunchedOut ? '✅' : isPunchedIn ? '🟢' : '⭕';

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Attendance</Text>
                    <Text style={styles.subtitle}>Track your daily work hours</Text>
                </View>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📍</Text>
                </View>
            </View>

            {/* Date & Time Bar */}
            <View style={styles.dateBar}>
                <View style={styles.dateItem}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>{fmtDate(today)}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateItem}>
                    <Text style={styles.dateIcon}>⏰</Text>
                    <Text style={styles.dateText}>{clock.toLocaleTimeString('en-IN', { hour12: true })}</Text>
                </View>
            </View>

            {/* Today's Status Card */}
            <View style={styles.todayCard}>
                <View style={styles.todayHeader}>
                    <Text style={styles.todayLabel}>Today's Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <Text style={styles.statusIcon}>{statusIcon}</Text>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>

                <View style={styles.punchRow}>
                    <View style={[styles.punchBox, styles.punchInBox]}>
                        <Text style={styles.punchBoxIcon}>🟢</Text>
                        <View>
                            <Text style={styles.punchBoxLabel}>Punch In</Text>
                            <Text style={[styles.punchBoxTime, { color: '#22c55e' }]}>{fmt(record?.punchIn?.time)}</Text>
                            {record?.punchIn?.location?.latitude ? (
                                <Text style={styles.locationHint}>📍 Location saved</Text>
                            ) : null}
                        </View>
                    </View>
                    <View style={[styles.punchBox, styles.punchOutBox]}>
                        <Text style={styles.punchBoxIcon}>🔴</Text>
                        <View>
                            <Text style={styles.punchBoxLabel}>Punch Out</Text>
                            <Text style={[styles.punchBoxTime, { color: '#ef4444' }]}>{fmt(record?.punchOut?.time)}</Text>
                        </View>
                    </View>
                </View>

                {elapsed !== null ? (
                    <View style={styles.elapsedBox}>
                        <Text style={styles.elapsedIcon}>⏱️</Text>
                        <Text style={styles.elapsedText}>
                            Time Elapsed: <Text style={styles.elapsedValue}>{fmtHours(elapsed)}</Text>
                        </Text>
                    </View>
                ) : null}

                {isPunchedOut && record?.hoursWorked ? (
                    <View style={[styles.elapsedBox, styles.totalBox]}>
                        <Text style={styles.elapsedIcon}>✅</Text>
                        <Text style={[styles.elapsedText, { color: '#6366f1' }]}>
                            Total Worked: <Text style={styles.elapsedValue}>{fmtHours(record.hoursWorked)}</Text>
                        </Text>
                    </View>
                ) : null}

                {!isPunchedOut ? (
                    <TouchableOpacity
                        style={[
                            styles.locBtn,
                            locStatus === 'got' ? styles.locBtnGot :
                                locStatus === 'denied' ? styles.locBtnDenied :
                                    styles.locBtnIdle
                        ]}
                        onPress={handleFetchLocation}
                        disabled={locStatus === 'fetching' || locStatus === 'got'}
                    >
                        <Text style={styles.locBtnIcon}>
                            {locStatus === 'fetching' ? '⏳' :
                                locStatus === 'got' ? '✅' :
                                    locStatus === 'denied' ? '❌' : '📍'}
                        </Text>
                        <Text style={[
                            styles.locBtnText,
                            locStatus === 'got' ? styles.locBtnTextGot :
                                locStatus === 'denied' ? styles.locBtnTextDenied :
                                    styles.locBtnTextIdle
                        ]}>
                            {locStatus === 'fetching' ? 'Fetching GPS...' :
                                locStatus === 'got' ? `GPS Ready (±${location?.accuracy}m)` :
                                    locStatus === 'denied' ? 'Location Permission Denied' :
                                        'Share My Location (Optional)'}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {!isPunchedIn ? (
                    <TouchableOpacity style={[styles.actionBtn, styles.punchInBtn]} onPress={handlePunchIn} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                                <Text style={styles.actionBtnIcon}>🟢</Text>
                                <Text style={styles.actionBtnText}>Punch In</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : null}

                {isPunchedIn && !isPunchedOut ? (
                    <TouchableOpacity style={[styles.actionBtn, styles.punchOutBtn]} onPress={handlePunchOut} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                                <Text style={styles.actionBtnIcon}>🔴</Text>
                                <Text style={styles.actionBtnText}>Punch Out</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : null}

                {isPunchedOut ? (
                    <View style={[styles.actionBtn, styles.completedBtn]}>
                        <Text style={styles.completedIcon}>✅</Text>
                        <Text style={styles.completedText}>Attendance Complete</Text>
                    </View>
                ) : null}
            </View>

            {/* History Section */}
            <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                    <View style={styles.historyTitleBar} />
                    <Text style={styles.historyTitle}>This Month's History</Text>
                </View>

                {histLoading ? (
                    <View style={styles.historyLoading}>
                        <ActivityIndicator color="#6366f1" size="small" />
                        <Text style={styles.historyLoadingText}>Loading history...</Text>
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.historyEmpty}>
                        <Text style={styles.historyEmptyIcon}>📋</Text>
                        <Text style={styles.historyEmptyText}>No records this month</Text>
                    </View>
                ) : (
                    history.map((r, i) => (
                        <View key={r._id || i} style={[styles.histRow, i < history.length - 1 ? styles.histBorder : null]}>
                            <View style={styles.histDateSection}>
                                <Text style={styles.histDateText}>{fmtDate(r.date)}</Text>
                                <View style={[styles.histStatus, {
                                    backgroundColor: r.status === 'present' ? '#22c55e15' :
                                        r.status === 'half_day' ? '#f59e0b15' : '#ef444415'
                                }]}>
                                    <View style={[styles.histStatusDot, {
                                        backgroundColor: r.status === 'present' ? '#22c55e' :
                                            r.status === 'half_day' ? '#f59e0b' : '#ef4444'
                                    }]} />
                                    <Text style={[styles.histStatusText, {
                                        color: r.status === 'present' ? '#22c55e' :
                                            r.status === 'half_day' ? '#f59e0b' : '#ef4444'
                                    }]}>
                                        {r.status === 'present' ? 'Present' :
                                            r.status === 'half_day' ? 'Half Day' : 'Absent'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.histTimes}>
                                <View style={styles.histTimeItem}>
                                    <Text style={styles.histTimeIcon}>🟢</Text>
                                    <Text style={styles.histIn}>{fmt(r.punchIn?.time) || '—'}</Text>
                                </View>
                                <View style={styles.histTimeItem}>
                                    <Text style={styles.histTimeIcon}>🔴</Text>
                                    <Text style={styles.histOut}>{fmt(r.punchOut?.time) || '—'}</Text>
                                </View>
                            </View>
                            <View style={styles.histHoursBox}>
                                <Text style={styles.histHoursIcon}>⏱️</Text>
                                <Text style={styles.histHours}>
                                    {r.hoursWorked ? fmtHours(r.hoursWorked) : '—'}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 20,
        backgroundColor: '#0f172a',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#6366f120',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6366f140',
    },
    headerIconText: { fontSize: 24 },

    dateBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    dateItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateIcon: { fontSize: 16 },
    dateText: { color: '#1e293b', fontSize: 14, fontWeight: '500' },
    dateDivider: { width: 1, height: 20, backgroundColor: '#e2e8f0', marginHorizontal: 16 },

    todayCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    todayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    todayLabel: { color: '#1e293b', fontWeight: '700', fontSize: 16 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusIcon: { fontSize: 12 },
    statusText: { fontWeight: '700', fontSize: 13 },

    punchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    punchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    punchInBox: { backgroundColor: '#22c55e08', borderColor: '#22c55e20' },
    punchOutBox: { backgroundColor: '#ef444408', borderColor: '#ef444420' },
    punchBoxIcon: { fontSize: 24 },
    punchBoxLabel: { color: '#64748b', fontSize: 11, marginBottom: 4 },
    punchBoxTime: { fontWeight: '700', fontSize: 16 },
    locationHint: { color: '#94a3b8', fontSize: 9, marginTop: 4 },

    elapsedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3b82f608',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3b82f620',
    },
    totalBox: { backgroundColor: '#6366f108', borderColor: '#6366f620' },
    elapsedIcon: { fontSize: 16 },
    elapsedText: { color: '#3b82f6', fontSize: 14 },
    elapsedValue: { fontWeight: '800' },

    locBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    locBtnIdle: { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    locBtnGot: { borderColor: '#22c55e40', backgroundColor: '#22c55e08' },
    locBtnDenied: { borderColor: '#ef444440', backgroundColor: '#ef444408' },
    locBtnIcon: { fontSize: 16 },
    locBtnText: { fontSize: 13, fontWeight: '500' },
    locBtnTextIdle: { color: '#64748b' },
    locBtnTextGot: { color: '#22c55e' },
    locBtnTextDenied: { color: '#ef4444' },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
    },
    punchInBtn: { backgroundColor: '#22c55e' },
    punchOutBtn: { backgroundColor: '#ef4444' },
    completedBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    actionBtnIcon: { fontSize: 18 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    completedIcon: { fontSize: 18 },
    completedText: { color: '#64748b', fontWeight: '600', fontSize: 16 },

    historyCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    historyTitleBar: { width: 4, height: 18, backgroundColor: '#6366f1', borderRadius: 2, marginRight: 10 },
    historyTitle: { color: '#1e293b', fontWeight: '700', fontSize: 16 },
    historyLoading: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    historyLoadingText: { color: '#64748b', fontSize: 13 },
    historyEmpty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    historyEmptyIcon: { fontSize: 48, opacity: 0.5 },
    historyEmptyText: { color: '#94a3b8', fontSize: 14 },

    histRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    histBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    histDateSection: { flex: 1 },
    histDateText: { color: '#1e293b', fontWeight: '600', fontSize: 13, marginBottom: 6 },
    histStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    histStatusDot: { width: 6, height: 6, borderRadius: 3 },
    histStatusText: { fontSize: 10, fontWeight: '600' },

    histTimes: { flex: 1, gap: 6 },
    histTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    histTimeIcon: { fontSize: 10 },
    histIn: { color: '#64748b', fontSize: 12 },
    histOut: { color: '#64748b', fontSize: 12 },

    histHoursBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6366f108', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    histHoursIcon: { fontSize: 10 },
    histHours: { color: '#6366f1', fontWeight: '700', fontSize: 12 },
});