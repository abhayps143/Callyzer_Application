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


// import React, { useState, useEffect, useContext } from 'react';
// import {
//   View, Text, ScrollView, StyleSheet, TouchableOpacity,
//   ActivityIndicator, RefreshControl, StatusBar
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AuthContext } from '../../context/AuthContext';
// import { C, shadow } from '../../theme';

// const API = 'http://192.168.1.65:5000/api';

// const ROLE_CLR = {
//   agent: { color: C.green, soft: C.greenSoft },
//   team_leader: { color: C.cyan, soft: C.cyanSoft },
//   manager: { color: C.primary, soft: C.primarySoft },
//   hr: { color: C.amber, soft: C.amberSoft },
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
//       const [sRes, mRes] = await Promise.all([
//         fetch(`${API}/manager/stats`, { headers: h }),
//         fetch(`${API}/manager/recent-members`, { headers: h }),
//       ]);
//       setStats(await sRes.json());
//       const md = await mRes.json();
//       setRecentMembers(md.members || []);
//     } catch (e) { console.log('Manager stats error:', e); }
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => { fetchData(); }, []);

//   if (loading) return (
//     <View style={styles.center}>
//       <ActivityIndicator size="large" color={C.primary} />
//     </View>
//   );

//   const achieved = stats?.achieved || 0;
//   const monthTarget = stats?.monthlyTarget || 0;
//   const pct = monthTarget > 0 ? Math.round((achieved / monthTarget) * 100) : 0;

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={styles.content}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} />}
//     >
//       <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

//       {/* Header */}
//       <View style={styles.header}>
//         <View style={[styles.roleTag, { backgroundColor: C.primarySoft }]}>
//           <Text style={[styles.roleTagText, { color: C.primary }]}>Manager</Text>
//         </View>
//         <Text style={styles.name}>{user?.name || 'Manager'}</Text>
//         <Text style={styles.date}>
//           {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
//         </Text>
//       </View>

//       {/* Stats */}
//       <Text style={styles.sectionLabel}>TEAM OVERVIEW</Text>
//       <View style={styles.statsGrid}>
//         {[
//           { label: 'Total Members', value: stats?.totalMembers, icon: '👥', color: C.primary, soft: C.primarySoft },
//           { label: 'Active Members', value: stats?.activeMembers, icon: '✅', color: C.green, soft: C.greenSoft },
//           { label: "Today's Calls", value: stats?.todayCalls, icon: '📞', color: C.blue, soft: C.blueSoft },
//           { label: 'This Month', value: stats?.monthCalls, icon: '📊', color: C.amber, soft: C.amberSoft },
//         ].map(m => (
//           <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color, borderTopWidth: 3 }]}>
//             <View style={[styles.metricIcon, { backgroundColor: m.soft }]}>
//               <Text style={{ fontSize: 20 }}>{m.icon}</Text>
//             </View>
//             <Text style={styles.metricValue}>{m.value ?? '0'}</Text>
//             <Text style={styles.metricLabel}>{m.label}</Text>
//           </View>
//         ))}
//       </View>

//       {/* Targets */}
//       <Text style={styles.sectionLabel}>TARGET STATUS</Text>
//       <View style={styles.card}>
//         <View style={styles.targetHeaderRow}>
//           <Text style={styles.cardTitle}>Monthly Target</Text>
//           <Text style={[styles.pctBadge, { color: pct >= 100 ? C.green : C.primary }]}>{pct}%</Text>
//         </View>

//         <View style={styles.barBg}>
//           <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? C.green : C.primary }]} />
//         </View>

//         <View style={styles.targetMetaRow}>
//           {[
//             { label: 'Target', value: monthTarget, color: C.primary },
//             { label: 'Achieved', value: achieved, color: C.green },
//             { label: 'Remaining', value: Math.max(monthTarget - achieved, 0), color: C.amber },
//           ].map(t => (
//             <View key={t.label} style={styles.targetMeta}>
//               <Text style={[styles.targetMetaVal, { color: t.color }]}>{t.value ?? '—'}</Text>
//               <Text style={styles.targetMetaLabel}>{t.label}</Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       {/* Recent Members */}
//       <Text style={styles.sectionLabel}>RECENT TEAM MEMBERS</Text>
//       <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
//         {recentMembers.length === 0
//           ? <Text style={styles.empty}>No team members found</Text>
//           : recentMembers.map((m, i) => {
//             const cfg = ROLE_CLR[m.role] || ROLE_CLR.agent;
//             return (
//               <View key={m._id || i} style={[styles.memberRow, i < recentMembers.length - 1 && styles.memberDivider]}>
//                 <View style={[styles.avatar, { backgroundColor: cfg.soft }]}>
//                   <Text style={[styles.avatarText, { color: cfg.color }]}>
//                     {(m.name || 'U').charAt(0).toUpperCase()}
//                   </Text>
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.memberName}>{m.name}</Text>
//                   <Text style={styles.memberEmail}>{m.email}</Text>
//                 </View>
//                 <View style={[styles.rolePill, { backgroundColor: cfg.soft }]}>
//                   <Text style={[styles.rolePillText, { color: cfg.color }]}>
//                     {m.role?.replace('_', ' ')}
//                   </Text>
//                 </View>
//               </View>
//             );
//           })
//         }
//       </View>

