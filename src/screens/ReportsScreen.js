import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { api } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────
const fmtDuration = (s) => {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'Last 3M' },
];

const avatarColors = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function ReportsScreen() {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchReports = useCallback(async () => {
        setError('');
        try {
            // Backend: GET /api/reports?range=month
            // Returns: { summaryCards, monthlySummary, weeklyTrend, callDistribution, agentPerformance }
            const res = await api.getReports(period);
            if (res.error || res.message?.includes('error')) {
                setError(res.message || 'Failed to load reports');
            } else {
                setData(res);
            }
        } catch (e) {
            setError('Server se connect nahi ho pa raha');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => {
        setLoading(true);
        fetchReports();
    }, [fetchReports]);

    const onRefresh = () => { setRefreshing(true); fetchReports(); };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }

    // Destructure exactly as backend sends
    const {
        summaryCards = [],
        monthlySummary = [],
        weeklyTrend = [],
        callDistribution = [],
        agentPerformance = [],
    } = data || {};

    const totalPie = callDistribution.reduce((s, d) => s + (d.value || 0), 0) || 1;

    // Simple bar chart helper
    const maxMonthly = Math.max(...monthlySummary.map(d => d.total || 0), 1);
    const maxWeekly = Math.max(...weeklyTrend.map(d => d.calls || 0), 1);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📊 Reports</Text>
                <Text style={styles.subtitle}>Call performance & analytics</Text>
            </View>

            {/* Period Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
                {PERIODS.map(p => (
                    <TouchableOpacity
                        key={p.key}
                        style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
                        onPress={() => setPeriod(p.key)}
                    >
                        <Text style={[styles.periodBtnText, period === p.key && styles.periodBtnTextActive]}>
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity onPress={fetchReports}>
                        <Text style={styles.retryText}>Retry →</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* ── Summary Cards ── */}
            {summaryCards.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.summaryGrid}>
                        {summaryCards.map((card, i) => {
                            const colors = ['#6366f1', '#22c55e', '#ef4444', '#8b5cf6'];
                            const c = colors[i % colors.length];
                            return (
                                <View key={i} style={[styles.summaryCard, { borderLeftColor: c }]}>
                                    <View style={styles.summaryCardHeader}>
                                        <Text style={[styles.summaryValue, { color: c }]}>{card.value}</Text>
                                        <View style={[styles.changeBadge, { backgroundColor: card.up ? '#22c55e20' : '#ef444420' }]}>
                                            <Text style={[styles.changeText, { color: card.up ? '#22c55e' : '#ef4444' }]}>
                                                {card.up ? '↑' : '↓'} {card.change || '0%'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.summaryLabel}>{card.title}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* ── Monthly Bar Chart ── */}
            {monthlySummary.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Call Volume</Text>
                    <View style={styles.chartCard}>
                        <View style={styles.chartLegend}>
                            {[{ color: '#3b82f6', label: 'Total' }, { color: '#22c55e', label: 'Connected' }, { color: '#ef4444', label: 'Missed' }].map(l => (
                                <View key={l.label} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                                    <Text style={styles.legendText}>{l.label}</Text>
                                </View>
                            ))}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.barChart}>
                                {monthlySummary.map((d, i) => {
                                    const h = Math.max(((d.total || 0) / maxMonthly) * 80, 4);
                                    const hConn = d.total ? ((d.connected || 0) / d.total) * h : 0;
                                    const hMiss = d.total ? ((d.missed || 0) / d.total) * h : 0;
                                    return (
                                        <View key={i} style={styles.barCol}>
                                            <Text style={styles.barTopValue}>{d.total || 0}</Text>
                                            <View style={[styles.barBlock, { height: h, backgroundColor: '#3b82f640' }]}>
                                                <View style={{ height: hMiss, backgroundColor: '#ef4444', borderRadius: 3 }} />
                                                <View style={{ height: hConn, backgroundColor: '#22c55e', borderRadius: 3 }} />
                                            </View>
                                            <Text style={styles.barXLabel}>{d.month}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* ── Call Distribution ── */}
            {callDistribution.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Call Distribution</Text>
                    <View style={styles.distCard}>
                        {callDistribution.map((d, i) => {
                            const pct = ((d.value / totalPie) * 100).toFixed(1);
                            return (
                                <View key={i} style={styles.distRow}>
                                    <View style={[styles.distDot, { backgroundColor: d.color || avatarColors[i % avatarColors.length] }]} />
                                    <Text style={styles.distLabel}>{d.name}</Text>
                                    <View style={styles.distBarBg}>
                                        <View style={[styles.distBarFill, { width: `${pct}%`, backgroundColor: d.color || avatarColors[i % avatarColors.length] }]} />
                                    </View>
                                    <Text style={styles.distValue}>{d.value}</Text>
                                    <Text style={styles.distPct}>{pct}%</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* ── Weekly Trend ── */}
            {weeklyTrend.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Trend</Text>
                    <View style={styles.chartCard}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.barChart}>
                                {weeklyTrend.map((d, i) => {
                                    const h = Math.max(((d.calls || 0) / maxWeekly) * 80, 4);
                                    return (
                                        <View key={i} style={styles.barCol}>
                                            <Text style={styles.barTopValue}>{d.calls || 0}</Text>
                                            <View style={[styles.barBlock, { height: h, backgroundColor: '#6366f1', borderRadius: 6 }]} />
                                            <Text style={styles.barXLabel}>{d.week}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* ── Agent Performance ── */}
            {agentPerformance.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Agent Performance</Text>
                    <View style={styles.agentList}>
                        {agentPerformance.map((agent, i) => (
                            <View key={i} style={[styles.agentRow, i < agentPerformance.length - 1 && styles.agentBorder]}>
                                <View style={[styles.agentAvatar, { backgroundColor: avatarColors[i % avatarColors.length] + '30' }]}>
                                    <Text style={[styles.agentAvatarText, { color: avatarColors[i % avatarColors.length] }]}>
                                        {(agent.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.agentInfo}>
                                    <Text style={styles.agentName}>{agent.name}</Text>
                                    <View style={styles.agentStats}>
                                        <Text style={styles.agentStatText}>📞 {agent.calls} calls</Text>
                                        <Text style={styles.agentStatText}>✅ {agent.connected}</Text>
                                        <Text style={styles.agentStatText}>❌ {agent.missed}</Text>
                                    </View>
                                    <View style={styles.agentBarBg}>
                                        <View style={[styles.agentBarFill, {
                                            width: `${agent.rate || 0}%`,
                                            backgroundColor: agent.rate >= 88 ? '#22c55e' : agent.rate >= 83 ? '#3b82f6' : '#f59e0b'
                                        }]} />
                                    </View>
                                </View>
                                <View style={styles.agentRight}>
                                    <Text style={[styles.agentRate, { color: agent.rate >= 88 ? '#22c55e' : agent.rate >= 83 ? '#3b82f6' : '#f59e0b' }]}>
                                        {agent.rate || 0}%
                                    </Text>
                                    <Text style={styles.agentDuration}>{agent.avgDuration || '0s'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Empty state */}
            {!loading && !error && summaryCards.length === 0 && agentPerformance.length === 0 && (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyText}>Is period ke liye koi data nahi</Text>
                    <Text style={styles.emptySubText}>Koi aur period select karo</Text>
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
        padding: 20, paddingTop: 50, backgroundColor: '#1e293b',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 8,
    },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    periodRow: { flexGrow: 0, marginVertical: 8 },
    periodBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', marginRight: 8,
    },
    periodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    periodBtnText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    periodBtnTextActive: { color: '#fff' },
    errorBox: { backgroundColor: '#ef444420', margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' },
    errorText: { color: '#ef4444', fontSize: 14 },
    retryText: { color: '#ef4444', fontWeight: '600', marginTop: 8 },
    section: { marginBottom: 8 },
    sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
    summaryCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 6, width: '44%', borderLeftWidth: 3 },
    summaryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    summaryValue: { fontSize: 24, fontWeight: 'bold' },
    changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    changeText: { fontSize: 11, fontWeight: '600' },
    summaryLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
    chartCard: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, padding: 16 },
    chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: '#64748b', fontSize: 12 },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4 },
    barCol: { alignItems: 'center', width: 40 },
    barTopValue: { color: '#64748b', fontSize: 10, marginBottom: 4 },
    barBlock: { width: 24, borderRadius: 6, justifyContent: 'flex-end' },
    barXLabel: { color: '#64748b', fontSize: 10, marginTop: 4 },
    distCard: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, padding: 16 },
    distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    distDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    distLabel: { color: '#fff', fontSize: 13, width: 80 },
    distBarBg: { flex: 1, backgroundColor: '#0f172a', borderRadius: 3, height: 6, marginHorizontal: 8 },
    distBarFill: { height: 6, borderRadius: 3 },
    distValue: { color: '#94a3b8', fontSize: 12, width: 36, textAlign: 'right' },
    distPct: { color: '#64748b', fontSize: 11, width: 40, textAlign: 'right' },
    agentList: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, padding: 8 },
    agentRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    agentBorder: { borderBottomWidth: 1, borderBottomColor: '#0f172a' },
    agentAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    agentAvatarText: { fontWeight: 'bold', fontSize: 15 },
    agentInfo: { flex: 1 },
    agentName: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 4 },
    agentStats: { flexDirection: 'row', gap: 10, marginBottom: 6 },
    agentStatText: { color: '#64748b', fontSize: 11 },
    agentBarBg: { backgroundColor: '#0f172a', borderRadius: 3, height: 5 },
    agentBarFill: { height: 5, borderRadius: 3 },
    agentRight: { alignItems: 'flex-end', marginLeft: 10 },
    agentRate: { fontWeight: 'bold', fontSize: 15 },
    agentDuration: { color: '#64748b', fontSize: 12, marginTop: 4 },
    empty: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
    emptySubText: { color: '#64748b', fontSize: 13, marginTop: 6 },
});