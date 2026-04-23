import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Alert,
    Animated, StatusBar, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, rs, fs, shadow, shadowMd } from '../theme';
import {
    requestCallLogPermissions,
    checkCallLogPermissions,
    readDeviceCallLogs,
    syncCallLogsToBackend,
    getLastSyncTime,
    resetSyncState,
    registerBackgroundSync,
    unregisterBackgroundSync,
    isBackgroundSyncRegistered,
    startPhoneStateListener,
    stopPhoneStateListener,
    isPhoneStateListenerActive,
} from '../services/callLogService';

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

const fmtDuration = (s) => {
    if (!s && s !== 0) return '0s';
    const sec = Number(s);
    if (isNaN(sec) || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

const fmtDateTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
        hour12: true,
    });
};

const timeAgo = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 10)  return 'Just now';
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ─────────────────────────────────────────────────────
// MICRO-COMPONENTS
// ─────────────────────────────────────────────────────

const TypePill = ({ type }) => {
    const cfgMap = {
        Incoming: { bg: C.blueSoft,   color: C.blue,   icon: '↙' },
        Outgoing: { bg: C.purpleSoft, color: C.purple, icon: '↗' },
        Missed:   { bg: C.redSoft,    color: C.red,    icon: '✕' },
        Rejected: { bg: C.amberSoft,  color: C.amber,  icon: '⊘' },
        Voicemail:{ bg: C.tealSoft,   color: C.teal,   icon: '📩' },
    };
    const cfg = cfgMap[type] || { bg: C.surfaceAlt, color: C.textSub, icon: '·' };
    return (
        <View style={[pill.wrap, { backgroundColor: cfg.bg }]}>
            <Text style={[pill.text, { color: cfg.color }]}>
                {cfg.icon}  {type}
            </Text>
        </View>
    );
};

const StatusPill = ({ status }) => {
    const cfgMap = {
        Connected: { bg: C.greenSoft,  color: C.green },
        Missed:    { bg: C.redSoft,    color: C.red   },
        Rejected:  { bg: C.amberSoft,  color: C.amber },
    };
    const cfg = cfgMap[status] || { bg: C.surfaceAlt, color: C.textSub };
    return (
        <View style={[pill.wrap, { backgroundColor: cfg.bg }]}>
            <View style={[pill.dot, { backgroundColor: cfg.color }]} />
            <Text style={[pill.text, { color: cfg.color }]}>{status}</Text>
        </View>
    );
};

const pill = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: rs(8), paddingVertical: rs(3),
        borderRadius: rs(100), gap: rs(3),
    },
    text: { fontSize: fs(11), fontWeight: '700', letterSpacing: 0.1 },
    dot:  { width: rs(5), height: rs(5), borderRadius: rs(3) },
});

// ── Avatar ────────────────────────────────────────────
const AV_PALETTE = [
    C.primary, '#7322C0', C.green, C.red, C.amber, C.teal, C.blue,
];
const CallAvatar = ({ name, index }) => {
    const initials = (name || '?')
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const bg = AV_PALETTE[index % AV_PALETTE.length];
    return (
        <View style={[av.circle, { backgroundColor: bg }]}>
            <Text style={av.text}>{initials}</Text>
        </View>
    );
};
const av = StyleSheet.create({
    circle: { width: rs(40), height: rs(40), borderRadius: rs(20), justifyContent: 'center', alignItems: 'center' },
    text:   { color: '#fff', fontWeight: '800', fontSize: fs(14) },
});

