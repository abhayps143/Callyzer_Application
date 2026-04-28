import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    Modal, ScrollView, Alert, Platform, StatusBar,
    Share, Dimensions,
} from 'react-native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

// ── Design System ─────────────────────────────────────
const DS = {
    // Spacing scale (4-pt grid)
    sp: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
    // Border radius
    r: { sm: 8, md: 12, lg: 16, xl: 20, pill: 100 },
    // Typography
    fs: { xs: 10, sm: 12, md: 14, base: 15, lg: 17, xl: 20, xxl: 24 },
    // Safe header height (accounts for status bar on most devices)
    headerTop: Platform.OS === 'ios' ? 52 : 16,
};

// ── Color Palette ─────────────────────────────────────
const C = {
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F2F7',
    primary: '#4F6EF7',
    primarySoft: '#EEF1FE',
    primaryDark: '#3B56D4',
    text: '#0F1729',
    textSub: '#6B7A99',
    textMuted: '#A9B4CC',
    border: '#E8ECF4',
    divider: '#F0F2F7',
    green: '#17C964',
    greenSoft: '#E8FBF0',
    greenDark: '#0F9A4A',
    red: '#F31260',
    redSoft: '#FEE7EF',
    amber: '#F5A524',
    amberSoft: '#FFF4E0',
    blue: '#006FEE',
    blueSoft: '#E6F1FE',
    purple: '#7828C8',
    purpleSoft: '#F0E6FF',
};

// ── Elevation (thin, consistent) ──────────────────────
const elev1 = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
};
const elevModal = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
};

// ── Helpers ───────────────────────────────────────────
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
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getPresetDates = (preset) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const sub = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x; };
    switch (preset) {
        case 'today': return { from: fmt(today), to: fmt(today) };
        case 'yesterday': return { from: fmt(sub(today, 1)), to: fmt(sub(today, 1)) };
        case 'last7': return { from: fmt(sub(today, 6)), to: fmt(today) };
        case 'last30': return { from: fmt(sub(today, 29)), to: fmt(today) };
        default: return { from: '', to: '' };
    }
};

// ── Micro Components ──────────────────────────────────

const TypeBadge = ({ type }) => {
    const isIn = type === 'Incoming';
    return (
        <View style={[cmp.pill, { backgroundColor: isIn ? C.blueSoft : C.purpleSoft }]}>
            <Text style={[cmp.pillText, { color: isIn ? C.blue : C.purple }]}>
                {isIn ? '↙ In' : '↗ Out'}
            </Text>
        </View>
    );
};

const StatusBadge = ({ status }) => {
    const cfg = {
        Connected: { bg: C.greenSoft, color: C.green },
        Missed: { bg: C.redSoft, color: C.red },
        Rejected: { bg: C.amberSoft, color: C.amber },
    };
    const c = cfg[status] || cfg.Missed;
    return (
        <View style={[cmp.pill, { backgroundColor: c.bg }]}>
            <View style={[cmp.statusDot, { backgroundColor: c.color }]} />
            <Text style={[cmp.pillText, { color: c.color }]}>{status}</Text>
        </View>
    );
};

const DispositionBadge = ({ disposition }) => {
    if (!disposition) return null;
    const map = {
        'Interested': { bg: C.greenSoft, color: C.green },
        'Not Interested': { bg: C.redSoft, color: C.red },
        'Sale Done': { bg: C.purpleSoft, color: C.purple },
        'Callback': { bg: C.amberSoft, color: C.amber },
        'Wrong Number': { bg: C.surfaceAlt, color: C.textSub },
        'Follow-up': { bg: C.blueSoft, color: C.blue },
    };
    const c = map[disposition] || { bg: C.surfaceAlt, color: C.textSub };
    return (
        <View style={[cmp.pill, { backgroundColor: c.bg }]}>
            <Text style={[cmp.pillText, { color: c.color }]}>{disposition}</Text>
        </View>
    );
};

const AV_COLORS = ['#4A68F0', '#7322C0', '#16BE62', '#F0204E', '#F0991A', '#0AAECC'];
const Avatar = ({ name, index }) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const bg = AV_COLORS[index % AV_COLORS.length];
    return (
        <View style={[cmp.avatar, { backgroundColor: bg }]}>
            <Text style={cmp.avatarText}>{initials}</Text>
        </View>
    );
};

// Compact inline stat – no card borders, just a clean strip
const StatChip = ({ label, value, color }) => (
    <View style={cmp.statChip}>
        <Text style={[cmp.statValue, { color }]}>{value ?? 0}</Text>
        <Text style={cmp.statLabel}>{label}</Text>
    </View>
);

// Filter pill – compact, pill-shaped, no heavy border
const FilterPill = ({ label, active, onPress }) => (
    <TouchableOpacity
        style={[cmp.filterPill, active && cmp.filterPillActive]}
        onPress={onPress}
        activeOpacity={0.75}
    >
        <Text style={[cmp.filterPillText, active && cmp.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
);

// ── Picker Row (modal) ────────────────────────────────
const PickerRow = ({ options, value, onChange, scrollable = false }) => {
    const content = options.map(opt => (
        <TouchableOpacity
            key={opt.value ?? opt}
            style={[mSt.pickerOpt, (value === (opt.value ?? opt)) && mSt.pickerOptActive]}
            onPress={() => onChange(opt.value ?? opt)}
        >
            <Text style={[mSt.pickerOptText, (value === (opt.value ?? opt)) && mSt.pickerOptTextActive]}>
                {opt.label ?? opt}
            </Text>
        </TouchableOpacity>
    ));
    if (scrollable) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: DS.sp.sm }}>{content}</View>
            </ScrollView>
        );
    }
    return <View style={mSt.pickerRow}>{content}</View>;
};

