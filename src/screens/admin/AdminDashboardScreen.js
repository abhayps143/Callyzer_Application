import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.65:5000/api';
const { width } = Dimensions.get('window');

const ROLE_CONFIG = {
  super_admin: { color: '#8B5CF6', label: 'Super Admin' },
  admin: { color: '#3B82F6', label: 'Admin' },
  manager: { color: '#6366F1', label: 'Manager' },
  team_leader: { color: '#0EA5E9', label: 'Team Leader' },
  agent: { color: '#10B981', label: 'Agent' },
  hr: { color: '#F59E0B', label: 'HR' },
  finance: { color: '#F97316', label: 'Finance' },
};

const StatCard = ({ label, value, icon, color, sub }) => (
  <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
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
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [s, r] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: h }).then(x => x.json()),
        fetch(`${API}/admin/recent-users`, { headers: h }).then(x => x.json()),
      ]);
      setStats(s);
      setRecentUsers(r.users || []);
    } catch (e) {
      console.log('Admin stats error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );

  const roleCounts = stats?.roleCounts || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#3B82F6" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Overview</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stat Cards */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Total Users" value={stats?.totalUsers} icon="👥" color="#3B82F6" sub="All accounts" />
        <StatCard label="Active Users" value={stats?.activeUsers} icon="✅" color="#10B981" sub="Enabled" />
        <StatCard label="New This Week" value={stats?.newUsersThisWeek} icon="🆕" color="#8B5CF6" sub="Last 7 days" />
        <StatCard label="Active Today" value={stats?.recentlyActive} icon="🟢" color="#F59E0B" sub="Last 24hrs" />
      </View>

      {/* Role Breakdown */}
      <Text style={styles.sectionTitle}>Users by Role</Text>
      <View style={styles.card}>
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const count = roleCounts[key] || 0;
          const pct = stats?.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
          if (count === 0) return null;
          return (
            <View key={key} style={styles.roleRow}>
              <View style={[styles.roleDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.roleLabel}>{cfg.label}</Text>
              <View style={styles.roleBarBg}>
                <View style={[styles.roleBar, { width: `${pct}%`, backgroundColor: cfg.color }]} />
              </View>
              <Text style={[styles.roleCount, { color: cfg.color }]}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {[
          { icon: '👥', label: 'Manage Users', color: '#3B82F6', screen: 'AdminUsers' },
          { icon: '📋', label: 'Leave Mgmt', color: '#8B5CF6', screen: 'AdminLeaves' },
          { icon: '📍', label: 'Attendance', color: '#10B981', screen: 'AdminAttendance' },
          { icon: '⚙️', label: 'Settings', color: '#F59E0B', screen: 'AdminSettings' },
        ].map(a => (
          <TouchableOpacity
            key={a.label}
            style={[styles.quickBtn, { backgroundColor: a.color + '15', borderColor: a.color + '40' }]}
            onPress={() => navigation.navigate(a.screen)}
          >
            <Text style={{ fontSize: 28 }}>{a.icon}</Text>
            <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recently Joined */}
      <Text style={styles.sectionTitle}>Recently Joined</Text>
      <View style={styles.card}>
        {recentUsers.length === 0
          ? <Text style={styles.emptyText}>No users yet</Text>
          : recentUsers.map(u => (
            <View key={u._id} style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: (ROLE_CONFIG[u.role]?.color || '#3B82F6') + 'cc' }]}>
                <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: (ROLE_CONFIG[u.role]?.color || '#3B82F6') + '20' }]}>
                <Text style={[styles.roleBadgeText, { color: ROLE_CONFIG[u.role]?.color || '#3B82F6' }]}>
                  {ROLE_CONFIG[u.role]?.label || u.role}
                </Text>
              </View>
            </View>
          ))
        }
      </View>

      {/* System Health */}
      <Text style={styles.sectionTitle}>System Health</Text>
      <View style={styles.card}>
        {[
          { label: 'User Activation Rate', value: stats?.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0, color: '#10B981' },
          { label: 'Daily Login Rate', value: stats?.totalUsers > 0 ? Math.round((stats.recentlyActive / stats.totalUsers) * 100) : 0, color: '#3B82F6' },
          { label: 'New User Growth', value: stats?.totalUsers > 0 ? Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100) : 0, color: '#8B5CF6' },
        ].map(item => (
          <View key={item.label} style={styles.healthRow}>
            <View style={styles.healthTop}>
              <Text style={styles.healthLabel}>{item.label}</Text>
              <Text style={[styles.healthPct, { color: item.color }]}>{item.value}%</Text>
            </View>
            <View style={styles.healthBarBg}>
              <View style={[styles.healthBar, { width: `${item.value}%`, backgroundColor: item.color }]} />
            </View>
          </View>
        ))}
        <View style={styles.healthTiles}>
          <View style={[styles.healthTile, { backgroundColor: '#FEF9EC' }]}>
            <Text style={styles.healthTileLabel}>Inactive Users</Text>
            <Text style={[styles.healthTileVal, { color: '#B45309' }]}>{stats?.inactiveUsers || 0}</Text>
          </View>
          <View style={[styles.healthTile, { backgroundColor: '#ECFDF5' }]}>
            <Text style={styles.healthTileLabel}>Active Today</Text>
            <Text style={[styles.healthTileVal, { color: '#059669' }]}>{stats?.recentlyActive || 0}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, paddingTop: 50,
    background: '#fff',
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerDate: { fontSize: 13, color: '#64748B', marginTop: 4 },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', paddingHorizontal: 16, paddingVertical: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 4 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    width: (width - 40) / 2, marginHorizontal: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 30, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  roleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  roleLabel: { fontSize: 13, color: '#64748B', width: 90 },
  roleBarBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 4, marginRight: 8 },
  roleBar: { height: '100%', borderRadius: 4 },
  roleCount: { fontSize: 13, fontWeight: '700', width: 24, textAlign: 'right' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 4 },
  quickBtn: {
    width: (width - 40) / 2, borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1.5, marginHorizontal: 2,
  },
  quickLabel: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  userEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  healthRow: { marginBottom: 14 },
  healthTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  healthLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  healthPct: { fontSize: 13, fontWeight: '700' },
  healthBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 },
  healthBar: { height: '100%', borderRadius: 4 },
  healthTiles: { flexDirection: 'row', gap: 10, marginTop: 8 },
  healthTile: { flex: 1, borderRadius: 12, padding: 14 },
  healthTileLabel: { fontSize: 11, color: '#92400E', fontWeight: '500' },
  healthTileVal: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  emptyText: { color: '#94A3B8', textAlign: 'center', padding: 20 },
});