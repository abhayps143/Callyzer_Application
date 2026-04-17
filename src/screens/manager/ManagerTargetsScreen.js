import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Vianayk IP-Adress
const API = 'http://192.168.1.65:5000/api';

//Abhay IP-Adress
// const API = 'http://192.168.1.51:5000/api';

const PERIOD_CONFIG = {
  daily:   { icon: '☀️', label: 'Daily',   color: '#F97316', bg: '#FFF7ED' },
  weekly:  { icon: '📅', label: 'Weekly',  color: '#3B82F6', bg: '#EFF6FF' },
  monthly: { icon: '📊', label: 'Monthly', color: '#6366F1', bg: '#EEF2FF' },
};

export default function ManagerTargetsScreen() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [targetValue, setTargetValue] = useState('');
  const [saving, setSaving] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchAgents = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAgents(data.agents || data || []);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const openSetTarget = (agent) => {
    setSelectedAgent(agent);
    setPeriod('monthly');
    setTargetValue('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!targetValue || parseInt(targetValue) <= 0) {
      Alert.alert('Error', 'Valid target value enter karo');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/manager/targets/${selectedAgent._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ period, targetCalls: parseInt(targetValue) }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Success', `${selectedAgent.name} ka target set ho gaya!`);
        setShowModal(false);
        fetchAgents();
      } else {
        Alert.alert('Error', data.message || 'Failed to set target');
      }
    } catch (e) { Alert.alert('Error', 'Network error'); }
    setSaving(false);
  };

  const getTargetForPeriod = (agent, p) => {
    if (!agent.targets) return null;
    return agent.targets.find(t => t.period === p);
  };

  const renderAgent = ({ item: agent }) => {
    const monthlyTarget = getTargetForPeriod(agent, 'monthly');
    const achieved = agent.monthCalls || 0;
    const progress = monthlyTarget ? Math.min((achieved / monthlyTarget.targetCalls) * 100, 100) : 0;
    const roleColors = { agent: '#10B981', team_leader: '#0EA5E9' };
    const color = roleColors[agent.role] || '#6366F1';

    return (
      <View style={styles.agentCard}>
        <View style={styles.agentTop}>
          <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
            <Text style={[styles.avatarText, { color }]}>
              {(agent.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentRole}>{agent.role?.replace('_', ' ')}</Text>
          </View>
          <TouchableOpacity style={styles.setTargetBtn} onPress={() => openSetTarget(agent)}>
            <Text style={styles.setTargetBtnText}>🎯 Set Target</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Monthly Progress</Text>
            <Text style={styles.progressValue}>
              {achieved} / {monthlyTarget?.targetCalls ?? '—'}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#10B981' : '#6366F1' }]} />
          </View>
          <Text style={styles.progressPct}>{monthlyTarget ? `${Math.round(progress)}%` : 'No target set'}</Text>
        </View>

        {/* Period Targets */}
        <View style={styles.periodRow}>
          {Object.entries(PERIOD_CONFIG).map(([key, cfg]) => {
            const t = getTargetForPeriod(agent, key);
            return (
              <View key={key} style={[styles.periodChip, { backgroundColor: cfg.bg }]}>
                <Text style={styles.periodIcon}>{cfg.icon}</Text>
                <Text style={styles.periodLabel}>{cfg.label}</Text>
                <Text style={[styles.periodTarget, { color: cfg.color }]}>
                  {t ? t.targetCalls : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={agents}
        keyExtractor={(item) => item._id}
        renderItem={renderAgent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAgents(); }} tintColor="#6366F1" />}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Koi agent nahi mila</Text>}
        ListHeaderComponent={
          <Text style={styles.headerNote}>Apni team ke agents ke liye targets set karo 🎯</Text>
        }
      />

      {/* Set Target Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Modal Header */}
            <View style={styles.modalHeaderBg}>
              <View style={styles.targetIcon}><Text style={{ fontSize: 28 }}>🎯</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSubtitle}>Set Target</Text>
                <Text style={styles.modalAgentName}>{selectedAgent?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Period Selection */}
              <Text style={styles.fieldLabel}>Period Select Karo</Text>
              <View style={styles.periodSelectRow}>
                {Object.entries(PERIOD_CONFIG).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.periodOption, period === key && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                    onPress={() => setPeriod(key)}
                  >
                    <Text style={styles.periodOptionIcon}>{cfg.icon}</Text>
                    <Text style={[styles.periodOptionLabel, period === key && { color: cfg.color, fontWeight: '700' }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Target Value */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Target Calls</Text>
              <TextInput
                style={styles.targetInput}
                placeholder="e.g. 100"
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
                placeholderTextColor="#CBD5E1"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>✅ Target Save Karo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerNote: {
    fontSize: 13, color: '#64748B', marginBottom: 12,
    backgroundColor: '#EEF2FF', padding: 12, borderRadius: 10,
    textAlign: 'center',
  },
  agentCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  agentTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  agentName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  agentRole: { fontSize: 12, color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' },
  setTargetBtn: {
    backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  setTargetBtnText: { color: '#6366F1', fontSize: 12, fontWeight: '700' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  progressValue: { fontSize: 12, color: '#1E293B', fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  periodIcon: { fontSize: 16, marginBottom: 2 },
  periodLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  periodTarget: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 30 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeaderBg: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, backgroundColor: '#6366F1',
  },
  targetIcon: {
    width: 50, height: 50, backgroundColor: '#ffffff30',
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  modalSubtitle: { color: '#C7D2FE', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  modalAgentName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalCloseBtn: {
    width: 32, height: 32, backgroundColor: '#ffffff30',
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontSize: 16 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 },
  periodSelectRow: { flexDirection: 'row', gap: 8 },
  periodOption: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12,
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  periodOptionIcon: { fontSize: 20, marginBottom: 4 },
  periodOptionLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  targetInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 18,
    color: '#1E293B', fontWeight: '600', textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
