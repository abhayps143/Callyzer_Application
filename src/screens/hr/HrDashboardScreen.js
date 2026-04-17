import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value ?? '—'}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ── Role Badge ─────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
    const cfg = {
        agent: { bg: '#22c55e20', color: '#22c55e' },
        team_leader: { bg: '#06b6d420', color: '#06b6d4' },
        manager: { bg: '#6366f120', color: '#6366f1' },
    };
    const c = cfg[role] || cfg.agent;
    return (
        <View style={[styles.roleBadge, { backgroundColor: c.bg }]}>
            <Text style={[styles.roleBadgeText, { color: c.color }]}>{role?.replace('_', ' ')}</Text>
        </View>
    );
};

export default function HrDashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [recentEmployees, setRecentEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statsData, recentData] = await Promise.all([
                api.getHrStats(),
                api.getHrRecentEmployees(),
            ]);
            setStats(statsData);
            setRecentEmployees(recentData.employees || []);
        } catch (e) {
            console.log('HR Dashboard error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#eab308" />
            <Text style={styles.loadingText}>Loading HR Dashboard...</Text>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#eab308" />}
        >
            {/* Welcome */}
            <View style={styles.header}>
                <Text style={styles.greeting}>HR Dashboard 👋</Text>
                <Text style={styles.subGreeting}>Welcome back, {user?.name}</Text>
            </View>

            {/* Employee Stats */}
            <Text style={styles.sectionTitle}>Employee Overview</Text>
            <View style={styles.statsGrid}>
                <StatCard label="Total" value={stats?.totalEmployees} icon="👥" color="#6366f1" />
                <StatCard label="Active" value={stats?.activeEmployees} icon="✅" color="#22c55e" />
                <StatCard label="Inactive" value={stats?.inactiveEmployees} icon="🚫" color="#ef4444" />
                <StatCard label="New This Week" value={stats?.newThisWeek} icon="🆕" color="#a855f7" />
            </View>

            {/* Leave Stats */}
            <Text style={styles.sectionTitle}>Leave Summary</Text>
            <View style={styles.statsGrid}>
                <StatCard label="Pending" value={stats?.pendingLeaves} icon="⏳" color="#eab308" />
                <StatCard label="Approved" value={stats?.approvedLeaves} icon="✔️" color="#22c55e" />
                <StatCard label="Rejected" value={stats?.rejectedLeaves} icon="❌" color="#ef4444" />
            </View>

            {/* Role Breakdown */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Employee Breakdown</Text>
                {[
                    { label: 'Agents', count: stats?.roleCounts?.agent, color: '#22c55e' },
                    { label: 'Team Leaders', count: stats?.roleCounts?.team_leader, color: '#06b6d4' },
                    { label: 'Managers', count: stats?.roleCounts?.manager, color: '#6366f1' },
                ].map((item) => {
                    const total = stats?.totalEmployees || 1;
                    const pct = Math.round(((item.count || 0) / total) * 100);
                    return (
                        <View key={item.label} style={styles.barRow}>
                            <View style={styles.barLabelRow}>
                                <Text style={styles.barLabel}>{item.label}</Text>
                                <Text style={styles.barCount}>{item.count ?? 0}</Text>
                            </View>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Recent Employees */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Recent Employees</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('HrEmployees')}>
                        <Text style={styles.viewAll}>View all →</Text>
                    </TouchableOpacity>
                </View>
                {recentEmployees.length === 0 ? (
                    <Text style={styles.emptyText}>No employees found</Text>
                ) : (
                    recentEmployees.map((emp) => (
                        <View key={emp._id} style={styles.empRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.empInfo}>
                                <Text style={styles.empName}>{emp.name}</Text>
                                <Text style={styles.empEmail}>{emp.email}</Text>
                            </View>
                            <RoleBadge role={emp.role} />
                        </View>
                    ))
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#eab30820' }]}
                        onPress={() => navigation.navigate('HrLeaves')}
                    >
                        <Text style={styles.actionIcon}>⏳</Text>
                        <Text style={[styles.actionText, { color: '#eab308' }]}>Pending Leaves</Text>
                        {stats?.pendingLeaves > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{stats.pendingLeaves}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#6366f120' }]}
                        onPress={() => navigation.navigate('HrEmployees')}
                    >
                        <Text style={styles.actionIcon}>👥</Text>
                        <Text style={[styles.actionText, { color: '#6366f1' }]}>Employees</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#22c55e20' }]}
                        onPress={() => navigation.navigate('HrAttendance')}
                    >
                        <Text style={styles.actionIcon}>📅</Text>
                        <Text style={[styles.actionText, { color: '#22c55e' }]}>Attendance</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

    header: { marginBottom: 20 },
    greeting: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
    subGreeting: { fontSize: 14, color: '#64748b', marginTop: 4 },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, minWidth: '45%', backgroundColor: '#1e293b',
        borderRadius: 14, padding: 14, borderLeftWidth: 3,
    },
    statIcon: { fontSize: 22, marginBottom: 6 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },

    card: {
        backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: '#334155',
    },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#f8fafc', marginBottom: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    viewAll: { fontSize: 13, color: '#eab308', fontWeight: '600' },

    barRow: { marginBottom: 12 },
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    barLabel: { fontSize: 13, color: '#94a3b8' },
    barCount: { fontSize: 13, color: '#64748b' },
    barBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },

    empRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#eab30820', justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    avatarText: { color: '#eab308', fontWeight: 'bold', fontSize: 15 },
    empInfo: { flex: 1 },
    empName: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
    empEmail: { color: '#64748b', fontSize: 12, marginTop: 1 },

    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
        flex: 1, minWidth: '45%',
    },
    actionIcon: { fontSize: 18 },
    actionText: { fontSize: 13, fontWeight: '600' },

    badge: {
        backgroundColor: '#eab308', borderRadius: 10,
        paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    emptyText: { color: '#475569', textAlign: 'center', paddingVertical: 16, fontSize: 13 },
});
