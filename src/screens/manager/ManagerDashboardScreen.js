// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View, Text, ScrollView, StyleSheet, TouchableOpacity,
//   ActivityIndicator, RefreshControl
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AuthContext } from '../../context/AuthContext';

// //Vianayk IP-Adress
// const API = 'http://192.168.1.65:5000/api';


// //Abhay IP-Adress
// // const API = 'http://192.168.1.51:5000/api';

// const StatCard = ({ label, value, icon, color, sub }) => (
//   <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
//     <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
//       <Text style={{ fontSize: 22 }}>{icon}</Text>
//     </View>
//     <Text style={styles.statValue}>{value ?? '0'}</Text>
//     <Text style={styles.statLabel}>{label}</Text>
//     {sub && <Text style={styles.statSub}>{sub}</Text>}
//   </View>
// );

// const MemberRow = ({ member }) => {
//   const roleColors = {
//     agent: '#10B981', team_leader: '#0EA5E9',
//     manager: '#6366F1', hr: '#F59E0B',
//   };
//   const color = roleColors[member.role] || '#6B7280';
//   return (
//     <View style={styles.memberRow}>
//       <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
//         <Text style={[styles.avatarText, { color }]}>
//           {(member.name || 'U').charAt(0).toUpperCase()}
//         </Text>
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.memberName}>{member.name}</Text>
//         <Text style={styles.memberEmail}>{member.email}</Text>
//       </View>
//       <View style={[styles.roleBadge, { backgroundColor: color + '20' }]}>
//         <Text style={[styles.roleText, { color }]}>
//           {member.role?.replace('_', ' ')}
//         </Text>
//       </View>
//     </View>
//   );
// };

// export default function ManagerDashboardScreen() {
//   const { user } = useContext(AuthContext);
//   const [stats, setStats] = useState(null);
//   const [recentMembers, setRecentMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const fetchData = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const h = { Authorization: `Bearer ${token}` };
//       const [statsRes, membersRes] = await Promise.all([
//         fetch(`${API}/manager/stats`, { headers: h }),
//         fetch(`${API}/manager/recent-members`, { headers: h }),
//       ]);
//       const statsData = await statsRes.json();
//       const membersData = await membersRes.json();
//       setStats(statsData);
//       setRecentMembers(membersData.members || []);
//     } catch (e) {
//       console.log('Manager stats error:', e);
//     }
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => { fetchData(); }, []);

//   if (loading) return (
//     <View style={styles.center}>
//       <ActivityIndicator size="large" color="#6366F1" />
//     </View>
//   );

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#6366F1" />
//       }
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.greeting}>Welcome back 👋</Text>
//           <Text style={styles.headerTitle}>{user?.name || 'Manager'}</Text>
//           <Text style={styles.headerDate}>
//             {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
//           </Text>
//         </View>
//       </View>

//       {/* Stats */}
//       <Text style={styles.sectionTitle}>Team Overview</Text>
//       <View style={styles.statsGrid}>
//         <StatCard label="Total Members" value={stats?.totalMembers} icon="👥" color="#6366F1" sub="In your team" />
//         <StatCard label="Active Members" value={stats?.activeMembers} icon="✅" color="#10B981" sub="Enabled" />
//         <StatCard label="Today's Calls" value={stats?.todayCalls} icon="📞" color="#3B82F6" sub="All members" />
//         <StatCard label="This Month" value={stats?.monthCalls} icon="📊" color="#F59E0B" sub="Total calls" />
//       </View>

//       {/* Targets Overview */}
//       <Text style={styles.sectionTitle}>Targets Status</Text>
//       <View style={styles.targetCard}>
//         <View style={styles.targetRow}>
//           <Text style={styles.targetLabel}>🎯 Monthly Target</Text>
//           <Text style={[styles.targetValue, { color: '#6366F1' }]}>{stats?.monthlyTarget ?? '—'}</Text>
//         </View>
//         <View style={styles.targetRow}>
//           <Text style={styles.targetLabel}>✅ Achieved</Text>
//           <Text style={[styles.targetValue, { color: '#10B981' }]}>{stats?.achieved ?? '—'}</Text>
//         </View>
//         <View style={styles.targetRow}>
//           <Text style={styles.targetLabel}>📈 Achievement %</Text>
//           <Text style={[styles.targetValue, { color: '#F59E0B' }]}>
//             {stats?.monthlyTarget && stats?.achieved
//               ? `${Math.round((stats.achieved / stats.monthlyTarget) * 100)}%`
//               : '—'}
//           </Text>
//         </View>
//       </View>

