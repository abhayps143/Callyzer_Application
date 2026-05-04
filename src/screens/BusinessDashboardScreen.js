import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { C, shadow } from '../theme';
 
const StatCard = ({ label, value, icon, color, soft, sub }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
        <View style={[styles.statIconBox, { backgroundColor: soft }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <Text style={styles.statValue}>{value ?? "0"}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
);
 
const AgentRow = ({ agent, index }) => (
    <View style={[styles.agentRow, index > 0 && styles.rowDivider]}>
        <View style={styles.agentRank}>
            <Text style={styles.agentRankText}>#{index + 1}</Text>
        </View>
        <View style={[styles.agentAvatar, { backgroundColor: C.primarySoft }]}>
            <Text style={[styles.agentAvatarText, { color: C.primary }]}>
                {(agent.name || "?").charAt(0).toUpperCase()}
            </Text>
        </View>
        <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentSub}>
                {agent.connectedCalls} connected · {agent.totalCalls} total
            </Text>
        </View>
        <Text style={styles.agentTotal}>{agent.totalCalls}</Text>
    </View>
);
 
export default function BusinessDashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [teamStats, setTeamStats] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
 
    const fetchStats = async () => {
        try {
            const res = await api.getTeamCallStats();
            if (res) {
                setTeamStats(res.summary || res);
                setAgents(res.agents || []);
            }
        } catch (e) {
            console.log('Business dashboard error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
 
    useEffect(() => { fetchStats(); }, []);
 
    const onRefresh = () => { setRefreshing(true); fetchStats(); };
 
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }
 
    const today = new Date().toLocaleDateString("en-IN", {
        weekday: 'long', month: 'long', day: 'numeric'
    });
 
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
 
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>
                        Hello, {user?.name?.split(" ")[0] || "Team Lead"} 👋
                    </Text>
                    <Text style={styles.headerDate}>{today}</Text>
                </View>
            </View>
 
            {/* Team Call Stats */}
            <Text style={styles.sectionLabel}>TODAY'S TEAM OVERVIEW</Text>
            <View style={styles.statsGrid}>
                <StatCard
                    label="Total Calls"
                    value={teamStats?.totalCalls}
                    icon="📞"
                    color={C.blue}
                    soft={C.blueSoft}
                    sub="All calls today"
                />
                <StatCard
                    label="Connected"
                    value={teamStats?.connectedCalls}
                    icon="✅"
                    color={C.green}
                    soft={C.greenSoft}
                    sub="Picked up"
                />
                <StatCard
                    label="Missed"
                    value={teamStats?.missedCalls}
                    icon="📵"
                    color={C.red}
                    soft={C.redSoft}
                    sub="Not answered"
                />
                <StatCard
                    label="Avg Duration"
                    value={teamStats?.avgDuration ? teamStats.avgDuration + "s" : "0s"}
                    icon="⏱️"
                    color={C.purple}
                    soft={C.purpleSoft}
                    sub="Per call"
                />
            </View>
 
            {/* Connection Rate */}
            <Text style={styles.sectionLabel}>CONNECTION RATE</Text>
            <View style={styles.card}>
                <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Team Connection Rate</Text>
                    <Text style={[styles.ratePct, { color: C.green }]}>
                        {teamStats?.totalCalls > 0
                            ? Math.round((teamStats.connectedCalls / teamStats.totalCalls) * 100)
                            : 0}%
                    </Text>
                </View>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, {
                        width: teamStats?.totalCalls > 0
                            ? `${Math.round((teamStats.connectedCalls / teamStats.totalCalls) * 100)}%`
                            : "0%",
                        backgroundColor: C.green
                    }]} />
                </View>
            </View>
 
            {/* Agent-wise Breakdown */}
            <Text style={styles.sectionLabel}>AGENT PERFORMANCE</Text>
            <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }]}>
                {agents.length === 0
                    ? <Text style={styles.emptyText}>No agent data available</Text>
                    : agents.map((agent, i) => (
                        <AgentRow key={agent._id || i} agent={agent} index={i} />
                    ))
                }
            </View>
 
            {/* Quick Actions */}
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
                {[
                    { icon: '📞', label: 'Call Logs',   color: C.blue,   soft: C.blueSoft,   screen: 'CallLogs' },
                    { icon: '🔴', label: 'Live Feed', color: C.red, soft: C.redSoft, screen: 'LiveFeed' },
                    { icon: '📊', label: 'Reports',     color: C.purple, soft: C.purpleSoft, screen: 'Reports' },
                    { icon: '📲', label: 'Device Sync', color: C.green,  soft: C.greenSoft,  screen: 'DeviceCallSync' },
                    { icon: '🏆', label: 'Leaderboard', color: C.amber,  soft: C.amberSoft,  screen: 'Leaderboard' },
                ].map(a => (
                    <TouchableOpacity
                        key={a.label}
                        style={[styles.quickBtn, { backgroundColor: a.soft }]}
                        onPress={() => navigation.navigate(a.screen)}
                        activeOpacity={0.75}
                    >
                        <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                        <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
 
            <View style={{ height: 32 }} />
        </ScrollView>
    );
}
 
const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: C.bg },
    content:        { paddingBottom: 20 },
    center:         { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
 
    header:         { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16 },
    greeting:       { fontSize: 22, fontWeight: "800", color: C.text },
    headerDate:     { fontSize: 13, color: C.textSub, marginTop: 4 },
 
    sectionLabel:   { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
 
    statsGrid:      { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    statCard:       { width: "47%", backgroundColor: C.surface, borderRadius: 16, padding: 16, marginHorizontal: 2, ...shadow },
    statIconBox:    { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
    statValue:      { fontSize: 28, fontWeight: "800", color: C.text },
    statLabel:      { fontSize: 13, color: C.textSub, marginTop: 2 },
    statSub:        { fontSize: 11, color: C.textMuted, marginTop: 2 },
 
    card:           { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, ...shadow },
 
    rateRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    rateLabel:      { fontSize: 14, color: C.textSub },
    ratePct:        { fontSize: 14, fontWeight: "800" },
    barBg:          { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: "hidden" },
    barFill:        { height: 8, borderRadius: 4 },
 
    agentRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    rowDivider:     { borderTopWidth: 1, borderTopColor: C.border },
    agentRank:      { width: 30 },
    agentRankText:  { fontSize: 12, fontWeight: "700", color: C.textMuted },
    agentAvatar:    { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 12 },
    agentAvatarText:{ fontWeight: "800", fontSize: 16 },
    agentInfo:      { flex: 1 },
    agentName:      { fontSize: 14, fontWeight: "600", color: C.text },
    agentSub:       { fontSize: 12, color: C.textSub, marginTop: 2 },
    agentTotal:     { fontSize: 18, fontWeight: "800", color: C.primary },
 
    quickGrid:      { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    quickBtn:       { width: "47%", borderRadius: 16, padding: 20, alignItems: "center", marginHorizontal: 2 },
    quickLabel:     { fontSize: 13, fontWeight: "700", marginTop: 8 },
 
    emptyText:      { color: C.textMuted, textAlign: "center", padding: 24 },
});
