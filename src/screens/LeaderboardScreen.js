// import React, { useState, useEffect } from 'react';
// import {
//     View, Text, FlatList, StyleSheet,
//     ActivityIndicator, RefreshControl
// } from 'react-native';
// import { api } from '../services/api';

// export default function LeaderboardScreen() {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);

//     const fetchData = async () => {
//         try {
//             const res = await api.getLeaderboard();
//             const list = Array.isArray(res) ? res : res.leaderboard || [];
//             setData(list);
//         } catch (e) {
//             console.log('Leaderboard error:', e);
//         }
//         setLoading(false);
//         setRefreshing(false);
//     };

//     useEffect(() => { fetchData(); }, []);

//     const getMedal = (index) => {
//         if (index === 0) return '🥇';
//         if (index === 1) return '🥈';
//         if (index === 2) return '🥉';
//         return `#${index + 1}`;
//     };

//     const renderItem = ({ item, index }) => (
//         <View style={[styles.row, index < 3 && styles.topRow]}>
//             <Text style={styles.medal}>{getMedal(index)}</Text>
//             <View style={styles.info}>
//                 <Text style={styles.name}>{item.name || item.agentName}</Text>
//                 <Text style={styles.role}>{item.role || ''}</Text>
//             </View>
//             <View style={styles.right}>
//                 <Text style={styles.calls}>{item.totalCalls || item.calls || 0}</Text>
//                 <Text style={styles.callsLabel}>calls</Text>
//             </View>
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
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <Text style={styles.title}>🏆 Leaderboard</Text>
//                 <Text style={styles.subtitle}>Top Performers</Text>
//             </View>

//             <FlatList
//                 data={data}
//                 keyExtractor={(item, index) => item._id || index.toString()}
//                 renderItem={renderItem}
//                 refreshControl={
//                     <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#6366f1" />
//                 }
//                 ListEmptyComponent={
//                     <Text style={styles.empty}>Abhi koi data nahi hai</Text>
//                 }
//                 contentContainerStyle={{ paddingBottom: 30 }}
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#0f172a' },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
//     header: {
//         padding: 20, paddingTop: 50, backgroundColor: '#1e293b',
//         borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16,
//         alignItems: 'center',
//     },
//     title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
//     subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
//     row: {
//         backgroundColor: '#1e293b', marginHorizontal: 16, marginVertical: 6,
//         padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
//     },
//     topRow: { borderWidth: 1, borderColor: '#f59e0b' },
//     medal: { fontSize: 28, width: 44, textAlign: 'center' },
//     info: { flex: 1, marginLeft: 8 },
//     name: { color: '#fff', fontSize: 16, fontWeight: '600' },
//     role: { color: '#64748b', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
//     right: { alignItems: 'center' },
//     calls: { color: '#6366f1', fontSize: 22, fontWeight: 'bold' },
//     callsLabel: { color: '#64748b', fontSize: 12 },
//     empty: { color: '#64748b', textAlign: 'center', marginTop: 60, fontSize: 16 },
// });


