import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = 'http://192.168.1.65:5000/api';

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' },
  approved: { color: '#10B981', bg: '#D1FAE5', label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEE2E2', label: 'Rejected' },
};

const LEAVE_TYPES = {
  sick: { color: '#EF4444', label: 'Sick' },
  casual: { color: '#3B82F6', label: 'Casual' },
  earned: { color: '#8B5CF6', label: 'Earned' },
  unpaid: { color: '#64748B', label: 'Unpaid' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminLeavesScreen() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState('approved');
  const [saving, setSaving] = useState(false);

  const getToken = async () => await AsyncStorage.getItem('token');

  const fetchLeaves = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/admin/leaves?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeaves(data.leaves || data || []);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); fetchLeaves(); }, [filter]);

  const handleAction = async () => {
    if (action === 'rejected' && !remarks.trim()) {
      Alert.alert('Error', 'Rejection reason zaroori hai');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API}/hr/leaves/${selectedLeave.hrRecordId}/${selectedLeave._id}/action`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, remarks }),
        }
      );
      if (res.ok) {
        setSelectedLeave(null);
        setRemarks('');
        fetchLeaves();
        Alert.alert('✅ Done', `Leave ${action}!`);
      } else {
        Alert.alert('Error', 'Action failed');
      }
    } catch { Alert.alert('Error', 'Server error'); }
    setSaving(false);
  };

  const renderLeave = ({ item }) => {
    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const lt = LEAVE_TYPES[item.leaveType] || { color: '#64748B', label: item.leaveType };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { setSelectedLeave(item); setAction('approved'); setRemarks(''); }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.employeeName || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.empName}>{item.employeeName || 'Employee'}</Text>
              <Text style={styles.empRole}>{item.employeeRole || ''}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={[styles.typeBadge, { backgroundColor: lt.color + '20' }]}>
            <Text style={[styles.typeText, { color: lt.color }]}>{lt.label}</Text>
          </View>
          <Text style={styles.dates}>{fmt(item.startDate)} → {fmt(item.endDate)}</Text>
          <Text style={styles.days}>{item.days || 1} day(s)</Text>
        </View>
        {item.reason && <Text style={styles.reason} numberOfLines={2}>"{item.reason}"</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Leave Management</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {['pending', 'approved', 'rejected'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, filter === s && { backgroundColor: STATUS_CONFIG[s].color }]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.tabText, filter === s && { color: '#fff' }]}>
              {STATUS_CONFIG[s].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 60 }} />
        : <FlatList
          data={leaves}
          keyExtractor={(item, i) => item._id || i.toString()}
          renderItem={renderLeave}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaves(); }} tintColor="#3B82F6" />}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 4 }}
          ListEmptyComponent={<Text style={styles.empty}>Koi leave request nahi</Text>}
        />
      }

      {/* Review Modal */}
      <Modal visible={!!selectedLeave} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Leave</Text>
              <TouchableOpacity onPress={() => setSelectedLeave(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedLeave && (
              <ScrollView>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{selectedLeave.employeeName}</Text>
                  <Text style={styles.reviewDetail}>Type: {selectedLeave.leaveType}</Text>
                  <Text style={styles.reviewDetail}>From: {fmt(selectedLeave.startDate)}</Text>
                  <Text style={styles.reviewDetail}>To: {fmt(selectedLeave.endDate)}</Text>
                  <Text style={styles.reviewDetail}>Days: {selectedLeave.days}</Text>
                  {selectedLeave.reason && <Text style={styles.reviewReason}>Reason: {selectedLeave.reason}</Text>}
                </View>

                <Text style={styles.fieldLabel}>Action</Text>
                <View style={styles.actionRow}>
                  {['approved', 'rejected'].map(a => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.actionBtn, action === a && {
                        backgroundColor: a === 'approved' ? '#10B981' : '#EF4444'
                      }]}
                      onPress={() => setAction(a)}
                    >
                      <Text style={[styles.actionBtnText, action === a && { color: '#fff' }]}>
                        {a === 'approved' ? '✅ Approve' : '❌ Reject'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Remarks {action === 'rejected' ? '(Required)' : '(Optional)'}</Text>
                <TextInput
                  style={[styles.remarksInput, { borderColor: action === 'rejected' ? '#FCA5A5' : '#E2E8F0' }]}
                  placeholder="Add remarks..."
                  placeholderTextColor="#94A3B8"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleAction} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Decision</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 20, paddingTop: 50, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'capitalize' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 5,
    padding: 14, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  empName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  empRole: { fontSize: 12, color: '#94A3B8', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '700' },
  dates: { fontSize: 12, color: '#64748B' },
  days: { fontSize: 12, color: '#94A3B8' },
  reason: { fontSize: 12, color: '#94A3B8', marginTop: 8, fontStyle: 'italic' },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 60, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalClose: { fontSize: 20, color: '#64748B' },
  reviewInfo: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16 },
  reviewName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  reviewDetail: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  reviewReason: { fontSize: 13, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  remarksInput: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC', textAlignVertical: 'top', marginBottom: 16 },
  submitBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});