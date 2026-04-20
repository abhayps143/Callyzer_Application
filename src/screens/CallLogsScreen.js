import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    Modal, ScrollView, Alert, Platform, StatusBar
} from 'react-native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Helpers ────────────────────────────────────────────────────
const fmtDuration = (s) => {
    if (!s && s !== 0) return '—';
    const sec = Number(s);
    if (isNaN(sec)) return '—';
    const m = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return m > 0 ? `${m}m ${remainingSec}s` : `${remainingSec}s`;
};

const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Badges ────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
    const isIncoming = type === 'Incoming';
    return (
        <View style={[styles.badge, { backgroundColor: isIncoming ? '#eff6ff' : '#f5f3ff', borderWidth: 1, borderColor: isIncoming ? '#bfdbfe' : '#ddd6fe' }]}>
            <Text style={[styles.badgeText, { color: isIncoming ? '#3b82f6' : '#8b5cf6' }]}>
                {isIncoming ? '↙ Incoming' : '↗ Outgoing'}
            </Text>
        </View>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        Connected: { bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0' },
        Missed: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
        Rejected: { bg: '#fffbeb', color: '#f59e0b', border: '#fde68a' },
    };
    const c = config[status] || config.Missed;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }]}>
            <View style={[styles.statusDot, { backgroundColor: c.color }]} />
            <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
        </View>
    );
};

const DispositionBadge = ({ disposition }) => {
    if (!disposition) return null;
    const colors = {
        'Interested': { bg: '#f0fdf4', color: '#22c55e' },
        'Not Interested': { bg: '#fef2f2', color: '#ef4444' },
        'Sale Done': { bg: '#f5f3ff', color: '#8b5cf6' },
        'Callback': { bg: '#fffbeb', color: '#f59e0b' },
        'Wrong Number': { bg: '#f8fafc', color: '#64748b' },
        'Follow-up': { bg: '#eff6ff', color: '#3b82f6' },
    };
    const c = colors[disposition] || { bg: '#f8fafc', color: '#64748b' };
    return (
        <View style={[styles.badgeSmall, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeSmallText, { color: c.color }]}>{disposition}</Text>
        </View>
    );
};

const avatarColors = ['#3b82f6', '#8b5cf6', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4'];
const Avatar = ({ name, index }) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const color = avatarColors[index % avatarColors.length];
    return (
        <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>{initials}</Text>
        </View>
    );
};

const StatCard = ({ label, value, icon, color }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ── Picker Row Component ──────────────────────────────────────
const PickerRow = ({ options, value, onChange, scrollable = false }) => {
    const content = options.map(opt => (
        <TouchableOpacity
            key={opt.value ?? opt}
            style={[modalStyles.pickerOpt, (value === (opt.value ?? opt)) && modalStyles.pickerOptActive]}
            onPress={() => onChange(opt.value ?? opt)}
        >
            <Text style={[modalStyles.pickerOptText, (value === (opt.value ?? opt)) && modalStyles.pickerOptTextActive]}>
                {opt.label ?? opt}
            </Text>
        </TouchableOpacity>
    ));

    if (scrollable) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>{content}</View>
            </ScrollView>
        );
    }
    return <View style={modalStyles.pickerRow}>{content}</View>;
};

