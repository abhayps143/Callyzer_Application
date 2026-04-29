import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { api } from '../services/api';

const fmtDuration = (s) => {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const medals = ['🥇', '🥈', '🥉'];
const avatarColors = ['#f59e0b', '#64748b', '#f97316', '#6366f1', '#22c55e', '#3b82f6'];

export default function LeaderboardScreen() {
    const [period, setPeriod] = useState('weekly');
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchLeaderboard = useCallback(async () => {
        setError('');
        try {
            const res = await api.getLeaderboard(period);
            setLeaders(res.leaderboard || []);
        } catch (e) { setError('Data load nahi hua'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [period]);

    useEffect(() => { setLoading(true); fetchLeaderboard(); }, [fetchLeaderboard]);

    const onRefresh = () => { setRefreshing(true); fetchLeaderboard(); };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Leaderboard</Text>
                    <Text style={styles.subtitle}>Top performing salespersons</Text>
                </View>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>🏆</Text>
                </View>
            </View>

            <View style={styles.toggleContainer}>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === 'weekly' && styles.toggleBtnActive]}
                        onPress={() => setPeriod('weekly')}
                    >
                        <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>
                            This Week
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, period === 'monthly' && styles.toggleBtnActive]}
                        onPress={() => setPeriod('monthly')}
                    >
                        <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>
                            This Month
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Loading leaderboard...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchLeaderboard} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Try Again →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : leaders.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Data Available</Text>
                        <Text style={styles.emptyText}>No records for this period</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.list}>
                    {/* Podium Section */}
                    {leaders.length >= 3 && (
                        <View style={styles.podiumSection}>
                            <View style={styles.podium}>
                                {/* 2nd Place */}
                                <View style={styles.podiumItem}>
                                    <View style={[styles.podiumAvatar, styles.secondPlaceAvatar]}>
                                        <Text style={styles.podiumMedal}>🥈</Text>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={2}>
                                        {leaders[1]?.agentName || 'Unknown'}
                                    </Text>
                                    <Text style={styles.podiumEmail} numberOfLines={1}>
                                        {leaders[1]?.agentEmail || ''}
                                    </Text>
                                    <Text style={styles.podiumCalls}>{leaders[1]?.totalCalls} calls</Text>
                                    <View style={[styles.podiumBar, styles.secondPlaceBar]} />
                                </View>

                                {/* 1st Place */}
                                <View style={[styles.podiumItem, styles.firstPlaceItem]}>
                                    <View style={[styles.podiumAvatar, styles.firstPlaceAvatar]}>
                                        <Text style={styles.podiumMedal}>🥇</Text>
                                    </View>
                                    <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={2}>
                                        {leaders[0]?.agentName || 'Unknown'}
                                    </Text>
                                    <Text style={[styles.podiumEmail, styles.firstPlaceEmail]} numberOfLines={1}>
                                        {leaders[0]?.agentEmail || ''}
                                    </Text>
                                    <Text style={[styles.podiumCalls, styles.firstPlaceCalls]}>
                                        {leaders[0]?.totalCalls} calls
                                    </Text>
                                    <View style={[styles.podiumBar, styles.firstPlaceBar]} />
                                </View>

                                {/* 3rd Place */}
                                <View style={styles.podiumItem}>
                                    <View style={[styles.podiumAvatar, styles.thirdPlaceAvatar]}>
                                        <Text style={styles.podiumMedal}>🥉</Text>
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={2}>
                                        {leaders[2]?.agentName || 'Unknown'}
                                    </Text>
                                    <Text style={styles.podiumEmail} numberOfLines={1}>
                                        {leaders[2]?.agentEmail || ''}
                                    </Text>
                                    <Text style={styles.podiumCalls}>{leaders[2]?.totalCalls} calls</Text>
                                    <View style={[styles.podiumBar, styles.thirdPlaceBar]} />
                                </View>
                            </View>
                            <Text style={styles.podiumLabel}>🏆 Top Performers 🏆</Text>
                        </View>
                    )}

                    {/* Leader List */}
                    <View style={styles.leaderList}>
                        <Text style={styles.leaderListTitle}>All Rankings</Text>
                        {leaders.map((agent, idx) => (
                            <View key={agent._id || idx} style={[
                                styles.leaderCard,
                                idx === 0 && styles.firstPlaceCard,
                                idx === 1 && styles.secondPlaceCard,
                                idx === 2 && styles.thirdPlaceCard
                            ]}>
                                <View style={styles.rankSection}>
                                    {idx < 3 ? (
                                        <Text style={styles.rankMedal}>{medals[idx]}</Text>
                                    ) : (
                                        <View style={styles.rankNumberBox}>
                                            <Text style={styles.rankNumber}>{idx + 1}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.avatar, { backgroundColor: avatarColors[idx % avatarColors.length] + '15' }]}>
                                    <Text style={[styles.avatarText, { color: avatarColors[idx % avatarColors.length] }]}>
                                        {(agent.agentName || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>

                                <View style={styles.agentInfo}>
                                    <Text style={styles.agentName} numberOfLines={2}>{agent.agentName || 'Unknown'}</Text>
                                    <Text style={styles.agentEmail} numberOfLines={1}>{agent.agentEmail || 'No email'}</Text>
                                </View>

                                <View style={styles.statsContainer}>
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statValue, { color: '#6366f1' }]}>{agent.totalCalls || 0}</Text>
                                        <Text style={styles.statLabel}>Calls</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statValue, { color: '#22c55e' }]}>{agent.salesDone || 0}</Text>
                                        <Text style={styles.statLabel}>Sales</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statBox}>
                                        <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{fmtDuration(agent.totalDuration)}</Text>
                                        <Text style={styles.statLabel}>Time</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    center: { paddingTop: 80, alignItems: 'center' },
    loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: { color: '#1e293b', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#64748b', fontSize: 13, marginTop: 4 },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f59e0b10',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b30',
    },
    headerIconText: { fontSize: 24 },

    toggleContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    toggleBtnActive: { backgroundColor: '#f59e0b' },
    toggleText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
    toggleTextActive: { color: '#ffffff' },

    errorContainer: { alignItems: 'center', backgroundColor: '#ffffff', padding: 24, borderRadius: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    errorIcon: { fontSize: 48, marginBottom: 12 },
    errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 12 },
    retryBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    emptyContainer: { alignItems: 'center', backgroundColor: '#ffffff', padding: 32, borderRadius: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    emptyIcon: { fontSize: 56, marginBottom: 16, opacity: 0.5 },
    emptyTitle: { color: '#1e293b', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyText: { color: '#64748b', fontSize: 14 },

    list: { paddingHorizontal: 16 },

    podiumSection: { marginBottom: 20 },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
    firstPlaceItem: { marginBottom: -8 },
    podiumAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    secondPlaceAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#64748b15', borderWidth: 1, borderColor: '#64748b30' },
    firstPlaceAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f59e0b15', borderWidth: 2, borderColor: '#f59e0b' },
    thirdPlaceAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f9731515', borderWidth: 1, borderColor: '#f9731530' },
    podiumMedal: { fontSize: 24 },
    podiumName: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    firstPlaceName: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
    podiumEmail: { color: '#94a3b8', fontSize: 9, textAlign: 'center', marginBottom: 4 },
    firstPlaceEmail: { color: '#f59e0b80', fontSize: 9 },
    podiumCalls: { color: '#64748b', fontSize: 11, textAlign: 'center' },
    firstPlaceCalls: { color: '#f59e0b' },
    podiumBar: { width: '60%', borderTopLeftRadius: 6, borderTopRightRadius: 6, marginTop: 8 },
    secondPlaceBar: { height: 45, backgroundColor: '#64748b20' },
    firstPlaceBar: { height: 65, backgroundColor: '#f59e0b20' },
    thirdPlaceBar: { height: 35, backgroundColor: '#f9731520' },
    podiumLabel: { textAlign: 'center', marginTop: 12, color: '#64748b', fontSize: 11, fontWeight: '500' },

    leaderList: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
    leaderListTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700', marginBottom: 12 },

    leaderCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderLeftWidth: 3,
    },
    firstPlaceCard: { borderLeftColor: '#f59e0b', backgroundColor: '#f59e0b05' },
    secondPlaceCard: { borderLeftColor: '#64748b', backgroundColor: '#64748b05' },
    thirdPlaceCard: { borderLeftColor: '#f97316', backgroundColor: '#f9731605' },

    rankSection: { width: 40, alignItems: 'center' },
    rankMedal: { fontSize: 20 },
    rankNumberBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
    rankNumber: { color: '#64748b', fontWeight: '700', fontSize: 12 },

    avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    avatarText: { fontWeight: '700', fontSize: 16 },

    agentInfo: { flex: 1 },
    agentName: { color: '#1e293b', fontWeight: '600', fontSize: 14, lineHeight: 18 },
    agentEmail: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

    statsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statBox: { alignItems: 'center', minWidth: 50 },
    statValue: { fontWeight: '800', fontSize: 14 },
    statLabel: { color: '#64748b', fontSize: 9, marginTop: 2 },
    statDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
});