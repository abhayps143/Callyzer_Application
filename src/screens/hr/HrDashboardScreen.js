import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { C, shadow } from '../../theme';

const ROLE_CHART = [
    { key: 'agent', label: 'Agents', color: C.green },
    { key: 'team_leader', label: 'Team Leaders', color: C.cyan },
    { key: 'manager', label: 'Managers', color: C.primary },
];

export default function HrDashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [recentEmps, setRecentEmps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statsData, recentData] = await Promise.all([
                api.getHrStats(),
                api.getHrRecentEmployees(),
            ]);
            setStats(statsData);
            setRecentEmps(recentData.employees || []);
        } catch (e) { console.log('HR Dashboard error:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.amber} />
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.amber} />}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.roleTag, { backgroundColor: C.amberSoft }]}>
                    <Text style={[styles.roleTagText, { color: C.amber }]}>HR</Text>
                </View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.date}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
            </View>

            {/* Employee Stats */}
            <Text style={styles.sectionLabel}>EMPLOYEE OVERVIEW</Text>
            <View style={styles.statsGrid}>
                {[
                    { label: 'Total', value: stats?.totalEmployees, icon: '👥', color: C.primary, soft: C.primarySoft },
                    { label: 'Active', value: stats?.activeEmployees, icon: '✅', color: C.green, soft: C.greenSoft },
                    { label: 'Inactive', value: stats?.inactiveEmployees, icon: '🚫', color: C.red, soft: C.redSoft },
                    { label: 'New / Week', value: stats?.newThisWeek, icon: '🆕', color: C.purple, soft: C.purpleSoft },
                ].map(m => (
                    <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color, borderTopWidth: 3 }]}>
                        <View style={[styles.metricIcon, { backgroundColor: m.soft }]}>
                            <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                        </View>
                        <Text style={styles.metricValue}>{m.value ?? '—'}</Text>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                    </View>
                ))}
            </View>

            {/* Leave Stats */}
            <Text style={styles.sectionLabel}>LEAVE SUMMARY</Text>
            <View style={styles.leaveRow}>
                {[
                    { label: 'Pending', value: stats?.pendingLeaves, color: C.amber, soft: C.amberSoft },
                    { label: 'Approved', value: stats?.approvedLeaves, color: C.green, soft: C.greenSoft },
                    { label: 'Rejected', value: stats?.rejectedLeaves, color: C.red, soft: C.redSoft },
                ].map(l => (
                    <View key={l.label} style={[styles.leaveCard, { backgroundColor: l.soft }]}>
                        <Text style={[styles.leaveValue, { color: l.color }]}>{l.value ?? '0'}</Text>
                        <Text style={[styles.leaveLabel, { color: l.color }]}>{l.label}</Text>
                    </View>
                ))}
            </View>

            {/* Role Breakdown */}
            <Text style={styles.sectionLabel}>EMPLOYEE BREAKDOWN</Text>
            <View style={styles.card}>
                {ROLE_CHART.map(item => {
                    const total = stats?.totalEmployees || 1;
                    const count = stats?.roleCounts?.[item.key] || 0;
                    const pct = Math.round((count / total) * 100);
                    return (
                        <View key={item.key} style={styles.breakdownRow}>
                            <View style={styles.breakdownLeft}>
                                <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                                <Text style={styles.breakdownLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.breakdownBarBg}>
                                <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                            </View>
                            <Text style={[styles.breakdownCount, { color: item.color }]}>{count}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Recent Employees */}
            <Text style={styles.sectionLabel}>RECENT EMPLOYEES</Text>
            <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardHeaderTitle, { paddingHorizontal: 16, paddingTop: 14 }]}>Recent</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('HrEmployees')} style={{ paddingRight: 16, paddingTop: 14 }}>
                        <Text style={styles.viewAllLink}>View all →</Text>
                    </TouchableOpacity>
                </View>
                {recentEmps.length === 0
                    ? <Text style={styles.empty}>No employees found</Text>
                    : recentEmps.map((emp, i) => (
                        <View key={emp._id} style={[styles.empRow, i < recentEmps.length - 1 && styles.empDivider]}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{emp.name?.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.empInfo}>
                                <Text style={styles.empName}>{emp.name}</Text>
                                <Text style={styles.empEmail}>{emp.email}</Text>
                            </View>
                            <View style={styles.rolePill}>
                                <Text style={styles.rolePillText}>{emp.role?.replace('_', ' ')}</Text>
                            </View>
                        </View>
                    ))
                }
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.actionsRow}>
                {[
                    { icon: '⏳', label: 'Pending Leaves', color: C.amber, soft: C.amberSoft, screen: 'HrLeaves', badge: stats?.pendingLeaves },
                    { icon: '👥', label: 'Employees', color: C.primary, soft: C.primarySoft, screen: 'HrEmployees' },
                    { icon: '📅', label: 'Attendance', color: C.green, soft: C.greenSoft, screen: 'HrAttendance' },
                ].map(a => (
                    <TouchableOpacity
                        key={a.label}
                        style={[styles.actionBtn, { backgroundColor: a.soft }]}
                        onPress={() => navigation.navigate(a.screen)}
                        activeOpacity={0.75}
                    >
                        <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                        <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                        {a.badge > 0 && (
                            <View style={[styles.badge, { backgroundColor: a.color }]}>
                                <Text style={styles.badgeText}>{a.badge}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingBottom: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    header: {
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16,
    },
    roleTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
    roleTagText: { fontSize: 11, fontWeight: '700' },
    name: { fontSize: 22, fontWeight: '800', color: C.text },
    date: { fontSize: 13, color: C.textSub, marginTop: 4 },

    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    metricCard: { width: '47%', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginHorizontal: 2, ...shadow },
    metricIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    metricValue: { fontSize: 24, fontWeight: '800', color: C.text },
    metricLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },

    leaveRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    leaveCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
    leaveValue: { fontSize: 28, fontWeight: '800' },
    leaveLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },

    card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, ...shadow },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    cardHeaderTitle: { fontSize: 14, fontWeight: '700', color: C.text },
    viewAllLink: { fontSize: 13, color: C.amber, fontWeight: '600' },

    breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    breakdownLeft: { flexDirection: 'row', alignItems: 'center', width: 110 },
    breakdownDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    breakdownLabel: { fontSize: 13, color: C.textSub },
    breakdownBarBg: { flex: 1, height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginRight: 10 },
    breakdownBarFill: { height: 6, borderRadius: 3 },
    breakdownCount: { fontSize: 13, fontWeight: '800', width: 24, textAlign: 'right' },

    empRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    empDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.amberSoft, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: C.amber, fontWeight: '800', fontSize: 15 },
    empInfo: { flex: 1 },
    empName: { fontSize: 14, fontWeight: '600', color: C.text },
    empEmail: { fontSize: 12, color: C.textSub, marginTop: 1 },
    rolePill: { backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    rolePillText: { fontSize: 11, fontWeight: '600', color: C.textSub, textTransform: 'capitalize' },

    actionsRow: { flexDirection: 'row', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    actionBtn: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
    actionLabel: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
    badge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 8, right: 8 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    empty: { color: C.textMuted, textAlign: 'center', paddingVertical: 20, fontSize: 13 },
});
