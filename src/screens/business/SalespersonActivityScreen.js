// src/screens/business/SalespersonActivityScreen.js
// Business User only.
// Website jaise: salesperson list → click karo → uski full call report dekho with date filter

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import { C, shadow, shadowMd, rs, fs } from '../../theme';

// ── Helpers ──────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const fmtDuration = (sec) => {
    if (!sec || sec === 0) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.round(sec % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const fmtDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

const avatarColor = (name) => {
    const colors = [C.blue, C.purple, C.green, C.red, C.amber, C.teal];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

// ── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        Connected: { color: C.green, soft: C.greenSoft },
        Missed: { color: C.red, soft: C.redSoft },
        Rejected: { color: C.amber, soft: C.amberSoft },
    };
    const s = map[status] || map.Rejected;
    return (
        <View style={[styles.badge, { backgroundColor: s.soft }]}>
            <Text style={[styles.badgeText, { color: s.color }]}>{status}</Text>
        </View>
    );
};

// ── Avatar Circle ─────────────────────────────────────────────────
const Avatar = ({ name, size = 44 }) => {
    const color = avatarColor(name);
    return (
        <View style={[styles.avatar, {
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color + '20',
        }]}>
            <Text style={[styles.avatarText, { color, fontSize: fs(size * 0.38) }]}>
                {(name || 'S').charAt(0).toUpperCase()}
            </Text>
        </View>
    );
};

// ── Date Input (simple text-based) ───────────────────────────────
const DateInput = ({ label, value, onChange }) => (
    <View style={styles.dateInputWrap}>
        <Text style={styles.dateLabel}>{label}</Text>
        <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => {
                Alert.prompt(
                    `Enter ${label} (YYYY-MM-DD)`,
                    `Current: ${value}`,
                    (text) => {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) onChange(text);
                        else Alert.alert('Invalid format', 'Please use YYYY-MM-DD format\nExample: 2026-05-12');
                    },
                    'plain-text',
                    value,
                );
            }}
            activeOpacity={0.7}
        >
            <Text style={styles.dateBtnText}>📅 {value}</Text>
        </TouchableOpacity>
    </View>
);

// ══════════════════════════════════════════════════════════════════
//  CALL ROW (individual call item)
// ══════════════════════════════════════════════════════════════════
const CallRow = ({ call, isLast }) => {
    const isOut = call.callType === 'Outgoing';
    return (
        <View style={[styles.callRow, !isLast && styles.callRowBorder]}>
            <View style={[styles.callTypeIcon, {
                backgroundColor: isOut ? C.blueSoft : C.purpleSoft,
            }]}>
                <Text style={{ fontSize: fs(14) }}>{isOut ? '↑' : '↓'}</Text>
            </View>

            <View style={styles.callInfo}>
                <Text style={styles.callName} numberOfLines={1}>
                    {call.customerName || 'Unknown'}
                </Text>
                <Text style={styles.callNumber} numberOfLines={1}>
                    {call.customerNumber}
                </Text>
                <Text style={styles.callTime}>{fmtDateTime(call.calledAt)}</Text>
            </View>

            <View style={styles.callRight}>
                <StatusBadge status={call.callStatus} />
                {call.callStatus === 'Connected' && (
                    <Text style={styles.callDur}>{fmtDuration(call.durationSeconds)}</Text>
                )}
            </View>
        </View>
    );
};

