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