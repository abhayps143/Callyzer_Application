import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';

//Vianayk IP-Adress
const API = 'http://192.168.1.65:5000/api';


//Abhay IP-Adress
// const API = 'http://192.168.1.51:5000/api';

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

const MemberRow = ({ member }) => {
  const roleColors = {
    agent: '#10B981', team_leader: '#0EA5E9',
    manager: '#6366F1', hr: '#F59E0B',
  };
  const color = roleColors[member.role] || '#6B7280';
  return (
    <View style={styles.memberRow}>
      <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
        <Text style={[styles.avatarText, { color }]}>
          {(member.name || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberEmail}>{member.email}</Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.roleText, { color }]}>
          {member.role?.replace('_', ' ')}
        </Text>
      </View>
    </View>
  );
};

export default function ManagerDashboardScreen() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      const [statsRes, membersRes] = await Promise.all([
        fetch(`${API}/manager/stats`, { headers: h }),
        fetch(`${API}/manager/recent-members`, { headers: h }),
      ]);
      const statsData = await statsRes.json();
      const membersData = await membersRes.json();
      setStats(statsData);
      setRecentMembers(membersData.members || []);
    } catch (e) {
      console.log('Manager stats error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#6366F1" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.headerTitle}>{user?.name || 'Manager'}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Team Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard label="Total Members" value={stats?.totalMembers} icon="👥" color="#6366F1" sub="In your team" />
        <StatCard label="Active Members" value={stats?.activeMembers} icon="✅" color="#10B981" sub="Enabled" />
        <StatCard label="Today's Calls" value={stats?.todayCalls} icon="📞" color="#3B82F6" sub="All members" />
        <StatCard label="This Month" value={stats?.monthCalls} icon="📊" color="#F59E0B" sub="Total calls" />
      </View>

      {/* Targets Overview */}
      <Text style={styles.sectionTitle}>Targets Status</Text>
      <View style={styles.targetCard}>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>🎯 Monthly Target</Text>
          <Text style={[styles.targetValue, { color: '#6366F1' }]}>{stats?.monthlyTarget ?? '—'}</Text>
        </View>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>✅ Achieved</Text>
          <Text style={[styles.targetValue, { color: '#10B981' }]}>{stats?.achieved ?? '—'}</Text>
        </View>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>📈 Achievement %</Text>
          <Text style={[styles.targetValue, { color: '#F59E0B' }]}>
            {stats?.monthlyTarget && stats?.achieved
              ? `${Math.round((stats.achieved / stats.monthlyTarget) * 100)}%`
              : '—'}
          </Text>
        </View>
      </View>

      {/* Recent Team Members */}
      <Text style={styles.sectionTitle}>Recent Team Members</Text>
      <View style={styles.card}>
        {recentMembers.length === 0 ? (
          <Text style={styles.emptyText}>No team members found</Text>
        ) : (
          recentMembers.map((m, i) => <MemberRow key={m._id || i} member={m} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 28,
  },
  greeting: { color: '#C7D2FE', fontSize: 13, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerDate: { color: '#C7D2FE', fontSize: 13, marginTop: 4 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#1E293B',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    width: '47%', shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, elevation: 2,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  targetCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  targetRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  targetLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
  targetValue: { fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    marginBottom: 20, overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  memberEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 20 },
});
