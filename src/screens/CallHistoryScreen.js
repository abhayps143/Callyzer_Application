// ╔══════════════════════════════════════════════════════════════╗
// ║  FILE: callapp/src/screens/CallHistoryScreen.js             ║
// ║  NEW FILE — does not exist in old codebase.                 ║
// ║                                                             ║
// ║  Purpose: Show the logged-in salesperson's call history     ║
// ║  that has already been synced to the backend (MongoDB).     ║
// ║  Uses the same api pattern (fetch + authHeaders) as every   ║
// ║  other screen. Includes:                                    ║
// ║    • Loading state    (ActivityIndicator)                   ║
// ║    • Empty state      (friendly empty illustration)         ║
// ║    • Error state      (retry button)                        ║
// ║    • Paginated list   (FlatList + infinite scroll)          ║
// ║    • Search bar       (client-side filter for fast UX)      ║
// ║    • Filter chips     (All / Incoming / Outgoing / Missed)  ║
// ║    • Pull-to-refresh                                        ║
// ╚══════════════════════════════════════════════════════════════╝

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    StatusBar, Platform,
} from 'react-native';
import { C, rs, fs } from '../theme';
import { getMyCallHistory } from '../services/callLogService';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (shared subset from theme)
// ─────────────────────────────────────────────────────────────
const shadow = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtDuration = (s) => {
    if (!s && s !== 0) return '—';
    const sec = Number(s);
    if (isNaN(sec)) return '—';
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

const fmtTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

const FILTER_OPTIONS = ['All', 'Incoming', 'Outgoing', 'Missed'];

// ─────────────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────

const TypeBadge = ({ type }) => {
    const cfg = {
        Incoming: { bg: C.blueSoft, color: C.blue, label: '↙ In' },
        Outgoing: { bg: C.purpleSoft, color: C.purple, label: '↗ Out' },
        Missed: { bg: C.redSoft, color: C.red, label: '✕ Miss' },
    }[type] || { bg: C.surfaceAlt, color: C.textSub, label: type };

    return (
        <View style={[mc.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[mc.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

const StatusBadge = ({ status }) => {
    const cfg = {
        Connected: { bg: C.greenSoft, color: C.green },
        Missed: { bg: C.redSoft, color: C.red },
        Rejected: { bg: C.amberSoft, color: C.amber },
    }[status] || { bg: C.surfaceAlt, color: C.textSub };

    return (
        <View style={[mc.badge, { backgroundColor: cfg.bg }]}>
            <View style={[mc.dot, { backgroundColor: cfg.color }]} />
            <Text style={[mc.badgeText, { color: cfg.color }]}>{status}</Text>
        </View>
    );
};

const SourceBadge = ({ source }) => {
    if (source !== 'device_sync') return null;
    return (
        <View style={[mc.badge, { backgroundColor: C.primarySoft }]}>
            <Text style={[mc.badgeText, { color: C.primary }]}>📲 Synced</Text>
        </View>
    );
};

const mc = StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(100), gap: rs(3) },
    badgeText: { fontSize: fs(11), fontWeight: '700' },
    dot: { width: rs(5), height: rs(5), borderRadius: rs(3) },
});

// ── Avatar ────────────────────────────────────────────────────
const AV_COLORS = [C.primary, '#7322C0', C.green, C.red, C.amber, C.teal, C.blue];
const Avatar = ({ name, index }) => {
    const initials = (name || '?')
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (
        <View style={[avS.circle, { backgroundColor: AV_COLORS[index % AV_COLORS.length] }]}>
            <Text style={avS.text}>{initials}</Text>
        </View>
    );
};
const avS = StyleSheet.create({
    circle: { width: rs(42), height: rs(42), borderRadius: rs(21), justifyContent: 'center', alignItems: 'center' },
    text: { color: '#fff', fontWeight: '800', fontSize: fs(14) },
});

// ── Call Card ─────────────────────────────────────────────────
const CallCard = React.memo(({ item, index }) => {
    const displayName = item.customerName && item.customerName !== 'Unknown'
        ? item.customerName
        : item.customerNumber;

    return (
        <View style={[cardS.wrap, shadow]}>
            <View style={cardS.row}>
                <Avatar name={displayName} index={index} />
                <View style={cardS.info}>
                    <Text style={cardS.name} numberOfLines={1}>{displayName}</Text>
                    {item.customerName && item.customerName !== 'Unknown' && (
                        <Text style={cardS.number}>{item.customerNumber}</Text>
                    )}
                    <Text style={cardS.datetime}>
                        {fmtDate(item.calledAt)}  {fmtTime(item.calledAt)}
                    </Text>
                </View>
                <View style={cardS.right}>
                    <Text style={cardS.duration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
                </View>
            </View>
            <View style={cardS.pills}>
                <TypeBadge type={item.callType} />
                <StatusBadge status={item.callStatus} />
                <SourceBadge source={item.source} />
            </View>
        </View>
    );
});
const cardS = StyleSheet.create({
    wrap: { backgroundColor: C.surface, marginHorizontal: rs(12), marginBottom: rs(8), borderRadius: rs(14), padding: rs(14) },
    row: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(10) },
    info: { flex: 1, minWidth: 0 },
    name: { fontSize: fs(14), fontWeight: '700', color: C.text },
    number: { fontSize: fs(12), color: C.textSub, marginTop: 1 },
    datetime: { fontSize: fs(11), color: C.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    duration: { fontSize: fs(12), color: C.textSub, fontWeight: '600' },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), paddingTop: rs(10), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
});

// ── Loading skeleton placeholder ──────────────────────────────
const SkeletonCard = () => (
    <View style={[cardS.wrap, { opacity: 0.35 }]}>
        <View style={cardS.row}>
            <View style={[avS.circle, { backgroundColor: C.border }]} />
            <View style={{ flex: 1, gap: rs(6) }}>
                <View style={{ height: rs(13), width: '60%', backgroundColor: C.border, borderRadius: rs(6) }} />
                <View style={{ height: rs(11), width: '40%', backgroundColor: C.border, borderRadius: rs(6) }} />
            </View>
        </View>
    </View>
);

// ── Empty state ───────────────────────────────────────────────
const EmptyState = ({ onSync }) => (
    <View style={emptyS.wrap}>
        <Text style={emptyS.emoji}>📭</Text>
        <Text style={emptyS.title}>No Call History</Text>
        <Text style={emptyS.body}>
            Your synced calls will appear here.{'\n'}
            Go to <Text style={emptyS.bold}>Sync Calls</Text> to upload your device call logs.
        </Text>
        {onSync && (
            <TouchableOpacity style={emptyS.btn} onPress={onSync} activeOpacity={0.85}>
                <Text style={emptyS.btnText}>Go to Sync Calls →</Text>
            </TouchableOpacity>
        )}
    </View>
);
const emptyS = StyleSheet.create({
    wrap: { flex: 1, paddingVertical: rs(64), alignItems: 'center', paddingHorizontal: rs(32), gap: rs(12) },
    emoji: { fontSize: rs(52) },
    title: { fontSize: fs(18), fontWeight: '800', color: C.text },
    body: { fontSize: fs(14), color: C.textSub, textAlign: 'center', lineHeight: rs(22) },
    bold: { fontWeight: '700', color: C.primary },
    btn: { marginTop: rs(8), backgroundColor: C.primary, paddingHorizontal: rs(24), paddingVertical: rs(12), borderRadius: rs(12) },
    btnText: { color: '#fff', fontWeight: '700', fontSize: fs(14) },
});

// ── Error state ───────────────────────────────────────────────
const ErrorState = ({ message, onRetry }) => (
    <View style={errS.wrap}>
        <Text style={errS.emoji}>⚠️</Text>
        <Text style={errS.title}>Could not load calls</Text>
        <Text style={errS.body}>{message}</Text>
        <TouchableOpacity style={errS.btn} onPress={onRetry} activeOpacity={0.85}>
            <Text style={errS.btnText}>Try Again</Text>
        </TouchableOpacity>
    </View>
);
const errS = StyleSheet.create({
    wrap: { flex: 1, paddingVertical: rs(64), alignItems: 'center', paddingHorizontal: rs(32), gap: rs(12) },
    emoji: { fontSize: rs(48) },
    title: { fontSize: fs(17), fontWeight: '800', color: C.text },
    body: { fontSize: fs(13), color: C.textSub, textAlign: 'center' },
    btn: { marginTop: rs(8), backgroundColor: C.red, paddingHorizontal: rs(24), paddingVertical: rs(12), borderRadius: rs(12) },
    btnText: { color: '#fff', fontWeight: '700', fontSize: fs(14) },
});

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function CallHistoryScreen({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    const searchTimer = useRef(null);

    // ── Fetch ─────────────────────────────────────────────────
    const fetchLogs = useCallback(async ({
        pageNum = 1,
        searchVal = search,
        filterVal = filter,
        append = false,
    } = {}) => {
        if (pageNum === 1) append ? null : setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            // Map filter chip to API params
            const callTypeParam = filterVal === 'All' ? '' : filterVal;

            const data = await getMyCallHistory({
                page: pageNum,
                limit: PAGE_SIZE,
                search: searchVal,
                callType: callTypeParam,
            });

            const newLogs = data.logs || [];
            setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
            setPage(data.pagination?.page || pageNum);
            setTotalPages(data.pagination?.pages || 1);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [search, filter]);

    // Initial load
    useEffect(() => { fetchLogs({ pageNum: 1 }); }, []);

    // Search debounce
    const handleSearchChange = (text) => {
        setSearch(text);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchLogs({ pageNum: 1, searchVal: text, filterVal: filter });
        }, 400);
    };

    // Filter change
    const handleFilterChange = (f) => {
        setFilter(f);
        fetchLogs({ pageNum: 1, searchVal: search, filterVal: f });
    };

    // Pull-to-refresh
    const handleRefresh = () => {
        setRefreshing(true);
        fetchLogs({ pageNum: 1, append: false });
    };

    // Infinite scroll
    const handleLoadMore = () => {
        if (loadingMore || page >= totalPages) return;
        const nextPage = page + 1;
        fetchLogs({ pageNum: nextPage, append: true });
    };

    // ── Header (search + filters) ──────────────────────────────
    const ListHeader = () => (
        <View style={headerS.wrap}>
            {/* Stats summary */}
            <View style={headerS.summaryRow}>
                <Text style={headerS.summaryText}>
                    {total} call{total !== 1 ? 's' : ''} synced
                </Text>
                <Text style={headerS.summaryHint}>Sorted newest first</Text>
            </View>

            {/* Search */}
            <View style={[headerS.searchBox, shadow]}>
                <Text style={headerS.searchIcon}>🔍</Text>
                <TextInput
                    style={headerS.searchInput}
                    placeholder="Search name or number…"
                    placeholderTextColor={C.textMuted}
                    value={search}
                    onChangeText={handleSearchChange}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {!!search && (
                    <TouchableOpacity onPress={() => handleSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={headerS.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter chips */}
            <View style={headerS.chipRow}>
                {FILTER_OPTIONS.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[headerS.chip, filter === f && headerS.chipActive]}
                        onPress={() => handleFilterChange(f)}
                        activeOpacity={0.8}
                    >
                        <Text style={[headerS.chipText, filter === f && headerS.chipTextActive]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // ── Footer ─────────────────────────────────────────────────
    const ListFooter = () => (
        <View style={{ paddingVertical: rs(16), alignItems: 'center' }}>
            {loadingMore && <ActivityIndicator size="small" color={C.primary} />}
            {!loadingMore && page >= totalPages && logs.length > 0 && (
                <Text style={{ fontSize: fs(12), color: C.textMuted }}>
                    All {total} calls loaded
                </Text>
            )}
        </View>
    );

    // ── Render: initial load skeleton ──────────────────────────
    if (loading && !refreshing) {
        return (
            <View style={s.container}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
                <ListHeader />
                {[1, 2, 3, 4, 5].map(k => <SkeletonCard key={k} />)}
            </View>
        );
    }

    // ── Render: error ──────────────────────────────────────────
    if (error && logs.length === 0) {
        return (
            <View style={s.container}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
                <ErrorState message={error} onRetry={() => fetchLogs({ pageNum: 1 })} />
            </View>
        );
    }

    // ── Render: main ───────────────────────────────────────────
    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
            <FlatList
                data={logs}
                keyExtractor={(item, index) => item?._id || item?.deviceLogId || String(index)}
                renderItem={({ item, index }) => <CallCard item={item} index={index} />}
                ListHeaderComponent={<ListHeader />}
                ListFooterComponent={<ListFooter />}
                ListEmptyComponent={
                    !loading && (
                        <EmptyState
                            onSync={
                                navigation
                                    ? () => navigation.navigate('DeviceCallSync')
                                    : null
                            }
                        />
                    )
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={C.primary}
                        colors={[C.primary]}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.listContent}
            />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    listContent: { paddingTop: rs(4), paddingBottom: rs(32) },
});

const headerS = StyleSheet.create({
    wrap: { paddingHorizontal: rs(12), paddingTop: rs(12), paddingBottom: rs(4), gap: rs(10) },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryText: { fontSize: fs(13), fontWeight: '700', color: C.text },
    summaryHint: { fontSize: fs(11), color: C.textMuted },

    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: rs(12), paddingHorizontal: rs(12), paddingVertical: rs(10),
        gap: rs(8), borderWidth: 1, borderColor: C.border,
    },
    searchIcon: { fontSize: fs(14) },
    searchInput: { flex: 1, fontSize: fs(14), color: C.text, padding: 0 },
    clearBtn: { fontSize: fs(13), color: C.textMuted },

    chipRow: { flexDirection: 'row', gap: rs(8) },
    chip: {
        paddingHorizontal: rs(14), paddingVertical: rs(7),
        borderRadius: rs(100), backgroundColor: C.surface,
        borderWidth: 1, borderColor: C.border,
    },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipText: { fontSize: fs(12), fontWeight: '600', color: C.textSub },
    chipTextActive: { color: '#fff' },
});