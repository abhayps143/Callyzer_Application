import React, { useEffect, useState, useRef, useContext } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    Animated, StatusBar, RefreshControl, Platform,
} from 'react-native';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { API_BASE_URL } from '../config';

// ── Helpers ───────────────────────────────────────────
const fmtDuration = (sec) => {
    if (!sec || sec === 0) return '0s';
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
};

const statusColor = (status) => {
    if (status === 'Connected') return '#17C964';
    if (status === 'Missed') return '#F31260';
    if (status === 'Rejected') return '#F5A524';
    return '#6B7A99';
};

const statusBg = (status) => {
    if (status === 'Connected') return '#E8FBF0';
    if (status === 'Missed') return '#FEE7EF';
    if (status === 'Rejected') return '#FFF4E0';
    return '#F0F2F7';
};

const callTypeLabel = (type) => type === 'Incoming' ? '↙ In' : '↗ Out';
const callTypeBg = (type) => type === 'Incoming' ? '#E6F1FE' : '#F0E6FF';
const callTypeColor = (type) => type === 'Incoming' ? '#006FEE' : '#7828C8';

// ─────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────
export default function LiveFeedScreen() {
    const { user } = useContext(AuthContext);

    const [calls, setCalls] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [newCallCount, setNewCallCount] = useState(0);

    const socketRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    useEffect(() => { loadRecentCalls(); }, []);

    useEffect(() => {
        if (!user?._id) return;

        const socket = io(API_BASE_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsLive(true);
            socket.emit('join-user', {
                userId: user._id,
                role: user.role,
                businessUserId: user.businessUserId || user._id,
            });
        });

        socket.on('disconnect', () => setIsLive(false));

        socket.on('new-call', (callData) => {
            setCalls(prev => {
                if (prev.find(c => c._id === callData._id)) return prev;
                return [{ ...callData, isNew: true }, ...prev].slice(0, 100);
            });
            setNewCallCount(prev => prev + 1);
        });

        return () => socket.disconnect();
    }, [user?._id]);

    const loadRecentCalls = async () => {
        try {
            setRefreshing(true);
            const today = new Date().toISOString().split('T')[0];
            const data = await api.getCallLogs({ dateFrom: today, limit: 50 });
            if (data?.logs) setCalls(data.logs.map(c => ({ ...c, isNew: false })));
        } catch (err) {
            console.error('LiveFeed load error:', err);
        } finally {
            setRefreshing(false);
        }
    };

    // ── Stats ─────────────────────────────────────────
    const connected = calls.filter(c => c.callStatus === 'Connected').length;
    const missed = calls.filter(c => c.callStatus === 'Missed').length;
    const total = calls.length;
    const connectRate = total > 0 ? Math.round((connected / total) * 100) : 0;

    // ── Render call card ──────────────────────────────
    const renderCall = ({ item }) => (
        <View style={[styles.card, item.isNew && styles.cardNew]}>
            <View style={[styles.colorBar, { backgroundColor: statusColor(item.callStatus) }]} />
            <View style={styles.cardBody}>
                {/* Top row */}
                <View style={styles.cardTop}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {item.customerName || 'Unknown'}
                    </Text>
                    {item.isNew && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.phoneNumber}>{item.customerNumber}</Text>

                {/* Pills row */}
                <View style={styles.pillsRow}>
                    <View style={[styles.pill, { backgroundColor: callTypeBg(item.callType) }]}>
                        <Text style={[styles.pillText, { color: callTypeColor(item.callType) }]}>
                            {callTypeLabel(item.callType)}
                        </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: statusBg(item.callStatus) }]}>
                        <View style={[styles.pillDot, { backgroundColor: statusColor(item.callStatus) }]} />
                        <Text style={[styles.pillText, { color: statusColor(item.callStatus) }]}>
                            {item.callStatus}
                        </Text>
                    </View>
                </View>

                {/* Bottom row */}
                <View style={styles.cardBottom}>
                    {item.agent?.name && (
                        <Text style={styles.agentName} numberOfLines={1}>👤 {item.agent.name}</Text>
                    )}
                    <View style={styles.metaRight}>
                        <Text style={styles.duration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
                        <Text style={styles.timeAgo}>{timeAgo(item.calledAt)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // ── Header ────────────────────────────────────────
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Live Feed</Text>
                <View style={styles.liveIndicator}>
                    <Animated.View style={[
                        styles.liveDot,
                        { transform: [{ scale: pulseAnim }] },
                        { backgroundColor: isLive ? '#4ADE80' : 'rgba(255,255,255,0.4)' },
                    ]} />
                    <Text style={[styles.liveText, { color: isLive ? '#4ADE80' : 'rgba(255,255,255,0.6)' }]}>
                        {isLive ? 'LIVE' : 'Offline'}
                    </Text>
                </View>
            </View>
            <View style={styles.headerRight}>
                {newCallCount > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{newCallCount} new</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={() => { loadRecentCalls(); setNewCallCount(0); }}
                    activeOpacity={0.8}
                >
                    <Text>🔄</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Stats bar ─────────────────────────────────────
    const renderStats = () => (
        <View style={styles.statsBar}>
            {[
                { label: 'Total', value: total, color: '#4F6EF7' },
                { label: 'Connected', value: connected, color: '#17C964' },
                { label: 'Missed', value: missed, color: '#F31260' },
                { label: 'Rate', value: `${connectRate}%`, color: '#4F6EF7' },
            ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={styles.statDivider} />}
                </React.Fragment>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4F6EF7" />
            {renderStats()}
            <FlatList
                data={calls}
                keyExtractor={(item, index) => item._id?.toString() || index.toString()}
                renderItem={renderCall}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { loadRecentCalls(); setNewCallCount(0); }}
                        tintColor="#4F6EF7"
                    />
                }
                contentContainerStyle={[styles.listContent, calls.length === 0 && { flexGrow: 1 }]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📞</Text>
                        <Text style={styles.emptyText}>Koi call activity nahi</Text>
                        <Text style={styles.emptySubText}>
                            Jab team member call karega, yahan dikhega
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

// ─────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 16,
        paddingBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    countBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 100,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    countBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    refreshBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats bar
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E8ECF4',
        marginBottom: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 11,
        color: '#A9B4CC',
        marginTop: 2,
        fontWeight: '500',
    },
    statDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: '#E8ECF4',
        marginVertical: 4,
    },

    // List
    listContent: {
        padding: 12,
        gap: 8,
    },

    // Call card
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#E8ECF4',
        shadowColor: '#1A2B5F',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardNew: {
        borderColor: '#4F6EF7',
        borderWidth: 1.5,
        backgroundColor: '#FAFBFF',
    },
    colorBar: {
        width: 4,
    },
    cardBody: {
        flex: 1,
        padding: 12,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    customerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F1729',
        flex: 1,
    },
    newBadge: {
        backgroundColor: '#4F6EF7',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginLeft: 6,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    phoneNumber: {
        fontSize: 13,
        color: '#6B7A99',
        marginBottom: 8,
    },

    // Pills
    pillsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 100,
        gap: 4,
    },
    pillDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700',
    },

    // Card bottom
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#F0F2F7',
        paddingTop: 8,
    },
    agentName: {
        fontSize: 12,
        color: '#6B7A99',
        flex: 1,
    },
    metaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    duration: {
        fontSize: 12,
        color: '#6B7A99',
        fontWeight: '500',
    },
    timeAgo: {
        fontSize: 12,
        color: '#A9B4CC',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F1729',
        marginBottom: 6,
    },
    emptySubText: {
        fontSize: 13,
        color: '#6B7A99',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});