// ══════════════════════════════════════════════════════════════════
//  DETAIL REPORT SCREEN (for one salesperson)
// ══════════════════════════════════════════════════════════════════
function SalespersonDetailReport({ salesperson, onBack }) {
    const [fromDate, setFromDate] = useState(todayStr());
    const [toDate, setToDate] = useState(todayStr());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.getSalespersonCallReport(salesperson.id, { fromDate, toDate });
            if (res?.summary) {
                setData(res);
            } else {
                setError(res?.message || 'Report load nahi hua.');
            }
        } catch {
            setError('Server se connect nahi ho saka.');
        }
        setLoading(false);
    }, [salesperson.id, fromDate, toDate]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const summary = data?.summary || {};
    const calls = data?.calls || [];
    const connectRate = summary.connectRate ?? 0;

    return (
        <View style={styles.flex1}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* Back Header */}
            <View style={styles.detailHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Avatar name={salesperson.name} size={38} />
                <View style={styles.detailHeaderInfo}>
                    <Text style={styles.detailName} numberOfLines={1}>{salesperson.name}</Text>
                    <Text style={styles.detailEmail} numberOfLines={1}>{salesperson.email}</Text>
                </View>
                <TouchableOpacity onPress={fetchReport} style={styles.refreshBtn} activeOpacity={0.7}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Date Filter */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📅 Date Range</Text>
                    <View style={styles.dateRow}>
                        <View style={styles.dateFlex}>
                            <DateInput label="From" value={fromDate} onChange={setFromDate} />
                        </View>
                        <View style={styles.dateFlex}>
                            <DateInput label="To" value={toDate} onChange={setToDate} />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={fetchReport}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                        <TouchableOpacity onPress={fetchReport}>
                            <Text style={styles.retryText}>Retry →</Text>
                        </TouchableOpacity>
                    </View>
                ) : loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={C.primary} />
                        <Text style={styles.loadingText}>Loading report…</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <View style={styles.statsGrid}>
                            {[
                                { label: 'Total Calls', value: summary.total ?? 0, icon: '📞', color: C.primary, soft: C.primarySoft },
                                { label: 'Connected', value: summary.connected ?? 0, icon: '✅', color: C.green, soft: C.greenSoft },
                                { label: 'Not Connected', value: summary.notConnected ?? 0, icon: '❌', color: C.red, soft: C.redSoft },
                                { label: 'Total Duration', value: summary.totalDuration || '0s', icon: '⏱️', color: C.purple, soft: C.purpleSoft },
                            ].map((s) => (
                                <View key={s.label} style={[styles.statCard, { borderTopColor: s.color, borderTopWidth: 3 }]}>
                                    <View style={[styles.statIcon, { backgroundColor: s.soft }]}>
                                        <Text style={{ fontSize: rs(18) }}>{s.icon}</Text>
                                    </View>
                                    <Text style={styles.statValue}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Connection Rate + Duration */}
                        <View style={styles.row2col}>
                            {/* Rate Circle */}
                            <View style={[styles.card, styles.rateCard]}>
                                <Text style={styles.cardTitle}>📈 Connect Rate</Text>
                                <View style={styles.rateCircle}>
                                    <View style={[styles.rateArc, {
                                        borderColor: connectRate >= 50 ? C.green : C.red,
                                    }]} />
                                    <View style={styles.rateCenter}>
                                        <Text style={[styles.ratePct, {
                                            color: connectRate >= 50 ? C.green : C.red,
                                        }]}>{connectRate}%</Text>
                                        <Text style={styles.rateWord}>Rate</Text>
                                    </View>
                                </View>
                                <View style={styles.rateDetails}>
                                    <View style={styles.rateRow}>
                                        <Text style={styles.rateRowLabel}>Connected</Text>
                                        <Text style={[styles.rateRowVal, { color: C.green }]}>{summary.connected ?? 0}</Text>
                                    </View>
                                    <View style={styles.rateRow}>
                                        <Text style={styles.rateRowLabel}>Missed</Text>
                                        <Text style={[styles.rateRowVal, { color: C.red }]}>{summary.missed ?? 0}</Text>
                                    </View>
                                    <View style={styles.rateRow}>
                                        <Text style={styles.rateRowLabel}>Rejected</Text>
                                        <Text style={[styles.rateRowVal, { color: C.amber }]}>{summary.rejected ?? 0}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Duration */}
                            <View style={[styles.card, styles.durCard]}>
                                <Text style={styles.cardTitle}>⏱️ Duration</Text>
                                <View style={[styles.durBox, { backgroundColor: C.purpleSoft }]}>
                                    <Text style={[styles.durVal, { color: C.purple }]}>
                                        {summary.totalDuration || '0s'}
                                    </Text>
                                    <Text style={[styles.durSub, { color: C.purple + 'AA' }]}>Total Talk</Text>
                                </View>
                                <View style={[styles.durBox, { backgroundColor: C.blueSoft, marginTop: rs(8) }]}>
                                    <Text style={[styles.durVal, { color: C.blue }]}>
                                        {summary.avgDuration || '0s'}
                                    </Text>
                                    <Text style={[styles.durSub, { color: C.blue + 'AA' }]}>Avg / Call</Text>
                                </View>
                                <View style={styles.durMeta}>
                                    <Text style={styles.durMetaText}>
                                        {fromDate} → {toDate}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Call List */}
                        {calls.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>📊</Text>
                                <Text style={styles.emptyTitle}>Koi call nahi mili</Text>
                                <Text style={styles.emptySub}>Is date range mein koi call log nahi hai.</Text>
                            </View>
                        ) : (
                            <View style={styles.callListCard}>
                                <View style={styles.callListHeader}>
                                    <Text style={styles.callListTitle}>📋 Call List ({calls.length})</Text>
                                </View>
                                {calls.map((call, i) => (
                                    <CallRow key={call._id || i} call={call} isLast={i === calls.length - 1} />
                                ))}
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: rs(40) }} />
            </ScrollView>
        </View>
    );
}

