import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow } from '../theme';

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

const StatusPill = ({ status }) => {
    const cfg = {
        Connected: { bg: C.greenSoft, color: C.green },
        Missed: { bg: C.redSoft, color: C.red },
        Rejected: { bg: C.amberSoft, color: C.amber },
    };
    const c = cfg[status] || cfg.Missed;
    return (
        <View style={[styles.pill, { backgroundColor: c.bg }]}>
            <Text style={[styles.pillText, { color: c.color }]}>{status}</Text>
        </View>
    );
};

const MetricCard = ({ title, value, icon, color, soft, change, up }) => (
    <View style={[styles.metricCard, { backgroundColor: C.surface }]}>
        <View style={[styles.metricIcon, { backgroundColor: soft }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
        {change !== undefined && (
            <View style={[styles.changePill, { backgroundColor: up ? C.greenSoft : C.redSoft }]}>
                <Text style={[styles.changeText, { color: up ? C.green : C.red }]}>
                    {up ? '↑' : '↓'} {change}
                </Text>
            </View>
        )}
    </View>
);

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
            const [dashRes, progressRes] = await Promise.allSettled([
                api.getDashboardStats(),
                api.getMyProgress(),
            ]);
            if (dashRes.status === 'fulfilled') setData(dashRes.value);
            else setError('Dashboard failed to load.');
            if (progressRes.status === 'fulfilled') setProgress(progressRes.value);
        } catch {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    const { summary, weeklyTrend, recentCalls, topAgents } = data || {};
    const maxTotal = weeklyTrend ? Math.max(...weeklyTrend.map(d => d.total), 1) : 1;

    const metrics = summary ? [
        { title: 'Total Calls', value: summary.totalCalls?.toLocaleString() || '0', icon: '📞', color: C.primary, soft: C.primarySoft, change: `${summary.connectRate || 0}%`, up: true },
        { title: 'Incoming', value: summary.incomingCalls?.toLocaleString() || '0', icon: '↙️', color: C.blue, soft: C.blueSoft, change: '+8%', up: true },
        { title: 'Outgoing', value: summary.outgoingCalls?.toLocaleString() || '0', icon: '↗️', color: C.purple, soft: C.purpleSoft, change: '+3%', up: true },
        { title: 'Missed', value: summary.missedCalls?.toLocaleString() || '0', icon: '⚠️', color: C.red, soft: C.redSoft, change: '-4.6%', up: false },
    ] : [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} />}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good day 👋</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <View style={styles.rolePill}>
                        <Text style={styles.roleText}>{user?.role || ''}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Sign out</Text>
                </TouchableOpacity>
            </View>

            {/* Error */}
            {!!error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorMsg}>⚠️  {error}</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Text style={styles.retryLink}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Metrics */}
            <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>
            <View style={styles.metricsGrid}>
                {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
            </View>

            {/* Connect Rate */}
            {summary?.connectRate !== undefined && (
                <View style={styles.card}>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardTitle}>Connect Rate</Text>
                        <Text style={[styles.boldVal, { color: C.primary }]}>{summary.connectRate}%</Text>
                    </View>
                    <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${Math.min(summary.connectRate, 100)}%`, backgroundColor: C.primary }]} />
                    </View>
                </View>
            )}

            {/* Progress */}
            {progress && (
                <>
                    <Text style={styles.sectionLabel}>TARGET PROGRESS</Text>
                    {[
                        { label: "Today's Target", data: progress.daily, color: C.blue },
                        { label: 'Monthly Target', data: progress.monthly, color: C.purple },
                    ].map(({ label, data: d, color }) => (
                        <View key={label} style={styles.card}>
                            <View style={styles.cardRow}>
                                <Text style={styles.cardTitle}>{label}</Text>
                                <Text style={styles.textSub}>{d?.achieved || 0} / {d?.target || 0}</Text>
                            </View>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${Math.min(d?.percentage || 0, 100)}%`, backgroundColor: color }]} />
                            </View>
                            <Text style={[styles.pctText, { color }]}>{d?.percentage || 0}% completed</Text>
                        </View>
                    ))}
                </>
            )}

            {/* Weekly Chart */}
            {weeklyTrend && weeklyTrend.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weekly Activity</Text>
                    <View style={styles.chartRow}>
                        {weeklyTrend.map((d, i) => {
                            const h = Math.max(((d.total / maxTotal) * 80), 4);
                            return (
                                <View key={i} style={styles.barCol}>
                                    <Text style={styles.barValLabel}>{d.total}</Text>
                                    <View style={[styles.chartBar, { height: h }]} />
                                    <Text style={styles.barDayLabel}>{d.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Top Agents */}
            {topAgents && topAgents.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Agents</Text>
                    {topAgents.slice(0, 5).map((agent, i) => {
                        const rate = agent.calls > 0 ? Math.round((agent.connected / agent.calls) * 100) : 0;
                        return (
                            <View key={i} style={styles.agentRow}>
                                <View style={[styles.avatar, { backgroundColor: C.primarySoft }]}>
                                    <Text style={[styles.avatarText, { color: C.primary }]}>
                                        {(agent.name || 'U').charAt(0)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.agentTop}>
                                        <Text style={styles.agentName}>{agent.name}</Text>
                                        <Text style={styles.agentRate}>{rate}%</Text>
                                    </View>
                                    <View style={styles.barBg}>
                                        <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: C.primary }]} />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Recent Calls */}
            {recentCalls && recentCalls.length > 0 && (
                <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                    <Text style={[styles.cardTitle, { paddingHorizontal: 16, paddingTop: 16 }]}>Recent Calls</Text>
                    {recentCalls.slice(0, 8).map((call, i) => (
                        <View
                            key={i}
                            style={[styles.callRow, i < recentCalls.length - 1 && styles.callDivider]}
                        >
                            <View style={styles.callAvatar}>
                                <Text style={styles.callAvatarText}>{(call.name || 'U').charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.callName}>{call.name || 'Unknown'}</Text>
                                <Text style={styles.callNumber}>{call.number}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                <StatusPill status={call.status} />
                                <Text style={styles.callTime}>{call.time || fmtTime(call.calledAt)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingBottom: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
        marginBottom: 16,
    },
    greeting: { fontSize: 13, color: C.textSub },
    userName: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 2 },
    rolePill: { marginTop: 6, backgroundColor: C.primarySoft, borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3 },
    roleText: { fontSize: 11, fontWeight: '600', color: C.primary, textTransform: 'capitalize' },
    logoutBtn: { backgroundColor: C.redSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
    logoutText: { color: C.red, fontWeight: '700', fontSize: 13 },

    errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.redSoft, marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 12 },
    errorMsg: { color: C.red, fontSize: 13 },
    retryLink: { color: C.red, fontWeight: '700' },

    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 12 },
    metricCard: {
        width: '47%', borderRadius: 16, padding: 16,
        marginHorizontal: 2, ...shadow,
    },
    metricIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    metricValue: { fontSize: 26, fontWeight: '800', color: C.text },
    metricTitle: { fontSize: 12, color: C.textSub, marginTop: 2 },
    changePill: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    changeText: { fontSize: 11, fontWeight: '700' },

    card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
    boldVal: { fontSize: 16, fontWeight: '800' },
    textSub: { fontSize: 13, color: C.textSub },

    barBg: { height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    pctText: { fontSize: 12, marginTop: 6, fontWeight: '600' },

    chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 110, justifyContent: 'space-between' },
    barCol: { flex: 1, alignItems: 'center' },
    barValLabel: { color: C.textMuted, fontSize: 10, marginBottom: 4 },
    chartBar: { width: 22, backgroundColor: C.primary, borderRadius: 6, minHeight: 4 },
    barDayLabel: { color: C.textSub, fontSize: 11, marginTop: 6 },

    agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    agentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    agentName: { fontSize: 14, fontWeight: '600', color: C.text },
    agentRate: { fontSize: 13, fontWeight: '700', color: C.textSub },

    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontWeight: '700', fontSize: 14 },

    callRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    callDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
    callAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    callAvatarText: { color: C.primary, fontWeight: '700', fontSize: 14 },
    callName: { fontSize: 14, fontWeight: '600', color: C.text },
    callNumber: { fontSize: 12, color: C.textSub, marginTop: 2 },
    callTime: { fontSize: 11, color: C.textMuted },

    pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
    pillText: { fontSize: 11, fontWeight: '700' },
});
