import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow, shadowMd, rs, fs } from '../theme';

const StatCard = ({ label, value, icon, color, soft }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
        <View style={[styles.statIconBox, { backgroundColor: soft }]}>
            <Text style={{ fontSize: rs(20) }}>{icon}</Text>
        </View>
        <Text style={styles.statValue}>{value ?? '0'}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
};

const CallRow = ({ call }) => {
    const isConnected = call.callStatus === 'Connected';
    const isMissed = call.callStatus === 'Missed' || call.callStatus === 'Rejected';
    const color = isConnected ? C.green : isMissed ? C.red : C.textMuted;
    const soft = isConnected ? C.greenSoft : isMissed ? C.redSoft : C.surfaceAlt;
    const icon = isConnected ? '✅' : isMissed ? '❌' : '📞';

    const timeStr = call.calledAt
        ? new Date(call.calledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '—';

    return (
        <View style={styles.callRow}>
            <View style={[styles.callDot, { backgroundColor: soft }]}>
                <Text style={{ fontSize: rs(16) }}>{icon}</Text>
            </View>
            <View style={styles.callInfo}>
                <Text style={styles.callName} numberOfLines={1}>
                    {call.customerName || call.customerNumber || 'Unknown'}
                </Text>
                <Text style={styles.callMeta}>
                    {call.callType} · {timeStr}
                </Text>
            </View>
            <View style={styles.callRight}>
                {isConnected && (
                    <Text style={styles.callDuration}>{formatDuration(call.durationSeconds)}</Text>
                )}
                <View style={[styles.callStatusBadge, { backgroundColor: soft }]}>
                    <Text style={[styles.callStatusText, { color }]}>{call.callStatus}</Text>
                </View>
            </View>
        </View>
    );
};

export default function SalespersonDashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [myRank, setMyRank] = useState(null); 
    const [teamSize, setTeamSize] = useState(0);
    const [recentCalls, setRecentCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    const fetchDashboard = async () => {
        try {
            const [statsRes, callsRes, leaderRes] = await Promise.allSettled([
                api.getCallStats({ dateFrom: todayDate(), dateTo: todayDate() }),
                api.getCallLogs({ page: 1, limit: 5, sortField: 'calledAt', sortDir: 'desc' }),
                api.getLeaderboard('weekly'),
            ]);

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value);
            }
            if (callsRes.status === 'fulfilled') {
                setRecentCalls(callsRes.value.calls || callsRes.value.data || []);
            }
            if (leaderRes.status === 'fulfilled') {
                const board = leaderRes.value?.leaderboard || [];
                setTeamSize(board.length);
                const myIndex = board.findIndex(
                    (entry) => entry._id?.toString() === user?._id?.toString()
                        || entry.agentEmail === user?.email
                );
                setMyRank(myIndex >= 0 ? myIndex + 1 : null);
            }
        } catch (e) {
            console.log('Salesperson dashboard error:', e);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const todayDate = () => new Date().toISOString().split('T')[0];

    useEffect(() => { fetchDashboard(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    const totalCalls = stats?.totalCalls ?? 0;
    const connected = stats?.connected ?? 0;
    const missed = stats?.missed ?? 0;
    const avgDuration = stats?.avgDuration ?? 0;
    const connectRate = totalCalls > 0 ? Math.round((connected / totalCalls) * 100) : 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Welcome Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {(user?.name || 'S').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
                        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Salesperson'}</Text>
                    </View>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
            </View>

            {/* Today Performance Banner */}
            <View style={styles.banner}>
                <View style={styles.bannerLeft}>
                    <Text style={styles.bannerTitle}>Today's Performance</Text>
                    <Text style={styles.bannerSub}>{today}</Text>
                </View>
                <View style={styles.connectRateBox}>
                    <Text style={styles.connectRateValue}>{connectRate}%</Text>
                    <Text style={styles.connectRateLabel}>Connect Rate</Text>
                </View>
            </View>

            {/* My Rank Badge */}
            {myRank && (
                <View style={rankStyles.rankBanner}>
                    <Text style={rankStyles.rankEmoji}>
                        {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏅'}
                    </Text>
                    <View>
                        <Text style={rankStyles.rankTitle}>
                            #{myRank} in Team This Week
                        </Text>
                        <Text style={rankStyles.rankSub}>
                            {myRank === 1 ? 'You are the top performer! 🔥'
                            : `${myRank - 1} ahead of you — keep going!`}
                        </Text>
                    </View>
                    <Text style={rankStyles.rankTotal}>/{teamSize}</Text>
                </View>
            )}

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard label="Total Calls" value={totalCalls} icon="📞" color={C.primary} soft={C.primarySoft} />
                <StatCard label="Connected" value={connected} icon="✅" color={C.green} soft={C.greenSoft} />
                <StatCard label="Missed" value={missed} icon="❌" color={C.red} soft={C.redSoft} />
                <StatCard label="Avg Duration" value={formatDuration(avgDuration)} icon="⏱️" color={C.amber} soft={C.amberSoft} />
            </View>

            {/* Quick Sync Button */}
            <TouchableOpacity
                style={styles.syncBtn}
                onPress={() => navigation.navigate('DeviceCallSync')}
                activeOpacity={0.8}
            >
                <Text style={styles.syncIcon}>📲</Text>
                <View>
                    <Text style={styles.syncTitle}>Sync Phone Calls</Text>
                    <Text style={styles.syncSub}>Upload today's call logs from your device</Text>
                </View>
                <Text style={styles.syncArrow}>›</Text>
            </TouchableOpacity>

            {/* Recent Calls */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Calls</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CallLogs')}>
                        <Text style={styles.sectionLink}>View All →</Text>
                    </TouchableOpacity>
                </View>

                {recentCalls.length === 0 ? (
                    <View style={styles.noCallsBox}>
                        <Text style={styles.noCallsText}>No calls recorded today. Sync your phone to get started.</Text>
                    </View>
                ) : (
                    <View style={styles.callsList}>
                        {recentCalls.map((call, i) => (
                            <CallRow key={call._id || i} call={call} />
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: rs(16), paddingBottom: rs(40) },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: rs(16),
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
    avatarCircle: {
        width: rs(46), height: rs(46), borderRadius: rs(23),
        backgroundColor: C.blueSoft, justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: fs(20), fontWeight: '700', color: C.blue },
    greeting: { fontSize: fs(12), color: C.textMuted },
    userName: { fontSize: fs(16), fontWeight: '700', color: C.text, maxWidth: rs(200) },
    dateBadge: {
        backgroundColor: C.primarySoft, paddingHorizontal: rs(12),
        paddingVertical: rs(6), borderRadius: rs(20),
    },
    dateText: { fontSize: fs(12), fontWeight: '600', color: C.primary },

    // Banner
    banner: {
        backgroundColor: C.primary, borderRadius: rs(16),
        padding: rs(16), flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
        marginBottom: rs(16), ...shadowMd,
    },
    bannerLeft: {},
    bannerTitle: { color: '#fff', fontSize: fs(16), fontWeight: '700' },
    bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: fs(12), marginTop: rs(2) },
    connectRateBox: { alignItems: 'center' },
    connectRateValue: { color: '#fff', fontSize: fs(28), fontWeight: '800' },
    connectRateLabel: { color: 'rgba(255,255,255,0.7)', fontSize: fs(11) },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(16),
    },
    statCard: {
        backgroundColor: C.surface, borderRadius: rs(14),
        padding: rs(14), width: '47%', ...shadow,
        borderWidth: 1, borderColor: C.border, alignItems: 'center',
    },
    statIconBox: {
        width: rs(40), height: rs(40), borderRadius: rs(12),
        justifyContent: 'center', alignItems: 'center', marginBottom: rs(8),
    },
    statValue: { fontSize: fs(22), fontWeight: '800', color: C.text },
    statLabel: { fontSize: fs(11), color: C.textMuted, marginTop: rs(2), textAlign: 'center' },

    // Sync Button
    syncBtn: {
        flexDirection: 'row', alignItems: 'center', gap: rs(14),
        backgroundColor: C.tealSoft, borderRadius: rs(16),
        padding: rs(16), marginBottom: rs(20),
        borderWidth: 1.5, borderColor: C.teal + '40',
    },
    syncIcon: { fontSize: rs(28) },
    syncTitle: { fontSize: fs(15), fontWeight: '700', color: C.teal },
    syncSub: { fontSize: fs(12), color: C.teal + 'AA', marginTop: rs(2) },
    syncArrow: { marginLeft: 'auto', fontSize: fs(24), color: C.teal },

    // Recent Calls
    section: {},
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: rs(12),
    },
    sectionTitle: { fontSize: fs(16), fontWeight: '700', color: C.text },
    sectionLink: { fontSize: fs(13), color: C.primary, fontWeight: '600' },

    callsList: {
        backgroundColor: C.surface, borderRadius: rs(16),
        overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...shadow,
    },
    callRow: {
        flexDirection: 'row', alignItems: 'center', gap: rs(12),
        paddingHorizontal: rs(14), paddingVertical: rs(12),
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    callDot: {
        width: rs(38), height: rs(38), borderRadius: rs(12),
        justifyContent: 'center', alignItems: 'center',
    },
    callInfo: { flex: 1 },
    callName: { fontSize: fs(14), fontWeight: '600', color: C.text },
    callMeta: { fontSize: fs(12), color: C.textMuted, marginTop: rs(2) },
    callRight: { alignItems: 'flex-end', gap: rs(4) },
    callDuration: { fontSize: fs(12), color: C.textSub, fontWeight: '500' },
    callStatusBadge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20) },
    callStatusText: { fontSize: fs(10), fontWeight: '700' },

    noCallsBox: {
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(24), alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    noCallsText: { fontSize: fs(14), color: C.textMuted, textAlign: 'center', lineHeight: fs(20) },
});

const rankStyles = StyleSheet.create({
    rankBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#F59E0B',
        borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 14,
    },
    rankEmoji: { fontSize: 32 },
    rankTitle: { fontSize: 15, fontWeight: '800', color: '#92400E' },
    rankSub:   { fontSize: 12, color: '#B45309', marginTop: 2 },
    rankTotal: { marginLeft: 'auto', fontSize: 18, fontWeight: '800', color: '#D97706' },
});