//src/screens/manager/ManagerTargetsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl,
  ScrollView, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, shadow } from '../../theme';

const API = 'http://192.168.1.51:5000/api';

const PERIOD_CONFIG = {
  daily: { icon: '☀️', label: 'Daily', color: '#F97316', bg: '#FFF7ED', ring: '#F97316', desc: 'Resets every day' },
  weekly: { icon: '📅', label: 'Weekly', color: '#3B82F6', bg: '#EFF6FF', ring: '#3B82F6', desc: 'Resets every Monday' },
  monthly: { icon: '📊', label: 'Monthly', color: '#6366F1', bg: '#EEF2FF', ring: '#6366F1', desc: 'Resets every 1st' },
};

// ─── Set Target Modal ─────────────────────────────────────────
const SetTargetModal = ({ visible, agent, onClose, onSave, saving }) => {
  const [period, setPeriod] = useState('monthly');
  const [targetValue, setTargetValue] = useState('');

  const selected = PERIOD_CONFIG[period];

  const handleSave = () => {
    if (!targetValue || parseInt(targetValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }
    onSave({ period, targetCalls: parseInt(targetValue) });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={[modalStyles.header, { backgroundColor: selected.color }]}>
            <View style={modalStyles.headerDecor1} />
            <View style={modalStyles.headerDecor2} />
            <View style={modalStyles.headerContent}>
              <View style={modalStyles.headerIcon}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.headerSubtitle}>Set Target</Text>
                <Text style={modalStyles.headerTitle}>{agent?.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={modalStyles.roleBadge}>
              <View style={modalStyles.roleDot} />
              <Text style={modalStyles.roleText}>{agent?.role?.replace('_', ' ') || 'Agent'}</Text>
            </View>
          </View>

          {/* Body */}
          <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
            {/* Period Selection */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>SELECT PERIOD</Text>
              <View style={modalStyles.periodGrid}>
                {Object.entries(PERIOD_CONFIG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      modalStyles.periodCard,
                      period === key && { backgroundColor: cfg.bg, borderColor: cfg.color, borderWidth: 2 }
                    ]}
                    onPress={() => setPeriod(key)}
                  >
                    <Text style={modalStyles.periodIcon}>{cfg.icon}</Text>
                    <Text style={[
                      modalStyles.periodLabel,
                      period === key && { color: cfg.color, fontWeight: '700' }
                    ]}>{cfg.label}</Text>
                    <Text style={modalStyles.periodDesc}>{cfg.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Input */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>
                {selected.label.toUpperCase()} CALL TARGET
              </Text>
              <View style={modalStyles.inputWrapper}>
                <TextInput
                  style={modalStyles.targetInput}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder="e.g. 50"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={modalStyles.inputSuffix}>calls</Text>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionLabel}>QUICK PRESETS</Text>
              <View style={modalStyles.presetRow}>
                {(period === 'daily' ? [10, 20, 30, 50] : period === 'weekly' ? [50, 100, 150, 200] : [100, 200, 300, 500]).map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      modalStyles.presetBtn,
                      targetValue === String(v) && { backgroundColor: selected.bg }
                    ]}
                    onPress={() => setTargetValue(String(v))}
                  >
                    <Text style={[
                      modalStyles.presetText,
                      targetValue === String(v) && { color: selected.color, fontWeight: '700' }
                    ]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                modalStyles.saveBtn,
                { backgroundColor: selected.color },
                saving && { opacity: 0.6 }
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.saveBtnText}>Set {selected.label} Target</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Team Member Card ─────────────────────────────────────────
const TeamMemberCard = ({ member, period, onSetTarget }) => {
  const periodData = member[period] || { target: 0, achieved: 0, percentage: 0 };
  const { target, achieved, percentage } = periodData;
  const pct = Math.min(percentage, 100);
  const pc = PERIOD_CONFIG[period];

  const getProgressColor = () => {
    if (pct >= 100) return '#10B981';
    if (pct >= 80) return '#22C55E';
    if (pct >= 50) return '#F59E0B';
    return pc.color;
  };

  return (
    <View style={styles.memberCard}>
      {/* Top Row */}
      <View style={styles.memberTop}>
        <View style={[styles.avatar, { backgroundColor: pc.bg }]}>
          <Text style={[styles.avatarText, { color: pc.color }]}>
            {member.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.role?.replace('_', ' ') || 'Agent'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.setTargetBtn, { backgroundColor: pc.bg }]}
          onPress={() => onSetTarget(member)}
        >
          <Text style={[styles.setTargetBtnText, { color: pc.color }]}>🎯 Set Target</Text>
        </TouchableOpacity>
      </View>

      {/* Target Badge */}
      <View style={styles.targetRow}>
        <View style={[styles.targetBadge, { backgroundColor: pc.bg }]}>
          <Text style={[styles.targetBadgeText, { color: pc.color }]}>
            Target: {target} calls
          </Text>
        </View>
        <View style={styles.achievedBadge}>
          <Text style={styles.achievedText}>
            Achieved: <Text style={styles.achievedValue}>{achieved}</Text> calls
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: getProgressColor() }]}
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={[styles.progressPercent, { color: getProgressColor() }]}>{Math.round(pct)}%</Text>
          <Text style={styles.progressRemaining}>
            {Math.max(target - achieved, 0)} remaining
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────
export default function ManagerTargetsScreen() {
  const [teamProgress, setTeamProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [modalAgent, setModalAgent] = useState(null);
  const [period, setPeriod] = useState('monthly');

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchTeamProgress = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/targets/team-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTeamProgress(data.teamProgress || []);
    } catch (err) {
      console.log('Fetch team progress error:', err);
      Alert.alert('Error', 'Failed to load team progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTeamProgress(); }, [fetchTeamProgress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamProgress();
  };

  const handleSaveTarget = async ({ period: p, targetCalls }) => {
    setSavingTarget(true);
    const now = new Date();
    try {
      const token = await getToken();
      const res = await fetch(`${API}/targets/manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId: modalAgent.agentId,
          period: p,
          targetCalls,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: p === 'daily' ? now.getDate() : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `${p.charAt(0).toUpperCase() + p.slice(1)} target set for ${modalAgent.name}!`);
        setModalAgent(null);
        fetchTeamProgress();
      } else {
        Alert.alert('Error', data.message || 'Failed to set target');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSavingTarget(false);
    }
  };

  const filteredMembers = teamProgress;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading team targets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Team Targets</Text>
          <Text style={styles.subtitle}>Set & track call targets for your team</Text>
        </View>
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>{teamProgress.length} member(s)</Text>
        </View>
      </View>

      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {['daily', 'weekly', 'monthly'].map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.filterBtn,
                period === p && { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[
                styles.filterText,
                period === p && { color: '#1E293B', fontWeight: '700' }
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Team List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.agentId}
        renderItem={({ item }) => (
          <TeamMemberCard
            member={item}
            period={period}
            onSetTarget={(member) => setModalAgent({ agentId: member.agentId, name: member.name, role: member.role })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No team members found</Text>
            <Text style={styles.emptyText}>Add agents to your team to set targets</Text>
          </View>
        }
      />

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Text style={{ fontSize: 18 }}>💡</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Targets</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}><Text style={styles.infoItemIcon}>☀️</Text><Text style={styles.infoItemText}><Text style={styles.infoItemBold}>Daily</Text> — Resets every day</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoItemIcon}>📅</Text><Text style={styles.infoItemText}><Text style={styles.infoItemBold}>Weekly</Text> — Mon to Sun</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoItemIcon}>📊</Text><Text style={styles.infoItemText}><Text style={styles.infoItemBold}>Monthly</Text> — Resets 1st</Text></View>
          </View>
        </View>
      </View>

      {/* Modal */}
      <SetTargetModal
        visible={!!modalAgent}
        agent={modalAgent}
        onClose={() => setModalAgent(null)}
        onSave={handleSaveTarget}
        saving={savingTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  memberCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  memberCountText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  filterContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  listContent: { padding: 16, paddingBottom: 30 },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  memberTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  memberRole: { fontSize: 12, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' },
  setTargetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  setTargetBtnText: { fontSize: 12, fontWeight: '700' },

  targetRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  targetBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  targetBadgeText: { fontSize: 12, fontWeight: '700' },
  achievedBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  achievedText: { fontSize: 12, color: '#64748B' },
  achievedValue: { fontWeight: '800', color: '#1E293B', fontSize: 13 },

  progressSection: { marginTop: 4 },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressPercent: { fontSize: 13, fontWeight: '800' },
  progressRemaining: { fontSize: 11, color: '#94A3B8' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94A3B8' },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoIcon: { width: 40, height: 40, borderRadius: 16, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  infoRow: { gap: 6 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoItemIcon: { fontSize: 12 },
  infoItemText: { fontSize: 11, color: '#64748B' },
  infoItemBold: { fontWeight: '700', color: '#1E293B' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  header: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 48,
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -16,
    left: -16,
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 16 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    position: 'relative',
    zIndex: 1,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  roleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  body: { paddingHorizontal: 20, maxHeight: 400 },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase' },

  periodGrid: { flexDirection: 'row', gap: 8 },
  periodCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  periodIcon: { fontSize: 20, marginBottom: 4 },
  periodLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 2 },
  periodDesc: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },

  inputWrapper: { position: 'relative' },
  targetInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
  },
  inputSuffix: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  presetText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', padding: 14, borderRadius: 16, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});