// ── Add / Edit Call Modal ─────────────────────────────
const CallModal = ({ visible, onClose, onDone, log }) => {
    const isEdit = !!log;
    const defaultForm = {
        customerName: '', customerNumber: '',
        callType: 'Outgoing', callStatus: 'Connected',
        durationSeconds: '',
        calledAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        notes: '', disposition: '', followUpDate: '', followUpNotes: '',
    };
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!visible) return;
        if (log) {
            const toLocal = (d) => {
                if (!d) return '';
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 16).replace('T', ' ');
            };
            setForm({
                customerName: log.customerName || '',
                customerNumber: log.customerNumber || '',
                callType: log.callType || 'Outgoing',
                callStatus: log.callStatus || 'Connected',
                durationSeconds: log.durationSeconds?.toString() || '',
                calledAt: toLocal(log.calledAt),
                notes: log.notes || '',
                disposition: log.disposition || '',
                followUpDate: log.followUpDate ? new Date(log.followUpDate).toISOString().split('T')[0] : '',
                followUpNotes: log.followUpNotes || '',
            });
        } else {
            setForm(defaultForm);
        }
        setError('');
    }, [visible, log]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.customerNumber.trim()) { setError('Phone number is required'); return; }
        setSaving(true); setError('');
        try {
            let calledAtISO = new Date().toISOString();
            if (form.calledAt) {
                const p = new Date(form.calledAt.replace(' ', 'T'));
                if (!isNaN(p.getTime())) calledAtISO = p.toISOString();
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
            if (isEdit) res = await api.updateCallLog(log._id, callData);
            else res = await api.createCallLog(callData);
            if (res?._id || res?.message === 'Call log created' || res?.success !== false) {
                onDone(isEdit ? 'Call log updated successfully!' : 'Call log added successfully!');
            } else {
                setError(res?.message || 'Failed to save call');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const callTypeOpts = ['Outgoing', 'Incoming'];
    const callStatusOpts = ['Connected', 'Missed', 'Rejected'];
    const dispositionOpts = [
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
            <View style={mSt.overlay}>
                <View style={mSt.sheet}>
                    <View style={mSt.drag} />
                    <View style={mSt.header}>
                        <Text style={mSt.title}>{isEdit ? '✏️ Edit Call Log' : '📞 New Call Log'}</Text>
                        <TouchableOpacity onPress={onClose} style={mSt.closeBtn}>
                            <Text style={mSt.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={mSt.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {!!error && (
                            <View style={mSt.errorBox}>
                                <Text style={mSt.errorText}>⚠️  {error}</Text>
                            </View>
                        )}
                        <View style={mSt.row}>
                            <View style={[mSt.field, { flex: 1 }]}>
                                <Text style={mSt.label}>Customer Name</Text>
                                <TextInput style={mSt.input} value={form.customerName} onChangeText={v => set('customerName', v)} placeholder="Rahul Sharma" placeholderTextColor={C.textMuted} />
                            </View>
                            <View style={{ width: DS.sp.md }} />
                            <View style={[mSt.field, { flex: 1 }]}>
                                <Text style={mSt.label}>Phone <Text style={mSt.req}>*</Text></Text>
                                <TextInput style={mSt.input} value={form.customerNumber} onChangeText={v => set('customerNumber', v)} placeholder="+91 98765 43210" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
                            </View>
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Call Type</Text>
                            <PickerRow options={callTypeOpts} value={form.callType} onChange={v => set('callType', v)} />
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Call Status</Text>
                            <PickerRow options={callStatusOpts} value={form.callStatus} onChange={v => set('callStatus', v)} />
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Disposition</Text>
                            <PickerRow options={dispositionOpts} value={form.disposition} onChange={v => set('disposition', v)} scrollable />
                        </View>

                        <View style={mSt.row}>
                            <View style={[mSt.field, { flex: 1 }]}>
                                <Text style={mSt.label}>Duration (sec)</Text>
                                <TextInput style={mSt.input} value={form.durationSeconds} onChangeText={v => set('durationSeconds', v)} placeholder="120" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                            </View>
                            <View style={{ width: DS.sp.md }} />
                            <View style={[mSt.field, { flex: 1 }]}>
                                <Text style={mSt.label}>Date & Time</Text>
                                <TextInput style={mSt.input} value={form.calledAt} onChangeText={v => set('calledAt', v)} placeholder="2026-04-18 10:30" placeholderTextColor={C.textMuted} />
                            </View>
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Follow-up Date</Text>
                            <TextInput style={mSt.input} value={form.followUpDate} onChangeText={v => set('followUpDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Follow-up Notes</Text>
                            <TextInput style={[mSt.input, mSt.textarea]} value={form.followUpNotes} onChangeText={v => set('followUpNotes', v)} placeholder="Follow-up notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
                        </View>

                        <View style={mSt.field}>
                            <Text style={mSt.label}>Notes</Text>
                            <TextInput style={[mSt.input, mSt.textarea]} value={form.notes} onChangeText={v => set('notes', v)} placeholder="Optional notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
                        </View>
                        <View style={{ height: DS.sp.xl }} />
                    </ScrollView>

                    <View style={mSt.footer}>
                        <TouchableOpacity style={mSt.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                            <Text style={mSt.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[mSt.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.88}>
                            <Text style={mSt.saveText}>{saving ? 'Saving…' : isEdit ? 'Update Call' : 'Add Call'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── Delete Confirm Modal ──────────────────────────────
const DeleteConfirmModal = ({ visible, onClose, onConfirm, log }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.deleteCallLog(log._id);
            onConfirm();
        } catch {
            Alert.alert('Error', 'Failed to delete');
            onClose();
        }
        setDeleting(false);
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={mSt.overlay}>
                <View style={mSt.confirmSheet}>
                    <Text style={mSt.confirmIcon}>🗑️</Text>
                    <Text style={mSt.confirmTitle}>Delete Call Log?</Text>
                    <Text style={mSt.confirmBody}>
                        {log?.customerName || 'This record'} • {log?.customerNumber || ''}
                        {'\n'}This action cannot be undone.
                    </Text>
                    <View style={mSt.confirmBtns}>
                        <TouchableOpacity style={mSt.cancelBtn} onPress={onClose}>
                            <Text style={mSt.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={mSt.deleteBtn} onPress={handleDelete} disabled={deleting}>
                            <Text style={mSt.deleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── Bulk Import Modal ─────────────────────────────────
const BulkImportModal = ({ visible, onClose, onDone }) => {
    const [csv, setCsv] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(0);
    const [sampleData, setSampleData] = useState([]);

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    };

    const normalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const isHeaderRow = (row) => {
        const lower = row.toLowerCase();
        return lower.includes('name') && lower.includes('phone');
    };

    useEffect(() => {
        if (!csv.trim()) { setPreview(0); setSampleData([]); return; }
        const lines = csv.trim().split('\n').filter(l => l.trim());
        if (lines.length === 0) { setPreview(0); return; }
        let dataLines = lines;
        if (isHeaderRow(lines[0])) dataLines = lines.slice(1);
        const validRows = [];
        dataLines.forEach((line) => {
            const cols = parseCSVLine(line);
            if (cols.length >= 2 && cols[1] && cols[1].replace(/\D/g, '').length >= 7) {
                validRows.push({ name: cols[0] || 'Unknown', phone: cols[1] || '', type: normalize(cols[2] || 'Outgoing'), status: normalize(cols[3] || 'Connected') });
            }
        });
        setPreview(validRows.length);
        setSampleData(validRows.slice(0, 3));
    }, [csv]);

    const handleImport = async () => {
        if (!csv.trim()) { setError('Please paste CSV data first.'); return; }
        setImporting(true); setError('');
        try {
            const lines = csv.trim().split('\n').filter(l => l.trim());
            let dataLines = lines;
            if (isHeaderRow(lines[0])) dataLines = lines.slice(1);
            const calls = []; const errors = [];
            dataLines.forEach((line, idx) => {
                const cols = parseCSVLine(line);
                const phone = cols[1]?.replace(/\s/g, '') || '';
                if (!phone || phone.replace(/\D/g, '').length < 7) {
                    errors.push(`Row ${idx + 1}: Invalid phone number "${cols[1] || ''}"`);
                    return;
                }
                let calledAt = new Date().toISOString();
                if (cols[5] && cols[5].trim()) {
                    const dateStr = cols[5].trim();
                    let parsedDate = new Date(dateStr);
                    if (isNaN(parsedDate.getTime())) parsedDate = new Date(dateStr + 'T00:00:00');
                    if (!isNaN(parsedDate.getTime())) calledAt = parsedDate.toISOString();
                }
                let callType = normalize(cols[2] || 'Outgoing');
                if (callType !== 'Incoming') callType = 'Outgoing';
                let callStatus = normalize(cols[3] || 'Connected');
                if (!['Connected', 'Missed', 'Rejected'].includes(callStatus)) callStatus = 'Connected';
                let disposition = normalize(cols[7] || '');
                const validDispositions = ['Interested', 'Not Interested', 'Sale Done', 'Callback', 'Wrong Number', 'Follow-up'];
                if (disposition && !validDispositions.includes(disposition)) disposition = '';
                calls.push({
                    customerName: cols[0]?.trim() || 'Unknown',
                    customerNumber: phone, callType, callStatus,
                    durationSeconds: parseInt(cols[4]) || 0, calledAt,
                    notes: cols[6]?.trim() || '', disposition,
                });
            });
            if (errors.length > 0) { setError(errors.slice(0, 3).join('\n')); setImporting(false); return; }
            if (calls.length === 0) { setError('No valid rows found. Check your CSV format.'); setImporting(false); return; }
            await api.bulkCreateCallLogs(calls);
            setCsv('');
            onDone(`${calls.length} call(s) imported successfully!`);
        } catch {
            setError('Import failed. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => { setCsv(''); setError(''); setPreview(0); setSampleData([]); onClose(); };

    const exampleCSV = `Nishit,9558630639,Incoming,Connected,120,2026-04-21,nice,Interested\nRahul,9876543210,Outgoing,Missed,45,2026-04-20,no answer,\nShani,9601930581,Incoming,Connected,60,2026-04-21,interested,Sale Done`;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={mSt.overlay}>
                <View style={[mSt.sheet, { maxHeight: '90%' }]}>
                    <View style={mSt.drag} />
                    <View style={mSt.header}>
                        <Text style={mSt.title}>📥 Bulk Import Calls</Text>
                        <TouchableOpacity onPress={handleClose} style={mSt.closeBtn}>
                            <Text style={mSt.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={mSt.body} showsVerticalScrollIndicator={false}>
                        <View style={mSt.importHint}>
                            <Text style={mSt.importHintTitle}>📋 CSV Format (No Header Row)</Text>
                            <Text style={mSt.importHintText}>Name, Phone, Type, Status, Duration(sec), Date, Notes, Disposition</Text>
                            <View style={mSt.exampleBox}>
                                <Text style={mSt.exampleTitle}>✅ Example:</Text>
                                <Text style={mSt.exampleText}>Nishit,9558630639,Incoming,Connected,120,2026-04-21,nice,Interested</Text>
                            </View>
                            <View style={mSt.exampleBox}>
                                <Text style={mSt.exampleTitle}>📝 Rules:</Text>
                                <Text style={mSt.exampleText}>
                                    {'• Phone: 10 digits required\n• Type: Incoming / Outgoing\n• Status: Connected / Missed / Rejected\n• Date: YYYY-MM-DD format\n• Disposition: Interested, Not Interested, Sale Done, Callback, Wrong Number, Follow-up'}
                                </Text>
                            </View>
                        </View>
                        {!!error && <View style={mSt.errorBox}><Text style={mSt.errorText}>⚠️  {error}</Text></View>}
                        {preview > 0 && !error && (
                            <View style={mSt.previewBadge}>
                                <Text style={mSt.previewText}>✅ {preview} valid row{preview > 1 ? 's' : ''} ready to import</Text>
                            </View>
                        )}
                        {sampleData.length > 0 && (
                            <View style={mSt.previewBox}>
                                <Text style={mSt.previewBoxTitle}>🔍 Preview (first {sampleData.length})</Text>
                                {sampleData.map((row, idx) => (
                                    <View key={idx} style={mSt.previewRow}>
                                        <Text style={mSt.previewName}>{row.name}</Text>
                                        <Text style={mSt.previewPhone}>{row.phone}</Text>
                                        <Text style={mSt.previewType}>{row.type}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        <Text style={mSt.inputLabel}>Paste CSV Data Below:</Text>
                        <TextInput
                            style={mSt.csvInput}
                            value={csv}
                            onChangeText={(t) => { setCsv(t); setError(''); }}
                            placeholder={exampleCSV}
                            placeholderTextColor={C.textMuted}
                            multiline textAlignVertical="top"
                            autoCorrect={false} autoCapitalize="none"
                        />
                        <View style={{ height: DS.sp.md }} />
                    </ScrollView>
                    <View style={mSt.footer}>
                        <TouchableOpacity style={mSt.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                            <Text style={mSt.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[mSt.saveBtn, (importing || preview === 0) && { opacity: 0.6 }]}
                            onPress={handleImport}
                            disabled={importing || preview === 0}
                            activeOpacity={0.88}
                        >
                            <Text style={mSt.saveText}>
                                {importing ? 'Importing…' : preview > 0 ? `Import ${preview} row${preview > 1 ? 's' : ''}` : 'Import'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── Main Screen ───────────────────────────────────────
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
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activePreset, setActivePreset] = useState('');
    const [page, setPage] = useState(1);

    const [sortField, setSortField] = useState('calledAt');
    const [sortDir, setSortDir] = useState('desc');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editLog, setEditLog] = useState(null);
    const [deleteLog, setDeleteLog] = useState(null);

    const [userRole, setUserRole] = useState('agent');
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [isLoadingRole, setIsLoadingRole] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setUserRole(user?.role || 'agent');
                }
            } catch (e) { console.log('Error getting user role:', e); }
            finally { setIsLoadingRole(false); }
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (userRole === 'admin' || userRole === 'super_admin') {
                    const res = await fetch(`${API_BASE_URL}/admin/users?role=agent&limit=100`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setAgents(data.users || []);
                } else if (userRole === 'manager') {
                    const res = await fetch(`${API_BASE_URL}/manager/team?limit=100`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setAgents(data.members || []);
                }
            } catch (err) { console.log('Failed to fetch agents:', err); }
        };
        if (userRole && !isLoadingRole) fetchAgents();
    }, [userRole, isLoadingRole]);

    const canAddCalls = ['agent', 'team_leader', 'admin', 'super_admin', 'employee', 'salesperson'].includes(userRole);
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const canDelete = userRole === 'super_admin';
    const isManager = userRole === 'manager';
    const canViewAll = isAdmin || isManager;

    const applyPreset = (preset) => {
        const { from, to } = getPresetDates(preset);
        setDateFrom(from); setDateTo(to); setActivePreset(preset); setPage(1);
    };

    const resetFilters = () => {
        setSearch(''); setTypeFilter('All'); setStatusFilter('All');
        setDateFrom(''); setDateTo(''); setActivePreset(''); setSelectedAgent(''); setPage(1);
    };

    const hasFilters = search || typeFilter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo || selectedAgent;

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
        setPage(1);
    };

    const fetchCalls = useCallback(async (reset = false) => {
        if (reset) { setLoading(true); setError(null); }
        try {
            const currentPage = reset ? 1 : page;
            const params = { page: currentPage, limit: 20, sortField, sortDir };
            if (search && search.trim()) params.search = search.trim();
            if (typeFilter && typeFilter !== 'All') params.callType = typeFilter;
            if (statusFilter && statusFilter !== 'All') params.callStatus = statusFilter;
            if (dateFrom && dateFrom.trim()) params.dateFrom = dateFrom;
            if (dateTo && dateTo.trim()) params.dateTo = dateTo;
            if (selectedAgent && selectedAgent.trim()) params.agentId = selectedAgent;
            const response = await api.getCallLogs(params);
            let logsData = [];
            let paginationData = { total: 0, pages: 1, page: currentPage, limit: 20 };
            if (response && response.success === false) {
                setError(response.message); logsData = [];
            } else if (response && response.logs && Array.isArray(response.logs)) {
                logsData = response.logs; paginationData = response.pagination || paginationData;
            } else if (response && response.data && Array.isArray(response.data)) {
                logsData = response.data; paginationData = response.pagination || response.meta || paginationData;
            } else if (Array.isArray(response)) {
                logsData = response; paginationData.total = response.length; paginationData.pages = Math.ceil(response.length / 20);
            }
            if (reset || currentPage === 1) setLogs(logsData);
            else setLogs(prev => [...prev, ...logsData]);
            setPagination(paginationData);
            try {
                const statsParams = {};
                if (search && search.trim()) statsParams.search = search.trim();
                if (typeFilter && typeFilter !== 'All') statsParams.callType = typeFilter;
                if (statusFilter && statusFilter !== 'All') statsParams.callStatus = statusFilter;
                if (dateFrom && dateFrom.trim()) statsParams.dateFrom = dateFrom;
                if (dateTo && dateTo.trim()) statsParams.dateTo = dateTo;
                if (selectedAgent && selectedAgent.trim()) statsParams.agentId = selectedAgent;
                const statsRes = await api.getCallStats(statsParams);
                if (statsRes && statsRes.success !== false) setStats(statsRes);
            } catch (e) { console.log('Stats error:', e); }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setLoading(false); setRefreshing(false); setLoadingMore(false);
        }
    }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);

    useEffect(() => { setPage(1); fetchCalls(true); }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);
    useEffect(() => { if (page > 1) fetchCalls(false); }, [page]);

    const onRefresh = () => { setRefreshing(true); setPage(1); fetchCalls(true); };
    const loadMore = () => {
        if (page < pagination.pages && !loadingMore && !loading) {
            setLoadingMore(true); setPage(p => p + 1);
        }
    };

    const onDone = (msg) => {
        setShowAddModal(false); setShowImportModal(false);
        setEditLog(null); setDeleteLog(null);
        Alert.alert('✅ Success', msg || 'Done!');
        onRefresh();
    };

    const downloadCSV = async () => {
        if (!logs?.length) { Alert.alert('No Data', 'No call logs to export'); return; }
        const headers = ['#', 'Agent', 'Customer', 'Phone', 'Type', 'Status', 'Duration', 'Date & Time', 'Disposition', 'Follow-up', 'Notes'];
        const rows = logs.map((log, idx) => [
            idx + 1, log.agent?.name || '—', log.customerName || '—', log.customerNumber || '—',
            log.callType || '—', log.callStatus || '—',
            log.durationSeconds ? `${Math.floor(log.durationSeconds / 60)}m ${log.durationSeconds % 60}s` : '0s',
            log.calledAt ? new Date(log.calledAt).toLocaleString('en-IN') : '—',
            log.disposition || '—',
            log.followUpDate ? new Date(log.followUpDate).toLocaleDateString('en-IN') : '—',
            (log.notes || '').replace(/,/g, ';'),
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        try { await Share.share({ title: 'Call Logs Export', message: csv }); }
        catch { Alert.alert('Error', 'Failed to share CSV'); }
    };

    // ── Call Card ─────────────────────────────────────
    const renderCallItem = ({ item, index }) => (
        <View style={sc.card}>
            {/* Top row: avatar + info + actions */}
            <View style={sc.cardRow}>
                <Avatar name={item.customerName} index={index} />
                <View style={sc.cardInfo}>
                    <Text style={sc.cardName} numberOfLines={1}>{item.customerName || 'Unknown'}</Text>
                    <Text style={sc.cardNumber}>{item.customerNumber || '—'}</Text>
                    <Text style={sc.cardMeta}>{fmtDate(item.calledAt)}  ·  {fmtTime(item.calledAt)}</Text>
                </View>
                <View style={sc.cardActions}>
                    <Text style={sc.cardDuration}>{fmtDuration(item.durationSeconds)}</Text>
                    <View style={sc.actionRow}>
                        <TouchableOpacity onPress={() => setEditLog(item)} style={sc.editBtn} activeOpacity={0.8}>
                            <Text style={sc.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        {canDelete && (
                            <TouchableOpacity onPress={() => setDeleteLog(item)} style={sc.delBtn} activeOpacity={0.8}>
                                <Text style={sc.delBtnText}>Del</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            {/* Bottom row: status pills */}
            <View style={sc.cardPills}>
                <TypeBadge type={item.callType} />
                <StatusBadge status={item.callStatus} />
                {!!item.disposition && <DispositionBadge disposition={item.disposition} />}
            </View>
        </View>
    );

    const statsItems = stats ? [
        { label: 'Total', value: pagination.total, color: C.primary },
        { label: 'Incoming', value: stats.incoming ?? stats.incomingCalls ?? stats.totalIncoming ?? 0, color: C.blue },
        { label: 'Outgoing', value: stats.outgoing ?? stats.outgoingCalls ?? stats.totalOutgoing ?? 0, color: C.purple },
        { label: 'Connected', value: stats.connected ?? stats.connectedCalls ?? stats.totalConnected ?? 0, color: C.green },
        { label: 'Missed', value: stats.missed ?? stats.missedCalls ?? stats.totalMissed ?? 0, color: C.red },
        { label: 'Today', value: stats.todayCalls ?? stats.today ?? stats.todayTotal ?? 0, color: C.amber },
    ] : [];

    if (isLoadingRole) return (
        <View style={sc.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    return (
        <View style={sc.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

            {/* ── Header ── */}
            <View style={sc.header}>
                <View>
                    <Text style={sc.headerTitle}>Call Logs</Text>
                    <Text style={sc.headerSub}>{pagination.total.toLocaleString()} records</Text>
                </View>
                <View style={sc.headerRight}>
                    <TouchableOpacity style={sc.iconBtn} onPress={onRefresh} activeOpacity={0.8}>
                        <Text>🔄</Text>
                    </TouchableOpacity>
                    {canViewAll && (
                        <TouchableOpacity style={sc.iconBtn} onPress={downloadCSV} activeOpacity={0.8}>
                            <Text>⬇️</Text>
                        </TouchableOpacity>
                    )}
                    {canAddCalls && (
                        <>
                            <TouchableOpacity style={sc.iconBtn} onPress={() => setShowImportModal(true)} activeOpacity={0.8}>
                                <Text>📥</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={sc.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.88}>
                                <Text style={sc.addBtnText}>+ Add</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* ── Stats strip ── */}
            {stats && (
                <View style={sc.statsStrip}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sc.statsContent}>
                        {statsItems.map(s => <StatChip key={s.label} {...s} />)}
                    </ScrollView>
                </View>
            )}

            {/* ── Search ── */}
            <View style={sc.searchWrap}>
                <View style={sc.searchBox}>
                    <Text style={sc.searchIcon}>🔍</Text>
                    <TextInput
                        style={sc.searchInput}
                        placeholder="Search name or number…"
                        placeholderTextColor={C.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={sc.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Filter bar ── */}
            <View style={sc.filterBar}>

                {/* Type — Line 1 */}
                <View style={sc.filterRow}>
                    <Text style={sc.filterGroupLabel}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={sc.filterPills}>
                            {['All', 'Incoming', 'Outgoing'].map(t => (
                                <FilterPill key={t} label={t} active={typeFilter === t} onPress={() => { setTypeFilter(t); setPage(1); }} />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={sc.filterLineDivider} />

                {/* Status — Line 2 */}
                <View style={sc.filterRow}>
                    <Text style={sc.filterGroupLabel}>Status</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={sc.filterPills}>
                            {['All', 'Connected', 'Missed', 'Rejected'].map(s => (
                                <FilterPill key={s} label={s} active={statusFilter === s} onPress={() => { setStatusFilter(s); setPage(1); }} />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={sc.filterLineDivider} />

                {/* Range — Line 3 */}
                <View style={sc.filterRow}>
                    <Text style={sc.filterGroupLabel}>Range</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={sc.filterPills}>
                            {[
                                { key: 'today', label: 'Today' },
                                { key: 'yesterday', label: 'Yesterday' },
                                { key: 'last7', label: '7d' },
                                { key: 'last30', label: '30d' },
                            ].map(p => (
                                <FilterPill key={p.key} label={p.label} active={activePreset === p.key} onPress={() => applyPreset(p.key)} />
                            ))}
                        </View>
                    </ScrollView>
                    {hasFilters && (
                        <TouchableOpacity onPress={resetFilters} style={sc.clearFilters} activeOpacity={0.8}>
                            <Text style={sc.clearFiltersText}>✕ Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Agent — Line 4 (only for admin/manager) */}
                {(isAdmin || isManager) && agents.length > 0 && (
                    <>
                        <View style={sc.filterLineDivider} />
                        <View style={sc.filterRow}>
                            <Text style={sc.filterGroupLabel}>Agent</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={sc.filterPills}>
                                    <FilterPill label="All" active={!selectedAgent} onPress={() => { setSelectedAgent(''); setPage(1); }} />
                                    {agents.map(a => (
                                        <FilterPill key={a._id} label={a.name} active={selectedAgent === a._id} onPress={() => { setSelectedAgent(a._id); setPage(1); }} />
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </>
                )}

                {/* Date inputs — Last line */}
                <View style={sc.filterLineDivider} />
                <View style={sc.dateRow}>
                    <TextInput
                        style={sc.dateInput}
                        placeholder="From YYYY-MM-DD"
                        value={dateFrom}
                        onChangeText={setDateFrom}
                        placeholderTextColor={C.textMuted}
                    />
                    <Text style={sc.dateArrow}>→</Text>
                    <TextInput
                        style={sc.dateInput}
                        placeholder="To YYYY-MM-DD"
                        value={dateTo}
                        onChangeText={setDateTo}
                        placeholderTextColor={C.textMuted}
                    />
                </View>

            </View>

            {/* ── List ── */}
            {loading && !refreshing ? (
                <View style={sc.center}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={sc.loadingText}>Loading call logs…</Text>
                </View>
            ) : error && logs.length === 0 ? (
                <View style={sc.center}>
                    <Text style={sc.stateEmoji}>⚠️</Text>
                    <Text style={sc.stateTitle}>Failed to load</Text>
                    <Text style={sc.stateBody}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchCalls(true)} style={sc.retryBtn} activeOpacity={0.8}>
                        <Text style={sc.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    renderItem={renderCallItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={sc.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: DS.sp.xl }} color={C.primary} /> : null}
                    ListEmptyComponent={
                        !loading && (
                            <View style={sc.emptyState}>
                                <Text style={sc.stateEmoji}>📞</Text>
                                <Text style={sc.stateTitle}>No call logs found</Text>
                                {hasFilters && (
                                    <TouchableOpacity onPress={resetFilters} style={sc.retryBtn}>
                                        <Text style={sc.retryText}>Clear filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )
                    }
                />
            )}

            {/* ── Pagination ── */}
            {pagination.pages > 1 && !loading && (
                <View style={sc.pagination}>
                    <TouchableOpacity
                        style={[sc.pageBtn, page === 1 && sc.pageBtnOff]}
                        onPress={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <Text style={[sc.pageBtnText, page === 1 && sc.pageBtnTextOff]}>← Prev</Text>
                    </TouchableOpacity>
                    <Text style={sc.pageInfo}>Page {page} of {pagination.pages}</Text>
                    <TouchableOpacity
                        style={[sc.pageBtn, page === pagination.pages && sc.pageBtnOff]}
                        onPress={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                    >
                        <Text style={[sc.pageBtnText, page === pagination.pages && sc.pageBtnTextOff]}>Next →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Modals ── */}
            <CallModal visible={showAddModal} onClose={() => setShowAddModal(false)} onDone={onDone} />
            <CallModal visible={!!editLog} onClose={() => setEditLog(null)} onDone={onDone} log={editLog} />
            <DeleteConfirmModal visible={!!deleteLog} onClose={() => setDeleteLog(null)} onConfirm={() => onDone('Call log deleted')} log={deleteLog} />
            <BulkImportModal visible={showImportModal} onClose={() => setShowImportModal(false)} onDone={() => onDone('Calls imported!')} />
        </View>
    );
}

// ═══════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════

// ── Shared micro-component styles ────────────────────
const cmp = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DS.sp.sm + 2,
        paddingVertical: 3,
        borderRadius: DS.r.pill,
        gap: 4,
    },
    pillText: { fontSize: DS.fs.xs, fontWeight: '600', letterSpacing: 0.1 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: DS.fs.sm + 1 },

    // Compact stat chip – no card, just value + label stacked
    statChip: {
        alignItems: 'center',
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.xs,
        minWidth: 56,
    },
    statValue: { fontSize: DS.fs.lg, fontWeight: '800', lineHeight: 22 },
    statLabel: { fontSize: DS.fs.xs, color: C.textMuted, marginTop: 1, fontWeight: '500' },

    // Filter pill
    filterPill: {
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.xs,
        borderRadius: DS.r.pill,
        backgroundColor: C.surfaceAlt,
    },
    filterPillActive: { backgroundColor: C.primarySoft },
    filterPillText: { fontSize: DS.fs.sm, color: C.textSub, fontWeight: '500' },
    filterPillTextActive: { color: C.primary, fontWeight: '700' },
});

// ── Screen styles ─────────────────────────────────────
const sc = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: DS.sp.sm, padding: DS.sp.xxl },
    loadingText: { fontSize: DS.fs.sm, color: C.textSub, marginTop: DS.sp.xs },

    // Header – clean, no heavy shadow
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DS.sp.lg,
        paddingTop: DS.headerTop,
        paddingBottom: DS.sp.md,
        backgroundColor: C.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    headerTitle: { fontSize: DS.fs.xl, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
    headerSub: { fontSize: DS.fs.xs, color: C.textMuted, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: DS.sp.xs },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: DS.r.sm,
        backgroundColor: C.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: C.primary,
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.xs + 2,
        borderRadius: DS.r.sm,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: DS.fs.sm },

    // Stats strip – borderless, flush to header
    statsStrip: {
        backgroundColor: C.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    statsContent: {
        paddingHorizontal: DS.sp.lg,
        paddingVertical: DS.sp.sm,
        gap: DS.sp.xs,
        // Thin separators between chips via borderRight
    },

    // Search
    searchWrap: { paddingHorizontal: DS.sp.lg, paddingTop: DS.sp.md, paddingBottom: DS.sp.xs },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: DS.r.lg,
        paddingHorizontal: DS.sp.md,
        height: 42,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        gap: DS.sp.sm,
        ...elev1,
    },
    searchIcon: { fontSize: DS.fs.base },
    searchInput: { flex: 1, fontSize: DS.fs.md, color: C.text, paddingVertical: 0 },
    clearBtn: { fontSize: DS.fs.sm, color: C.textMuted, fontWeight: '600', paddingLeft: DS.sp.xs },

    // Filter bar – single horizontal scroll, grouped
    // filterBar: {
    //     backgroundColor: C.surface,
    //     borderBottomWidth: StyleSheet.hairlineWidth,
    //     borderBottomColor: C.border,
    //     paddingBottom: DS.sp.xs,
    // },
    // filterContent: {
    //     paddingHorizontal: DS.sp.lg,
    //     paddingVertical: DS.sp.sm,
    //     alignItems: 'center',
    //     gap: DS.sp.xs,
    // },
    // filterGroup: { flexDirection: 'row', alignItems: 'center', gap: DS.sp.xs },
    // filterGroupLabel: {
    //     fontSize: DS.fs.xs,
    //     color: C.textMuted,
    //     fontWeight: '600',
    //     letterSpacing: 0.4,
    //     textTransform: 'uppercase',
    //     marginRight: 2,
    // },
    // filterPills: { flexDirection: 'row', gap: 4 },
    // filterDivider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: C.border, marginHorizontal: DS.sp.xs },
    filterBar: {
        backgroundColor: C.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DS.sp.lg,
        paddingVertical: DS.sp.sm,
        gap: DS.sp.sm,
    },
    filterGroupLabel: {
        fontSize: DS.fs.xs,
        color: C.textMuted,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        width: 44,          // fixed width so pills always align
        flexShrink: 0,
    },
    filterPills: { flexDirection: 'row', gap: 4 },
    filterLineDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: C.border,
        marginHorizontal: DS.sp.lg,
    },
    // filterDivider & filterContent ab use nahi hote, remove kar sakte ho
    clearFilters: {
        paddingHorizontal: DS.sp.sm,
        paddingVertical: DS.sp.xs,
        borderRadius: DS.r.pill,
        backgroundColor: C.redSoft,
    },
    clearFiltersText: { fontSize: DS.fs.xs, color: C.red, fontWeight: '700' },

    // Date row – compact, below scroll
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DS.sp.lg,
        paddingBottom: DS.sp.sm,
        gap: DS.sp.sm,
    },
    dateInput: {
        flex: 1,
        height: 34,
        backgroundColor: C.surfaceAlt,
        borderRadius: DS.r.sm,
        paddingHorizontal: DS.sp.sm,
        fontSize: DS.fs.xs,
        color: C.text,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
    },
    dateArrow: { color: C.textMuted, fontSize: DS.fs.md },

    // Call card
    listContent: { padding: DS.sp.lg, gap: DS.sp.sm, paddingBottom: DS.sp.xxxl },
    card: {
        backgroundColor: C.surface,
        borderRadius: DS.r.lg,
        padding: DS.sp.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        ...elev1,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DS.sp.sm,
        marginBottom: DS.sp.sm,
    },
    cardInfo: { flex: 1, minWidth: 0 },
    cardName: { fontSize: DS.fs.base, fontWeight: '700', color: C.text, flexShrink: 1 },
    cardNumber: { fontSize: DS.fs.sm, color: C.textSub, marginTop: 1 },
    cardMeta: { fontSize: DS.fs.xs, color: C.textMuted, marginTop: 2, letterSpacing: 0.1 },
    cardActions: { alignItems: 'flex-end', gap: DS.sp.xs, flexShrink: 0 },
    cardDuration: { fontSize: DS.fs.xs, color: C.textSub, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: DS.sp.xs },
    editBtn: {
        paddingHorizontal: DS.sp.sm,
        paddingVertical: 4,
        borderRadius: DS.r.sm,
        backgroundColor: C.primarySoft,
    },
    editBtnText: { color: C.primary, fontWeight: '700', fontSize: DS.fs.xs },
    delBtn: {
        paddingHorizontal: DS.sp.sm,
        paddingVertical: 4,
        borderRadius: DS.r.sm,
        backgroundColor: C.redSoft,
    },
    delBtnText: { color: C.red, fontWeight: '700', fontSize: DS.fs.xs },
    cardPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: DS.sp.xs,
        paddingTop: DS.sp.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.divider,
    },

    // States
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: DS.sp.sm },
    stateEmoji: { fontSize: 44 },
    stateTitle: { fontSize: DS.fs.lg, fontWeight: '700', color: C.text },
    stateBody: { fontSize: DS.fs.md, color: C.textSub, textAlign: 'center', lineHeight: 20 },
    retryBtn: {
        backgroundColor: C.primarySoft,
        paddingHorizontal: DS.sp.xl,
        paddingVertical: DS.sp.sm,
        borderRadius: DS.r.pill,
        marginTop: DS.sp.xs,
    },
    retryText: { color: C.primary, fontWeight: '700', fontSize: DS.fs.md },

    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DS.sp.lg,
        paddingVertical: DS.sp.sm,
        backgroundColor: C.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.border,
    },
    pageBtn: {
        paddingHorizontal: DS.sp.lg,
        paddingVertical: DS.sp.sm,
        borderRadius: DS.r.sm,
        backgroundColor: C.primarySoft,
    },
    pageBtnOff: { backgroundColor: C.surfaceAlt },
    pageBtnText: { color: C.primary, fontWeight: '700', fontSize: DS.fs.sm },
    pageBtnTextOff: { color: C.textMuted },
    pageInfo: { fontSize: DS.fs.sm, color: C.textSub, fontWeight: '600' },
});

// ── Modal styles ──────────────────────────────────────
const mSt = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(13,20,38,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: C.surface,
        borderTopLeftRadius: DS.r.xl,
        borderTopRightRadius: DS.r.xl,
        maxHeight: '92%',
        ...elevModal,
    },
    drag: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.border,
        alignSelf: 'center',
        marginTop: DS.sp.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DS.sp.xl,
        paddingVertical: DS.sp.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    title: { fontSize: DS.fs.lg, fontWeight: '800', color: C.text },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: C.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: { color: C.textSub, fontWeight: '700', fontSize: DS.fs.sm },
    body: { padding: DS.sp.xl },
    row: { flexDirection: 'row' },
    field: { marginBottom: DS.sp.md },
    label: {
        fontSize: DS.fs.xs,
        fontWeight: '700',
        color: C.textMuted,
        marginBottom: DS.sp.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    req: { color: C.red },
    input: {
        backgroundColor: C.surfaceAlt,
        borderRadius: DS.r.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.md,
        fontSize: DS.fs.md,
        color: C.text,
    },
    textarea: { minHeight: 80, textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: DS.sp.sm },
    pickerOpt: {
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.sm,
        borderRadius: DS.r.sm,
        backgroundColor: C.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
    },
    pickerOptActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
    pickerOptText: { fontSize: DS.fs.sm, color: C.textSub, fontWeight: '600' },
    pickerOptTextActive: { color: C.primary, fontWeight: '700' },
    errorBox: {
        backgroundColor: C.redSoft,
        borderRadius: DS.r.sm,
        padding: DS.sp.md,
        marginBottom: DS.sp.md,
    },
    errorText: { color: C.red, fontSize: DS.fs.sm, fontWeight: '600' },
    footer: {
        flexDirection: 'row',
        padding: DS.sp.lg,
        gap: DS.sp.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: C.border,
        paddingBottom: Platform.OS === 'ios' ? 32 : DS.sp.lg,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: DS.sp.md,
        borderRadius: DS.r.md,
        alignItems: 'center',
        backgroundColor: C.surfaceAlt,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
    },
    cancelText: { color: C.textSub, fontWeight: '700', fontSize: DS.fs.base },
    saveBtn: {
        flex: 2,
        paddingVertical: DS.sp.md,
        borderRadius: DS.r.md,
        alignItems: 'center',
        backgroundColor: C.primary,
    },
    saveText: { color: '#fff', fontWeight: '700', fontSize: DS.fs.base },

    // Confirm modal
    confirmSheet: {
        backgroundColor: C.surface,
        margin: DS.sp.xxl,
        borderRadius: DS.r.xl,
        padding: DS.sp.xxl + 4,
        alignItems: 'center',
        ...elevModal,
    },
    confirmIcon: { fontSize: 40, marginBottom: DS.sp.md },
    confirmTitle: { fontSize: DS.fs.xl, fontWeight: '800', color: C.text, marginBottom: DS.sp.sm },
    confirmBody: { fontSize: DS.fs.md, color: C.textSub, textAlign: 'center', lineHeight: 22, marginBottom: DS.sp.xxl },
    confirmBtns: { flexDirection: 'row', gap: DS.sp.md, width: '100%' },
    deleteBtn: { flex: 1, paddingVertical: DS.sp.md, borderRadius: DS.r.md, alignItems: 'center', backgroundColor: C.red },
    deleteText: { color: '#fff', fontWeight: '700', fontSize: DS.fs.base },

    // Import modal
    importHint: {
        backgroundColor: C.primarySoft,
        borderRadius: DS.r.md,
        padding: DS.sp.md,
        marginBottom: DS.sp.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#C7D2FE',
        gap: DS.sp.xs,
    },
    importHintTitle: { color: C.primary, fontSize: DS.fs.sm, fontWeight: '800', marginBottom: DS.sp.xs },
    importHintText: { color: C.primary, fontSize: DS.fs.xs, fontWeight: '500' },
    exampleBox: {
        backgroundColor: C.surface,
        borderRadius: DS.r.sm,
        padding: DS.sp.sm,
        marginTop: DS.sp.xs,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
    },
    exampleTitle: { fontSize: DS.fs.xs, fontWeight: '700', color: C.text, marginBottom: DS.sp.xs },
    exampleText: {
        fontSize: DS.fs.xs,
        color: C.textSub,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 16,
    },
    previewBadge: {
        backgroundColor: C.greenSoft,
        borderRadius: DS.r.sm,
        paddingHorizontal: DS.sp.md,
        paddingVertical: DS.sp.sm,
        marginBottom: DS.sp.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.green,
    },
    previewText: { color: C.greenDark, fontSize: DS.fs.sm, fontWeight: '700' },
    previewBox: {
        backgroundColor: C.surfaceAlt,
        borderRadius: DS.r.sm,
        padding: DS.sp.sm,
        marginBottom: DS.sp.md,
    },
    previewBoxTitle: { fontSize: DS.fs.xs, fontWeight: '700', color: C.textSub, marginBottom: DS.sp.sm },
    previewRow: {
        flexDirection: 'row',
        gap: DS.sp.sm,
        paddingVertical: DS.sp.xs,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.border,
    },
    previewName: { fontSize: DS.fs.sm, fontWeight: '600', color: C.text, flex: 1 },
    previewPhone: { fontSize: DS.fs.sm, color: C.textSub, width: 100 },
    previewType: { fontSize: DS.fs.xs, color: C.primary, width: 70 },
    inputLabel: { fontSize: DS.fs.sm, fontWeight: '700', color: C.textSub, marginBottom: DS.sp.sm, marginTop: DS.sp.xs },
    csvInput: {
        backgroundColor: C.surfaceAlt,
        borderRadius: DS.r.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        padding: DS.sp.md,
        fontSize: DS.fs.sm,
        color: C.text,
        minHeight: 160,
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 18,
    },
});