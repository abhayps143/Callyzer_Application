import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, RefreshControl, StatusBar, Dimensions, Alert
} from 'react-native';
import { api } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────
const fmtDuration = (s) => {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const getDateRange = (period) => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from;
    if (period === 'today') { from = to; }
    else if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); from = d.toISOString().split('T')[0]; }
    else if (period === 'month') { const d = new Date(now); d.setDate(1); from = d.toISOString().split('T')[0]; }
    else { const d = new Date(now); d.setMonth(d.getMonth() - 3); from = d.toISOString().split('T')[0]; }
    return { dateFrom: from, dateTo: to };
};

const buildDailyBuckets = (logs, period) => {
    const buckets = {};
    const now = new Date();
    const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        buckets[key] = { date: key, total: 0, connected: 0, missed: 0, rejected: 0 };
    }
    logs.forEach(log => {
        const key = log.calledAt ? log.calledAt.split('T')[0] : null;
        if (key && buckets[key]) {
            buckets[key].total++;
            if (log.callStatus === 'Connected') buckets[key].connected++;
            else if (log.callStatus === 'Missed') buckets[key].missed++;
            else if (log.callStatus === 'Rejected') buckets[key].rejected++;
        }
    });
    return Object.values(buckets);
};

// ── PDF HTML Generator ────────────────────────────────────────
const generatePdfHtml = ({ periodLabel, total, connected, missed, rejected, outgoing, incoming, connRate, avgDur, totalDur, dispEntries, logs, dateFrom, dateTo }) => {
    const dispRows = dispEntries.map(([label, count]) =>
        `<tr><td>${label}</td><td style="text-align:center">${count}</td><td style="text-align:center">${Math.round((count / total) * 100)}%</td></tr>`
    ).join('');

    const recentLogs = logs.slice(0, 30);
    const logRows = recentLogs.map(log => {
        const date = log.calledAt ? new Date(log.calledAt).toLocaleDateString('en-IN') : '—';
        const statusColor = log.callStatus === 'Connected' ? '#22c55e' : log.callStatus === 'Missed' ? '#ef4444' : '#f59e0b';
        return `<tr>
            <td>${log.customerName || 'Unknown'}</td>
            <td>${log.customerNumber || '—'}</td>
            <td>${log.callType || '—'}</td>
            <td style="color:${statusColor};font-weight:600">${log.callStatus || '—'}</td>
            <td>${fmtDuration(log.durationSeconds)}</td>
            <td>${log.disposition || '—'}</td>
            <td>${date}</td>
        </tr>`;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; }
        .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; padding: 28px 32px; border-radius: 12px; margin-bottom: 28px; }
        .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: #94a3b8; margin-top: 6px; font-size: 14px; }
        .header .meta { display: flex; gap: 24px; margin-top: 16px; }
        .header .meta span { background: rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 20px; font-size: 13px; }
        h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 14px; padding-left: 10px; border-left: 4px solid #6366f1; }
        .section { margin-bottom: 32px; }
        .cards { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 0; }
        .card { background: #f8fafc; border-radius: 10px; padding: 18px 20px; flex: 1; min-width: 130px; border-top: 3px solid #6366f1; }
        .card .val { font-size: 28px; font-weight: 800; }
        .card .lbl { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .c-purple { border-top-color: #6366f1; color: #6366f1; }
        .c-green  { border-top-color: #22c55e; color: #22c55e; }
        .c-red    { border-top-color: #ef4444; color: #ef4444; }
        .c-blue   { border-top-color: #3b82f6; color: #3b82f6; }
        .c-violet { border-top-color: #8b5cf6; color: #8b5cf6; }
        .c-amber  { border-top-color: #f59e0b; color: #f59e0b; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
        td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .bar-bg { background: #e2e8f0; border-radius: 4px; height: 8px; width: 100%; }
        .bar-fill { height: 8px; border-radius: 4px; }
        .dist-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .dist-label { width: 90px; font-size: 13px; font-weight: 600; }
        .dist-val { width: 36px; text-align: right; font-size: 13px; color: #64748b; }
        .dist-pct { width: 40px; text-align: right; font-size: 12px; color: #94a3b8; }
        .dist-bar { flex: 1; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Reports & Analytics</h1>
        <p>Call performance report generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <div class="meta">
          <span>📅 Period: ${periodLabel}</span>
          <span>📆 ${dateFrom} → ${dateTo}</span>
          <span>📞 ${total} Total Calls</span>
        </div>
      </div>

      <div class="section">
        <h2>Key Metrics</h2>
        <div class="cards">
          <div class="card"><div class="val c-purple">${total}</div><div class="lbl">Total Calls</div></div>
          <div class="card"><div class="val c-green">${connected}</div><div class="lbl">Connected</div></div>
          <div class="card"><div class="val c-red">${missed}</div><div class="lbl">Missed</div></div>
          <div class="card"><div class="val c-blue">${connRate}%</div><div class="lbl">Connect Rate</div></div>
          <div class="card"><div class="val c-violet">${fmtDuration(avgDur)}</div><div class="lbl">Avg Duration</div></div>
          <div class="card"><div class="val c-amber">${fmtDuration(totalDur)}</div><div class="lbl">Total Duration</div></div>
        </div>
      </div>

      <div class="section">
        <h2>Call Distribution</h2>
        <table>
          <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
          <tr><td>Outgoing</td><td>${outgoing}</td><td>${total ? Math.round((outgoing / total) * 100) : 0}%</td></tr>
          <tr><td>Incoming</td><td>${incoming}</td><td>${total ? Math.round((incoming / total) * 100) : 0}%</td></tr>
          <tr><td>Connected</td><td>${connected}</td><td>${total ? Math.round((connected / total) * 100) : 0}%</td></tr>
          <tr><td>Missed</td><td>${missed}</td><td>${total ? Math.round((missed / total) * 100) : 0}%</td></tr>
          <tr><td>Rejected</td><td>${rejected}</td><td>${total ? Math.round((rejected / total) * 100) : 0}%</td></tr>
        </table>
      </div>

      ${dispEntries.length > 0 ? `
      <div class="section">
        <h2>Disposition Breakdown</h2>
        <table>
          <tr><th>Disposition</th><th style="text-align:center">Count</th><th style="text-align:center">%</th></tr>
          ${dispRows}
        </table>
      </div>` : ''}

      ${recentLogs.length > 0 ? `
      <div class="section">
        <h2>Recent Call Logs (Last ${recentLogs.length})</h2>
        <table>
          <tr><th>Name</th><th>Number</th><th>Type</th><th>Status</th><th>Duration</th><th>Disposition</th><th>Date</th></tr>
          ${logRows}
        </table>
      </div>` : ''}

      <div class="footer">Generated by Callyzer App • ${new Date().toLocaleString('en-IN')}</div>
    </body>
    </html>`;
};

const PERIODS = [
    { key: 'today', label: 'Today', icon: '📅' },
    { key: 'week', label: 'This Week', icon: '📆' },
    { key: 'month', label: 'This Month', icon: '📊' },
    { key: 'quarter', label: 'Last 3M', icon: '📈' },
];

const MiniBar = ({ value, max, color }) => (
    <View style={barStyles.bg}>
        <View style={[barStyles.fill, { width: `${Math.round((value / Math.max(max, 1)) * 100)}%`, backgroundColor: color }]} />
    </View>
);

export default function ReportsScreen() {
    const [period, setPeriod] = useState('month');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async () => {
        setError('');
        try {
            const { dateFrom, dateTo } = getDateRange(period);
            const logsRes = await api.getCallLogs({ dateFrom, dateTo, limit: 500, sortField: 'calledAt', sortDir: 'asc' });
            let logsData = [];
            if (logsRes?.logs) logsData = logsRes.logs;
            else if (Array.isArray(logsRes)) logsData = logsRes;
            setLogs(logsData);
        } catch (e) {
            setError('Server se connect nahi ho pa raha');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [period]);

    useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    // ── Computed ──────────────────────────────────────────────
    const total = logs.length;
    const connected = logs.filter(l => l.callStatus === 'Connected').length;
    const missed = logs.filter(l => l.callStatus === 'Missed').length;
    const rejected = logs.filter(l => l.callStatus === 'Rejected').length;
    const outgoing = logs.filter(l => l.callType === 'Outgoing').length;
    const incoming = logs.filter(l => l.callType === 'Incoming').length;
    const connRate = total ? Math.round((connected / total) * 100) : 0;
    const totalDur = logs.reduce((s, l) => s + (l.durationSeconds || 0), 0);
    const avgDur = total ? Math.round(totalDur / total) : 0;

    const dispositions = {};
    logs.forEach(l => { if (l.disposition) dispositions[l.disposition] = (dispositions[l.disposition] || 0) + 1; });
    const dispEntries = Object.entries(dispositions).sort((a, b) => b[1] - a[1]);

    const allBuckets = buildDailyBuckets(logs, period);
    const step = period === 'quarter' ? 7 : period === 'month' ? 3 : 1;
    const chartBuckets = allBuckets.filter((_, i, arr) => i % step === 0 || i === arr.length - 1);
    const maxBucket = Math.max(...allBuckets.map(b => b.total), 1);

    const summaryCards = [
        { title: 'Total Calls', value: String(total), color: '#6366f1', icon: '📞' },
        { title: 'Connected', value: String(connected), color: '#22c55e', icon: '✅' },
        { title: 'Missed', value: String(missed), color: '#ef4444', icon: '❌' },
        { title: 'Connect Rate', value: `${connRate}%`, color: '#3b82f6', icon: '📈' },
        { title: 'Avg Duration', value: fmtDuration(avgDur), color: '#8b5cf6', icon: '⏱' },
        { title: 'Total Duration', value: fmtDuration(totalDur), color: '#f59e0b', icon: '🕐' },
    ];

    const periodLabel = PERIODS.find(p => p.key === period)?.label || '';
    const { dateFrom, dateTo } = getDateRange(period);

    // ── Export PDF ────────────────────────────────────────────
    const handleExportPDF = async () => {
        if (total === 0) { Alert.alert('No Data', 'Is period mein koi data nahi hai export karne ke liye.'); return; }
        setExporting(true);
        try {
            const html = generatePdfHtml({ periodLabel, total, connected, missed, rejected, outgoing, incoming, connRate, avgDur, totalDur, dispEntries, logs, dateFrom, dateTo });
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Report — ${periodLabel}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Saved!', `PDF saved at:\n${uri}`);
            }
        } catch (e) {
            Alert.alert('Error', 'PDF export nahi ho paya. Dobara try karo.');
        } finally {
            setExporting(false);
        }
    };

    // ── Download = same as Export (share sheet se save hoga) ──
    const handleDownload = handleExportPDF;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Reports & Analytics</Text>
                    <Text style={styles.subtitle}>Track your call performance metrics</Text>
                </View>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>📊</Text>
                </View>
            </View>

            {/* Period Selector */}
            <View style={[styles.card, { marginTop: 16 }]}>
                <Text style={styles.cardLabel}>SELECT PERIOD</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {PERIODS.map(p => (
                        <TouchableOpacity
                            key={p.key}
                            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
                            onPress={() => setPeriod(p.key)}
                        >
                            <Text style={styles.periodIcon}>{p.icon}</Text>
                            <Text style={[styles.periodBtnText, period === p.key && styles.periodBtnTextActive]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* ── Export / Download Buttons ── */}
            <View style={styles.exportRow}>
                <TouchableOpacity
                    style={[styles.exportBtn, styles.exportBtnRed, exporting && styles.btnDisabled]}
                    onPress={handleExportPDF}
                    disabled={exporting}
                    activeOpacity={0.85}
                >
                    {exporting
                        ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        : <Text style={styles.exportBtnIcon}>📄</Text>
                    }
                    <Text style={styles.exportBtnText}>{exporting ? 'Generating...' : 'Export PDF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.exportBtn, styles.exportBtnBlue, exporting && styles.btnDisabled]}
                    onPress={handleDownload}
                    disabled={exporting}
                    activeOpacity={0.85}
                >
                    <Text style={styles.exportBtnIcon}>⬇</Text>
                    <Text style={styles.exportBtnText}>Download Report</Text>
                </TouchableOpacity>
            </View>

            {/* Error */}
            {!!error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️  {error}</Text>
                    <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Empty */}
            {!error && total === 0 && (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📊</Text>
                    <Text style={styles.emptyTitle}>No Calls Found</Text>
                    <Text style={styles.emptyText}>"{periodLabel}" mein koi call log nahi hai</Text>
                    <Text style={styles.emptySubText}>Alag period select karo ya pehle calls add karo</Text>
                </View>
            )}

            {total > 0 && (
                <>
                    {/* Summary Cards */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionBar} />
                            <Text style={styles.sectionTitle}>Key Metrics — {periodLabel}</Text>
                        </View>
                        <View style={styles.summaryGrid}>
                            {summaryCards.map((card, i) => (
                                <View key={i} style={[styles.summaryCard, { borderTopColor: card.color }]}>
                                    <Text style={styles.summaryIcon}>{card.icon}</Text>
                                    <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
                                    <Text style={styles.summaryLabel}>{card.title}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Call Type Split */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionBar} />
                            <Text style={styles.sectionTitle}>Call Type Split</Text>
                        </View>
                        <View style={[styles.card, { gap: 12 }]}>
                            {[
                                { label: 'Outgoing', value: outgoing, color: '#6366f1' },
                                { label: 'Incoming', value: incoming, color: '#3b82f6' },
                            ].map(item => (
                                <View key={item.label} style={styles.distRow}>
                                    <View style={[styles.distDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.distLabel}>{item.label}</Text>
                                    <MiniBar value={item.value} max={total} color={item.color} />
                                    <Text style={styles.distValue}>{item.value}</Text>
                                    <Text style={styles.distPct}>{total ? Math.round((item.value / total) * 100) : 0}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Call Status Distribution */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionBar} />
                            <Text style={styles.sectionTitle}>Call Status Distribution</Text>
                        </View>
                        <View style={[styles.card, { gap: 12 }]}>
                            {[
                                { label: 'Connected', value: connected, color: '#22c55e' },
                                { label: 'Missed', value: missed, color: '#ef4444' },
                                { label: 'Rejected', value: rejected, color: '#f59e0b' },
                            ].map(item => (
                                <View key={item.label} style={styles.distRow}>
                                    <View style={[styles.distDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.distLabel}>{item.label}</Text>
                                    <MiniBar value={item.value} max={total} color={item.color} />
                                    <Text style={styles.distValue}>{item.value}</Text>
                                    <Text style={styles.distPct}>{total ? Math.round((item.value / total) * 100) : 0}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Daily Trend */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionBar} />
                            <Text style={styles.sectionTitle}>Daily Trend</Text>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.legendRow}>
                                {[['Connected', '#22c55e'], ['Missed', '#ef4444'], ['Rejected', '#f59e0b']].map(([l, c]) => (
                                    <View key={l} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: c }]} />
                                        <Text style={styles.legendText}>{l}</Text>
                                    </View>
                                ))}
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.barChart}>
                                    {chartBuckets.map((b, i) => {
                                        const barH = 100;
                                        const connH = Math.round((b.connected / maxBucket) * barH);
                                        const missH = Math.round((b.missed / maxBucket) * barH);
                                        const rejH = Math.round((b.rejected / maxBucket) * barH);
                                        const label = period === 'today' ? 'Today' :
                                            period === 'week' ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(b.date).getDay()] :
                                                b.date.slice(5);
                                        return (
                                            <View key={i} style={styles.barCol}>
                                                <Text style={styles.barTopVal}>{b.total || ''}</Text>
                                                <View style={{ height: barH, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                                                    {connH > 0 && <View style={{ width: 8, height: connH, backgroundColor: '#22c55e', borderRadius: 3 }} />}
                                                    {missH > 0 && <View style={{ width: 8, height: missH, backgroundColor: '#ef4444', borderRadius: 3 }} />}
                                                    {rejH > 0 && <View style={{ width: 8, height: rejH, backgroundColor: '#f59e0b', borderRadius: 3 }} />}
                                                    {b.total === 0 && <View style={{ width: 8, height: 4, backgroundColor: '#e2e8f0', borderRadius: 3 }} />}
                                                </View>
                                                <Text style={styles.barXLabel}>{label}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* Disposition Breakdown */}
                    {dispEntries.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionBar} />
                                <Text style={styles.sectionTitle}>Disposition Breakdown</Text>
                            </View>
                            <View style={[styles.card, { gap: 12 }]}>
                                {dispEntries.map(([label, count], i) => {
                                    const cols = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];
                                    const color = cols[i % cols.length];
                                    return (
                                        <View key={label} style={styles.distRow}>
                                            <View style={[styles.distDot, { backgroundColor: color }]} />
                                            <Text style={styles.distLabel}>{label}</Text>
                                            <MiniBar value={count} max={total} color={color} />
                                            <Text style={styles.distValue}>{count}</Text>
                                            <Text style={styles.distPct}>{Math.round((count / total) * 100)}%</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const barStyles = StyleSheet.create({
    bg: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 6 },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    loadingText: { color: '#64748b', marginTop: 12, fontSize: 14, fontWeight: '500' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24,
        backgroundColor: '#0f172a', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    title: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
    headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f120', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6366f140' },
    headerIconText: { fontSize: 24 },

    card: { backgroundColor: '#ffffff', marginHorizontal: 16, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    cardLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },

    periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    periodIcon: { fontSize: 14 },
    periodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    periodBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    periodBtnTextActive: { color: '#ffffff' },

    // ── Export Buttons ──────────────────────────────────────
    exportRow: {
        flexDirection: 'row', gap: 12,
        marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    },
    exportBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 14, gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    },
    exportBtnRed: { backgroundColor: '#ef4444' },
    exportBtnBlue: { backgroundColor: '#2563eb' },
    exportBtnIcon: { fontSize: 16 },
    exportBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
    btnDisabled: { opacity: 0.6 },

    errorBox: { backgroundColor: '#fef2f2', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
    retryBtn: { marginLeft: 12 },
    retryText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },

    emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: '#1e293b', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 4 },
    emptySubText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },

    section: { marginTop: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
    sectionBar: { width: 4, height: 18, backgroundColor: '#6366f1', borderRadius: 2, marginRight: 10 },
    sectionTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700' },

    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
    summaryCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, width: (width - 44) / 2, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    summaryIcon: { fontSize: 20, marginBottom: 8 },
    summaryValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
    summaryLabel: { color: '#64748b', fontSize: 12, fontWeight: '500' },

    distRow: { flexDirection: 'row', alignItems: 'center' },
    distDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    distLabel: { color: '#1e293b', fontSize: 13, fontWeight: '600', width: 80 },
    distValue: { color: '#64748b', fontSize: 13, width: 36, textAlign: 'right', fontWeight: '500' },
    distPct: { color: '#94a3b8', fontSize: 12, width: 38, textAlign: 'right' },

    legendRow: { flexDirection: 'row', gap: 16, marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 9, height: 9, borderRadius: 5 },
    legendText: { color: '#64748b', fontSize: 12, fontWeight: '500' },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 4, paddingHorizontal: 4 },
    barCol: { alignItems: 'center', minWidth: 36 },
    barTopVal: { color: '#64748b', fontSize: 10, fontWeight: '600', marginBottom: 4, minHeight: 14 },
    barXLabel: { color: '#94a3b8', fontSize: 10, marginTop: 6, fontWeight: '500' },
});