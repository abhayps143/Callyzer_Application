import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, RefreshControl
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
            </View>
        );
    }

    const statusText = isPunchedOut ? 'Completed ✅' : isPunchedIn ? '🟢 Working' : 'Not Started';
    const statusColor = isPunchedOut ? '#6366f1' : isPunchedIn ? '#22c55e' : '#64748b';

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
            <View style={styles.header}>
                <Text style={styles.title}>📍 Attendance</Text>
                <Text style={styles.date}>{fmtDate(today)} · {clock.toLocaleTimeString('en-IN', { hour12: true })}</Text>
            </View>

            <View style={styles.todayCard}>
                <View style={styles.todayHeader}>
                    <Text style={styles.todayLabel}>Today's Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>

                <View style={styles.punchRow}>
                    <View style={[styles.punchBox, { backgroundColor: '#22c55e15', borderColor: '#22c55e30' }]}>
                        <Text style={styles.punchBoxLabel}>Punch In</Text>
                        <Text style={[styles.punchBoxTime, { color: '#22c55e' }]}>{fmt(record?.punchIn?.time)}</Text>
                        {record?.punchIn?.location?.latitude ? (
                            <Text style={styles.locationHint}>📍 Location saved</Text>
                        ) : null}
                    </View>
                    <View style={[styles.punchBox, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
                        <Text style={styles.punchBoxLabel}>Punch Out</Text>
                        <Text style={[styles.punchBoxTime, { color: '#ef4444' }]}>{fmt(record?.punchOut?.time)}</Text>
                    </View>
                </View>

                {elapsed !== null ? (
                    <View style={styles.elapsedBox}>
                        <Text style={styles.elapsedText}>
                            ⏱ Time elapsed: <Text style={{ fontWeight: 'bold' }}>{fmtHours(elapsed)}</Text>
                        </Text>
                    </View>
                ) : null}

                {isPunchedOut && record?.hoursWorked ? (
                    <View style={[styles.elapsedBox, { backgroundColor: '#6366f115' }]}>
                        <Text style={[styles.elapsedText, { color: '#6366f1' }]}>
                            ✅ Total worked: <Text style={{ fontWeight: 'bold' }}>{fmtHours(record.hoursWorked)}</Text>
                        </Text>
                    </View>
                ) : null}

                {!isPunchedOut ? (
                    <TouchableOpacity
                        style={[
                            styles.locBtn,
                            locStatus === 'got' ? { backgroundColor: '#22c55e15', borderColor: '#22c55e40' } : 
                            locStatus === 'denied' ? { backgroundColor: '#ef444415', borderColor: '#ef444440' } : 
                            { borderColor: '#334155' }
                        ]}
                        onPress={handleFetchLocation}
                        disabled={locStatus === 'fetching' || locStatus === 'got'}
                    >
                        <Text style={[
                            styles.locBtnText,
                            locStatus === 'got' ? { color: '#22c55e' } : 
                            locStatus === 'denied' ? { color: '#ef4444' } : 
                            { color: '#94a3b8' }
                        ]}>
                            {locStatus === 'fetching' ? '⏳ Fetching GPS...' : 
                             locStatus === 'got' ? `✅ GPS Ready (±${location?.accuracy}m)` : 
                             locStatus === 'denied' ? '❌ Location denied' : 
                             '📍 Share My Location (Optional)'}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {!isPunchedIn ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={handlePunchIn} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🟢 Punch In</Text>}
                    </TouchableOpacity>
                ) : null}

                {isPunchedIn && !isPunchedOut ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={handlePunchOut} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🔴 Punch Out</Text>}
                    </TouchableOpacity>
                ) : null}

                {isPunchedOut ? (
                    <View style={[styles.actionBtn, { backgroundColor: '#1e293b' }]}>
                        <Text style={[styles.actionBtnText, { color: '#64748b' }]}>✅ Attendance Complete</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.historyCard}>
                <Text style={styles.historyTitle}>This Month's History</Text>
                {histLoading ? (
                    <ActivityIndicator color="#6366f1" style={{ marginVertical: 20 }} />
                ) : history.length === 0 ? (
                    <Text style={styles.historyEmpty}>Koi record nahi is mahine</Text>
                ) : (
                    history.map((r, i) => (
                        <View key={r._id || i} style={[styles.histRow, i < history.length - 1 ? styles.histBorder : null]}>
                            <View style={styles.histDate}>
                                <Text style={styles.histDateText}>{fmtDate(r.date)}</Text>
                                <View style={[styles.histStatus, { 
                                    backgroundColor: r.status === 'present' ? '#22c55e20' : 
                                                   r.status === 'half_day' ? '#f59e0b20' : '#ef444420' 
                                }]}>
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
                                <Text style={styles.histIn}>
                                    In: <Text style={{ color: '#22c55e' }}>{fmt(r.punchIn?.time)}</Text>
                                </Text>
                                <Text style={styles.histOut}>
                                    Out: <Text style={{ color: '#ef4444' }}>{fmt(r.punchOut?.time)}</Text>
                                </Text>
                            </View>
                            <Text style={styles.histHours}>
                                {r.hoursWorked ? fmtHours(r.hoursWorked) : '—'}
                            </Text>
                        </View>
                    ))
                )}
            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    header: { padding: 20, paddingTop: 50, backgroundColor: '#1e293b', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    date: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    todayCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
    todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    todayLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    statusText: { fontWeight: 'bold', fontSize: 13 },
    punchRow: { flexDirection: 'row', marginBottom: 16, justifyContent: 'space-between' },
    punchBox: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, marginHorizontal: 6 },
    punchBoxLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
    punchBoxTime: { fontWeight: 'bold', fontSize: 17 },
    locationHint: { color: '#64748b', fontSize: 10, marginTop: 4 },
    elapsedBox: { backgroundColor: '#3b82f615', padding: 12, borderRadius: 10, marginBottom: 12 },
    elapsedText: { color: '#3b82f6', fontSize: 14, textAlign: 'center' },
    locBtn: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
    locBtnText: { fontSize: 14 },
    actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    historyCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
    historyTitle: { color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 16 },
    historyEmpty: { color: '#64748b', textAlign: 'center', paddingVertical: 20 },
    histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    histBorder: { borderBottomWidth: 1, borderBottomColor: '#0f172a' },
    histDate: { flex: 1 },
    histDateText: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 4 },
    histStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
    histStatusText: { fontSize: 11, fontWeight: '600' },
    histTimes: { flex: 1, paddingHorizontal: 8 },
    histIn: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
    histOut: { color: '#94a3b8', fontSize: 12 },
    histHours: { color: '#6366f1', fontWeight: 'bold', fontSize: 13 },
});