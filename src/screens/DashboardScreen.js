// import React, { useState, useEffect, useContext } from 'react';
// import {
//     View, Text, ScrollView, StyleSheet,
//     TouchableOpacity, ActivityIndicator, RefreshControl
// } from 'react-native';
// import { AuthContext } from '../context/AuthContext';
// import { api } from '../services/api';

// export default function DashboardScreen() {
//     const { user, logout } = useContext(AuthContext);
//     const [stats, setStats] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);

//     const fetchStats = async () => {
//         try {
//             const data = await api.getDashboardStats();
//             setStats(data);
//         } catch (e) {
//             console.log('Stats error:', e);
//         }
//         setLoading(false);
//         setRefreshing(false);
//     };

//     useEffect(() => { fetchStats(); }, []);

//     const onRefresh = () => { setRefreshing(true); fetchStats(); };

//     const StatCard = ({ title, value, icon, color }) => (
//         <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
//             <Text style={styles.cardIcon}>{icon}</Text>
//             <Text style={styles.cardValue}>{value ?? '0'}</Text>
//             <Text style={styles.cardTitle}>{title}</Text>
//         </View>
//     );

//     if (loading) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" color="#6366f1" />
//             </View>
//         );
//     }

//     return (
//         <ScrollView
//             style={styles.container}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
//         >
//             {/* Header */}
//             <View style={styles.header}>
//                 <View>
//                     <Text style={styles.welcome}>Welcome back 👋</Text>
//                     <Text style={styles.userName}>{user?.name || 'User'}</Text>
//                     <Text style={styles.userRole}>{user?.role || ''}</Text>
//                 </View>
//                 <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
//                     <Text style={styles.logoutText}>Logout</Text>
//                 </TouchableOpacity>
//             </View>

//             {/* Stats Grid */}
//             <Text style={styles.sectionTitle}>Today's Overview</Text>
//             <View style={styles.grid}>
//                 <StatCard
//                     title="Total Calls"
//                     value={stats?.totalCalls}
//                     icon="📞"
//                     color="#6366f1"
//                 />
//                 <StatCard
//                     title="Connected"
//                     value={stats?.connectedCalls}
//                     icon="✅"
//                     color="#22c55e"
//                 />
//                 <StatCard
//                     title="Missed"
//                     value={stats?.missedCalls}
//                     icon="❌"
//                     color="#ef4444"
//                 />
//                 <StatCard
//                     title="Duration"
//                     value={stats?.totalDuration ? `${stats.totalDuration}m` : '0m'}
//                     icon="⏱️"
//                     color="#f59e0b"
//                 />
//             </View>

//             {/* Extra Info */}
//             {stats?.followUps > 0 && (
//                 <View style={styles.alertBox}>
//                     <Text style={styles.alertText}>🔔 {stats.followUps} Follow-ups pending today!</Text>
//                 </View>
//             )}

//             <View style={{ height: 30 }} />
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
//     header: {
//         flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
//         padding: 20, paddingTop: 50, backgroundColor: '#1e293b',
//         borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
//         marginBottom: 20,
//     },
//     welcome: { color: '#94a3b8', fontSize: 14 },
//     userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
//     userRole: { color: '#6366f1', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
//     logoutBtn: {
//         backgroundColor: '#ef444420', paddingHorizontal: 14,
//         paddingVertical: 8, borderRadius: 8,
//     },
//     logoutText: { color: '#ef4444', fontWeight: '600' },
//     sectionTitle: { color: '#94a3b8', fontSize: 14, paddingHorizontal: 20, marginBottom: 12 },
//     grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
//     card: {
//         backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
//         margin: 8, width: '44%', alignItems: 'flex-start',
//     },
//     cardIcon: { fontSize: 28, marginBottom: 8 },
//     cardValue: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
//     cardTitle: { color: '#64748b', fontSize: 13, marginTop: 4 },
//     alertBox: {
//         backgroundColor: '#f59e0b20', margin: 20, padding: 14,
//         borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b',
//     },
//     alertText: { color: '#f59e0b', fontWeight: '600' },
// });


import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

// ── Helper ─────────────────────────────────────────────────────
const fmtDuration = (s) => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const fmtTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardValue}>{value ?? '0'}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
    </View>
);

// ── Status Badge ───────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const cfg = {
        Connected: { bg: '#22c55e20', color: '#22c55e' },
        Missed: { bg: '#ef444420', color: '#ef4444' },
        Rejected: { bg: '#f59e0b20', color: '#f59e0b' },
    };
    const c = cfg[status] || cfg.Missed;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
        </View>
    );
};