import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, RefreshControl
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
            // Backend: GET /api/calls/leaderboard?period=weekly
            // Returns: { leaderboard: [{ agentName, agentEmail, totalCalls, salesDone, totalDuration }] }
            const res = await api.getLeaderboard(period);
            setLeaders(res.leaderboard || []);
        } catch (e) {
            setError('Data load nahi hua');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => {
        setLoading(true);
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const onRefresh = () => { setRefreshing(true); fetchLeaderboard(); };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🏆 Leaderboard</Text>
                <Text style={styles.subtitle}>Top performing agents</Text>
            </View>

            {/* Period Toggle */}
            <View style={styles.toggleRow}>
                {[
                    { key: 'weekly', label: 'This Week' },
                    { key: 'monthly', label: 'This Month' },
                ].map(p => (
                    <TouchableOpacity
                        key={p.key}
                        style={[styles.toggleBtn, period === p.key && styles.toggleBtnActive]}
                        onPress={() => setPeriod(p.key)}
                    >
                        <Text style={[styles.toggleText, period === p.key && styles.toggleTextActive]}>
                            {p.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity onPress={fetchLeaderboard} style={{ marginTop: 12 }}>
                        <Text style={styles.retryText}>Retry →</Text>
                    </TouchableOpacity>
                </View>
            ) : leaders.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>Is period ke liye koi data nahi</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {/* Top 3 podium highlight */}
                    {leaders.length >= 3 && (
                        <View style={styles.podium}>
                            {/* 2nd place */}
                            <View style={styles.podiumItem}>
                                <View style={[styles.podiumAvatar, { backgroundColor: '#94a3b820', width: 50, height: 50, borderRadius: 25 }]}>
                                    <Text style={{ fontSize: 20 }}>🥈</Text>
                                </View>
                                <Text style={styles.podiumName} numberOfLines={1}>{(leaders[1]?.agentName || '').split(' ')[0]}</Text>
                                <Text style={styles.podiumCalls}>{leaders[1]?.totalCalls} calls</Text>
                                <View style={[styles.podiumBar, { height: 50, backgroundColor: '#94a3b830' }]} />
                            </View>
                            {/* 1st place */}
                            <View style={[styles.podiumItem, { marginBottom: -8 }]}>
                                <View style={[styles.podiumAvatar, { backgroundColor: '#f59e0b20', width: 60, height: 60, borderRadius: 30 }]}>
                                    <Text style={{ fontSize: 26 }}>🥇</Text>
                                </View>
                                <Text style={[styles.podiumName, { color: '#f59e0b', fontSize: 14 }]} numberOfLines={1}>{(leaders[0]?.agentName || '').split(' ')[0]}</Text>
                                <Text style={[styles.podiumCalls, { color: '#f59e0b' }]}>{leaders[0]?.totalCalls} calls</Text>
                                <View style={[styles.podiumBar, { height: 70, backgroundColor: '#f59e0b30' }]} />
                            </View>
                            {/* 3rd place */}
                            <View style={styles.podiumItem}>
                                <View style={[styles.podiumAvatar, { backgroundColor: '#f9730020', width: 46, height: 46, borderRadius: 23 }]}>
                                    <Text style={{ fontSize: 18 }}>🥉</Text>
                                </View>
                                <Text style={styles.podiumName} numberOfLines={1}>{(leaders[2]?.agentName || '').split(' ')[0]}</Text>
                                <Text style={styles.podiumCalls}>{leaders[2]?.totalCalls} calls</Text>
                                <View style={[styles.podiumBar, { height: 40, backgroundColor: '#f9730020' }]} />
                            </View>
                        </View>
                    )}

                    {/* Full list */}
                    {leaders.map((agent, idx) => (
                        <View
                            key={agent._id || idx}
                            style={[styles.leaderCard,
                            idx === 0 ? { borderLeftColor: '#f59e0b', borderLeftWidth: 3, backgroundColor: '#f59e0b10' } :
                                idx === 1 ? { borderLeftColor: '#94a3b8', borderLeftWidth: 3 } :
                                    idx === 2 ? { borderLeftColor: '#f97316', borderLeftWidth: 3 } :
                                        {}
                            ]}
                        >
                            {/* Rank */}
                            <View style={styles.rankBadge}>
                                {idx < 3
                                    ? <Text style={{ fontSize: 20 }}>{medals[idx]}</Text>
                                    : <Text style={styles.rankNumber}>#{idx + 1}</Text>
                                }
                            </View>

                            {/* Avatar */}
                            <View style={[styles.avatar, { backgroundColor: avatarColors[idx % avatarColors.length] + '30' }]}>
                                <Text style={[styles.avatarText, { color: avatarColors[idx % avatarColors.length] }]}>
                                    {(agent.agentName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            {/* Info */}
                            <View style={styles.agentInfo}>
                                {/* Backend field: agentName */}
                                <Text style={styles.agentName}>{agent.agentName}</Text>
                                {/* Backend field: agentEmail */}
                                <Text style={styles.agentEmail} numberOfLines={1}>{agent.agentEmail}</Text>
                            </View>

                            {/* Stats */}
                            <View style={styles.statsCol}>
                                {/* Backend field: totalCalls */}
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#6366f1' }]}>{agent.totalCalls}</Text>
                                    <Text style={styles.statLabel}>Calls</Text>
                                </View>
                                {/* Backend field: salesDone */}
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#22c55e' }]}>{agent.salesDone}</Text>
                                    <Text style={styles.statLabel}>Sales</Text>
                                </View>
                                {/* Backend field: totalDuration (in seconds) */}
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{fmtDuration(agent.totalDuration)}</Text>
                                    <Text style={styles.statLabel}>Time</Text>
                                </View>
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
    center: { paddingTop: 80, alignItems: 'center' },
    header: {
        padding: 20, paddingTop: 50, backgroundColor: '#1e293b',
        borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16,
    },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    toggleRow: { flexDirection: 'row', backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, padding: 4, marginBottom: 16 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    toggleBtnActive: { backgroundColor: '#6366f1' },
    toggleText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
    toggleTextActive: { color: '#fff' },
    errorText: { color: '#ef4444', fontSize: 15 },
    retryText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { color: '#64748b', fontSize: 16 },
    list: { paddingHorizontal: 16 },
    podium: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
        backgroundColor: '#1e293b', marginHorizontal: 0, marginBottom: 16,
        borderRadius: 16, padding: 20, gap: 16,
    },
    podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
    podiumAvatar: { justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    podiumName: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    podiumCalls: { color: '#64748b', fontSize: 11, textAlign: 'center' },
    podiumBar: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: 8 },
    leaderCard: {
        backgroundColor: '#1e293b', borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    },
    rankBadge: { width: 36, alignItems: 'center' },
    rankNumber: { color: '#475569', fontWeight: 'bold', fontSize: 14 },
    avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
    avatarText: { fontWeight: 'bold', fontSize: 16 },
    agentInfo: { flex: 1 },
    agentName: { color: '#fff', fontWeight: '600', fontSize: 14 },
    agentEmail: { color: '#475569', fontSize: 11, marginTop: 2 },
    statsCol: { flexDirection: 'row', gap: 12 },
    statItem: { alignItems: 'center' },
    statValue: { fontWeight: 'bold', fontSize: 14 },
    statLabel: { color: '#475569', fontSize: 10, marginTop: 2 },
});