// ── Add/Edit Call Modal ───────────────────────────────────────
const CallModal = ({ visible, onClose, onDone, log }) => {
    const isEdit = !!log;

    const defaultForm = {
        customerName: '',
        customerNumber: '',
        callType: 'Outgoing',
        callStatus: 'Connected',
        durationSeconds: '',
        calledAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        notes: '',
        disposition: '',
        followUpDate: '',
        followUpNotes: '',
    };

    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            if (log) {
                const toLocalStr = (d) => {
                    if (!d) return '';
                    const dt = new Date(d);
                    if (isNaN(dt.getTime())) return '';
                    return dt.toISOString().slice(0, 16).replace('T', ' ');
                };
                setForm({
                    customerName: log.customerName || '',
                    customerNumber: log.customerNumber || '',
                    callType: log.callType || 'Outgoing',
                    callStatus: log.callStatus || 'Connected',
                    durationSeconds: log.durationSeconds?.toString() || '',
                    calledAt: toLocalStr(log.calledAt),
                    notes: log.notes || '',
                    disposition: log.disposition || '',
                    followUpDate: log.followUpDate ? new Date(log.followUpDate).toISOString().split('T')[0] : '',
                    followUpNotes: log.followUpNotes || '',
                });
            } else {
                setForm(defaultForm);
            }
            setError('');
        }
    }, [visible, log]);

    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        if (!form.customerNumber.trim()) {
            setError('Phone number is required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            // Parse calledAt from "YYYY-MM-DD HH:MM" to ISO
            let calledAtISO = new Date().toISOString();
            if (form.calledAt) {
                const parsed = new Date(form.calledAt.replace(' ', 'T'));
                if (!isNaN(parsed.getTime())) calledAtISO = parsed.toISOString();
            }

            const callData = {
                customerName: form.customerName.trim() || 'Unknown',
                customerNumber: form.customerNumber.trim(),
                callType: form.callType,
                callStatus: form.callStatus,
                durationSeconds: Number(form.durationSeconds) || 0,
                calledAt: calledAtISO,
                notes: form.notes,
                disposition: form.disposition,
                followUpDate: form.followUpDate || null,
                followUpNotes: form.followUpNotes,
            };

            let res;
            if (isEdit) {
                res = await api.updateCallLog(log._id, callData);
            } else {
                res = await api.createCallLog(callData);
            }

            if (res?._id || res?.message === 'Call log created' || res?.success !== false) {
                onDone(isEdit ? 'Call log updated successfully!' : 'Call log added successfully!');
            } else {
                setError(res?.message || 'Failed to save call');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const callTypeOptions = ['Outgoing', 'Incoming'];
    const callStatusOptions = ['Connected', 'Missed', 'Rejected'];
    const dispositionOptions = [
        { label: 'None', value: '' },
        { label: '✅ Interested', value: 'Interested' },
        { label: '❌ Not Interested', value: 'Not Interested' },
        { label: '📞 Callback', value: 'Callback' },
        { label: '💰 Sale Done', value: 'Sale Done' },
        { label: '🔢 Wrong Number', value: 'Wrong Number' },
        { label: '⏰ Follow-up', value: 'Follow-up' },
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    {/* Header */}
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>{isEdit ? '✏️ Edit Call Log' : '📞 Add Call Log'}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                            <Text style={modalStyles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Body */}
                    <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {!!error && (
                            <View style={modalStyles.errorBox}>
                                <Text style={modalStyles.errorText}>⚠️ {error}</Text>
                            </View>
                        )}

                        {/* Row: Customer Name + Phone */}
                        <View style={modalStyles.row}>
                            <View style={[modalStyles.field, { flex: 1 }]}>
                                <Text style={modalStyles.label}>Customer Name</Text>
                                <TextInput
                                    style={modalStyles.input}
                                    value={form.customerName}
                                    onChangeText={v => set('customerName', v)}
                                    placeholder="Rahul Sharma"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={[modalStyles.field, { flex: 1 }]}>
                                <Text style={modalStyles.label}>Phone Number <Text style={modalStyles.required}>*</Text></Text>
                                <TextInput
                                    style={modalStyles.input}
                                    value={form.customerNumber}
                                    onChangeText={v => set('customerNumber', v)}
                                    placeholder="+91 98765 43210"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Call Type */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Call Type</Text>
                            <PickerRow
                                options={callTypeOptions}
                                value={form.callType}
                                onChange={v => set('callType', v)}
                            />
                        </View>

                        {/* Call Status */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Call Status</Text>
                            <PickerRow
                                options={callStatusOptions}
                                value={form.callStatus}
                                onChange={v => set('callStatus', v)}
                            />
                        </View>

                        {/* Call Disposition */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Call Disposition</Text>
                            <PickerRow
                                options={dispositionOptions}
                                value={form.disposition}
                                onChange={v => set('disposition', v)}
                                scrollable={true}
                            />
                        </View>

                        {/* Row: Duration + Date & Time */}
                        <View style={modalStyles.row}>
                            <View style={[modalStyles.field, { flex: 1 }]}>
                                <Text style={modalStyles.label}>Duration (seconds)</Text>
                                <TextInput
                                    style={modalStyles.input}
                                    value={form.durationSeconds}
                                    onChangeText={v => set('durationSeconds', v)}
                                    placeholder="120"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={[modalStyles.field, { flex: 1 }]}>
                                <Text style={modalStyles.label}>Date & Time</Text>
                                <TextInput
                                    style={modalStyles.input}
                                    value={form.calledAt}
                                    onChangeText={v => set('calledAt', v)}
                                    placeholder="2026-04-18 10:30"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>

                        {/* Follow-up Date */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Follow-up Date</Text>
                            <TextInput
                                style={modalStyles.input}
                                value={form.followUpDate}
                                onChangeText={v => set('followUpDate', v)}
                                placeholder="YYYY-MM-DD (e.g. 2026-04-25)"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        {/* Follow-up Notes */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Follow-up Notes</Text>
                            <TextInput
                                style={[modalStyles.input, modalStyles.textarea]}
                                value={form.followUpNotes}
                                onChangeText={v => set('followUpNotes', v)}
                                placeholder="Add follow-up notes..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Notes */}
                        <View style={modalStyles.field}>
                            <Text style={modalStyles.label}>Notes</Text>
                            <TextInput
                                style={[modalStyles.input, modalStyles.textarea]}
                                value={form.notes}
                                onChangeText={v => set('notes', v)}
                                placeholder="Optional notes..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={{ height: 16 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={modalStyles.footer}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={saving}
                        >
                            <Text style={modalStyles.saveBtnText}>
                                {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Call'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── Delete Confirm Modal ──────────────────────────────────────
const DeleteConfirmModal = ({ visible, onClose, onConfirm, log }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.deleteCallLog(log._id);
            onConfirm();
        } catch {
            Alert.alert('Error', 'Failed to delete call log');
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={modalStyles.overlay}>
                <View style={[modalStyles.container, modalStyles.deleteContainer]}>
                    <View style={modalStyles.deleteHeader}>
                        <Text style={modalStyles.deleteIcon}>🗑️</Text>
                        <Text style={modalStyles.deleteTitle}>Delete Call Log?</Text>
                    </View>
                    <View style={modalStyles.deleteBody}>
                        <Text style={modalStyles.deleteName}>{log?.customerName || 'Unknown'}</Text>
                        <Text style={modalStyles.deleteNumber}>{log?.customerNumber}</Text>
                        <Text style={modalStyles.deleteWarning}>This action cannot be undone.</Text>
                    </View>
                    <View style={modalStyles.footer}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.saveBtn, { backgroundColor: '#ef4444' }, deleting && { opacity: 0.6 }]}
                            onPress={handleDelete}
                            disabled={deleting}
                        >
                            <Text style={modalStyles.saveBtnText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function CallLogsScreen() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 20 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editLog, setEditLog] = useState(null);
    const [deleteLog, setDeleteLog] = useState(null);

    const [userRole, setUserRole] = useState('agent');
    const [isLoadingRole, setIsLoadingRole] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setUserRole(user?.role || 'agent');
                }
            } catch (e) {
                console.log('Error getting user role:', e);
            } finally {
                setIsLoadingRole(false);
            }
        };
        getUser();
    }, []);

    const canAddCalls = ['agent', 'team_leader', 'admin', 'employee'].includes(userRole);
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const canDelete = userRole === 'super_admin';

    const fetchCalls = useCallback(async (reset = false) => {
        if (reset) { setLoading(true); setError(null); }
        try {
            const currentPage = reset ? 1 : page;
            const params = {
                page: currentPage,
                limit: 20,
                sortField: 'calledAt',
                sortDir: 'desc',
            };
            if (search.trim()) params.search = search.trim();
            if (typeFilter !== 'All') params.callType = typeFilter;
            if (statusFilter !== 'All') params.callStatus = statusFilter;

            const response = await api.getCallLogs(params);
            let logsData = [];
            let paginationData = { total: 0, pages: 1, page: currentPage, limit: 20 };

            if (response?.logs) {
                logsData = response.logs;
                paginationData = response.pagination || paginationData;
            } else if (Array.isArray(response)) {
                logsData = response;
            } else if (response?.success === false) {
                setError(response.message);
            }

            if (reset || currentPage === 1) setLogs(logsData);
            else setLogs(prev => [...prev, ...logsData]);
            setPagination(paginationData);

            if (reset) {
                try {
                    const statsRes = await api.getCallStats();
                    if (statsRes && statsRes.success !== false) setStats(statsRes);
                } catch (e) {
                    console.log('Stats error:', e);
                }
            }
        } catch (err) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [page, search, typeFilter, statusFilter]);

    useEffect(() => { fetchCalls(true); }, [search, typeFilter, statusFilter]);
    useEffect(() => { if (page > 1) fetchCalls(false); }, [page]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchCalls(true);
    };

    const loadMore = () => {
        if (page < pagination.pages && !loadingMore && !loading) {
            setLoadingMore(true);
            setPage(p => p + 1);
        }
    };

    const onDone = (msg) => {
        setShowAddModal(false);
        setEditLog(null);
        setDeleteLog(null);
        Alert.alert('Success', msg || 'Done!');
        onRefresh();
    };

    const renderCallItem = ({ item, index }) => (
        <View style={styles.callCard}>
            <View style={styles.callCardTop}>
                <Avatar name={item.customerName} index={index} />
                <View style={styles.callInfo}>
                    <Text style={styles.callName}>{item.customerName || 'Unknown'}</Text>
                    <Text style={styles.callNumber}>{item.customerNumber || '—'}</Text>
                    <Text style={styles.callDate}>{fmtDate(item.calledAt)} • {fmtTime(item.calledAt)}</Text>
                </View>
                <View style={styles.callRight}>
                    <Text style={styles.callDuration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => setEditLog(item)} style={styles.editBtn}>
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        {canDelete && (
                            <TouchableOpacity onPress={() => setDeleteLog(item)} style={styles.deleteBtn}>
                                <Text style={styles.deleteBtnText}>Del</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.callCardBottom}>
                <TypeBadge type={item.callType} />
                <StatusBadge status={item.callStatus} />
                {!!item.disposition && <DispositionBadge disposition={item.disposition} />}
            </View>
        </View>
    );

    const statsItems = stats ? [
        { label: 'Total', value: stats.total, icon: '📞', color: '#6366f1' },
        { label: 'Incoming', value: stats.incoming, icon: '↙️', color: '#3b82f6' },
        { label: 'Outgoing', value: stats.outgoing, icon: '↗️', color: '#8b5cf6' },
        { label: 'Connected', value: stats.connected, icon: '✅', color: '#22c55e' },
        { label: 'Missed', value: stats.missed, icon: '❌', color: '#ef4444' },
        { label: 'Today', value: stats.todayCalls, icon: '📅', color: '#f59e0b' },
    ] : [];

    if (isLoadingRole) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Call Logs</Text>
                    <Text style={styles.subtitle}>{pagination.total} total calls</Text>
                </View>
                {canAddCalls && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                        <Text style={styles.addBtnText}>+ Add Call</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Stats */}
            {stats && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {statsItems.map(s => (
                        <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
                    ))}
                </ScrollView>
            )}

            {/* Search */}
            <View style={styles.searchWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.search}
                    placeholder="Search by name or number..."
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                />
                {!!search && (
                    <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                        <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <View style={styles.filterGroup}>
                    <Text style={styles.filterGroupLabel}>Call Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['All', 'Incoming', 'Outgoing'].map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.filterBtn, typeFilter === t && styles.filterBtnActive]}
                                onPress={() => { setTypeFilter(t); setPage(1); }}
                            >
                                <Text style={[styles.filterBtnText, typeFilter === t && styles.filterBtnTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <View style={[styles.filterGroup, { marginBottom: 0 }]}>
                    <Text style={styles.filterGroupLabel}>Call Status</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['All', 'Connected', 'Missed', 'Rejected'].map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
                                onPress={() => { setStatusFilter(s); setPage(1); }}
                            >
                                <Text style={[styles.filterBtnText, statusFilter === s && styles.filterBtnTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading call logs...</Text>
                </View>
            ) : error && logs.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
                    <Text style={styles.emptyText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchCalls(true)} style={styles.retryBtn}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    renderItem={renderCallItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={styles.listContent}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color="#6366f1" /> : null}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.empty}>
                                <Text style={{ fontSize: 48, marginBottom: 12 }}>📞</Text>
                                <Text style={styles.emptyText}>No call logs found</Text>
                                {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
                                    <TouchableOpacity onPress={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); }}>
                                        <Text style={styles.emptyReset}>Reset filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )
                    }
                />
            )}

            {/* Modals */}
            <CallModal visible={showAddModal} onClose={() => setShowAddModal(false)} onDone={onDone} />
            <CallModal visible={!!editLog} onClose={() => setEditLog(null)} onDone={onDone} log={editLog} />
            <DeleteConfirmModal visible={!!deleteLog} onClose={() => setDeleteLog(null)} onConfirm={() => onDone('Call log deleted')} log={deleteLog} />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 20,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: { color: '#1e293b', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
    addBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    statsRow: { flexGrow: 0, marginTop: 12, marginBottom: 4 },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 12,
        marginRight: 10,
        alignItems: 'center',
        minWidth: 82,
        borderTopWidth: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },

    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 10,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: { fontSize: 14, marginRight: 8 },
    search: { flex: 1, color: '#1e293b', paddingVertical: 12, fontSize: 14 },
    clearBtn: { padding: 6 },
    clearBtnText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    filtersContainer: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterGroup: { marginBottom: 10 },
    filterGroupLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 8,
        backgroundColor: '#f8fafc',
    },
    filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    filterBtnText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    filterBtnTextActive: { color: '#fff' },

    listContent: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
    callCard: {
        backgroundColor: '#ffffff',
        marginVertical: 5,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    callCardTop: { flexDirection: 'row', marginBottom: 10 },
    callInfo: { flex: 1, marginLeft: 12 },
    callName: { color: '#1e293b', fontWeight: '700', fontSize: 15 },
    callNumber: { color: '#64748b', fontSize: 13, marginTop: 1 },
    callDate: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
    callRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    callDuration: { color: '#64748b', fontSize: 11, fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    editBtn: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#eff6ff', borderRadius: 8 },
    editBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
    deleteBtn: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#fef2f2', borderRadius: 8 },
    deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
    callCardBottom: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    badgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeSmallText: { fontSize: 10, fontWeight: '600' },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    empty: { alignItems: 'center', paddingTop: 80, flex: 1 },
    emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center' },
    emptyReset: { color: '#2563eb', marginTop: 12, fontWeight: '600', fontSize: 14 },
    retryBtn: { marginTop: 20, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '92%',
    },
    deleteContainer: {
        borderRadius: 24,
        marginHorizontal: 24,
        marginBottom: 'auto',
        marginTop: 'auto',
        maxHeight: undefined,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: { color: '#1e293b', fontSize: 18, fontWeight: '700' },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    body: { paddingHorizontal: 20, paddingTop: 16 },
    row: { flexDirection: 'row' },
    field: { marginBottom: 18 },
    label: { color: '#374151', fontSize: 13, fontWeight: '600', marginBottom: 7 },
    required: { color: '#ef4444' },
    input: {
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textarea: { height: 72, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pickerOpt: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    pickerOptActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    pickerOptText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
    pickerOptTextActive: { color: '#ffffff' },
    errorBox: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: { color: '#ef4444', fontSize: 13 },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        padding: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
    saveBtn: {
        flex: 1,
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
    deleteHeader: { alignItems: 'center', paddingTop: 28, paddingBottom: 12 },
    deleteIcon: { fontSize: 44, marginBottom: 10 },
    deleteTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    deleteBody: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 8 },
    deleteName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    deleteNumber: { fontSize: 14, color: '#64748b' },
    deleteWarning: { fontSize: 12, color: '#ef4444', marginTop: 12 },
});