//       {/* Recent Team Members */}
//       <Text style={styles.sectionTitle}>Recent Team Members</Text>
//       <View style={styles.card}>
//         {recentMembers.length === 0 ? (
//           <Text style={styles.emptyText}>No team members found</Text>
//         ) : (
//           recentMembers.map((m, i) => <MemberRow key={m._id || i} member={m} />)
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8FAFC' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   header: {
//     backgroundColor: '#6366F1',
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     paddingBottom: 28,
//   },
//   greeting: { color: '#C7D2FE', fontSize: 13, marginBottom: 4 },
//   headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
//   headerDate: { color: '#C7D2FE', fontSize: 13, marginTop: 4 },
//   sectionTitle: {
//     fontSize: 16, fontWeight: '700', color: '#1E293B',
//     marginHorizontal: 16, marginTop: 20, marginBottom: 10,
//   },
//   statsGrid: {
//     flexDirection: 'row', flexWrap: 'wrap',
//     paddingHorizontal: 12, gap: 8,
//   },
//   statCard: {
//     backgroundColor: '#fff', borderRadius: 14, padding: 14,
//     width: '47%', shadowColor: '#000', shadowOpacity: 0.05,
//     shadowRadius: 6, elevation: 2,
//   },
//   statIcon: {
//     width: 44, height: 44, borderRadius: 10,
//     justifyContent: 'center', alignItems: 'center', marginBottom: 8,
//   },
//   statValue: { fontSize: 26, fontWeight: 'bold', color: '#1E293B' },
//   statLabel: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
//   statSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
//   targetCard: {
//     backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
//     padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
//   },
//   targetRow: {
//     flexDirection: 'row', justifyContent: 'space-between',
//     alignItems: 'center', paddingVertical: 10,
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
//   },
//   targetLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
//   targetValue: { fontSize: 18, fontWeight: 'bold' },
//   card: {
//     backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14,
//     shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
//     marginBottom: 20, overflow: 'hidden',
//   },
//   memberRow: {
//     flexDirection: 'row', alignItems: 'center', padding: 14,
//     borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
//   },
//   avatar: {
//     width: 42, height: 42, borderRadius: 21,
//     justifyContent: 'center', alignItems: 'center', marginRight: 12,
//   },
//   avatarText: { fontSize: 18, fontWeight: 'bold' },
//   memberName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
//   memberEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
//   roleBadge: {
//     paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
//   },
//   roleText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
//   emptyText: { textAlign: 'center', color: '#94A3B8', padding: 20 },
// });


import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { C, shadow } from '../../theme';

const API = 'http://192.168.1.65:5000/api';

const ROLE_CLR = {
  agent: { color: C.green, soft: C.greenSoft },
  team_leader: { color: C.cyan, soft: C.cyanSoft },
  manager: { color: C.primary, soft: C.primarySoft },
  hr: { color: C.amber, soft: C.amberSoft },
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
      const [sRes, mRes] = await Promise.all([
        fetch(`${API}/manager/stats`, { headers: h }),
        fetch(`${API}/manager/recent-members`, { headers: h }),
      ]);
      setStats(await sRes.json());
      const md = await mRes.json();
      setRecentMembers(md.members || []);
    } catch (e) { console.log('Manager stats error:', e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  const achieved = stats?.achieved || 0;
  const monthTarget = stats?.monthlyTarget || 0;
  const pct = monthTarget > 0 ? Math.round((achieved / monthTarget) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.roleTag, { backgroundColor: C.primarySoft }]}>
          <Text style={[styles.roleTagText, { color: C.primary }]}>Manager</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Manager'}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Stats */}
      <Text style={styles.sectionLabel}>TEAM OVERVIEW</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Members', value: stats?.totalMembers, icon: '👥', color: C.primary, soft: C.primarySoft },
          { label: 'Active Members', value: stats?.activeMembers, icon: '✅', color: C.green, soft: C.greenSoft },
          { label: "Today's Calls", value: stats?.todayCalls, icon: '📞', color: C.blue, soft: C.blueSoft },
          { label: 'This Month', value: stats?.monthCalls, icon: '📊', color: C.amber, soft: C.amberSoft },
        ].map(m => (
          <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color, borderTopWidth: 3 }]}>
            <View style={[styles.metricIcon, { backgroundColor: m.soft }]}>
              <Text style={{ fontSize: 20 }}>{m.icon}</Text>
            </View>
            <Text style={styles.metricValue}>{m.value ?? '0'}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Targets */}
      <Text style={styles.sectionLabel}>TARGET STATUS</Text>
      <View style={styles.card}>
        <View style={styles.targetHeaderRow}>
          <Text style={styles.cardTitle}>Monthly Target</Text>
          <Text style={[styles.pctBadge, { color: pct >= 100 ? C.green : C.primary }]}>{pct}%</Text>
        </View>

        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? C.green : C.primary }]} />
        </View>

        <View style={styles.targetMetaRow}>
          {[
            { label: 'Target', value: monthTarget, color: C.primary },
            { label: 'Achieved', value: achieved, color: C.green },
            { label: 'Remaining', value: Math.max(monthTarget - achieved, 0), color: C.amber },
          ].map(t => (
            <View key={t.label} style={styles.targetMeta}>
              <Text style={[styles.targetMetaVal, { color: t.color }]}>{t.value ?? '—'}</Text>
              <Text style={styles.targetMetaLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Members */}
      <Text style={styles.sectionLabel}>RECENT TEAM MEMBERS</Text>
      <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
        {recentMembers.length === 0
          ? <Text style={styles.empty}>No team members found</Text>
          : recentMembers.map((m, i) => {
            const cfg = ROLE_CLR[m.role] || ROLE_CLR.agent;
            return (
              <View key={m._id || i} style={[styles.memberRow, i < recentMembers.length - 1 && styles.memberDivider]}>
                <View style={[styles.avatar, { backgroundColor: cfg.soft }]}>
                  <Text style={[styles.avatarText, { color: cfg.color }]}>
                    {(m.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: cfg.soft }]}>
                  <Text style={[styles.rolePillText, { color: cfg.color }]}>
                    {m.role?.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            );
          })
        }
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
  metricIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { fontSize: 26, fontWeight: '800', color: C.text },
  metricLabel: { fontSize: 12, color: C.textSub, marginTop: 2, fontWeight: '500' },

  card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, ...shadow },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  targetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pctBadge: { fontSize: 20, fontWeight: '800' },
  barBg: { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  barFill: { height: 8, borderRadius: 4 },
  targetMetaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  targetMeta: { alignItems: 'center' },
  targetMetaVal: { fontSize: 20, fontWeight: '800' },
  targetMetaLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },

  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  memberDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '600', color: C.text },
  memberEmail: { fontSize: 12, color: C.textSub, marginTop: 2 },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  empty: { textAlign: 'center', color: C.textMuted, padding: 20 },
});
