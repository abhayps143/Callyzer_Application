import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, ROLE_COLORS, shadow } from '../../theme';

import { API_BASE_URL as API } from '../../config';
import { api } from '../../services/api';

const StatCard = ({ label, value, icon, color, soft, sub }) => (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
        <View style={[styles.statIconBox, { backgroundColor: soft }]}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <Text style={styles.statValue}>{value ?? '0'}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
);

export default function AdminDashboardScreen({ navigation }) {
    const { logout } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = async () => {
        try {
            const [statsRes, usersRes] = await Promise.allSettled([
                api.getAdminStats(),
                api.getAdminRecentUsers(), // ← ab ye api.js me hoga
            ]);

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value);
            }
            if (usersRes.status === 'fulfilled') {
                setRecentUsers(usersRes.value.users || []);
            }
        } catch (e) {
            console.log('Admin stats error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    const roleCounts = stats?.roleCounts || {};

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={C.primary} />}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Overview</Text>
                    <Text style={styles.headerDate}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Sign out</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <Text style={styles.sectionLabel}>OVERVIEW</Text>
            <View style={styles.statsGrid}>
                <StatCard label="Total Users" value={stats?.totalUsers} icon="👥" color={C.blue} soft={C.blueSoft} sub="All accounts" />
                <StatCard label="Active Users" value={stats?.activeUsers} icon="✅" color={C.green} soft={C.greenSoft} sub="Enabled" />
                <StatCard label="New This Week" value={stats?.newUsersThisWeek} icon="🆕" color={C.purple} soft={C.purpleSoft} sub="Last 7 days" />
                <StatCard label="Active Today" value={stats?.recentlyActive} icon="🟢" color={C.amber} soft={C.amberSoft} sub="Last 24 hrs" />
            </View>

            {/* Role Breakdown */}
            <Text style={styles.sectionLabel}>USERS BY ROLE</Text>
            <View style={styles.card}>
                {Object.entries(ROLE_COLORS).map(([key, cfg]) => {
                    const count = roleCounts[key] || 0;
                    if (!count) return null;
                    const pct = stats?.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                    return (
                        <View key={key} style={styles.roleRow}>
                            <View style={[styles.roleDot, { backgroundColor: cfg.color }]} />
                            <Text style={styles.roleLabel}>{cfg.label}</Text>
                            <View style={styles.roleBarBg}>
                                <View style={[styles.roleBarFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                            </View>
                            <Text style={[styles.roleCount, { color: cfg.color }]}>{count}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
                {[
                    { icon: '👥', label: 'Users', color: C.blue, soft: C.blueSoft, screen: 'AdminUsers' },
                    { icon: '📋', label: 'Leaves', color: C.purple, soft: C.purpleSoft, screen: 'AdminLeaves' },
                    { icon: '📍', label: 'Attendance', color: C.green, soft: C.greenSoft, screen: 'AdminAttendance' },
                    { icon: '⚙️', label: 'Settings', color: C.amber, soft: C.amberSoft, screen: 'AdminSettings' },
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

            {/* Recently Joined */}
            <Text style={styles.sectionLabel}>RECENTLY JOINED</Text>
            <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                {recentUsers.length === 0
                    ? <Text style={styles.emptyText}>No users yet</Text>
                    : recentUsers.map((u, i) => {
                        const cfg = ROLE_COLORS[u.role] || ROLE_COLORS.agent;
                        return (
                            <View
                                key={u._id}
                                style={[styles.userRow, i < recentUsers.length - 1 && styles.rowDivider]}
                            >
                                <View style={[styles.avatar, { backgroundColor: cfg.soft }]}>
                                    <Text style={[styles.avatarText, { color: cfg.color }]}>
                                        {u.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{u.name}</Text>
                                    <Text style={styles.userEmail}>{u.email}</Text>
                                </View>
                                <View style={[styles.rolePill, { backgroundColor: cfg.soft }]}>
                                    <Text style={[styles.rolePillText, { color: cfg.color }]}>{cfg.label}</Text>
                                </View>
                            </View>
                        );
                    })
                }
            </View>

            {/* System Health */}
            <Text style={styles.sectionLabel}>SYSTEM HEALTH</Text>
            <View style={styles.card}>
                {[
                    { label: 'User Activation Rate', value: stats?.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0, color: C.green },
                    { label: 'Daily Login Rate', value: stats?.totalUsers > 0 ? Math.round((stats.recentlyActive / stats.totalUsers) * 100) : 0, color: C.blue },
                    { label: 'New User Growth', value: stats?.totalUsers > 0 ? Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100) : 0, color: C.purple },
                ].map(item => (
                    <View key={item.label} style={styles.healthRow}>
                        <View style={styles.healthTop}>
                            <Text style={styles.healthLabel}>{item.label}</Text>
                            <Text style={[styles.healthPct, { color: item.color }]}>{item.value}%</Text>
                        </View>
                        <View style={styles.barBg}>
                            <View style={[styles.barFill, { width: `${item.value}%`, backgroundColor: item.color }]} />
                        </View>
                    </View>
                ))}

                <View style={styles.tileRow}>
                    <View style={[styles.tile, { backgroundColor: C.amberSoft }]}>
                        <Text style={[styles.tileVal, { color: C.amber }]}>{stats?.inactiveUsers || 0}</Text>
                        <Text style={[styles.tileLabel, { color: C.amber }]}>Inactive Users</Text>
                    </View>
                    <View style={[styles.tile, { backgroundColor: C.greenSoft }]}>
                        <Text style={[styles.tileVal, { color: C.green }]}>{stats?.recentlyActive || 0}</Text>
                        <Text style={[styles.tileLabel, { color: C.green }]}>Active Today</Text>
                    </View>
                </View>
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
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: C.text },
    headerDate: { fontSize: 13, color: C.textSub, marginTop: 4 },
    logoutBtn: { backgroundColor: C.redSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
    logoutText: { color: C.red, fontWeight: '700', fontSize: 13 },

    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    statCard: {
        width: '47%', backgroundColor: C.surface, borderRadius: 16,
        padding: 16, marginHorizontal: 2, ...shadow,
    },
    statIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statValue: { fontSize: 28, fontWeight: '800', color: C.text },
    statLabel: { fontSize: 13, color: C.textSub, marginTop: 2 },
    statSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

    card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, ...shadow },

    roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    roleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    roleLabel: { fontSize: 13, color: C.textSub, width: 90 },
    roleBarBg: { flex: 1, height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, marginRight: 10, overflow: 'hidden' },
    roleBarFill: { height: 6, borderRadius: 3 },
    roleCount: { fontSize: 13, fontWeight: '800', width: 24, textAlign: 'right' },

    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
    quickBtn: {
        width: '47%', borderRadius: 16, padding: 20,
        alignItems: 'center', marginHorizontal: 2,
    },
    quickLabel: { fontSize: 13, fontWeight: '700', marginTop: 8 },

    userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontWeight: '800', fontSize: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 14, fontWeight: '600', color: C.text },
    userEmail: { fontSize: 12, color: C.textSub, marginTop: 2 },
    rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    rolePillText: { fontSize: 11, fontWeight: '700' },

    healthRow: { marginBottom: 14 },
    healthTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    healthLabel: { fontSize: 13, color: C.textSub },
    healthPct: { fontSize: 13, fontWeight: '700' },
    barBg: { height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },

    tileRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    tile: { flex: 1, borderRadius: 14, padding: 16 },
    tileVal: { fontSize: 26, fontWeight: '800' },
    tileLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },

    emptyText: { color: C.textMuted, textAlign: 'center', padding: 20 },
});