//       <View style={{ height: 32 }} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: C.bg },
//   content: { paddingBottom: 20 },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

//   header: {
//     paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
//     backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16,
//   },
//   roleTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
//   roleTagText: { fontSize: 11, fontWeight: '700' },
//   name: { fontSize: 22, fontWeight: '800', color: C.text },
//   date: { fontSize: 13, color: C.textSub, marginTop: 4 },

//   sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },

//   statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 16 },
//   metricCard: { width: '47%', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginHorizontal: 2, ...shadow },
//   metricIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
//   metricValue: { fontSize: 26, fontWeight: '800', color: C.text },
//   metricLabel: { fontSize: 12, color: C.textSub, marginTop: 2, fontWeight: '500' },

//   card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, ...shadow },
//   cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },

//   targetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
//   pctBadge: { fontSize: 20, fontWeight: '800' },
//   barBg: { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
//   barFill: { height: 8, borderRadius: 4 },
//   targetMetaRow: { flexDirection: 'row', justifyContent: 'space-around' },
//   targetMeta: { alignItems: 'center' },
//   targetMetaVal: { fontSize: 20, fontWeight: '800' },
//   targetMetaLabel: { fontSize: 12, color: C.textSub, marginTop: 2 },

//   memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
//   memberDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
//   avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   avatarText: { fontSize: 18, fontWeight: '800' },
//   memberName: { fontSize: 14, fontWeight: '600', color: C.text },
//   memberEmail: { fontSize: 12, color: C.textSub, marginTop: 2 },
//   rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//   rolePillText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

//   empty: { textAlign: 'center', color: C.textMuted, padding: 20 },
// });
// src/screens/manager/ManagerDashboardScreen.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { C, shadow } from '../../theme';

const { width } = Dimensions.get('window');

const fmtDuration = (s) => {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const StatusPill = ({ status }) => {
  const cfg = {
    Connected: { bg: C.greenSoft, color: C.green },
    Missed: { bg: C.redSoft, color: C.red },
    Rejected: { bg: C.amberSoft, color: C.amber },
  };
  const c = cfg[status] || cfg.Missed;
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.color }]}>{status}</Text>
    </View>
  );
};

const TypeBadge = ({ type }) => {
  const isIncoming = type === 'Incoming';
  return (
    <View style={[styles.pill, { backgroundColor: isIncoming ? C.blueSoft : C.purpleSoft }]}>
      <Text style={[styles.pillText, { color: isIncoming ? C.blue : C.purple }]}>
        {isIncoming ? '↙ Incoming' : '↗ Outgoing'}
      </Text>
    </View>
  );
};