export default function DashboardScreen() {
    const { user, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setError('');
        try {
            // Both calls at same time
            const [dashRes, progressRes] = await Promise.allSettled([
                api.getDashboardStats(),
                api.getMyProgress(),
            ]);

            if (dashRes.status === 'fulfilled') {
                setData(dashRes.value);
            } else {
                setError('Dashboard load nahi hua');
            }

            if (progressRes.status === 'fulfilled') {
                setProgress(progressRes.value);
            }
        } catch (e) {
            setError('Server se connect nahi ho pa raha');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    // Backend se aane wala data structure (website ke same)
    // data.summary = { totalCalls, incomingCalls, outgoingCalls, missedCalls, connectedCalls, connectRate, avgDuration }
    // data.weeklyTrend = [{ day, total, incoming, outgoing, missed }]
    // data.recentCalls = [{ name, number, type, status, duration, time, avatar }]
    // data.topAgents = [{ name, calls, connected, avatar, color }]
    const { summary, weeklyTrend, recentCalls, topAgents } = data || {};

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
            {/* ── Header ── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Welcome back 👋</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userRole}>{user?.role || ''}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Text style={styles.retryText}>Retry →</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* ── Summary Stats ── */}
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.grid}>
                <StatCard title="Total Calls" value={summary?.totalCalls} icon="📞" color="#6366f1" />
                <StatCard title="Connected" value={summary?.connectedCalls} icon="✅" color="#22c55e" />
                <StatCard title="Missed" value={summary?.missedCalls} icon="❌" color="#ef4444" />
                <StatCard title="Incoming" value={summary?.incomingCalls} icon="↙️" color="#3b82f6" />
                <StatCard title="Outgoing" value={summary?.outgoingCalls} icon="↗️" color="#8b5cf6" />
                <StatCard title="Avg Duration" value={summary?.avgDuration || '0s'} icon="⏱️" color="#f59e0b" />
            </View>

            {/* ── Connect Rate ── */}
            {summary?.connectRate !== undefined && (
                <View style={styles.rateCard}>
                    <Text style={styles.rateLabel}>Connect Rate</Text>
                    <View style={styles.rateBarBg}>
                        <View style={[styles.rateBarFill, { width: `${Math.min(summary.connectRate, 100)}%` }]} />
                    </View>
                    <Text style={styles.rateValue}>{summary.connectRate}%</Text>
                </View>
            )}

            {/* ── Target Progress ── */}
            {progress && (
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Target Progress</Text>
                    {/* Daily */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>🎯 Today's Target</Text>
                            <Text style={styles.progressNumbers}>{progress.daily?.achieved || 0} / {progress.daily?.target || 0}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(progress.daily?.percentage || 0, 100)}%`, backgroundColor: '#3b82f6' }]} />
                        </View>
                        <Text style={styles.progressPct}>{progress.daily?.percentage || 0}% completed</Text>
                    </View>
                    {/* Monthly */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>📊 Monthly Target</Text>
                            <Text style={styles.progressNumbers}>{progress.monthly?.achieved || 0} / {progress.monthly?.target || 0}</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(progress.monthly?.percentage || 0, 100)}%`, backgroundColor: '#8b5cf6' }]} />
                        </View>
                        <Text style={styles.progressPct}>{progress.monthly?.percentage || 0}% completed</Text>
                    </View>
                </View>
            )}

            {/* ── Weekly Chart (Simple Bars) ── */}
            {weeklyTrend && weeklyTrend.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <View style={styles.chartCard}>
                        <View style={styles.chartBars}>
                            {weeklyTrend.map((d, i) => {
                                const maxTotal = Math.max(...weeklyTrend.map(x => x.total), 1);
                                const height = Math.max(((d.total / maxTotal) * 80), 4);
                                return (
                                    <View key={i} style={styles.barColumn}>
                                        <Text style={styles.barValue}>{d.total}</Text>
                                        <View style={[styles.bar, { height }]} />
                                        <Text style={styles.barLabel}>{d.day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                                <Text style={styles.legendText}>Total calls per day</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* ── Top Agents ── */}
            {topAgents && topAgents.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Agents</Text>
                    <View style={styles.agentCard}>
                        {topAgents.slice(0, 5).map((agent, i) => {
                            const rate = agent.calls > 0 ? Math.round((agent.connected / agent.calls) * 100) : 0;
                            return (
                                <View key={i} style={styles.agentRow}>
                                    <View style={[styles.agentAvatar, { backgroundColor: agent.color || '#6366f1' }]}>
                                        <Text style={styles.agentAvatarText}>{agent.avatar || (agent.name || 'U').charAt(0)}</Text>
                                    </View>
                                    <View style={styles.agentInfo}>
                                        <Text style={styles.agentName}>{agent.name}</Text>
                                        <View style={styles.agentBarBg}>
                                            <View style={[styles.agentBarFill, { width: `${rate}%`, backgroundColor: agent.color || '#6366f1' }]} />
                                        </View>
                                    </View>
                                    <Text style={styles.agentRate}>{rate}%</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* ── Recent Calls ── */}
            {recentCalls && recentCalls.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Calls</Text>
                    <View style={styles.recentCard}>
                        {recentCalls.slice(0, 8).map((call, i) => (
                            <View key={i} style={[styles.recentRow, i < recentCalls.length - 1 && styles.recentBorder]}>
                                <View style={styles.recentAvatar}>
                                    <Text style={styles.recentAvatarText}>{call.avatar || (call.name || 'U').charAt(0)}</Text>
                                </View>
                                <View style={styles.recentInfo}>
                                    <Text style={styles.recentName}>{call.name || 'Unknown'}</Text>
                                    <Text style={styles.recentNumber}>{call.number}</Text>
                                </View>
                                <View style={styles.recentRight}>
                                    <StatusBadge status={call.status} />
                                    <Text style={styles.recentTime}>{call.time || fmtTime(call.calledAt)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: 20, paddingTop: 50, backgroundColor: '#1e293b',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 20,
    },
    welcome: { color: '#94a3b8', fontSize: 14 },
    userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
    userRole: { color: '#6366f1', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    logoutBtn: { backgroundColor: '#ef444420', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    logoutText: { color: '#ef4444', fontWeight: '600' },
    errorBox: { backgroundColor: '#ef444420', margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' },
    errorText: { color: '#ef4444', fontSize: 14 },
    retryText: { color: '#ef4444', fontWeight: '600', marginTop: 8 },
    sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
    card: {
        backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
        margin: 6, width: '44%', borderLeftWidth: 4,
    },
    cardIcon: { fontSize: 24, marginBottom: 8 },
    cardValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    cardTitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
    rateCard: { backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 4, padding: 16, borderRadius: 12 },
    rateLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
    rateBarBg: { backgroundColor: '#0f172a', borderRadius: 4, height: 8, marginBottom: 6 },
    rateBarFill: { backgroundColor: '#6366f1', height: 8, borderRadius: 4 },
    rateValue: { color: '#6366f1', fontWeight: 'bold', fontSize: 16 },
    progressSection: { marginTop: 8 },
    progressCard: { backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
    progressNumbers: { color: '#94a3b8', fontSize: 13 },
    progressBarBg: { backgroundColor: '#0f172a', borderRadius: 4, height: 8, marginBottom: 6 },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressPct: { color: '#64748b', fontSize: 12 },
    section: { marginTop: 8 },
    chartCard: { backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12 },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, justifyContent: 'space-between' },
    barColumn: { flex: 1, alignItems: 'center', gap: 4 },
    barValue: { color: '#64748b', fontSize: 10, marginBottom: 4 },
    bar: { width: 20, backgroundColor: '#6366f1', borderRadius: 4, minHeight: 4 },
    barLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
    chartLegend: { flexDirection: 'row', marginTop: 12, gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: '#64748b', fontSize: 12 },
    agentCard: { backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12 },
    agentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    agentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    agentAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    agentInfo: { flex: 1 },
    agentName: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 4 },
    agentBarBg: { backgroundColor: '#0f172a', borderRadius: 3, height: 6 },
    agentBarFill: { height: 6, borderRadius: 3 },
    agentRate: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
    recentCard: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
    recentRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    recentBorder: { borderBottomWidth: 1, borderBottomColor: '#0f172a' },
    recentAvatar: { width: 36, height: 36, backgroundColor: '#6366f120', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    recentAvatarText: { color: '#6366f1', fontWeight: 'bold', fontSize: 14 },
    recentInfo: { flex: 1 },
    recentName: { color: '#fff', fontWeight: '600', fontSize: 14 },
    recentNumber: { color: '#64748b', fontSize: 12, marginTop: 2 },
    recentRight: { alignItems: 'flex-end', gap: 4 },
    recentTime: { color: '#475569', fontSize: 11, marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, fontWeight: '600' },
});