// ── Stat Tile ─────────────────────────────────────────
const StatTile = ({ icon, label, value, color }) => (
    <View style={[stat.tile, shadow]}>
        <Text style={stat.icon}>{icon}</Text>
        <Text style={[stat.value, { color }]}>{value ?? 0}</Text>
        <Text style={stat.label}>{label}</Text>
    </View>
);
const stat = StyleSheet.create({
    tile:  { flex: 1, backgroundColor: C.surface, borderRadius: rs(14), padding: rs(12), alignItems: 'center', gap: rs(4) },
    icon:  { fontSize: rs(20) },
    value: { fontSize: fs(20), fontWeight: '800', lineHeight: fs(24) },
    label: { fontSize: fs(10), color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ── Animated Banner ───────────────────────────────────
const SyncBanner = ({ status, message, onDismiss }) => {
    const slideY = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        Animated.timing(slideY, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, []);

    const cfgMap = {
        success: { bg: C.greenSoft,   border: C.green,   icon: '✅' },
        error:   { bg: C.redSoft,     border: C.red,     icon: '⚠️' },
        syncing: { bg: C.primarySoft, border: C.primary, icon: '🔄' },
        info:    { bg: C.blueSoft,    border: C.blue,    icon: 'ℹ️' },
    };
    const cfg = cfgMap[status] || cfgMap.info;

    return (
        <Animated.View
            style={[
                bnr.wrap,
                { backgroundColor: cfg.bg, borderColor: cfg.border, transform: [{ translateY: slideY }] },
            ]}
        >
            <Text style={bnr.icon}>{cfg.icon}</Text>
            <Text style={bnr.text} numberOfLines={2}>{message}</Text>
            {onDismiss && (
                <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={bnr.close}>✕</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};
const bnr = StyleSheet.create({
    wrap:  {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: rs(12), marginBottom: rs(8),
        paddingHorizontal: rs(14), paddingVertical: rs(10),
        borderRadius: rs(12), borderWidth: 1, gap: rs(8),
    },
    icon:  { fontSize: fs(16) },
    text:  { flex: 1, fontSize: fs(13), fontWeight: '600', color: C.text },
    close: { fontSize: fs(14), color: C.textSub },
});

// ── Toggle Switch ─────────────────────────────────────
const ToggleRow = ({ label, desc, active, onToggle, disabled }) => (
    <View style={tog.row}>
        <View style={tog.info}>
            <Text style={tog.label}>{label}</Text>
            {!!desc && <Text style={tog.desc}>{desc}</Text>}
        </View>
        <TouchableOpacity
            style={[tog.track, active && tog.trackOn, disabled && tog.trackDisabled]}
            onPress={onToggle}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <View style={[tog.thumb, active && tog.thumbOn]} />
        </TouchableOpacity>
    </View>
);
const tog = StyleSheet.create({
    row:          { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
    info:         { flex: 1 },
    label:        { fontSize: fs(14), fontWeight: '700', color: C.text },
    desc:         { fontSize: fs(12), color: C.textSub, marginTop: 2 },
    track:        { width: rs(44), height: rs(24), borderRadius: rs(12), backgroundColor: C.border, justifyContent: 'center', padding: rs(2) },
    trackOn:      { backgroundColor: C.green },
    trackDisabled:{ opacity: 0.4 },
    thumb:        { width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: '#fff', alignSelf: 'flex-start',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    thumbOn:      { alignSelf: 'flex-end' },
});

// ── Call Log Card ─────────────────────────────────────
const CallCard = React.memo(({ item, index }) => (
    <View style={[card.wrap, shadow]}>
        <View style={card.row}>
            <CallAvatar
                name={item.customerName !== 'Unknown' ? item.customerName : item.customerNumber}
                index={index}
            />
            <View style={card.info}>
                <Text style={card.name} numberOfLines={1}>
                    {item.customerName !== 'Unknown' ? item.customerName : item.customerNumber}
                </Text>
                {item.customerName !== 'Unknown' && (
                    <Text style={card.number}>{item.customerNumber}</Text>
                )}
                <Text style={card.time}>{fmtDateTime(item.calledAt)}</Text>
            </View>
            <View style={card.right}>
                <Text style={card.duration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
            </View>
        </View>
        <View style={card.pills}>
            <TypePill type={item.callType} />
            <StatusPill status={item.callStatus} />
        </View>
    </View>
));

const card = StyleSheet.create({
    wrap:     { backgroundColor: C.surface, marginHorizontal: rs(12), marginBottom: rs(8), borderRadius: rs(14), padding: rs(14) },
    row:      { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(10) },
    info:     { flex: 1, minWidth: 0 },
    name:     { fontSize: fs(14), fontWeight: '700', color: C.text },
    number:   { fontSize: fs(12), color: C.textSub, marginTop: 1 },
    time:     { fontSize: fs(11), color: C.textMuted, marginTop: 2 },
    right:    { alignItems: 'flex-end' },
    duration: { fontSize: fs(12), color: C.textSub, fontWeight: '600' },
    pills:    { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), paddingTop: rs(10), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
});

// ─────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────
export default function DeviceCallSyncScreen() {
    // ── State ──────────────────────────────────────────
    const [permGranted,   setPermGranted]   = useState(null); // null = unknown, checking
    const [deviceLogs,    setDeviceLogs]    = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [syncing,       setSyncing]       = useState(false);
    const [refreshing,    setRefreshing]    = useState(false);
    const [lastSyncTime,  setLastSyncTime]  = useState(null);
    const [banner,        setBanner]        = useState(null); // { status, message }
    const [bgSyncOn,      setBgSyncOn]      = useState(false);
    const [realtimeSyncOn,setRealtimeSyncOn]= useState(false);
    const [permChecked,   setPermChecked]   = useState(false);

    // Derived stats
    const stats = {
        total:    deviceLogs.length,
        incoming: deviceLogs.filter(l => l.callType === 'Incoming').length,
        outgoing: deviceLogs.filter(l => l.callType === 'Outgoing').length,
        missed:   deviceLogs.filter(l => l.callStatus === 'Missed').length,
    };

    // ── Init ───────────────────────────────────────────
    useEffect(() => {
        initScreen();
        return () => {
            // Cleanup on unmount — leave background sync running, just remove listener
            stopPhoneStateListener();
        };
    }, []);

    const initScreen = async () => {
        const hasPerm = await checkCallLogPermissions();
        setPermGranted(hasPerm);
        setPermChecked(true);

        const ts = await getLastSyncTime();
        setLastSyncTime(ts);

        const bgOn = await isBackgroundSyncRegistered();
        setBgSyncOn(bgOn);

        const rtOn = isPhoneStateListenerActive();
        setRealtimeSyncOn(rtOn);

        if (hasPerm) {
            loadDeviceLogs();
        }
    };

    // ── Load device logs (local read, no network) ──────
    const loadDeviceLogs = useCallback(async () => {
        setLoading(true);
        try {
            const logs = await readDeviceCallLogs(150, 7);
            setDeviceLogs(logs);
        } catch (err) {
            showBanner('error', `Could not read call logs: ${err.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadDeviceLogs();
    };

    // ── Banner helpers ─────────────────────────────────
    const showBanner = (status, message) => setBanner({ status, message });
    const clearBanner = () => setBanner(null);

    // ── Request permissions ────────────────────────────
    const handleRequestPermissions = async () => {
        setLoading(true);
        clearBanner();
        try {
            const result = await requestCallLogPermissions();
            setPermGranted(result.granted);

            if (result.granted) {
                showBanner('success', 'Permissions granted! Loading your call logs…');
                await loadDeviceLogs();
                // Auto-register background sync on first permission grant
                const bgOk = await registerBackgroundSync();
                setBgSyncOn(bgOk);
            } else {
                showBanner(
                    'error',
                    'Permission denied. Go to Settings → Apps → CallyzerApp → Permissions to enable manually.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Manual sync ────────────────────────────────────
    const handleSyncNow = async () => {
        if (syncing) return;
        setSyncing(true);
        showBanner('syncing', 'Syncing call logs to server…');

        const result = await syncCallLogsToBackend();
        const ts = await getLastSyncTime();
        setLastSyncTime(ts);

        if (result.success) {
            const msg = result.synced > 0
                ? `${result.synced} call${result.synced !== 1 ? 's' : ''} synced successfully`
                : 'Already up to date — no new calls to upload';
            showBanner('success', msg);
            if (result.synced > 0) loadDeviceLogs(); // refresh local list
        } else if (result.skipped) {
            showBanner('info', 'A sync is already in progress, please wait…');
        } else {
            showBanner('error', `Sync failed: ${result.reason || 'Unknown error'}`);
        }

        setSyncing(false);
    };

    // ── Background sync toggle ─────────────────────────
    const handleToggleBgSync = async () => {
        if (bgSyncOn) {
            await unregisterBackgroundSync();
            setBgSyncOn(false);
            showBanner('info', 'Background sync disabled');
        } else {
            const ok = await registerBackgroundSync();
            setBgSyncOn(ok);
            showBanner(
                ok ? 'success' : 'error',
                ok ? 'Background sync enabled — runs every 15 minutes' : 'Background sync unavailable on this device'
            );
        }
    };

    // ── Real-time sync toggle ──────────────────────────
    const handleToggleRealtimeSync = async () => {
        if (realtimeSyncOn) {
            stopPhoneStateListener();
            setRealtimeSyncOn(false);
            showBanner('info', 'Real-time sync disabled');
        } else {
            await startPhoneStateListener(async (result) => {
                const ts = await getLastSyncTime();
                setLastSyncTime(ts);
                showBanner(
                    result.success ? 'success' : 'error',
                    result.success
                        ? `Auto-synced ${result.synced ?? 0} call(s) after call ended`
                        : `Auto-sync failed: ${result.reason}`
                );
            });
            setRealtimeSyncOn(true);
            showBanner('success', '🟢 Real-time sync on — will auto-sync after every call');
        }
    };

    // ── Reset sync state ───────────────────────────────
    const handleReset = () => {
        Alert.alert(
            'Reset Sync State',
            'Clears the last-sync timestamp. The next sync will re-upload all calls from the last 7 days.\n\nContinue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset', style: 'destructive',
                    onPress: async () => {
                        await resetSyncState();
                        setLastSyncTime(null);
                        showBanner('info', 'Sync state reset — next sync will re-fetch all recent calls');
                    },
                },
            ]
        );
    };

    // ─────────────────────────────────────────────────
    // RENDER: Loading (permission check in progress)
    // ─────────────────────────────────────────────────
    if (!permChecked) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    // ─────────────────────────────────────────────────
    // RENDER: iOS / non-Android gate
    // ─────────────────────────────────────────────────
    if (Platform.OS !== 'android') {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.gateEmoji}>📵</Text>
                    <Text style={styles.gateTitle}>Android Only Feature</Text>
                    <Text style={styles.gateBody}>
                        Device call log sync is available on Android only.{'\n'}
                        On iOS, you can still add and manage calls manually from the Call Logs screen.
                    </Text>
                </View>
            </View>
        );
    }

    // ─────────────────────────────────────────────────
    // RENDER: Permission gate
    // ─────────────────────────────────────────────────
    if (permGranted === false) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

                {banner && (
                    <SyncBanner
                        status={banner.status}
                        message={banner.message}
                        onDismiss={clearBanner}
                    />
                )}

                <View style={styles.permGate}>
                    <Text style={styles.gateEmoji}>🔐</Text>
                    <Text style={styles.gateTitle}>Permissions Required</Text>
                    <Text style={styles.gateBody}>
                        CallyzerApp needs access to your device call logs to automatically
                        sync your call activity with the team dashboard.
                    </Text>

                    <View style={styles.permList}>
                        {[
                            { icon: '📋', perm: 'READ_CALL_LOG',     desc: 'Read your call history' },
                            { icon: '📱', perm: 'READ_PHONE_STATE',  desc: 'Detect call events in real-time' },
                        ].map(p => (
                            <View key={p.perm} style={styles.permRow}>
                                <Text style={styles.permIcon}>{p.icon}</Text>
                                <View>
                                    <Text style={styles.permName}>{p.perm}</Text>
                                    <Text style={styles.permDesc}>{p.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.grantBtn, loading && { opacity: 0.6 }]}
                        onPress={handleRequestPermissions}
                        disabled={loading}
                        activeOpacity={0.88}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.grantBtnText}>Grant Permissions</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─────────────────────────────────────────────────
    // RENDER: Main UI (permissions granted)
    // ─────────────────────────────────────────────────

    const ListHeader = () => (
        <>
            {/* ── Stats ──────────────────────────── */}
            <View style={styles.statsRow}>
                <StatTile icon="📞" label="Total"    value={stats.total}    color={C.primary} />
                <StatTile icon="↙️"  label="Incoming" value={stats.incoming} color={C.blue}    />
                <StatTile icon="↗️"  label="Outgoing" value={stats.outgoing} color={C.purple}  />
                <StatTile icon="❌"  label="Missed"   value={stats.missed}   color={C.red}     />
            </View>

            {/* ── Sync controls card ──────────────── */}
            <View style={[styles.settingsCard, shadowMd]}>
                <Text style={styles.settingsTitle}>⚡ Sync Settings</Text>

                <ToggleRow
                    label="Real-time Sync"
                    desc={realtimeSyncOn
                        ? 'Auto-syncs after every call ends'
                        : 'Sync automatically after each call'}
                    active={realtimeSyncOn}
                    onToggle={handleToggleRealtimeSync}
                />

                <View style={styles.settingsDivider} />

                <ToggleRow
                    label="Background Sync"
                    desc={bgSyncOn
                        ? 'Running every 15 minutes'
                        : 'Sync even when app is closed'}
                    active={bgSyncOn}
                    onToggle={handleToggleBgSync}
                />
            </View>

            {/* ── Section header ──────────────────── */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Device Logs (Last 7 Days)</Text>
                    <Text style={styles.sectionSub}>{deviceLogs.length} records found</Text>
                </View>
                <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                    <Text style={styles.resetLink}>Reset sync</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* ── Control bar ─────────────────────── */}
            <View style={[styles.controlBar, shadow]}>
                <View style={styles.syncMeta}>
                    <Text style={styles.syncMetaLabel}>Last synced</Text>
                    <Text style={styles.syncMetaValue}>{timeAgo(lastSyncTime)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.syncNowBtn, syncing && styles.syncNowBtnBusy]}
                    onPress={handleSyncNow}
                    disabled={syncing}
                    activeOpacity={0.88}
                >
                    {syncing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.syncNowBtnText}>↑ Sync Now</Text>
                    }
                </TouchableOpacity>
            </View>

            {/* ── Banner ──────────────────────────── */}
            {banner && (
                <SyncBanner
                    status={banner.status}
                    message={banner.message}
                    onDismiss={clearBanner}
                />
            )}

            {/* ── List ────────────────────────────── */}
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={styles.loadingText}>Reading device call logs…</Text>
                </View>
            ) : (
                <FlatList
                    data={deviceLogs}
                    keyExtractor={(item, idx) => item.deviceLogId || String(idx)}
                    renderItem={({ item, index }) => <CallCard item={item} index={index} />}
                    ListHeaderComponent={<ListHeader />}
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyEmoji}>📭</Text>
                                <Text style={styles.emptyTitle}>No calls found</Text>
                                <Text style={styles.emptyBody}>
                                    No calls in the last 7 days on this device.
                                    Pull down to refresh.
                                </Text>
                            </View>
                        )
                    }
                    ListFooterComponent={<View style={{ height: rs(32) }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={C.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    listContent: { paddingTop: rs(12) },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        gap: rs(12), padding: rs(24),
    },
    loadingText: { fontSize: fs(14), color: C.textSub },

    // ── Control bar
    controlBar: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.surface,
        paddingHorizontal: rs(16), paddingVertical: rs(12),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    syncMeta:       { gap: rs(2) },
    syncMetaLabel:  { fontSize: fs(11), color: C.textMuted },
    syncMetaValue:  { fontSize: fs(13), fontWeight: '700', color: C.text },
    syncNowBtn:     {
        backgroundColor: C.primary,
        paddingHorizontal: rs(18), paddingVertical: rs(9),
        borderRadius: rs(10), minWidth: rs(100), alignItems: 'center',
    },
    syncNowBtnBusy: { opacity: 0.65 },
    syncNowBtnText: { color: '#fff', fontSize: fs(13), fontWeight: '700' },

    // ── Stats row
    statsRow: {
        flexDirection: 'row', gap: rs(8),
        paddingHorizontal: rs(12), paddingBottom: rs(8),
    },

    // ── Settings card
    settingsCard: {
        backgroundColor: C.surface,
        marginHorizontal: rs(12), marginBottom: rs(12),
        borderRadius: rs(16), padding: rs(16), gap: rs(14),
    },
    settingsTitle: { fontSize: fs(13), fontWeight: '800', color: C.textSub, marginBottom: rs(4), textTransform: 'uppercase', letterSpacing: 0.5 },
    settingsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },

    // ── Section header
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: rs(16), paddingBottom: rs(8),
    },
    sectionTitle: { fontSize: fs(13), fontWeight: '700', color: C.text },
    sectionSub:   { fontSize: fs(11), color: C.textMuted, marginTop: rs(2) },
    resetLink:    { fontSize: fs(12), color: C.primary, fontWeight: '600' },

    // ── Permission gate
    permGate: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        padding: rs(24), gap: rs(16),
    },
    gateEmoji: { fontSize: rs(56) },
    gateTitle: { fontSize: fs(20), fontWeight: '800', color: C.text, textAlign: 'center' },
    gateBody:  { fontSize: fs(14), color: C.textSub, textAlign: 'center', lineHeight: rs(22) },
    permList:  { width: '100%', gap: rs(10), marginTop: rs(8) },
    permRow:   {
        flexDirection: 'row', alignItems: 'center', gap: rs(12),
        backgroundColor: C.surface, padding: rs(12),
        borderRadius: rs(12), borderWidth: 1, borderColor: C.border,
    },
    permIcon:  { fontSize: rs(24) },
    permName:  { fontSize: fs(13), fontWeight: '700', color: C.text },
    permDesc:  { fontSize: fs(12), color: C.textSub },
    grantBtn:  {
        backgroundColor: C.primary,
        paddingHorizontal: rs(32), paddingVertical: rs(14),
        borderRadius: rs(12), marginTop: rs(8),
        minWidth: rs(200), alignItems: 'center',
    },
    grantBtnText: { color: '#fff', fontSize: fs(15), fontWeight: '800' },

    // ── Empty
    emptyWrap:  { paddingVertical: rs(48), alignItems: 'center', gap: rs(10), paddingHorizontal: rs(24) },
    emptyEmoji: { fontSize: rs(48) },
    emptyTitle: { fontSize: fs(16), fontWeight: '700', color: C.text },
    emptyBody:  { fontSize: fs(13), color: C.textSub, textAlign: 'center', lineHeight: rs(20) },
});