// ══════════════════════════════════════════════════════════════════
//  SALESPERSON LIST (landing view)
// ══════════════════════════════════════════════════════════════════
function SalespersonList({ onSelect }) {
    const [salespersons, setSalespersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchList = async () => {
        try {
            const res = await api.getMySalespersons();
            setSalespersons(res?.salespersons || []);
            setError('');
        } catch {
            setError('Team load nahi hui. Pull to refresh.');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchList(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchList(); };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.flex1}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <View style={styles.listHeaderWrap}>
                <Text style={styles.listTitle}>Salesperson Activity</Text>
                <Text style={styles.listSub}>
                    Kisi bhi salesperson par tap karein unki report dekhne ke liye
                </Text>
            </View>

            {error ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            ) : salespersons.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyTitle}>Koi salesperson nahi mila</Text>
                    <Text style={styles.emptySub}>Pehle My Team mein salesperson add karein.</Text>
                </View>
            ) : (
                salespersons.map((sp) => {
                    const color = avatarColor(sp.name);
                    const isActive = sp.isActive !== false;
                    return (
                        <TouchableOpacity
                            key={sp._id}
                            style={styles.spCard}
                            onPress={() => onSelect({ id: sp._id, name: sp.name, email: sp.email })}
                            activeOpacity={0.75}
                        >
                            <Avatar name={sp.name} size={50} />
                            <View style={styles.spInfo}>
                                <Text style={styles.spName}>{sp.name}</Text>
                                <Text style={styles.spEmail} numberOfLines={1}>{sp.email}</Text>
                                <View style={[styles.activeBadge, {
                                    backgroundColor: isActive ? C.greenSoft : C.redSoft,
                                }]}>
                                    <View style={[styles.activeDot, {
                                        backgroundColor: isActive ? C.green : C.red,
                                    }]} />
                                    <Text style={[styles.activeText, {
                                        color: isActive ? C.green : C.red,
                                    }]}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.spArrowWrap}>
                                <Text style={[styles.spArrow, { color: C.primary }]}>›</Text>
                                <Text style={[styles.spViewLabel, { color: C.primary }]}>Report</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}

            <View style={{ height: rs(40) }} />
        </ScrollView>
    );
}

// ══════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ══════════════════════════════════════════════════════════════════
export default function SalespersonActivityScreen() {
    const { user } = useContext(AuthContext);
    const [selected, setSelected] = useState(null);

    if (user?.role !== 'business_user') {
        return (
            <View style={styles.center}>
                <Text style={styles.accessDenied}>Access denied. Business User account chahiye.</Text>
            </View>
        );
    }

    if (selected) {
        return (
            <SalespersonDetailReport
                salesperson={selected}
                onBack={() => setSelected(null)}
            />
        );
    }

    return <SalespersonList onSelect={setSelected} />;
}

// ══════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    flex1: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    accessDenied: { fontSize: fs(14), color: C.textMuted, textAlign: 'center', padding: rs(20) },

    // ── Avatar ──
    avatar: { justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontWeight: '800' },

    // ── Badge ──
    badge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20) },
    badgeText: { fontSize: fs(10), fontWeight: '700' },

    // ── List View ──
    listContent: { padding: rs(16) },
    listHeaderWrap: { marginBottom: rs(20) },
    listTitle: { fontSize: fs(22), fontWeight: '800', color: C.text },
    listSub: { fontSize: fs(13), color: C.textMuted, marginTop: rs(4) },

    spCard: {
        flexDirection: 'row', alignItems: 'center', gap: rs(14),
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(16), marginBottom: rs(12),
        borderWidth: 1, borderColor: C.border, ...shadow,
    },
    spInfo: { flex: 1 },
    spName: { fontSize: fs(15), fontWeight: '700', color: C.text },
    spEmail: { fontSize: fs(12), color: C.textMuted, marginTop: rs(2) },
    activeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: rs(5),
        alignSelf: 'flex-start', marginTop: rs(6),
        paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20),
    },
    activeDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
    activeText: { fontSize: fs(11), fontWeight: '700' },
    spArrowWrap: { alignItems: 'center' },
    spArrow: { fontSize: fs(26), fontWeight: '300' },
    spViewLabel: { fontSize: fs(10), fontWeight: '600' },

    // ── Detail View ──
    detailHeader: {
        flexDirection: 'row', alignItems: 'center', gap: rs(12),
        backgroundColor: C.surface, paddingHorizontal: rs(16),
        paddingTop: rs(52), paddingBottom: rs(14),
        borderBottomWidth: 1, borderBottomColor: C.border, ...shadow,
    },
    backBtn: {
        width: rs(36), height: rs(36), borderRadius: rs(18),
        backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center',
    },
    backIcon: { fontSize: fs(22), color: C.text, fontWeight: '300', lineHeight: fs(26) },
    detailHeaderInfo: { flex: 1 },
    detailName: { fontSize: fs(15), fontWeight: '700', color: C.text },
    detailEmail: { fontSize: fs(12), color: C.textMuted },
    refreshBtn: {
        width: rs(36), height: rs(36), borderRadius: rs(18),
        backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center',
    },
    refreshIcon: { fontSize: fs(18), color: C.primary, fontWeight: '700' },

    detailContent: { padding: rs(16) },

    // ── Date Filter ──
    card: {
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(16), marginBottom: rs(14),
        borderWidth: 1, borderColor: C.border, ...shadow,
    },
    cardTitle: { fontSize: fs(13), fontWeight: '700', color: C.textSub, marginBottom: rs(12) },
    dateRow: { flexDirection: 'row', gap: rs(12) },
    dateFlex: { flex: 1 },
    dateInputWrap: {},
    dateLabel: { fontSize: fs(11), fontWeight: '700', color: C.textMuted, marginBottom: rs(6), textTransform: 'uppercase' },
    dateBtn: {
        backgroundColor: C.surfaceAlt, borderRadius: rs(10),
        paddingHorizontal: rs(12), paddingVertical: rs(10),
        borderWidth: 1, borderColor: C.border,
    },
    dateBtnText: { fontSize: fs(13), color: C.text, fontWeight: '500' },
    applyBtn: {
        backgroundColor: C.primary, borderRadius: rs(12),
        paddingVertical: rs(12), alignItems: 'center', marginTop: rs(12),
    },
    applyBtnText: { color: '#fff', fontSize: fs(14), fontWeight: '700' },

    // ── Error / Loading / Empty ──
    errorBox: {
        backgroundColor: C.redSoft, borderRadius: rs(14),
        padding: rs(16), marginBottom: rs(14),
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    errorText: { fontSize: fs(13), color: C.red, fontWeight: '500', flex: 1 },
    retryText: { fontSize: fs(13), color: C.red, fontWeight: '700', marginLeft: rs(12) },
    loadingBox: { alignItems: 'center', paddingVertical: rs(40) },
    loadingText: { fontSize: fs(13), color: C.textMuted, marginTop: rs(12) },
    emptyCard: {
        backgroundColor: C.surface, borderRadius: rs(16),
        padding: rs(32), alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    emptyIcon: { fontSize: rs(48), marginBottom: rs(12) },
    emptyTitle: { fontSize: fs(16), fontWeight: '700', color: C.text },
    emptySub: { fontSize: fs(13), color: C.textMuted, marginTop: rs(6), textAlign: 'center' },

    // ── Stats Grid ──
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10), marginBottom: rs(14) },
    statCard: {
        width: '47%', backgroundColor: C.surface, borderRadius: rs(14),
        padding: rs(14), ...shadow, borderWidth: 1, borderColor: C.border, alignItems: 'center',
    },
    statIcon: { width: rs(40), height: rs(40), borderRadius: rs(12), justifyContent: 'center', alignItems: 'center', marginBottom: rs(8) },
    statValue: { fontSize: fs(22), fontWeight: '800', color: C.text },
    statLabel: { fontSize: fs(11), color: C.textMuted, marginTop: rs(2), textAlign: 'center' },

    // ── Rate + Duration 2-col ──
    row2col: { flexDirection: 'row', gap: rs(12), marginBottom: rs(14) },
    rateCard: { flex: 1, paddingBottom: rs(12) },
    durCard: { flex: 1, paddingBottom: rs(12) },

    rateCircle: {
        width: rs(90), height: rs(90), borderRadius: rs(45),
        alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
        marginVertical: rs(10),
    },
    rateArc: {
        position: 'absolute', width: rs(90), height: rs(90),
        borderRadius: rs(45), borderWidth: rs(7),
        opacity: 0.3,
    },
    rateCenter: { alignItems: 'center' },
    ratePct: { fontSize: fs(22), fontWeight: '800' },
    rateWord: { fontSize: fs(10), color: C.textMuted },
    rateDetails: { gap: rs(4) },
    rateRow: { flexDirection: 'row', justifyContent: 'space-between' },
    rateRowLabel: { fontSize: fs(12), color: C.textSub },
    rateRowVal: { fontSize: fs(12), fontWeight: '700' },

    durBox: { borderRadius: rs(10), padding: rs(10), alignItems: 'center' },
    durVal: { fontSize: fs(18), fontWeight: '800' },
    durSub: { fontSize: fs(10), marginTop: rs(2) },
    durMeta: { marginTop: rs(10), paddingTop: rs(8), borderTopWidth: 1, borderTopColor: C.border },
    durMetaText: { fontSize: fs(11), color: C.textMuted, textAlign: 'center' },

    // ── Call List ──
    callListCard: {
        backgroundColor: C.surface, borderRadius: rs(16),
        overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...shadow,
        marginBottom: rs(14),
    },
    callListHeader: {
        paddingHorizontal: rs(16), paddingVertical: rs(12),
        borderBottomWidth: 1, borderBottomColor: C.border,
        backgroundColor: C.surfaceAlt,
    },
    callListTitle: { fontSize: fs(13), fontWeight: '700', color: C.text },

    callRow: {
        flexDirection: 'row', alignItems: 'center', gap: rs(12),
        paddingHorizontal: rs(14), paddingVertical: rs(12),
    },
    callRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    callTypeIcon: {
        width: rs(36), height: rs(36), borderRadius: rs(10),
        justifyContent: 'center', alignItems: 'center',
    },
    callInfo: { flex: 1 },
    callName: { fontSize: fs(14), fontWeight: '600', color: C.text },
    callNumber: { fontSize: fs(12), color: C.textMuted, marginTop: rs(1) },
    callTime: { fontSize: fs(11), color: C.textMuted, marginTop: rs(2) },
    callRight: { alignItems: 'flex-end', gap: rs(4) },
    callDur: { fontSize: fs(11), color: C.textSub, fontWeight: '500' },
});