const MetricCard = ({ title, value, icon, color, soft }) => (
  <View style={[styles.metricCard, { backgroundColor: C.surface }]}>
    <View style={[styles.metricIcon, { backgroundColor: soft }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

export default function ManagerDashboardScreen() {
  const { user, logout } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState({
    daily: { target: 0, achieved: 0, percentage: 0 },
    monthly: { target: 0, achieved: 0, percentage: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setError('');
    try {
      console.log('🔵 Fetching Manager Dashboard data...');

      // Fetch dashboard stats and progress in parallel
      const [dashRes, progressRes] = await Promise.allSettled([
        api.getDashboardStats(),  // Dashboard stats API
        api.getMyProgress(),      // Progress API
      ]);

      // Handle Dashboard Response
      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const dashData = dashRes.value;
        console.log('📊 Manager Dashboard Data:', JSON.stringify(dashData, null, 2));

        if (dashData.summary) {
          setData(dashData);
        } else if (dashData.success === false) {
          setError(dashData.message || 'Failed to load dashboard');
        } else {
          setData({
            summary: dashData.summary || {
              totalCalls: dashData.totalCalls || 0,
              incomingCalls: dashData.incomingCalls || 0,
              outgoingCalls: dashData.outgoingCalls || 0,
              missedCalls: dashData.missedCalls || 0,
              connectRate: dashData.connectRate || 0,
              avgDuration: dashData.avgDuration || '0s',
            },
            weeklyTrend: dashData.weeklyTrend || [],
            recentCalls: dashData.recentCalls || [],
            topAgents: dashData.topAgents || [],
          });
        }
      } else {
        console.log('❌ Dashboard fetch failed:', dashRes.reason);
        setError('Dashboard data could not be loaded');
      }

      // Handle Progress Response
      if (progressRes.status === 'fulfilled' && progressRes.value) {
        const progData = progressRes.value;
        console.log('📈 Progress Data:', JSON.stringify(progData, null, 2));
        setProgress({
          daily: {
            target: progData.daily?.target || 0,
            achieved: progData.daily?.achieved || 0,
            percentage: progData.daily?.percentage || 0,
          },
          monthly: {
            target: progData.monthly?.target || 0,
            achieved: progData.monthly?.achieved || 0,
            percentage: progData.monthly?.percentage || 0,
          },
        });
      } else {
        console.log('❌ Progress fetch failed:', progressRes.reason);
      }

    } catch (e) {
      console.log('❌ Dashboard error:', e);
      setError(e.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.retryText}>Try Again →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { summary, weeklyTrend, recentCalls, topAgents } = data || {};

  const metrics = [
    { title: 'Team Calls', value: summary?.totalCalls?.toLocaleString() || '0', icon: '📞', color: C.primary, soft: C.primarySoft },
    { title: 'Incoming', value: summary?.incomingCalls?.toLocaleString() || '0', icon: '↙️', color: C.blue, soft: C.blueSoft },
    { title: 'Outgoing', value: summary?.outgoingCalls?.toLocaleString() || '0', icon: '↗️', color: C.purple, soft: C.purpleSoft },
    { title: 'Missed', value: summary?.missedCalls?.toLocaleString() || '0', icon: '⚠️', color: C.red, soft: C.redSoft },
  ];

  const maxTotal = weeklyTrend && weeklyTrend.length > 0
    ? Math.max(...weeklyTrend.map(d => d.total), 1)
    : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manager Dashboard</Text>
          <Text style={styles.userName}>{user?.name || 'Manager'}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{user?.role || 'manager'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorMsg}>⚠️ {error}</Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Metrics Grid */}
      <Text style={styles.sectionLabel}>TEAM OVERVIEW</Text>
      <View style={styles.metricsGrid}>
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </View>

      {/* Connect Rate Card */}
      {summary?.connectRate !== undefined && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Team Connect Rate</Text>
            <Text style={[styles.boldVal, { color: C.primary }]}>{summary.connectRate}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(summary.connectRate, 100)}%`, backgroundColor: C.primary }]} />
          </View>
          <Text style={styles.cardSubtext}>Overall team performance</Text>
        </View>
      )}

      {/* Weekly Chart */}
      {weeklyTrend && weeklyTrend.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team Weekly Activity</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.blue }]} /><Text style={styles.legendText}>Incoming</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.purple }]} /><Text style={styles.legendText}>Outgoing</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: C.red }]} /><Text style={styles.legendText}>Missed</Text></View>
          </View>
          <View style={styles.chartRow}>
            {weeklyTrend.map((d, i) => {
              const barHeight = Math.max(((d.total / maxTotal) * 100), 4);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValLabel}>{d.total}</Text>
                  <View style={[styles.chartBarStack, { height: barHeight }]}>
                    <View style={[styles.chartBarMissed, { height: `${(d.missed / Math.max(d.total, 1)) * 100}%` }]} />
                    <View style={[styles.chartBarOutgoing, { height: `${(d.outgoing / Math.max(d.total, 1)) * 100}%` }]} />
                    <View style={[styles.chartBarIncoming, { flex: 1 }]} />
                  </View>
                  <Text style={styles.barDayLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Top Performing Agents */}
      {topAgents && topAgents.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Performing Agents</Text>
          <Text style={styles.cardSubtext}>By connected calls</Text>
          {topAgents.slice(0, 5).map((agent, i) => {
            const rate = agent.calls > 0 ? Math.round((agent.connected / agent.calls) * 100) : 0;
            const agentColor = agent.color || C.primary;
            return (
              <View key={i} style={styles.agentRow}>
                <View style={[styles.avatar, { backgroundColor: agentColor + '20' }]}>
                  <Text style={[styles.avatarText, { color: agentColor }]}>
                    {(agent.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.agentTop}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRate}>{rate}%</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: agentColor }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Team Targets Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressCard, { flex: 1, marginRight: 6 }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Team Daily Target</Text>
            <Text style={styles.progressValue}>{progress.daily.achieved} / {progress.daily.target}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(progress.daily.percentage, 100)}%`, backgroundColor: C.blue }]} />
          </View>
          <Text style={styles.progressPct}>{progress.daily.percentage}% completed</Text>
        </View>
        <View style={[styles.progressCard, { flex: 1, marginLeft: 6 }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Team Monthly Target</Text>
            <Text style={styles.progressValue}>{progress.monthly.achieved} / {progress.monthly.target}</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(progress.monthly.percentage, 100)}%`, backgroundColor: C.purple }]} />
          </View>
          <Text style={styles.progressPct}>{progress.monthly.percentage}% completed</Text>
        </View>
      </View>

      {/* Recent Team Calls */}
      {recentCalls && recentCalls.length > 0 && (
        <View style={styles.tableCard}>
          <Text style={styles.cardTitle}>Recent Team Calls</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.thCaller]}>Agent / Customer</Text>
            <Text style={[styles.thText, styles.thType]}>Type</Text>
            <Text style={[styles.thText, styles.thDuration]}>Duration</Text>
            <Text style={[styles.thText, styles.thStatus]}>Status</Text>
          </View>
          {recentCalls.slice(0, 8).map((call, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.callerCell}>
                <View style={styles.callerAvatar}>
                  <Text style={styles.callerAvatarText}>{call.avatar || (call.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.callerName}>{call.name}</Text>
                  <Text style={styles.callerNumber}>{call.number}</Text>
                </View>
              </View>
              <View style={styles.typeCell}><TypeBadge type={call.type} /></View>
              <View style={styles.durationCell}><Text style={styles.durationText}>{call.duration}</Text></View>
              <View style={styles.statusCell}><StatusPill status={call.status} /></View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, padding: 24 },
  loadingText: { marginTop: 12, color: C.textSub, fontSize: 14 },

  errorBox: { backgroundColor: C.redSoft, borderRadius: 16, padding: 20, alignItems: 'center' },
  errorTitle: { color: C.red, fontSize: 14, marginBottom: 12 },
  retryText: { color: C.red, fontWeight: '600' },
  errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.redSoft, marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 12 },
  errorMsg: { color: C.red, fontSize: 13, flex: 1 },
  retryLink: { color: C.red, fontWeight: '700' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: C.textSub },
  userName: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 2 },
  rolePill: { marginTop: 6, backgroundColor: C.primarySoft, borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '600', color: C.primary, textTransform: 'capitalize' },
  logoutBtn: { backgroundColor: C.redSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  logoutText: { color: C.red, fontWeight: '700', fontSize: 13 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 12 },
  metricCard: { width: '47%', borderRadius: 16, padding: 16, marginHorizontal: 2, ...shadow },
  metricIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  metricValue: { fontSize: 26, fontWeight: '800', color: C.text },
  metricTitle: { fontSize: 12, color: C.textSub, marginTop: 2 },

  card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  cardSubtext: { fontSize: 11, color: C.textMuted, marginTop: 6 },
  boldVal: { fontSize: 16, fontWeight: '800' },

  barBg: { height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: C.textSub },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, justifyContent: 'space-between', marginTop: 8 },
  barCol: { flex: 1, alignItems: 'center' },
  barValLabel: { color: C.textMuted, fontSize: 9, marginBottom: 4 },
  chartBarStack: { width: 28, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarMissed: { backgroundColor: C.red, width: '100%' },
  chartBarOutgoing: { backgroundColor: C.purple, width: '100%' },
  chartBarIncoming: { backgroundColor: C.blue, width: '100%' },
  barDayLabel: { color: C.textSub, fontSize: 10, marginTop: 6, fontWeight: '500' },

  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  agentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  agentName: { fontSize: 14, fontWeight: '600', color: C.text },
  agentRate: { fontSize: 13, fontWeight: '700', color: C.textSub },

  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', fontSize: 14 },

  progressRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 12 },
  progressCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, ...shadow },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: C.textSub },
  progressValue: { fontSize: 14, fontWeight: '700', color: C.text },
  progressPct: { fontSize: 11, color: C.textMuted, marginTop: 6 },

  tableCard: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, ...shadow },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 8 },
  thText: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  thCaller: { flex: 1.5 },
  thType: { flex: 0.8 },
  thDuration: { flex: 0.7 },
  thStatus: { flex: 0.8 },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  callerCell: { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 10 },
  callerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  callerAvatarText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  callerName: { fontSize: 13, fontWeight: '600', color: C.text },
  callerNumber: { fontSize: 11, color: C.textSub, marginTop: 1 },
  typeCell: { flex: 0.8 },
  durationCell: { flex: 0.7 },
  durationText: { fontSize: 12, color: C.textSub, fontWeight: '500' },
  statusCell: { flex: 0.8 },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '700' },
});