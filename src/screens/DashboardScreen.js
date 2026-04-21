import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Dimensions,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow, shadowMd, rs, fs, ROLE_COLORS } from '../theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - rs(16) * 2 - rs(10)) / 2;

// ── Helpers ───────────────────────────────────────────
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

// ── Sub-components ────────────────────────────────────
const StatusPill = ({ status }) => {
    const cfg = {
        Connected: { bg: C.greenSoft, color: C.green },
        Missed: { bg: C.redSoft, color: C.red },
        Rejected: { bg: C.amberSoft, color: C.amber },
    };
    const c = cfg[status] || cfg.Missed;
    return (
        <View style={[styles.pill, { backgroundColor: c.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: c.color }]} />
            <Text style={[styles.pillText, { color: c.color }]}>{status}</Text>
        </View>
    );
};

const MetricCard = ({ title, value, icon, soft, change, up }) => (
    <View style={[styles.metricCard, { width: CARD_W }]}>
        <View style={[styles.metricIconWrap, { backgroundColor: soft }]}>
            <Text style={styles.metricIcon}>{icon}</Text>
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

const SectionLabel = ({ children }) => (
    <Text style={styles.sectionLabel}>{children}</Text>
);

const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
);

// ── Main Screen ───────────────────────────────────────
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
            <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
    );

    const { summary, weeklyTrend, recentCalls, topAgents } = data || {};
    const maxTotal = weeklyTrend ? Math.max(...weeklyTrend.map(d => d.total), 1) : 1;

    const roleInfo = ROLE_COLORS[user?.role] || { color: C.primary, soft: C.primarySoft, label: user?.role || '' };

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
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); fetchData(); }}
                    tintColor={C.primary}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ──────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Good day 👋</Text>
                    <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleInfo.soft }]}>
                        <View style={[styles.roleIndicator, { backgroundColor: roleInfo.color }]} />
                        <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                    <Text style={styles.logoutIcon}>⎋</Text>
                    <Text style={styles.logoutText}>Sign out</Text>
                </TouchableOpacity>
            </View>

            {/* ── Error banner ────────────────────── */}
            {!!error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorMsg}>⚠️  {error}</Text>
                    <TouchableOpacity onPress={fetchData}>
                        <Text style={styles.retryLink}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Metric grid ─────────────────────── */}
            <SectionLabel>TODAY'S OVERVIEW</SectionLabel>
            <View style={styles.metricsGrid}>
                {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
            </View>

            {/* ── Connect Rate ────────────────────── */}
            {summary?.connectRate !== undefined && (
                <Card>
                    <View style={styles.rowBetween}>
                        <Text style={styles.cardTitle}>Connect Rate</Text>
                        <Text style={[styles.valueLg, { color: C.primary }]}>{summary.connectRate}%</Text>
                    </View>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${Math.min(summary.connectRate, 100)}%`, backgroundColor: C.primary }]} />
                    </View>
                    <Text style={styles.trackHint}>
                        {summary.connectRate >= 70 ? '✅ On target' : '⚠️ Below target'}
                    </Text>
                </Card>
            )}

            {/* ── Target Progress ─────────────────── */}
            {progress && (
                <>
                    <SectionLabel>TARGET PROGRESS</SectionLabel>
                    {[
                        { label: "Today's Target", data: progress.daily, color: C.blue },
                        { label: 'Monthly Target', data: progress.monthly, color: C.purple },
                    ].map(({ label, data: d, color }) => (
                        <Card key={label}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.cardTitle}>{label}</Text>
                                <Text style={styles.valueSm}>
                                    {d?.achieved || 0}
                                    <Text style={styles.valueSep}> / </Text>
                                    {d?.target || 0}
                                </Text>
                            </View>
                            <View style={styles.track}>
                                <View style={[styles.fill, { width: `${Math.min(d?.percentage || 0, 100)}%`, backgroundColor: color }]} />
                            </View>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.pctText, { color }]}>{d?.percentage || 0}% completed</Text>
                                <Text style={styles.remainText}>
                                    {Math.max(0, (d?.target || 0) - (d?.achieved || 0))} remaining
                                </Text>
                            </View>
                        </Card>
                    ))}
                </>
            )}

            {/* ── Weekly Bar Chart ────────────────── */}
            {weeklyTrend && weeklyTrend.length > 0 && (
                <Card>
                    <Text style={[styles.cardTitle, { marginBottom: rs(16) }]}>Weekly Activity</Text>
                    <View style={styles.chartArea}>
                        {weeklyTrend.map((d, i) => {
                            const h = Math.max(((d.total / maxTotal) * rs(80)), rs(4));
                            const isMax = d.total === Math.max(...weeklyTrend.map(x => x.total));
                            return (
                                <View key={i} style={styles.barCol}>
                                    <Text style={styles.barVal}>{d.total > 0 ? d.total : ''}</Text>
                                    <View style={[
                                        styles.chartBar,
                                        { height: h, backgroundColor: isMax ? C.primary : C.primaryMid }
                                    ]} />
                                    <Text style={styles.barDay}>{d.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </Card>
            )}

            {/* ── Top Agents ──────────────────────── */}
            {topAgents && topAgents.length > 0 && (
                <Card>
                    <Text style={[styles.cardTitle, { marginBottom: rs(16) }]}>Top Agents</Text>
                    {topAgents.slice(0, 5).map((agent, i) => {
                        const rate = agent.calls > 0 ? Math.round((agent.connected / agent.calls) * 100) : 0;
                        const rankColors = [C.amber, C.textMuted, C.orange, C.blue, C.teal];
                        return (
                            <View key={i} style={[styles.agentRow, i < topAgents.slice(0, 5).length - 1 && styles.agentRowDivider]}>
                                <View style={[styles.rankBadge, { backgroundColor: i < 3 ? '#FFF8EC' : C.surfaceAlt }]}>
                                    <Text style={[styles.rankText, { color: rankColors[i] }]}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </Text>
                                </View>
                                <View style={styles.agentAvatar}>
                                    <Text style={styles.agentAvatarText}>
                                        {(agent.name || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.rowBetween}>
                                        <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                                        <Text style={[styles.agentRate, { color: C.primary }]}>{rate}%</Text>
                                    </View>
                                    <View style={[styles.track, { marginTop: rs(6) }]}>
                                        <View style={[styles.fill, { width: `${rate}%`, backgroundColor: C.primary }]} />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </Card>
            )}

            {/* ── Recent Calls ────────────────────── */}
            {recentCalls && recentCalls.length > 0 && (
                <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }}>
                    <Text style={[styles.cardTitle, { paddingHorizontal: rs(16), paddingTop: rs(16), marginBottom: rs(4) }]}>
                        Recent Calls
                    </Text>
                    {recentCalls.slice(0, 8).map((call, i) => (
                        <View
                            key={i}
                            style={[
                                styles.callRow,
                                i < recentCalls.slice(0, 8).length - 1 && styles.callDivider,
                            ]}
                        >
                            <View style={styles.callAvatar}>
                                <Text style={styles.callAvatarText}>
                                    {(call.name || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1, marginRight: rs(8) }}>
                                <Text style={styles.callName} numberOfLines={1}>{call.name || 'Unknown'}</Text>
                                <Text style={styles.callNumber}>{call.number}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: rs(4) }}>
                                <StatusPill status={call.status} />
                                <Text style={styles.callTime}>{call.time || fmtTime(call.calledAt)}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
            )}

            <View style={{ height: rs(40) }} />
        </ScrollView>
    );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingBottom: rs(20) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: rs(12) },
    loadingText: { fontSize: fs(14), color: C.textSub },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: rs(20),
        paddingTop: rs(56),
        paddingBottom: rs(20),
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        marginBottom: rs(16),
        ...shadow,
    },
    headerLeft: { flex: 1, marginRight: rs(12) },
    greeting: { fontSize: fs(13), color: C.textSub, fontWeight: '500' },
    userName: { fontSize: fs(22), fontWeight: '800', color: C.text, marginTop: rs(2), letterSpacing: -0.3 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: rs(8),
        alignSelf: 'flex-start',
        paddingHorizontal: rs(10),
        paddingVertical: rs(4),
        borderRadius: rs(20),
        gap: rs(5),
    },
    roleIndicator: { width: rs(6), height: rs(6), borderRadius: rs(3) },
    roleText: { fontSize: fs(11), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(4),
        backgroundColor: C.redSoft,
        paddingHorizontal: rs(12),
        paddingVertical: rs(9),
        borderRadius: rs(12),
    },
    logoutIcon: { fontSize: fs(14) },
    logoutText: { color: C.red, fontWeight: '700', fontSize: fs(12) },

    // Error
    errorBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.redSoft,
        marginHorizontal: rs(16),
        padding: rs(14),
        borderRadius: rs(12),
        marginBottom: rs(12),
    },
    errorMsg: { color: C.red, fontSize: fs(13) },
    retryLink: { color: C.red, fontWeight: '700', fontSize: fs(13) },

    // Section labels
    sectionLabel: {
        fontSize: fs(11),
        fontWeight: '700',
        color: C.textMuted,
        letterSpacing: 1.2,
        paddingHorizontal: rs(16),
        marginTop: rs(8),
        marginBottom: rs(10),
    },

    // Metric grid
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: rs(16),
        gap: rs(10),
        marginBottom: rs(12),
    },
    metricCard: {
        backgroundColor: C.surface,
        borderRadius: rs(18),
        padding: rs(16),
        borderWidth: 1,
        borderColor: C.border,
        ...shadow,
    },
    metricIconWrap: {
        width: rs(44),
        height: rs(44),
        borderRadius: rs(13),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rs(12),
    },
    metricIcon: { fontSize: fs(20) },
    metricValue: { fontSize: fs(26), fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    metricTitle: { fontSize: fs(12), color: C.textSub, marginTop: rs(2), fontWeight: '500' },
    changePill: {
        marginTop: rs(8),
        alignSelf: 'flex-start',
        paddingHorizontal: rs(8),
        paddingVertical: rs(3),
        borderRadius: rs(20),
    },
    changeText: { fontSize: fs(11), fontWeight: '700' },

    // Generic card
    card: {
        backgroundColor: C.surface,
        marginHorizontal: rs(16),
        marginBottom: rs(12),
        borderRadius: rs(18),
        padding: rs(16),
        borderWidth: 1,
        borderColor: C.border,
        ...shadow,
    },
    cardTitle: { fontSize: fs(15), fontWeight: '700', color: C.text },

    // Row utilities
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(10) },
    valueLg: { fontSize: fs(18), fontWeight: '800' },
    valueSm: { fontSize: fs(14), color: C.textSub, fontWeight: '600' },
    valueSep: { color: C.textMuted, fontWeight: '400' },

    // Progress track
    track: {
        height: rs(7),
        backgroundColor: C.surfaceAlt,
        borderRadius: rs(4),
        overflow: 'hidden',
    },
    fill: { height: rs(7), borderRadius: rs(4) },
    pctText: { fontSize: fs(12), marginTop: rs(6), fontWeight: '600' },
    remainText: { fontSize: fs(12), color: C.textMuted, marginTop: rs(6) },
    trackHint: { fontSize: fs(12), color: C.textSub, marginTop: rs(6), fontWeight: '500' },

    // Weekly chart
    chartArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: rs(110),
        justifyContent: 'space-between',
        paddingHorizontal: rs(4),
    },
    barCol: { flex: 1, alignItems: 'center' },
    barVal: { color: C.textMuted, fontSize: fs(10), marginBottom: rs(4), fontWeight: '600' },
    chartBar: { width: rs(22), borderRadius: rs(6), minHeight: rs(4) },
    barDay: { color: C.textSub, fontSize: fs(11), marginTop: rs(6), fontWeight: '500' },

    // Agent list
    agentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(10),
        paddingVertical: rs(10),
    },
    agentRowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    rankBadge: {
        width: rs(32),
        height: rs(32),
        borderRadius: rs(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: { fontSize: fs(14), fontWeight: '700' },
    agentAvatar: {
        width: rs(36),
        height: rs(36),
        borderRadius: rs(18),
        backgroundColor: C.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    agentAvatarText: { color: C.primary, fontWeight: '800', fontSize: fs(14) },
    agentName: { fontSize: fs(14), fontWeight: '600', color: C.text, flex: 1, marginRight: rs(8) },
    agentRate: { fontSize: fs(13), fontWeight: '800' },

    // Recent calls
    callRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rs(16),
        paddingVertical: rs(13),
    },
    callDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
    callAvatar: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
        backgroundColor: C.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rs(12),
    },
    callAvatarText: { color: C.primary, fontWeight: '800', fontSize: fs(15) },
    callName: { fontSize: fs(14), fontWeight: '600', color: C.text },
    callNumber: { fontSize: fs(12), color: C.textSub, marginTop: rs(2) },
    callTime: { fontSize: fs(11), color: C.textMuted, fontWeight: '500' },

    // Status pill
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rs(9),
        paddingVertical: rs(3),
        borderRadius: rs(20),
        gap: rs(5),
    },
    pillDot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
    pillText: { fontSize: fs(11), fontWeight: '700' },
});