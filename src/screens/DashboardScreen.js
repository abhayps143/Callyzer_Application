import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

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

const TypeBadge = ({ type }) => {
    const isIncoming = type === 'Incoming';
    return (
        <View style={[styles.badge, { backgroundColor: isIncoming ? '#3b82f620' : '#8b5cf620' }]}>
            <Text style={[styles.badgeText, { color: isIncoming ? '#3b82f6' : '#8b5cf6' }]}>
                {isIncoming ? '↙ Incoming' : '↗ Outgoing'}
            </Text>
        </View>
    );
};

const SummaryCard = ({ title, value, change, up, icon, color }) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
        <View style={styles.summaryCardHeader}>
            <View style={[styles.summaryIconBox, { backgroundColor: color + '20' }]}>
                <Text style={[styles.summaryIcon, { color }]}>{icon}</Text>
            </View>
            <View style={[styles.changeBadge, { backgroundColor: up ? '#22c55e20' : '#ef444420' }]}>
                <Text style={[styles.changeText, { color: up ? '#22c55e' : '#ef4444' }]}>
                    {up ? '↑' : '↓'} {change}
                </Text>
            </View>
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{title}</Text>
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
            else setError('Dashboard load nahi hua');

            if (progressRes.status === 'fulfilled') setProgress(progressRes.value);
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

    const { summary, weeklyTrend, recentCalls, topAgents } = data || {};

    const summaryCards = summary ? [
        { title: 'Total Calls', value: summary.totalCalls?.toLocaleString() || '0', change: `${summary.connectRate || 0}%`, up: true, icon: '📞', color: '#6366f1' },
        { title: 'Incoming', value: summary.incomingCalls?.toLocaleString() || '0', change: '+8%', up: true, icon: '↙️', color: '#3b82f6' },
        { title: 'Outgoing', value: summary.outgoingCalls?.toLocaleString() || '0', change: '+3%', up: true, icon: '↗️', color: '#8b5cf6' },
        { title: 'Missed', value: summary.missedCalls?.toLocaleString() || '0', change: '-4.6%', up: false, icon: '❌', color: '#ef4444' },
    ] : [];

    const maxTotal = weeklyTrend ? Math.max(...weeklyTrend.map(d => d.total), 1) : 1;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
            {/* Header */}
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

            {/* Summary Cards */}
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.summaryGrid}>
                {summaryCards.map((card, i) => (
                    <SummaryCard key={i} {...card} />
                ))}
            </View>

            {/* Connect Rate */}
            {summary?.connectRate !== undefined && (
                <View style={styles.rateCard}>
                    <Text style={styles.rateLabel}>Connect Rate</Text>
                    <View style={styles.rateBarBg}>
                        <View style={[styles.rateBarFill, { width: `${Math.min(summary.connectRate, 100)}%` }]} />
                    </View>
                    <Text style={styles.rateValue}>{summary.connectRate}%</Text>
                </View>
            )}

            {/* Progress Cards */}
            {progress && (
                <View>
                    <Text style={styles.sectionTitle}>Target Progress</Text>
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

            {/* Weekly Bar Chart */}
            {weeklyTrend && weeklyTrend.length > 0 && (
                <View style={styles.chartCard}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <View style={styles.chartBars}>
                        {weeklyTrend.map((d, i) => {
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
                </View>
            )}

            {/* Top Agents */}
            {topAgents && topAgents.length > 0 && (
                <View style={styles.agentCard}>
                    <Text style={styles.sectionTitle}>Top Agents</Text>
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
            )}

            {/* Recent Calls */}
            {recentCalls && recentCalls.length > 0 && (
                <View style={styles.recentCard}>
                    <Text style={styles.sectionTitle}>Recent Calls</Text>
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
    errorBox: { backgroundColor: '#ef444420', margin: 16, padding: 14, borderRadius: 12 },
    errorText: { color: '#ef4444', fontSize: 14 },
    retryText: { color: '#ef4444', fontWeight: '600', marginTop: 8 },
    sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
    summaryCard: {
        backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
        margin: 6, width: '44%', borderLeftWidth: 3,
    },
    summaryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    summaryIcon: { fontSize: 20 },
    changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    changeText: { fontSize: 11, fontWeight: '600' },
    summaryValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    summaryLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
    rateCard: { backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
    rateLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
    rateBarBg: { backgroundColor: '#0f172a', borderRadius: 4, height: 8, marginBottom: 6 },
    rateBarFill: { backgroundColor: '#6366f1', height: 8, borderRadius: 4 },
    rateValue: { color: '#6366f1', fontWeight: 'bold', fontSize: 16 },
    progressCard: { backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
    progressNumbers: { color: '#94a3b8', fontSize: 13 },
    progressBarBg: { backgroundColor: '#0f172a', borderRadius: 4, height: 8, marginBottom: 6 },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressPct: { color: '#64748b', fontSize: 12 },
    chartCard: { backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, justifyContent: 'space-between' },
    barColumn: { flex: 1, alignItems: 'center', gap: 4 },
    barValue: { color: '#64748b', fontSize: 10, marginBottom: 4 },
    bar: { width: 20, backgroundColor: '#6366f1', borderRadius: 4, minHeight: 4 },
    barLabel: { color: '#64748b', fontSize: 11, marginTop: 4 },
    agentCard: { backgroundColor: '#1e293b', marginHorizontal: 16, padding: 16, borderRadius: 12, marginBottom: 8 },
    agentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    agentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    agentAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    agentInfo: { flex: 1 },
    agentName: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 4 },
    agentBarBg: { backgroundColor: '#0f172a', borderRadius: 3, height: 6 },
    agentBarFill: { height: 6, borderRadius: 3 },
    agentRate: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
    recentCard: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
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