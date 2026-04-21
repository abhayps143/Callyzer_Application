// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     View, Text, StyleSheet, FlatList, TextInput,
//     TouchableOpacity, ActivityIndicator, RefreshControl,
//     Modal, ScrollView, Alert, Platform, StatusBar,
//     Share, Dimensions,
// } from 'react-native';
// import { api } from '../services/api';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width } = Dimensions.get('window');
// const rs = (size) => size;
// const fs = (size) => size;

// // ── Colors ──────────────────────────────────────────────
// const C = {
//     bg: '#F7F8FA',
//     surface: '#FFFFFF',
//     surfaceAlt: '#F1F3F7',
//     primary: '#4F6EF7',
//     primarySoft: '#EEF1FE',
//     primaryMid: '#C7D2FE',
//     primaryDark: '#3B56D4',
//     text: '#0F1729',
//     textSub: '#6B7A99',
//     textMuted: '#A9B4CC',
//     border: '#E8ECF4',
//     green: '#17C964',
//     greenSoft: '#E8FBF0',
//     greenDark: '#0F9A4A',
//     red: '#F31260',
//     redSoft: '#FEE7EF',
//     amber: '#F5A524',
//     amberSoft: '#FFF4E0',
//     blue: '#006FEE',
//     blueSoft: '#E6F1FE',
//     purple: '#7828C8',
//     purpleSoft: '#F0E6FF',
// };

// const shadow = {
//     shadowColor: '#1A2B5F',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 2,
// };

// const shadowMd = {
//     shadowColor: '#1A2B5F',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.10,
//     shadowRadius: 16,
//     elevation: 4,
// };

// // ── Helpers ───────────────────────────────────────────
// const fmtDuration = (s) => {
//     if (!s && s !== 0) return '—';
//     const sec = Number(s);
//     if (isNaN(sec)) return '—';
//     const m = Math.floor(sec / 60);
//     const r = sec % 60;
//     return m > 0 ? `${m}m ${r}s` : `${r}s`;
// };

// const fmtDate = (d) => {
//     if (!d) return '—';
//     const date = new Date(d);
//     if (isNaN(date.getTime())) return '—';
//     return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// };

// const fmtTime = (d) => {
//     if (!d) return '';
//     const date = new Date(d);
//     if (isNaN(date.getTime())) return '';
//     return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
// };

// const getPresetDates = (preset) => {
//     const today = new Date();
//     const fmt = (d) => d.toISOString().split('T')[0];
//     const sub = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x; };
//     switch (preset) {
//         case 'today': return { from: fmt(today), to: fmt(today) };
//         case 'yesterday': return { from: fmt(sub(today, 1)), to: fmt(sub(today, 1)) };
//         case 'last7': return { from: fmt(sub(today, 6)), to: fmt(today) };
//         case 'last30': return { from: fmt(sub(today, 29)), to: fmt(today) };
//         default: return { from: '', to: '' };
//     }
// };

// // ── Badges ────────────────────────────────────────────
// const TypeBadge = ({ type }) => {
//     const isIn = type === 'Incoming';
//     return (
//         <View style={[styles.badge, { backgroundColor: isIn ? C.blueSoft : C.purpleSoft }]}>
//             <Text style={[styles.badgeText, { color: isIn ? C.blue : C.purple }]}>
//                 {isIn ? '↙ In' : '↗ Out'}
//             </Text>
//         </View>
//     );
// };

// const StatusBadge = ({ status }) => {
//     const cfg = {
//         Connected: { bg: C.greenSoft, color: C.green },
//         Missed: { bg: C.redSoft, color: C.red },
//         Rejected: { bg: C.amberSoft, color: C.amber },
//     };
//     const c = cfg[status] || cfg.Missed;
//     return (
//         <View style={[styles.badge, { backgroundColor: c.bg }]}>
//             <View style={[styles.statusDot, { backgroundColor: c.color }]} />
//             <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
//         </View>
//     );
// };

// const DispositionBadge = ({ disposition }) => {
//     if (!disposition) return null;
//     const map = {
//         'Interested': { bg: C.greenSoft, color: C.green },
//         'Not Interested': { bg: C.redSoft, color: C.red },
//         'Sale Done': { bg: C.purpleSoft, color: C.purple },
//         'Callback': { bg: C.amberSoft, color: C.amber },
//         'Wrong Number': { bg: C.surfaceAlt, color: C.textSub },
//         'Follow-up': { bg: C.blueSoft, color: C.blue },
//     };
//     const c = map[disposition] || { bg: C.surfaceAlt, color: C.textSub };
//     return (
//         <View style={[styles.dispBadge, { backgroundColor: c.bg }]}>
//             <Text style={[styles.dispText, { color: c.color }]}>{disposition}</Text>
//         </View>
//     );
// };

// // ── Avatar ────────────────────────────────────────────
// const AV_COLORS = ['#4A68F0', '#7322C0', '#16BE62', '#F0204E', '#F0991A', '#0AAECC'];
// const Avatar = ({ name, index }) => {
//     const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
//     const bg = AV_COLORS[index % AV_COLORS.length];
//     return (
//         <View style={[styles.avatar, { backgroundColor: bg }]}>
//             <Text style={styles.avatarText}>{initials}</Text>
//         </View>
//     );
// };

// // ── Stat Card ─────────────────────────────────────────
// const StatCard = ({ label, value, icon, color }) => (
//     <View style={[styles.statCard, { borderTopColor: color }]}>
//         <Text style={styles.statIcon}>{icon}</Text>
//         <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>
//         <Text style={styles.statLabel}>{label}</Text>
//     </View>
// );

// // ── Filter Chip ───────────────────────────────────────
// const FilterChip = ({ label, active, onPress }) => (
//     <TouchableOpacity
//         style={[styles.chip, active && styles.chipActive]}
//         onPress={onPress}
//         activeOpacity={0.8}
//     >
//         <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
//     </TouchableOpacity>
// );

// // ── Picker row (used in modals) ───────────────────────
// const PickerRow = ({ options, value, onChange, scrollable = false }) => {
//     const content = options.map(opt => (
//         <TouchableOpacity
//             key={opt.value ?? opt}
//             style={[mStyles.pickerOpt, (value === (opt.value ?? opt)) && mStyles.pickerOptActive]}
//             onPress={() => onChange(opt.value ?? opt)}
//         >
//             <Text style={[mStyles.pickerOptText, (value === (opt.value ?? opt)) && mStyles.pickerOptTextActive]}>
//                 {opt.label ?? opt}
//             </Text>
//         </TouchableOpacity>
//     ));
//     if (scrollable) {
//         return (
//             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 <View style={{ flexDirection: 'row', gap: 8 }}>{content}</View>
//             </ScrollView>
//         );
//     }
//     return <View style={mStyles.pickerRow}>{content}</View>;
// };

// // ── Add / Edit Call Modal ─────────────────────────────
// const CallModal = ({ visible, onClose, onDone, log }) => {
//     const isEdit = !!log;
//     const defaultForm = {
//         customerName: '', customerNumber: '',
//         callType: 'Outgoing', callStatus: 'Connected',
//         durationSeconds: '',
//         calledAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
//         notes: '', disposition: '', followUpDate: '', followUpNotes: '',
//     };
//     const [form, setForm] = useState(defaultForm);
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         if (!visible) return;
//         if (log) {
//             const toLocal = (d) => {
//                 if (!d) return '';
//                 const dt = new Date(d);
//                 return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 16).replace('T', ' ');
//             };
//             setForm({
//                 customerName: log.customerName || '',
//                 customerNumber: log.customerNumber || '',
//                 callType: log.callType || 'Outgoing',
//                 callStatus: log.callStatus || 'Connected',
//                 durationSeconds: log.durationSeconds?.toString() || '',
//                 calledAt: toLocal(log.calledAt),
//                 notes: log.notes || '',
//                 disposition: log.disposition || '',
//                 followUpDate: log.followUpDate ? new Date(log.followUpDate).toISOString().split('T')[0] : '',
//                 followUpNotes: log.followUpNotes || '',
//             });
//         } else {
//             setForm(defaultForm);
//         }
//         setError('');
//     }, [visible, log]);

//     const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//     const handleSubmit = async () => {
//         if (!form.customerNumber.trim()) { setError('Phone number is required'); return; }
//         setSaving(true); setError('');
//         try {
//             let calledAtISO = new Date().toISOString();
//             if (form.calledAt) {
//                 const p = new Date(form.calledAt.replace(' ', 'T'));
//                 if (!isNaN(p.getTime())) calledAtISO = p.toISOString();
//             }
//             const callData = {
//                 customerName: form.customerName.trim() || 'Unknown',
//                 customerNumber: form.customerNumber.trim(),
//                 callType: form.callType,
//                 callStatus: form.callStatus,
//                 durationSeconds: Number(form.durationSeconds) || 0,
//                 calledAt: calledAtISO,
//                 notes: form.notes,
//                 disposition: form.disposition,
//                 followUpDate: form.followUpDate || null,
//                 followUpNotes: form.followUpNotes,
//             };
//             let res;
//             if (isEdit) res = await api.updateCallLog(log._id, callData);
//             else res = await api.createCallLog(callData);
//             if (res?._id || res?.message === 'Call log created' || res?.success !== false) {
//                 onDone(isEdit ? 'Call log updated successfully!' : 'Call log added successfully!');
//             } else {
//                 setError(res?.message || 'Failed to save call');
//             }
//         } catch {
//             setError('Something went wrong. Please try again.');
//         } finally {
//             setSaving(false);
//         }
//     };

//     const callTypeOpts = ['Outgoing', 'Incoming'];
//     const callStatusOpts = ['Connected', 'Missed', 'Rejected'];
//     const dispositionOpts = [
//         { label: 'None', value: '' },
//         { label: '✅ Interested', value: 'Interested' },
//         { label: '❌ Not Interested', value: 'Not Interested' },
//         { label: '📞 Callback', value: 'Callback' },
//         { label: '💰 Sale Done', value: 'Sale Done' },
//         { label: '🔢 Wrong Number', value: 'Wrong Number' },
//         { label: '⏰ Follow-up', value: 'Follow-up' },
//     ];

//     return (
//         <Modal visible={visible} animationType="slide" transparent>
//             <View style={mStyles.overlay}>
//                 <View style={mStyles.sheet}>
//                     <View style={mStyles.drag} />
//                     <View style={mStyles.header}>
//                         <Text style={mStyles.title}>{isEdit ? '✏️ Edit Call Log' : '📞 New Call Log'}</Text>
//                         <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
//                             <Text style={mStyles.closeText}>✕</Text>
//                         </TouchableOpacity>
//                     </View>

//                     <ScrollView style={mStyles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
//                         {!!error && (
//                             <View style={mStyles.errorBox}>
//                                 <Text style={mStyles.errorText}>⚠️  {error}</Text>
//                             </View>
//                         )}
//                         <View style={mStyles.row}>
//                             <View style={[mStyles.field, { flex: 1 }]}>
//                                 <Text style={mStyles.label}>Customer Name</Text>
//                                 <TextInput style={mStyles.input} value={form.customerName} onChangeText={v => set('customerName', v)} placeholder="Rahul Sharma" placeholderTextColor={C.textMuted} />
//                             </View>
//                             <View style={{ width: 12 }} />
//                             <View style={[mStyles.field, { flex: 1 }]}>
//                                 <Text style={mStyles.label}>Phone <Text style={mStyles.req}>*</Text></Text>
//                                 <TextInput style={mStyles.input} value={form.customerNumber} onChangeText={v => set('customerNumber', v)} placeholder="+91 98765 43210" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
//                             </View>
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Call Type</Text>
//                             <PickerRow options={callTypeOpts} value={form.callType} onChange={v => set('callType', v)} />
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Call Status</Text>
//                             <PickerRow options={callStatusOpts} value={form.callStatus} onChange={v => set('callStatus', v)} />
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Disposition</Text>
//                             <PickerRow options={dispositionOpts} value={form.disposition} onChange={v => set('disposition', v)} scrollable />
//                         </View>

//                         <View style={mStyles.row}>
//                             <View style={[mStyles.field, { flex: 1 }]}>
//                                 <Text style={mStyles.label}>Duration (sec)</Text>
//                                 <TextInput style={mStyles.input} value={form.durationSeconds} onChangeText={v => set('durationSeconds', v)} placeholder="120" placeholderTextColor={C.textMuted} keyboardType="numeric" />
//                             </View>
//                             <View style={{ width: 12 }} />
//                             <View style={[mStyles.field, { flex: 1 }]}>
//                                 <Text style={mStyles.label}>Date & Time</Text>
//                                 <TextInput style={mStyles.input} value={form.calledAt} onChangeText={v => set('calledAt', v)} placeholder="2026-04-18 10:30" placeholderTextColor={C.textMuted} />
//                             </View>
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Follow-up Date</Text>
//                             <TextInput style={mStyles.input} value={form.followUpDate} onChangeText={v => set('followUpDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Follow-up Notes</Text>
//                             <TextInput style={[mStyles.input, mStyles.textarea]} value={form.followUpNotes} onChangeText={v => set('followUpNotes', v)} placeholder="Follow-up notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
//                         </View>

//                         <View style={mStyles.field}>
//                             <Text style={mStyles.label}>Notes</Text>
//                             <TextInput style={[mStyles.input, mStyles.textarea]} value={form.notes} onChangeText={v => set('notes', v)} placeholder="Optional notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
//                         </View>
//                         <View style={{ height: 20 }} />
//                     </ScrollView>

//                     <View style={mStyles.footer}>
//                         <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
//                             <Text style={mStyles.cancelText}>Cancel</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity style={[mStyles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.88}>
//                             <Text style={mStyles.saveText}>{saving ? 'Saving…' : isEdit ? 'Update Call' : 'Add Call'}</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// // ── Delete Confirm Modal ──────────────────────────────
// const DeleteConfirmModal = ({ visible, onClose, onConfirm, log }) => {
//     const [deleting, setDeleting] = useState(false);

//     const handleDelete = async () => {
//         setDeleting(true);
//         try {
//             await api.deleteCallLog(log._id);
//             onConfirm();
//         } catch {
//             Alert.alert('Error', 'Failed to delete');
//             onClose();
//         }
//         setDeleting(false);
//     };

//     return (
//         <Modal visible={visible} animationType="fade" transparent>
//             <View style={mStyles.overlay}>
//                 <View style={mStyles.confirmSheet}>
//                     <Text style={mStyles.confirmIcon}>🗑️</Text>
//                     <Text style={mStyles.confirmTitle}>Delete Call Log?</Text>
//                     <Text style={mStyles.confirmBody}>
//                         {log?.customerName || 'This record'} • {log?.customerNumber || ''}
//                         {'\n'}This action cannot be undone.
//                     </Text>
//                     <View style={mStyles.confirmBtns}>
//                         <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose}>
//                             <Text style={mStyles.cancelText}>Cancel</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity style={mStyles.deleteBtn} onPress={handleDelete} disabled={deleting}>
//                             <Text style={mStyles.deleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// // ── Bulk Import Modal (FIXED) ─────────────────────────
// const BulkImportModal = ({ visible, onClose, onDone }) => {
//     const [csv, setCsv] = useState('');
//     const [importing, setImporting] = useState(false);
//     const [error, setError] = useState('');
//     const [preview, setPreview] = useState(0);
//     const [sampleData, setSampleData] = useState([]);

//     const parseCSVLine = (line) => {
//         const result = [];
//         let current = '';
//         let inQuotes = false;
//         for (let i = 0; i < line.length; i++) {
//             const ch = line[i];
//             if (ch === '"') {
//                 inQuotes = !inQuotes;
//             } else if (ch === ',' && !inQuotes) {
//                 result.push(current.trim());
//                 current = '';
//             } else {
//                 current += ch;
//             }
//         }
//         result.push(current.trim());
//         return result;
//     };

//     const normalize = (str) => {
//         if (!str) return '';
//         return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//     };

//     const isHeaderRow = (row) => {
//         const lower = row.toLowerCase();
//         return lower.includes('name') && lower.includes('phone');
//     };

//     useEffect(() => {
//         if (!csv.trim()) {
//             setPreview(0);
//             setSampleData([]);
//             return;
//         }

//         const lines = csv.trim().split('\n').filter(l => l.trim());
//         if (lines.length === 0) {
//             setPreview(0);
//             return;
//         }

//         let dataLines = lines;
//         if (isHeaderRow(lines[0])) {
//             dataLines = lines.slice(1);
//         }

//         const validRows = [];
//         dataLines.forEach((line, idx) => {
//             const cols = parseCSVLine(line);
//             if (cols.length >= 2 && cols[1] && cols[1].replace(/\D/g, '').length >= 7) {
//                 validRows.push({
//                     name: cols[0] || 'Unknown',
//                     phone: cols[1] || '',
//                     type: normalize(cols[2] || 'Outgoing'),
//                     status: normalize(cols[3] || 'Connected'),
//                 });
//             }
//         });

//         setPreview(validRows.length);
//         setSampleData(validRows.slice(0, 3));
//     }, [csv]);

//     const handleImport = async () => {
//         if (!csv.trim()) {
//             setError('Please paste CSV data first.');
//             return;
//         }

//         setImporting(true);
//         setError('');

//         try {
//             const lines = csv.trim().split('\n').filter(l => l.trim());
//             let dataLines = lines;
//             if (isHeaderRow(lines[0])) {
//                 dataLines = lines.slice(1);
//             }

//             const calls = [];
//             const errors = [];

//             dataLines.forEach((line, idx) => {
//                 const cols = parseCSVLine(line);
//                 const phone = cols[1]?.replace(/\s/g, '') || '';

//                 if (!phone || phone.replace(/\D/g, '').length < 7) {
//                     errors.push(`Row ${idx + 1}: Invalid phone number "${cols[1] || ''}"`);
//                     return;
//                 }

//                 let calledAt = new Date().toISOString();
//                 if (cols[5] && cols[5].trim()) {
//                     const dateStr = cols[5].trim();
//                     let parsedDate = new Date(dateStr);
//                     if (isNaN(parsedDate.getTime())) {
//                         parsedDate = new Date(dateStr + 'T00:00:00');
//                     }
//                     if (!isNaN(parsedDate.getTime())) {
//                         calledAt = parsedDate.toISOString();
//                     }
//                 }

//                 let callType = normalize(cols[2] || 'Outgoing');
//                 if (callType === 'Incoming') callType = 'Incoming';
//                 else if (callType === 'Outgoing') callType = 'Outgoing';
//                 else callType = 'Outgoing';

//                 let callStatus = normalize(cols[3] || 'Connected');
//                 if (callStatus === 'Connected') callStatus = 'Connected';
//                 else if (callStatus === 'Missed') callStatus = 'Missed';
//                 else if (callStatus === 'Rejected') callStatus = 'Rejected';
//                 else callStatus = 'Connected';

//                 let disposition = normalize(cols[7] || '');
//                 const validDispositions = ['Interested', 'Not Interested', 'Sale Done', 'Callback', 'Wrong Number', 'Follow-up'];
//                 if (disposition && !validDispositions.includes(disposition)) {
//                     disposition = '';
//                 }

//                 calls.push({
//                     customerName: cols[0]?.trim() || 'Unknown',
//                     customerNumber: phone,
//                     callType: callType,
//                     callStatus: callStatus,
//                     durationSeconds: parseInt(cols[4]) || 0,
//                     calledAt: calledAt,
//                     notes: cols[6]?.trim() || '',
//                     disposition: disposition,
//                 });
//             });

//             if (errors.length > 0) {
//                 setError(errors.slice(0, 3).join('\n'));
//                 setImporting(false);
//                 return;
//             }

//             if (calls.length === 0) {
//                 setError('No valid rows found. Check your CSV format.');
//                 setImporting(false);
//                 return;
//             }

//             await api.bulkCreateCallLogs(calls);
//             setCsv('');
//             onDone(`${calls.length} call(s) imported successfully!`);
//         } catch (err) {
//             setError('Import failed. Please try again.');
//         } finally {
//             setImporting(false);
//         }
//     };

//     const handleClose = () => {
//         setCsv('');
//         setError('');
//         setPreview(0);
//         setSampleData([]);
//         onClose();
//     };

//     const exampleCSV = `Nishit,9558630639,Incoming,Connected,120,2026-04-21,nice,Interested
// Rahul,9876543210,Outgoing,Missed,45,2026-04-20,no answer,
// Shani,9601930581,Incoming,Connected,60,2026-04-21,interested,Sale Done`;

//     return (
//         <Modal visible={visible} animationType="slide" transparent>
//             <View style={mStyles.overlay}>
//                 <View style={[mStyles.sheet, { maxHeight: '90%' }]}>
//                     <View style={mStyles.drag} />

//                     <View style={mStyles.header}>
//                         <Text style={mStyles.title}>📥 Bulk Import Calls</Text>
//                         <TouchableOpacity onPress={handleClose} style={mStyles.closeBtn}>
//                             <Text style={mStyles.closeText}>✕</Text>
//                         </TouchableOpacity>
//                     </View>

//                     <ScrollView style={mStyles.body} showsVerticalScrollIndicator={false}>
//                         <View style={mStyles.importHint}>
//                             <Text style={mStyles.importHintTitle}>📋 CSV Format (No Header Row)</Text>
//                             <Text style={mStyles.importHintText}>
//                                 Name, Phone, Type, Status, Duration(sec), Date, Notes, Disposition
//                             </Text>
//                             <View style={mStyles.exampleBox}>
//                                 <Text style={mStyles.exampleTitle}>✅ Example:</Text>
//                                 <Text style={mStyles.exampleText}>
//                                     Nishit,9558630639,Incoming,Connected,120,2026-04-21,nice,Interested
//                                 </Text>
//                             </View>
//                             <View style={mStyles.exampleBox}>
//                                 <Text style={mStyles.exampleTitle}>📝 Rules:</Text>
//                                 <Text style={mStyles.exampleText}>
//                                     • Phone: 10 digits required{'\n'}
//                                     • Type: Incoming / Outgoing{'\n'}
//                                     • Status: Connected / Missed / Rejected{'\n'}
//                                     • Date: YYYY-MM-DD format{'\n'}
//                                     • Disposition: Interested, Not Interested, Sale Done, Callback, Wrong Number, Follow-up
//                                 </Text>
//                             </View>
//                         </View>

//                         {!!error && (
//                             <View style={mStyles.errorBox}>
//                                 <Text style={mStyles.errorText}>⚠️  {error}</Text>
//                             </View>
//                         )}

//                         {preview > 0 && !error && (
//                             <View style={mStyles.previewBadge}>
//                                 <Text style={mStyles.previewText}>✅ {preview} valid row{preview > 1 ? 's' : ''} ready to import</Text>
//                             </View>
//                         )}

//                         {sampleData.length > 0 && (
//                             <View style={mStyles.previewBox}>
//                                 <Text style={mStyles.previewBoxTitle}>🔍 Preview (first {sampleData.length})</Text>
//                                 {sampleData.map((row, idx) => (
//                                     <View key={idx} style={mStyles.previewRow}>
//                                         <Text style={mStyles.previewName}>{row.name}</Text>
//                                         <Text style={mStyles.previewPhone}>{row.phone}</Text>
//                                         <Text style={mStyles.previewType}>{row.type}</Text>
//                                     </View>
//                                 ))}
//                             </View>
//                         )}

//                         <Text style={mStyles.inputLabel}>Paste CSV Data Below:</Text>
//                         <TextInput
//                             style={mStyles.csvInput}
//                             value={csv}
//                             onChangeText={(t) => { setCsv(t); setError(''); }}
//                             placeholder={exampleCSV}
//                             placeholderTextColor={C.textMuted}
//                             multiline
//                             textAlignVertical="top"
//                             autoCorrect={false}
//                             autoCapitalize="none"
//                         />
//                         <View style={{ height: 12 }} />
//                     </ScrollView>

//                     <View style={mStyles.footer}>
//                         <TouchableOpacity style={mStyles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
//                             <Text style={mStyles.cancelText}>Cancel</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity
//                             style={[mStyles.saveBtn, (importing || preview === 0) && { opacity: 0.6 }]}
//                             onPress={handleImport}
//                             disabled={importing || preview === 0}
//                             activeOpacity={0.88}
//                         >
//                             <Text style={mStyles.saveText}>
//                                 {importing ? 'Importing…' : preview > 0 ? `Import ${preview} row${preview > 1 ? 's' : ''}` : 'Import'}
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// // ── Main Screen ───────────────────────────────────────
// export default function CallLogsScreen() {
//     const [logs, setLogs] = useState([]);
//     const [stats, setStats] = useState(null);
//     const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 20 });
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [loadingMore, setLoadingMore] = useState(false);
//     const [error, setError] = useState(null);

//     const [search, setSearch] = useState('');
//     const [typeFilter, setTypeFilter] = useState('All');
//     const [statusFilter, setStatusFilter] = useState('All');
//     const [dateFrom, setDateFrom] = useState('');
//     const [dateTo, setDateTo] = useState('');
//     const [activePreset, setActivePreset] = useState('');
//     const [page, setPage] = useState(1);

//     const [sortField, setSortField] = useState('calledAt');
//     const [sortDir, setSortDir] = useState('desc');

//     const [showAddModal, setShowAddModal] = useState(false);
//     const [showImportModal, setShowImportModal] = useState(false);
//     const [editLog, setEditLog] = useState(null);
//     const [deleteLog, setDeleteLog] = useState(null);

//     const [userRole, setUserRole] = useState('agent');
//     const [agents, setAgents] = useState([]);
//     const [selectedAgent, setSelectedAgent] = useState('');
//     const [isLoadingRole, setIsLoadingRole] = useState(true);



//     // Keep existing pagination useEffect

//     useEffect(() => {
//         if (page > 1) {
//             fetchCalls(false);
//         }
//     }, [page]);

//     useEffect(() => {
//         const getUser = async () => {
//             try {
//                 const userStr = await AsyncStorage.getItem('user');
//                 if (userStr) {
//                     const user = JSON.parse(userStr);
//                     setUserRole(user?.role || 'agent');
//                 }
//             } catch (e) { console.log('Error getting user role:', e); }
//             finally { setIsLoadingRole(false); }
//         };
//         getUser();
//     }, []);

//     useEffect(() => {
//         const fetchAgents = async () => {
//             try {
//                 const token = await AsyncStorage.getItem('token');
//                 if (userRole === 'admin' || userRole === 'super_admin') {
//                     const res = await fetch(`http://192.168.1.51:5000/api/admin/users?role=agent&limit=100`, {
//                         headers: { Authorization: `Bearer ${token}` }
//                     });
//                     const data = await res.json();
//                     setAgents(data.users || []);
//                 } else if (userRole === 'manager') {
//                     const res = await fetch(`http://192.168.1.51:5000/api/manager/team?limit=100`, {
//                         headers: { Authorization: `Bearer ${token}` }
//                     });
//                     const data = await res.json();
//                     setAgents(data.members || []);
//                 }
//             } catch (err) { console.log('Failed to fetch agents:', err); }
//         };
//         if (userRole && !isLoadingRole) fetchAgents();
//     }, [userRole, isLoadingRole]);

//     const canAddCalls = ['agent', 'team_leader', 'admin', 'super_admin', 'employee'].includes(userRole);
//     const isAdmin = ['admin', 'super_admin'].includes(userRole);
//     const canDelete = userRole === 'super_admin';
//     const isManager = userRole === 'manager';
//     const canViewAll = isAdmin || isManager;

//     const applyPreset = (preset) => {
//         const { from, to } = getPresetDates(preset);
//         setDateFrom(from); setDateTo(to); setActivePreset(preset); setPage(1);
//     };

//     const resetFilters = () => {
//         setSearch(''); setTypeFilter('All'); setStatusFilter('All');
//         setDateFrom(''); setDateTo(''); setActivePreset(''); setSelectedAgent(''); setPage(1);
//     };

//     const hasFilters = search || typeFilter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo || selectedAgent;

//     const handleSort = (field) => {
//         if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
//         else { setSortField(field); setSortDir('asc'); }
//         setPage(1);
//     };

//     const fetchCalls = useCallback(async (reset = false) => {
//         if (reset) {
//             setLoading(true);
//             setError(null);
//         }

//         try {
//             const currentPage = reset ? 1 : page;

//             // Build params object
//             const params = {
//                 page: currentPage,
//                 limit: 20,
//                 sortField,
//                 sortDir
//             };

//             // Add filters only if they have values
//             if (search && search.trim()) {
//                 params.search = search.trim();
//             }
//             if (typeFilter && typeFilter !== 'All') {
//                 params.callType = typeFilter;
//             }
//             if (statusFilter && statusFilter !== 'All') {
//                 params.callStatus = statusFilter;
//             }
//             if (dateFrom && dateFrom.trim()) {
//                 params.dateFrom = dateFrom;
//             }
//             if (dateTo && dateTo.trim()) {
//                 params.dateTo = dateTo;
//             }
//             if (selectedAgent && selectedAgent.trim()) {
//                 params.agentId = selectedAgent;
//             }

//             console.log('🔍 Fetching calls with params:', params);

//             // Fetch calls
//             const response = await api.getCallLogs(params);
//             console.log('📦 Response received:', response);

//             // Handle different response structures
//             let logsData = [];
//             let paginationData = {
//                 total: 0,
//                 pages: 1,
//                 page: currentPage,
//                 limit: 20
//             };

//             if (response && response.success === false) {
//                 setError(response.message);
//                 logsData = [];
//             }
//             else if (response && response.logs && Array.isArray(response.logs)) {
//                 logsData = response.logs;
//                 paginationData = response.pagination || paginationData;
//                 console.log('✅ Found logs in response.logs:', logsData.length);
//             }
//             else if (response && response.data && Array.isArray(response.data)) {
//                 logsData = response.data;
//                 paginationData = response.pagination || response.meta || paginationData;
//                 console.log('✅ Found logs in response.data:', logsData.length);
//             }
//             else if (Array.isArray(response)) {
//                 logsData = response;
//                 paginationData.total = response.length;
//                 paginationData.pages = Math.ceil(response.length / 20);
//                 console.log('✅ Response is array:', logsData.length);
//             }
//             else {
//                 console.warn('⚠️ Unknown response format:', response);
//                 logsData = [];
//             }

//             // Update state
//             if (reset || currentPage === 1) {
//                 setLogs(logsData);
//             } else {
//                 setLogs(prev => [...prev, ...logsData]);
//             }
//             setPagination(paginationData);

//             // Fetch stats with same filters
//             try {
//                 const statsParams = {};
//                 if (search && search.trim()) statsParams.search = search.trim();
//                 if (typeFilter && typeFilter !== 'All') statsParams.callType = typeFilter;
//                 if (statusFilter && statusFilter !== 'All') statsParams.callStatus = statusFilter;
//                 if (dateFrom && dateFrom.trim()) statsParams.dateFrom = dateFrom;
//                 if (dateTo && dateTo.trim()) statsParams.dateTo = dateTo;
//                 if (selectedAgent && selectedAgent.trim()) statsParams.agentId = selectedAgent;

//                 console.log('📊 Fetching stats with params:', statsParams);
//                 const statsRes = await api.getCallStats(statsParams);
//                 console.log('📊 Stats response:', statsRes);

//                 if (statsRes && statsRes.success !== false) {
//                     setStats(statsRes);
//                 }
//             } catch (e) {
//                 console.log('Stats fetch error:', e);
//             }

//         } catch (err) {
//             console.error('❌ Fetch error:', err);
//             setError(err.message || 'Network error. Please try again.');
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//             setLoadingMore(false);
//         }
//     }, [page, search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);

//     useEffect(() => { fetchCalls(true); }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);
//     useEffect(() => { if (page > 1) fetchCalls(false); }, [page]);

//     const onRefresh = () => { setRefreshing(true); setPage(1); fetchCalls(true); };
//     const loadMore = () => {
//         if (page < pagination.pages && !loadingMore && !loading) {
//             setLoadingMore(true); setPage(p => p + 1);
//         }
//     };

//     const onDone = (msg) => {
//         setShowAddModal(false); setShowImportModal(false);
//         setEditLog(null); setDeleteLog(null);
//         Alert.alert('✅ Success', msg || 'Done!');
//         onRefresh();
//     };

//     const downloadCSV = async () => {
//         if (!logs?.length) { Alert.alert('No Data', 'No call logs to export'); return; }
//         const headers = ['#', 'Agent', 'Customer', 'Phone', 'Type', 'Status', 'Duration', 'Date & Time', 'Disposition', 'Follow-up', 'Notes'];
//         const rows = logs.map((log, idx) => [
//             idx + 1,
//             log.agent?.name || '—',
//             log.customerName || '—',
//             log.customerNumber || '—',
//             log.callType || '—',
//             log.callStatus || '—',
//             log.durationSeconds ? `${Math.floor(log.durationSeconds / 60)}m ${log.durationSeconds % 60}s` : '0s',
//             log.calledAt ? new Date(log.calledAt).toLocaleString('en-IN') : '—',
//             log.disposition || '—',
//             log.followUpDate ? new Date(log.followUpDate).toLocaleDateString('en-IN') : '—',
//             (log.notes || '').replace(/,/g, ';'),
//         ]);
//         const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
//         try {
//             await Share.share({ title: 'Call Logs Export', message: csv });
//         } catch {
//             Alert.alert('Error', 'Failed to share CSV');
//         }
//     };

//     const renderCallItem = ({ item, index }) => (
//         <View style={styles.callCard}>
//             <View style={styles.callCardTop}>
//                 <Avatar name={item.customerName} index={index} />
//                 <View style={styles.callInfo}>
//                     <Text style={styles.callName} numberOfLines={1}>{item.customerName || 'Unknown'}</Text>
//                     <Text style={styles.callNumber}>{item.customerNumber || '—'}</Text>
//                     <Text style={styles.callDate}>{fmtDate(item.calledAt)} · {fmtTime(item.calledAt)}</Text>
//                 </View>
//                 <View style={styles.callRight}>
//                     <Text style={styles.callDuration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
//                     <View style={styles.actionRow}>
//                         <TouchableOpacity onPress={() => setEditLog(item)} style={styles.editBtn} activeOpacity={0.8}>
//                             <Text style={styles.editBtnText}>Edit</Text>
//                         </TouchableOpacity>
//                         {canDelete && (
//                             <TouchableOpacity onPress={() => setDeleteLog(item)} style={styles.delBtn} activeOpacity={0.8}>
//                                 <Text style={styles.delBtnText}>Del</Text>
//                             </TouchableOpacity>
//                         )}
//                     </View>
//                 </View>
//             </View>
//             <View style={styles.callCardBottom}>
//                 <TypeBadge type={item.callType} />
//                 <StatusBadge status={item.callStatus} />
//                 {!!item.disposition && <DispositionBadge disposition={item.disposition} />}
//             </View>
//         </View>
//     );

//     const statsItems = stats ? [
//         { label: 'Total', value: pagination.total, icon: '📞', color: C.primary },
//         { label: 'Incoming', value: stats.incoming ?? stats.incomingCalls ?? stats.totalIncoming ?? 0, icon: '↙️', color: C.blue },
//         { label: 'Outgoing', value: stats.outgoing ?? stats.outgoingCalls ?? stats.totalOutgoing ?? 0, icon: '↗️', color: C.purple },
//         { label: 'Connected', value: stats.connected ?? stats.connectedCalls ?? stats.totalConnected ?? 0, icon: '✅', color: C.green },
//         { label: 'Missed', value: stats.missed ?? stats.missedCalls ?? stats.totalMissed ?? 0, icon: '❌', color: C.red },
//         { label: 'Today', value: stats.todayCalls ?? stats.today ?? stats.todayTotal ?? 0, icon: '📅', color: C.amber },
//     ] : [];

//     if (isLoadingRole) return (
//         <View style={styles.center}>
//             <ActivityIndicator size="large" color={C.primary} />
//         </View>
//     );

//     return (
//         <View style={styles.container}>
//             <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

//             {/* Header */}
//             <View style={styles.header}>
//                 <View>
//                     <Text style={styles.title}>Call Logs</Text>
//                     <Text style={styles.subtitle}>{pagination.total.toLocaleString()} total records</Text>
//                 </View>
//                 <View style={styles.headerBtns}>
//                     // Header buttons mein add karo:
//                     <TouchableOpacity
//                         style={styles.iconBtn}
//                         onPress={async () => {
//                             console.log('🔄 Manual refresh');
//                             setPage(1);
//                             await fetchCalls(true);
//                         }}
//                         activeOpacity={0.8}>
//                         <Text style={styles.iconBtnText}>🔄</Text>
//                     </TouchableOpacity>
//                     {canViewAll && (
//                         <TouchableOpacity style={styles.iconBtn} onPress={downloadCSV} activeOpacity={0.8}>
//                             <Text style={styles.iconBtnText}>⬇️</Text>
//                         </TouchableOpacity>
//                     )}
//                     {canAddCalls && (
//                         <>
//                             <TouchableOpacity style={styles.iconBtn} onPress={() => setShowImportModal(true)} activeOpacity={0.8}>
//                                 <Text style={styles.iconBtnText}>📥</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.88}>
//                                 <Text style={styles.addBtnText}>+ Add</Text>
//                             </TouchableOpacity>
//                         </>
//                     )}
//                 </View>
//             </View>

//             {/* Stats */}
//             {stats && (
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
//                     {statsItems.map(s => <StatCard key={s.label} {...s} />)}
//                 </ScrollView>
//             )}

//             {/* Search */}
//             <View style={styles.searchBox}>
//                 <Text style={styles.searchIcon}>🔍</Text>
//                 <TextInput
//                     style={styles.searchInput}
//                     placeholder="Search name or number…"
//                     placeholderTextColor={C.textMuted}
//                     value={search}
//                     onChangeText={setSearch}
//                 />
//                 {!!search && (
//                     <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//                         <Text style={styles.clearIcon}>✕</Text>
//                     </TouchableOpacity>
//                 )}
//             </View>

//             {/* Filters */}
//             <View style={styles.filterArea}>
//                 {(isAdmin || isManager) && agents.length > 0 && (
//                     <View style={styles.filterRow}>
//                         <Text style={styles.filterLabel}>Agent</Text>
//                         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 12 }}>
//                             <FilterChip label="All" active={!selectedAgent} onPress={() => { setSelectedAgent(''); setPage(1); }} />
//                             {agents.map(a => (
//                                 <FilterChip key={a._id} label={a.name} active={selectedAgent === a._id} onPress={() => { setSelectedAgent(a._id); setPage(1); }} />
//                             ))}
//                         </ScrollView>
//                     </View>
//                 )}

//                 <View style={styles.filterRow}>
//                     <Text style={styles.filterLabel}>Type</Text>
//                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 12 }}>
//                         {['All', 'Incoming', 'Outgoing'].map(t => (
//                             <FilterChip key={t} label={t} active={typeFilter === t} onPress={() => { setTypeFilter(t); setPage(1); }} />
//                         ))}
//                     </ScrollView>
//                 </View>

//                 <View style={styles.filterRow}>
//                     <Text style={styles.filterLabel}>Status</Text>
//                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 12 }}>
//                         {['All', 'Connected', 'Missed', 'Rejected'].map(s => (
//                             <FilterChip key={s} label={s} active={statusFilter === s} onPress={() => { setStatusFilter(s); setPage(1); }} />
//                         ))}
//                     </ScrollView>
//                 </View>

//                 <View style={styles.filterRow}>
//                     <Text style={styles.filterLabel}>Range</Text>
//                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 12 }}>
//                         {[
//                             { key: 'today', label: 'Today' },
//                             { key: 'yesterday', label: 'Yesterday' },
//                             { key: 'last7', label: 'Last 7d' },
//                             { key: 'last30', label: 'Last 30d' },
//                         ].map(p => (
//                             <FilterChip key={p.key} label={p.label} active={activePreset === p.key} onPress={() => applyPreset(p.key)} />
//                         ))}
//                     </ScrollView>
//                 </View>

//                 <View style={styles.dateRow}>
//                     <TextInput style={styles.dateInput} placeholder="From YYYY-MM-DD" value={dateFrom} onChangeText={setDateFrom} placeholderTextColor={C.textMuted} />
//                     <Text style={styles.dateArrow}>→</Text>
//                     <TextInput style={styles.dateInput} placeholder="To YYYY-MM-DD" value={dateTo} onChangeText={setDateTo} placeholderTextColor={C.textMuted} />
//                 </View>

//                 {hasFilters && (
//                     <TouchableOpacity onPress={resetFilters} style={styles.resetBtn} activeOpacity={0.8}>
//                         <Text style={styles.resetText}>✕ Clear all filters</Text>
//                     </TouchableOpacity>
//                 )}
//             </View>

//             {/* List */}
//             {loading && !refreshing ? (
//                 <View style={styles.center}>
//                     <ActivityIndicator size="large" color={C.primary} />
//                     <Text style={styles.loadingText}>Loading call logs…</Text>
//                 </View>
//             ) : error && logs.length === 0 ? (
//                 <View style={styles.center}>
//                     <Text style={styles.stateEmoji}>⚠️</Text>
//                     <Text style={styles.stateTitle}>Failed to load</Text>
//                     <Text style={styles.stateBody}>{error}</Text>
//                     <TouchableOpacity onPress={() => fetchCalls(true)} style={styles.retryBtn} activeOpacity={0.8}>
//                         <Text style={styles.retryText}>Try Again</Text>
//                     </TouchableOpacity>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={logs}
//                     keyExtractor={(item, index) => item._id || index.toString()}
//                     renderItem={renderCallItem}
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
//                     onEndReached={loadMore}
//                     onEndReachedThreshold={0.3}
//                     contentContainerStyle={styles.listContent}
//                     showsVerticalScrollIndicator={false}
//                     ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color={C.primary} /> : null}
//                     ListEmptyComponent={
//                         !loading && (
//                             <View style={styles.emptyState}>
//                                 <Text style={styles.stateEmoji}>📞</Text>
//                                 <Text style={styles.stateTitle}>No call logs found</Text>
//                                 {hasFilters && (
//                                     <TouchableOpacity onPress={resetFilters} style={styles.retryBtn}>
//                                         <Text style={styles.retryText}>Clear filters</Text>
//                                     </TouchableOpacity>
//                                 )}
//                             </View>
//                         )
//                     }
//                 />
//             )}

//             {/* Pagination */}
//             {pagination.pages > 1 && !loading && (
//                 <View style={styles.pagination}>
//                     <TouchableOpacity
//                         style={[styles.pageBtn, page === 1 && styles.pageBtnOff]}
//                         onPress={() => setPage(p => Math.max(1, p - 1))}
//                         disabled={page === 1}
//                     >
//                         <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextOff]}>← Prev</Text>
//                     </TouchableOpacity>
//                     <Text style={styles.pageInfo}>Page {page} of {pagination.pages}</Text>
//                     <TouchableOpacity
//                         style={[styles.pageBtn, page === pagination.pages && styles.pageBtnOff]}
//                         onPress={() => setPage(p => Math.min(pagination.pages, p + 1))}
//                         disabled={page === pagination.pages}
//                     >
//                         <Text style={[styles.pageBtnText, page === pagination.pages && styles.pageBtnTextOff]}>Next →</Text>
//                     </TouchableOpacity>
//                 </View>
//             )}

//             {/* Modals */}
//             <CallModal visible={showAddModal} onClose={() => setShowAddModal(false)} onDone={onDone} />
//             <CallModal visible={!!editLog} onClose={() => setEditLog(null)} onDone={onDone} log={editLog} />
//             <DeleteConfirmModal visible={!!deleteLog} onClose={() => setDeleteLog(null)} onConfirm={() => onDone('Call log deleted')} log={deleteLog} />
//             <BulkImportModal visible={showImportModal} onClose={() => setShowImportModal(false)} onDone={() => onDone('Calls imported!')} />
//         </View>
//     );
// }

// // ── Styles ────────────────────────────────────────────
// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: C.bg },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
//     loadingText: { fontSize: 14, color: C.textSub },

//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         paddingTop: 56,
//         paddingBottom: 14,
//         backgroundColor: C.surface,
//         borderBottomWidth: 1,
//         borderBottomColor: C.border,
//         ...shadow,
//     },
//     title: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
//     subtitle: { fontSize: 12, color: C.textSub, marginTop: 2, fontWeight: '500' },
//     headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     iconBtn: {
//         width: 36, height: 36,
//         borderRadius: 10,
//         backgroundColor: C.surfaceAlt,
//         justifyContent: 'center', alignItems: 'center',
//         borderWidth: 1, borderColor: C.border,
//     },
//     iconBtnText: { fontSize: 16 },
//     addBtn: {
//         backgroundColor: C.primary,
//         paddingHorizontal: 16,
//         paddingVertical: 9,
//         borderRadius: 10,
//         ...shadow,
//     },
//     addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

//     statsStrip: {
//         maxHeight: 110,
//         backgroundColor: C.surface,
//         borderBottomWidth: 1,
//         borderBottomColor: C.border,
//         paddingVertical: 10,
//     },
//     statCard: {
//         alignItems: 'center',
//         backgroundColor: C.surface,
//         borderRadius: 12,
//         paddingHorizontal: 14,
//         paddingVertical: 12,
//         borderTopWidth: 3,
//         borderWidth: 1,
//         borderColor: C.border,
//         minWidth: 80,
//         ...shadow,
//     },
//     statIcon: { fontSize: 16, marginBottom: 4 },
//     statValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
//     statLabel: { fontSize: 10, color: C.textSub, marginTop: 2, fontWeight: '600' },

//     searchBox: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: C.surface,
//         marginHorizontal: 16,
//         marginTop: 12,
//         borderRadius: 14,
//         paddingHorizontal: 14,
//         paddingVertical: 11,
//         borderWidth: 1.5,
//         borderColor: C.border,
//         gap: 8,
//         ...shadow,
//     },
//     searchIcon: { fontSize: 15 },
//     searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 0 },
//     clearIcon: { fontSize: 14, color: C.textMuted, fontWeight: '600' },

//     filterArea: {
//         backgroundColor: C.surface,
//         marginHorizontal: 16,
//         marginTop: 8,
//         borderRadius: 14,
//         paddingVertical: 10,
//         paddingHorizontal: 12,
//         borderWidth: 1,
//         borderColor: C.border,
//         gap: 8,
//         ...shadow,
//     },
//     filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     filterLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, width: 48, letterSpacing: 0.3 },

//     chip: {
//         paddingHorizontal: 12,
//         paddingVertical: 5,
//         borderRadius: 20,
//         backgroundColor: C.surfaceAlt,
//         borderWidth: 1,
//         borderColor: C.border,
//     },
//     chipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
//     chipText: { fontSize: 12, color: C.textSub, fontWeight: '600' },
//     chipTextActive: { color: C.primary, fontWeight: '700' },

//     dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
//     dateInput: {
//         flex: 1,
//         backgroundColor: C.surfaceAlt,
//         borderRadius: 10,
//         borderWidth: 1,
//         borderColor: C.border,
//         paddingHorizontal: 10,
//         paddingVertical: 8,
//         fontSize: 12,
//         color: C.text,
//     },
//     dateArrow: { color: C.textMuted, fontSize: 14, fontWeight: '700' },

//     resetBtn: {
//         alignSelf: 'flex-start',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 20,
//         backgroundColor: C.redSoft,
//     },
//     resetText: { color: C.red, fontSize: 12, fontWeight: '700' },

//     listContent: { padding: 16, gap: 10, paddingBottom: 40 },
//     callCard: {
//         backgroundColor: C.surface,
//         borderRadius: 16,
//         padding: 14,
//         borderWidth: 1,
//         borderColor: C.border,
//         ...shadow,
//     },
//     callCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
//     avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
//     avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
//     callInfo: { flex: 1 },
//     callName: { fontSize: 15, fontWeight: '700', color: C.text },
//     callNumber: { fontSize: 13, color: C.textSub, marginTop: 2 },
//     callDate: { fontSize: 11, color: C.textMuted, marginTop: 3 },
//     callRight: { alignItems: 'flex-end', gap: 6 },
//     callDuration: { fontSize: 12, color: C.textSub, fontWeight: '600' },
//     actionRow: { flexDirection: 'row', gap: 6 },
//     editBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.primarySoft },
//     editBtnText: { color: C.primary, fontWeight: '700', fontSize: 12 },
//     delBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.redSoft },
//     delBtnText: { color: C.red, fontWeight: '700', fontSize: 12 },
//     callCardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },

//     badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, gap: 4 },
//     statusDot: { width: 6, height: 6, borderRadius: 3 },
//     badgeText: { fontSize: 11, fontWeight: '700' },
//     dispBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
//     dispText: { fontSize: 11, fontWeight: '600' },

//     emptyState: { alignItems: 'center', padding: 48, gap: 8 },
//     stateEmoji: { fontSize: 48 },
//     stateTitle: { fontSize: 17, fontWeight: '700', color: C.text },
//     stateBody: { fontSize: 14, color: C.textSub, textAlign: 'center' },
//     retryBtn: { backgroundColor: C.primarySoft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
//     retryText: { color: C.primary, fontWeight: '700', fontSize: 14 },

//     pagination: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: C.surface,
//         borderTopWidth: 1,
//         borderTopColor: C.border,
//     },
//     pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: C.primarySoft },
//     pageBtnOff: { backgroundColor: C.surfaceAlt },
//     pageBtnText: { color: C.primary, fontWeight: '700', fontSize: 13 },
//     pageBtnTextOff: { color: C.textMuted },
//     pageInfo: { fontSize: 13, color: C.textSub, fontWeight: '600' },
// });

// // ── Modal Styles ──────────────────────────────────────
// const mStyles = StyleSheet.create({
//     overlay: { flex: 1, backgroundColor: 'rgba(13, 20, 38, 0.5)', justifyContent: 'flex-end' },
//     sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', ...shadowMd },
//     drag: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12 },
//     header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
//     title: { fontSize: 17, fontWeight: '800', color: C.text },
//     closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
//     closeText: { color: C.textSub, fontWeight: '700', fontSize: 14 },
//     body: { padding: 20 },
//     row: { flexDirection: 'row' },
//     field: { marginBottom: 14 },
//     label: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
//     req: { color: C.red },
//     input: { backgroundColor: C.surfaceAlt, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
//     textarea: { minHeight: 80, textAlignVertical: 'top' },
//     pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
//     pickerOpt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
//     pickerOptActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
//     pickerOptText: { fontSize: 13, color: C.textSub, fontWeight: '600' },
//     pickerOptTextActive: { color: C.primary, fontWeight: '700' },
//     errorBox: { backgroundColor: C.redSoft, borderRadius: 10, padding: 12, marginBottom: 12 },
//     errorText: { color: C.red, fontSize: 13, fontWeight: '600' },
//     footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
//     cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
//     cancelText: { color: C.textSub, fontWeight: '700', fontSize: 15 },
//     saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.primary, ...shadow },
//     saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
//     confirmSheet: { backgroundColor: C.surface, margin: 24, borderRadius: 24, padding: 28, alignItems: 'center', ...shadowMd },
//     confirmIcon: { fontSize: 44, marginBottom: 12 },
//     confirmTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
//     confirmBody: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
//     confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
//     deleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.red },
//     deleteText: { color: '#fff', fontWeight: '700', fontSize: 15 },
//     importHint: { backgroundColor: C.primarySoft, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.primaryMid, gap: 6 },
//     importHintTitle: { color: C.primary, fontSize: 13, fontWeight: '800', marginBottom: 4 },
//     importHintText: { color: C.primary, fontSize: 12, fontWeight: '600' },
//     exampleBox: { backgroundColor: C.surface, borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: C.border },
//     exampleTitle: { fontSize: 11, fontWeight: '700', color: C.text, marginBottom: 4 },
//     exampleText: { fontSize: 11, color: C.textSub, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
//     previewBadge: { backgroundColor: C.greenSoft, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: C.green },
//     previewText: { color: C.greenDark, fontSize: 13, fontWeight: '700' },
//     previewBox: { backgroundColor: C.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 12 },
//     previewBoxTitle: { fontSize: 11, fontWeight: '700', color: C.textSub, marginBottom: 8 },
//     previewRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.border },
//     previewName: { fontSize: 12, fontWeight: '600', color: C.text, flex: 1 },
//     previewPhone: { fontSize: 12, color: C.textSub, width: 100 },
//     previewType: { fontSize: 11, color: C.primary, width: 70 },
//     inputLabel: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 8, marginTop: 4 },
//     csvInput: {
//         backgroundColor: C.surfaceAlt,
//         borderRadius: 12,
//         borderWidth: 1.5,
//         borderColor: C.border,
//         padding: 14,
//         fontSize: 12,
//         color: C.text,
//         minHeight: 160,
//         textAlignVertical: 'top',
//         fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
//         lineHeight: 18,
//     },
// });

// ══════════════════════════════════════════════════════
//  CallLogsScreen — Refactored (Production-ready UI)
// ══════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, ActivityIndicator, RefreshControl,
    Modal, ScrollView, Alert, Platform, StatusBar,
    Share, Dimensions,
} from 'react-native';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, rs, fs, shadow, shadowMd } from '../theme';

const { width } = Dimensions.get('window');

// ── Helpers ───────────────────────────────────────────────────
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

// ── Badges ────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
    const isIn = type === 'Incoming';
    return (
        <View style={[S.badge, { backgroundColor: isIn ? C.blueSoft : C.purpleSoft }]}>
            <Text style={[S.badgeText, { color: isIn ? C.blue : C.purple }]}>
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
        <View style={[S.badge, { backgroundColor: c.bg }]}>
            <View style={[S.statusDot, { backgroundColor: c.color }]} />
            <Text style={[S.badgeText, { color: c.color }]}>{status}</Text>
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
        <View style={[S.dispBadge, { backgroundColor: c.bg }]}>
            <Text style={[S.dispText, { color: c.color }]}>{disposition}</Text>
        </View>
    );
};

// ── Avatar ────────────────────────────────────────────────────
const AV_COLORS = [C.primary, C.purple, C.green, C.red, C.amber, C.cyan];
const Avatar = ({ name, index }) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const bg = AV_COLORS[index % AV_COLORS.length];
    return (
        <View style={[S.avatar, { backgroundColor: bg }]}>
            <Text style={S.avatarText}>{initials}</Text>
        </View>
    );
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
    <View style={[S.statCard, { borderTopColor: color }]}>
        <Text style={S.statIcon}>{icon}</Text>
        <Text style={[S.statValue, { color }]}>{value ?? 0}</Text>
        <Text style={S.statLabel}>{label}</Text>
    </View>
);

// ── Filter Chip ───────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => (
    <TouchableOpacity
        style={[S.chip, active && S.chipActive]}
        onPress={onPress}
        activeOpacity={0.75}
    >
        <Text style={[S.chipText, active && S.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
);

// ── Picker Row (modals) ───────────────────────────────────────
const PickerRow = ({ options, value, onChange, scrollable = false }) => {
    const content = options.map(opt => (
        <TouchableOpacity
            key={opt.value ?? opt}
            style={[M.pickerOpt, (value === (opt.value ?? opt)) && M.pickerOptActive]}
            onPress={() => onChange(opt.value ?? opt)}
            activeOpacity={0.75}
        >
            <Text style={[M.pickerOptText, (value === (opt.value ?? opt)) && M.pickerOptTextActive]}>
                {opt.label ?? opt}
            </Text>
        </TouchableOpacity>
    ));
    if (scrollable) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: rs(8) }}>{content}</View>
            </ScrollView>
        );
    }
    return <View style={M.pickerRow}>{content}</View>;
};

// ── Add / Edit Call Modal ─────────────────────────────────────
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
        if (!form.customerNumber.trim()) { setError('Phone number is required'); return; }
        setSaving(true); setError('');
        try {
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
            if (isEdit) res = await api.updateCallLog(log._id, callData);
            else res = await api.createCallLog(callData);
            if (res?._id || res?.message === 'Call log created' || res?.success !== false) {
                onDone(isEdit ? 'Call log updated successfully!' : 'Call log added successfully!');
            } else {
                setError(res?.message || 'Failed to save call');
            }
        } catch { setError('Something went wrong. Please try again.'); }
        finally { setSaving(false); }
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
            <View style={M.overlay}>
                <View style={M.sheet}>
                    <View style={M.drag} />
                    <View style={M.header}>
                        <Text style={M.title}>{isEdit ? '✏️ Edit Call Log' : '📞 Add Call Log'}</Text>
                        <TouchableOpacity onPress={onClose} style={M.closeBtn}>
                            <Text style={M.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={M.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {!!error && (
                            <View style={M.errorBox}>
                                <Text style={M.errorText}>⚠️ {error}</Text>
                            </View>
                        )}

                        <View style={[M.row, { gap: rs(12) }]}>
                            <View style={[M.field, { flex: 1 }]}>
                                <Text style={M.label}>Customer Name</Text>
                                <TextInput style={M.input} value={form.customerName} onChangeText={v => set('customerName', v)} placeholder="Rahul Sharma" placeholderTextColor={C.textMuted} />
                            </View>
                            <View style={[M.field, { flex: 1 }]}>
                                <Text style={M.label}>Phone <Text style={M.req}>*</Text></Text>
                                <TextInput style={M.input} value={form.customerNumber} onChangeText={v => set('customerNumber', v)} placeholder="+91 98765 43210" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
                            </View>
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Call Type</Text>
                            <PickerRow options={callTypeOptions} value={form.callType} onChange={v => set('callType', v)} />
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Call Status</Text>
                            <PickerRow options={callStatusOptions} value={form.callStatus} onChange={v => set('callStatus', v)} />
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Disposition</Text>
                            <PickerRow options={dispositionOptions} value={form.disposition} onChange={v => set('disposition', v)} scrollable />
                        </View>

                        <View style={[M.row, { gap: rs(12) }]}>
                            <View style={[M.field, { flex: 1 }]}>
                                <Text style={M.label}>Duration (sec)</Text>
                                <TextInput style={M.input} value={form.durationSeconds} onChangeText={v => set('durationSeconds', v)} placeholder="120" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                            </View>
                            <View style={[M.field, { flex: 1 }]}>
                                <Text style={M.label}>Date & Time</Text>
                                <TextInput style={M.input} value={form.calledAt} onChangeText={v => set('calledAt', v)} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={C.textMuted} />
                            </View>
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Follow-up Date</Text>
                            <TextInput style={M.input} value={form.followUpDate} onChangeText={v => set('followUpDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Follow-up Notes</Text>
                            <TextInput style={[M.input, M.textarea]} value={form.followUpNotes} onChangeText={v => set('followUpNotes', v)} placeholder="Add follow-up notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
                        </View>

                        <View style={M.field}>
                            <Text style={M.label}>Notes</Text>
                            <TextInput style={[M.input, M.textarea]} value={form.notes} onChangeText={v => set('notes', v)} placeholder="Optional notes..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />
                        </View>
                        <View style={{ height: rs(16) }} />
                    </ScrollView>

                    <View style={M.footer}>
                        <TouchableOpacity style={M.cancelBtn} onPress={onClose}>
                            <Text style={M.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[M.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmit} disabled={saving}>
                            <Text style={M.saveText}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Call'}</Text>
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
        try { await api.deleteCallLog(log._id); onConfirm(); }
        catch { Alert.alert('Error', 'Failed to delete call log'); onClose(); }
        finally { setDeleting(false); }
    };
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={[M.overlay, { justifyContent: 'center', paddingHorizontal: rs(24) }]}>
                <View style={M.confirmSheet}>
                    <Text style={M.confirmIcon}>🗑️</Text>
                    <Text style={M.confirmTitle}>Delete Call Log?</Text>
                    <Text style={M.confirmBody}>
                        <Text style={{ fontWeight: '700', color: C.text }}>{log?.customerName || 'Unknown'}</Text>
                        {' · '}{log?.customerNumber}{'\n'}
                        This action cannot be undone.
                    </Text>
                    <View style={M.confirmBtns}>
                        <TouchableOpacity style={M.cancelBtn} onPress={onClose}>
                            <Text style={M.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[M.deleteBtn, deleting && { opacity: 0.6 }]} onPress={handleDelete} disabled={deleting}>
                            <Text style={M.saveText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ── Bulk Import Modal ─────────────────────────────────────────
const BulkImportModal = ({ visible, onClose, onDone }) => {
    const [importData, setImportData] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    const handleImport = async () => {
        if (!importData.trim()) { setError('Please paste CSV data'); return; }
        setImporting(true); setError('');
        try {
            const rows = importData.split('\n').slice(1);
            const calls = rows.filter(row => row.trim()).map(row => {
                const [customerName, customerNumber, callType, callStatus, durationSeconds, calledAt, notes] = row.split(',');
                let fmt = callType?.trim() || 'Outgoing';
                if (fmt.toLowerCase() === 'incoming') fmt = 'Incoming';
                if (fmt.toLowerCase() === 'outgoing') fmt = 'Outgoing';
                let fmtStatus = callStatus?.trim() || 'Connected';
                if (fmtStatus.toLowerCase() === 'connected') fmtStatus = 'Connected';
                if (fmtStatus.toLowerCase() === 'missed') fmtStatus = 'Missed';
                if (fmtStatus.toLowerCase() === 'rejected') fmtStatus = 'Rejected';
                let fmtDate = calledAt ? new Date(calledAt.trim()) : new Date();
                if (isNaN(fmtDate.getTime())) fmtDate = new Date();
                return {
                    customerName: customerName?.trim() || 'Unknown',
                    customerNumber: customerNumber?.trim() || '',
                    callType: fmt, callStatus: fmtStatus,
                    durationSeconds: parseInt(durationSeconds) || 0,
                    calledAt: fmtDate, notes: notes?.trim() || '',
                };
            });
            const valid = calls.filter(c => c.customerNumber);
            if (!valid.length) { setError('No valid calls to import. Check phone numbers.'); setImporting(false); return; }
            const res = await api.bulkImportCalls({ calls: valid });
            if (res.message) { Alert.alert('Success', res.message); onDone(); }
            else setError(res.message || 'Import failed');
        } catch (err) { setError('Import failed: ' + err.message); }
        finally { setImporting(false); }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={M.overlay}>
                <View style={[M.sheet, { maxHeight: '80%' }]}>
                    <View style={M.drag} />
                    <View style={M.header}>
                        <Text style={M.title}>📥 Bulk Import Calls</Text>
                        <TouchableOpacity onPress={onClose} style={M.closeBtn}>
                            <Text style={M.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={M.body} showsVerticalScrollIndicator={false}>
                        <View style={M.importHint}>
                            <Text style={M.importHintTitle}>CSV Format</Text>
                            <Text style={M.importHintText}>customerName, customerNumber, callType, callStatus, durationSeconds, calledAt, notes</Text>
                        </View>
                        <View style={M.exampleBox}>
                            <Text style={M.exampleTitle}>Example row:</Text>
                            <Text style={M.exampleText}>Rahul,9876543210,Outgoing,Connected,120,2026-04-10T10:30:00,Follow up</Text>
                        </View>
                        {!!error && <View style={M.errorBox}><Text style={M.errorText}>⚠️ {error}</Text></View>}
                        <Text style={M.inputLabel}>Paste CSV data below</Text>
                        <TextInput
                            style={M.csvInput}
                            value={importData}
                            onChangeText={setImportData}
                            placeholder={`customerName,customerNumber,callType,...\nRahul,9876543210,Outgoing,Connected,120,...`}
                            placeholderTextColor={C.textMuted}
                            multiline
                            textAlignVertical="top"
                        />
                        <View style={{ height: rs(16) }} />
                    </ScrollView>
                    <View style={M.footer}>
                        <TouchableOpacity style={M.cancelBtn} onPress={onClose}>
                            <Text style={M.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[M.saveBtn, importing && { opacity: 0.6 }]} onPress={handleImport} disabled={importing}>
                            <Text style={M.saveText}>{importing ? 'Importing…' : 'Import'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ══════════════════════════════════════════════════════
//  Main Screen
// ══════════════════════════════════════════════════════
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
                if (userStr) { const u = JSON.parse(userStr); setUserRole(u?.role || 'agent'); }
            } catch { }
            finally { setIsLoadingRole(false); }
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (userRole === 'admin' || userRole === 'super_admin') {
                    const res = await fetch(`http://192.168.1.51:5000/api/admin/users?role=agent&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
                    const data = await res.json(); setAgents(data.users || []);
                } else if (userRole === 'manager') {
                    const res = await fetch(`http://192.168.1.51:5000/api/manager/team?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
                    const data = await res.json(); setAgents(data.members || []);
                }
            } catch { }
        };
        if (userRole && !isLoadingRole) fetchAgents();
    }, [userRole, isLoadingRole]);

    const canAddCalls = ['agent', 'team_leader', 'admin', 'super_admin', 'employee'].includes(userRole);
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const canDelete = userRole === 'super_admin';
    const isManager = userRole === 'manager';
    const canViewAll = isAdmin || isManager;

    const applyPreset = (preset) => { const { from, to } = getPresetDates(preset); setDateFrom(from); setDateTo(to); setActivePreset(preset); setPage(1); };
    const resetFilters = () => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setDateFrom(''); setDateTo(''); setActivePreset(''); setSelectedAgent(''); setPage(1); };
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
            if (search?.trim()) params.search = search.trim();
            if (typeFilter !== 'All') params.callType = typeFilter;
            if (statusFilter !== 'All') params.callStatus = statusFilter;
            if (dateFrom?.trim()) params.dateFrom = dateFrom;
            if (dateTo?.trim()) params.dateTo = dateTo;
            if (selectedAgent?.trim()) params.agentId = selectedAgent;

            const response = await api.getCallLogs(params);
            let logsData = [];
            let paginationData = { total: 0, pages: 1, page: currentPage, limit: 20 };

            if (response?.success === false) { setError(response.message); }
            else if (response?.logs) { logsData = response.logs; paginationData = response.pagination || paginationData; }
            else if (response?.data) { logsData = response.data; paginationData = response.pagination || response.meta || paginationData; }
            else if (Array.isArray(response)) { logsData = response; paginationData.total = response.length; paginationData.pages = Math.ceil(response.length / 20); }

            if (reset || currentPage === 1) setLogs(logsData);
            else setLogs(prev => [...prev, ...logsData]);
            setPagination(paginationData);

            try {
                const statsParams = {};
                if (search?.trim()) statsParams.search = search.trim();
                if (typeFilter !== 'All') statsParams.callType = typeFilter;
                if (statusFilter !== 'All') statsParams.callStatus = statusFilter;
                if (dateFrom?.trim()) statsParams.dateFrom = dateFrom;
                if (dateTo?.trim()) statsParams.dateTo = dateTo;
                if (selectedAgent?.trim()) statsParams.agentId = selectedAgent;
                const statsRes = await api.getCallStats(statsParams);
                if (statsRes?.success !== false) setStats(statsRes);
            } catch { }
        } catch (err) { setError(err.message || 'Network error. Please try again.'); }
        finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
    }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);

    useEffect(() => { setPage(1); fetchCalls(true); }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortField, sortDir, selectedAgent]);
    useEffect(() => { if (page > 1) fetchCalls(false); }, [page]);

    const onRefresh = () => { setRefreshing(true); setPage(1); fetchCalls(true); };
    const loadMore = () => { if (page < pagination.pages && !loadingMore && !loading) { setLoadingMore(true); setPage(p => p + 1); } };

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

    const renderCallItem = ({ item, index }) => (
        <View style={S.callCard}>
            <View style={S.callCardTop}>
                <Avatar name={item.customerName} index={index} />
                <View style={S.callInfo}>
                    <Text style={S.callName} numberOfLines={1}>{item.customerName || 'Unknown'}</Text>
                    <Text style={S.callNumber}>{item.customerNumber || '—'}</Text>
                    <Text style={S.callDate}>{fmtDate(item.calledAt)} · {fmtTime(item.calledAt)}</Text>
                </View>
                <View style={S.callRight}>
                    <Text style={S.callDuration}>⏱ {fmtDuration(item.durationSeconds)}</Text>
                    <View style={S.actionRow}>
                        <TouchableOpacity onPress={() => setEditLog(item)} style={S.editBtn} activeOpacity={0.8}>
                            <Text style={S.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        {canDelete && (
                            <TouchableOpacity onPress={() => setDeleteLog(item)} style={S.delBtn} activeOpacity={0.8}>
                                <Text style={S.delBtnText}>Del</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
            <View style={S.callCardBottom}>
                <TypeBadge type={item.callType} />
                <StatusBadge status={item.callStatus} />
                {!!item.disposition && <DispositionBadge disposition={item.disposition} />}
            </View>
        </View>
    );

    const statsItems = stats ? [
        { label: 'Total', value: pagination.total, icon: '📞', color: C.primary },
        { label: 'Incoming', value: stats.incoming ?? stats.incomingCalls ?? 0, icon: '↙️', color: C.blue },
        { label: 'Outgoing', value: stats.outgoing ?? stats.outgoingCalls ?? 0, icon: '↗️', color: C.purple },
        { label: 'Connected', value: stats.connected ?? stats.connectedCalls ?? 0, icon: '✅', color: C.green },
        { label: 'Missed', value: stats.missed ?? stats.missedCalls ?? 0, icon: '❌', color: C.red },
        { label: 'Today', value: stats.todayCalls ?? stats.today ?? 0, icon: '📅', color: C.amber },
    ] : [];

    if (isLoadingRole) return (
        <View style={S.center}>
            <ActivityIndicator size="large" color={C.primary} />
        </View>
    );

    return (
        <View style={S.container}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ─────────────────────────────── */}
            <View style={S.header}>
                <View>
                    <Text style={S.title}>Call Logs</Text>
                    <Text style={S.subtitle}>{pagination.total.toLocaleString()} total records</Text>
                </View>
                <View style={S.headerBtns}>
                    <TouchableOpacity style={S.iconBtn} onPress={onRefresh} activeOpacity={0.8}>
                        <Text style={S.iconBtnText}>🔄</Text>
                    </TouchableOpacity>
                    {canViewAll && (
                        <TouchableOpacity style={S.iconBtn} onPress={downloadCSV} activeOpacity={0.8}>
                            <Text style={S.iconBtnText}>⬇️</Text>
                        </TouchableOpacity>
                    )}
                    {canAddCalls && (
                        <>
                            <TouchableOpacity style={S.iconBtn} onPress={() => setShowImportModal(true)} activeOpacity={0.8}>
                                <Text style={S.iconBtnText}>📥</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={S.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.88}>
                                <Text style={S.addBtnText}>+ Add</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* ── Stats Strip ────────────────────────── */}
            {stats && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={S.statsStrip}
                    contentContainerStyle={{ paddingHorizontal: rs(16), gap: rs(8) }}
                >
                    {statsItems.map(s => <StatCard key={s.label} {...s} />)}
                </ScrollView>
            )}

            {/* ── Search ─────────────────────────────── */}
            <View style={S.searchBox}>
                <Text style={S.searchIcon}>🔍</Text>
                <TextInput
                    style={S.searchInput}
                    placeholder="Search name or number…"
                    placeholderTextColor={C.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {!!search && (
                    <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={S.clearIcon}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Filters ────────────────────────────── */}
            <View style={S.filterArea}>
                {(isAdmin || isManager) && agents.length > 0 && (
                    <View style={S.filterRow}>
                        <Text style={S.filterLabel}>Agent</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(6), paddingRight: rs(12) }}>
                            <FilterChip label="All" active={!selectedAgent} onPress={() => { setSelectedAgent(''); setPage(1); }} />
                            {agents.map(a => <FilterChip key={a._id} label={a.name} active={selectedAgent === a._id} onPress={() => { setSelectedAgent(a._id); setPage(1); }} />)}
                        </ScrollView>
                    </View>
                )}

                <View style={S.filterRow}>
                    <Text style={S.filterLabel}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(6), paddingRight: rs(12) }}>
                        {['All', 'Incoming', 'Outgoing'].map(t => <FilterChip key={t} label={t} active={typeFilter === t} onPress={() => { setTypeFilter(t); setPage(1); }} />)}
                    </ScrollView>
                </View>

                <View style={S.filterRow}>
                    <Text style={S.filterLabel}>Status</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(6), paddingRight: rs(12) }}>
                        {['All', 'Connected', 'Missed', 'Rejected'].map(t => <FilterChip key={t} label={t} active={statusFilter === t} onPress={() => { setStatusFilter(t); setPage(1); }} />)}
                    </ScrollView>
                </View>

                <View style={S.filterRow}>
                    <Text style={S.filterLabel}>Range</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: rs(6), paddingRight: rs(12) }}>
                        {[{ key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' }, { key: 'last7', label: 'Last 7d' }, { key: 'last30', label: 'Last 30d' }].map(p => (
                            <FilterChip key={p.key} label={p.label} active={activePreset === p.key} onPress={() => applyPreset(p.key)} />
                        ))}
                    </ScrollView>
                </View>

                <View style={S.dateRow}>
                    <TextInput style={S.dateInput} placeholder="From YYYY-MM-DD" value={dateFrom} onChangeText={setDateFrom} placeholderTextColor={C.textMuted} />
                    <Text style={S.dateArrow}>→</Text>
                    <TextInput style={S.dateInput} placeholder="To YYYY-MM-DD" value={dateTo} onChangeText={setDateTo} placeholderTextColor={C.textMuted} />
                </View>

                {hasFilters && (
                    <TouchableOpacity onPress={resetFilters} style={S.resetBtn} activeOpacity={0.8}>
                        <Text style={S.resetText}>✕ Clear all filters</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── List / States ──────────────────────── */}
            {loading && !refreshing ? (
                <View style={S.center}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={S.loadingText}>Loading call logs…</Text>
                </View>
            ) : error && logs.length === 0 ? (
                <View style={S.center}>
                    <Text style={S.stateEmoji}>⚠️</Text>
                    <Text style={S.stateTitle}>Failed to load</Text>
                    <Text style={S.stateBody}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchCalls(true)} style={S.retryBtn} activeOpacity={0.8}>
                        <Text style={S.retryText}>Try Again</Text>
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
                    contentContainerStyle={S.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: rs(20) }} color={C.primary} /> : null}
                    ListEmptyComponent={!loading && (
                        <View style={S.emptyState}>
                            <Text style={S.stateEmoji}>📞</Text>
                            <Text style={S.stateTitle}>No call logs found</Text>
                            {hasFilters && (
                                <TouchableOpacity onPress={resetFilters} style={S.retryBtn}>
                                    <Text style={S.retryText}>Clear filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            )}

            {/* ── Pagination ─────────────────────────── */}
            {pagination.pages > 1 && !loading && (
                <View style={S.pagination}>
                    <TouchableOpacity style={[S.pageBtn, page === 1 && S.pageBtnOff]} onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <Text style={[S.pageBtnText, page === 1 && S.pageBtnTextOff]}>← Prev</Text>
                    </TouchableOpacity>
                    <Text style={S.pageInfo}>Page {page} of {pagination.pages}</Text>
                    <TouchableOpacity style={[S.pageBtn, page === pagination.pages && S.pageBtnOff]} onPress={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
                        <Text style={[S.pageBtnText, page === pagination.pages && S.pageBtnTextOff]}>Next →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Modals ─────────────────────────────── */}
            <CallModal visible={showAddModal} onClose={() => setShowAddModal(false)} onDone={onDone} />
            <CallModal visible={!!editLog} onClose={() => setEditLog(null)} onDone={onDone} log={editLog} />
            <DeleteConfirmModal visible={!!deleteLog} onClose={() => setDeleteLog(null)} onConfirm={() => onDone('Call log deleted')} log={deleteLog} />
            <BulkImportModal visible={showImportModal} onClose={() => setShowImportModal(false)} onDone={() => onDone('Calls imported!')} />
        </View>
    );
}

// ── Screen Styles ─────────────────────────────────────────────
const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: rs(10), padding: rs(24) },
    loadingText: { fontSize: fs(14), color: C.textSub },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: rs(16),
        paddingTop: Platform.OS === 'ios' ? rs(56) : rs(24),
        paddingBottom: rs(14),
        backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
        ...shadow,
    },
    title: { fontSize: fs(22), fontWeight: '800', color: C.text, letterSpacing: -0.3 },
    subtitle: { fontSize: fs(12), color: C.textSub, marginTop: rs(2), fontWeight: '500' },
    headerBtns: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
    iconBtn: {
        width: rs(36), height: rs(36), borderRadius: rs(10),
        backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    iconBtnText: { fontSize: fs(16) },
    addBtn: {
        backgroundColor: C.primary, paddingHorizontal: rs(16),
        paddingVertical: rs(9), borderRadius: rs(10), ...shadow,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: fs(13) },

    // Stats strip
    statsStrip: {
        maxHeight: rs(110), backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
        paddingVertical: rs(10),
    },
    statCard: {
        alignItems: 'center', backgroundColor: C.surface,
        borderRadius: rs(12), paddingHorizontal: rs(14), paddingVertical: rs(12),
        borderTopWidth: 3, borderWidth: 1, borderColor: C.border,
        minWidth: rs(80), ...shadow,
    },
    statIcon: { fontSize: fs(16), marginBottom: rs(4) },
    statValue: { fontSize: fs(18), fontWeight: '800', lineHeight: fs(22) },
    statLabel: { fontSize: fs(10), color: C.textSub, marginTop: rs(2), fontWeight: '600' },

    // Search
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, marginHorizontal: rs(16), marginTop: rs(12),
        borderRadius: rs(14), paddingHorizontal: rs(14), paddingVertical: rs(11),
        borderWidth: 1.5, borderColor: C.border, gap: rs(8), ...shadow,
    },
    searchIcon: { fontSize: fs(15) },
    searchInput: { flex: 1, fontSize: fs(14), color: C.text, paddingVertical: 0 },
    clearIcon: { fontSize: fs(14), color: C.textMuted, fontWeight: '600' },

    // Filter panel
    filterArea: {
        backgroundColor: C.surface, marginHorizontal: rs(16), marginTop: rs(8),
        borderRadius: rs(14), paddingVertical: rs(10), paddingHorizontal: rs(12),
        borderWidth: 1, borderColor: C.border, gap: rs(8), ...shadow,
    },
    filterRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
    filterLabel: { fontSize: fs(11), fontWeight: '700', color: C.textMuted, width: rs(48), letterSpacing: 0.3 },
    chip: {
        paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: rs(20),
        backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
    },
    chipActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
    chipText: { fontSize: fs(12), color: C.textSub, fontWeight: '600' },
    chipTextActive: { color: C.primary, fontWeight: '700' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(2) },
    dateInput: {
        flex: 1, backgroundColor: C.surfaceAlt, borderRadius: rs(10),
        borderWidth: 1, borderColor: C.border,
        paddingHorizontal: rs(10), paddingVertical: rs(8),
        fontSize: fs(12), color: C.text,
    },
    dateArrow: { color: C.textMuted, fontSize: fs(14), fontWeight: '700' },
    resetBtn: { alignSelf: 'flex-start', paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(20), backgroundColor: C.redSoft },
    resetText: { color: C.red, fontSize: fs(12), fontWeight: '700' },

    // Call cards
    listContent: { padding: rs(16), gap: rs(10), paddingBottom: rs(24) },
    callCard: {
        backgroundColor: C.surface, borderRadius: rs(16), padding: rs(14),
        borderWidth: 1, borderColor: C.border, ...shadow,
    },
    callCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), marginBottom: rs(10) },
    avatar: { width: rs(42), height: rs(42), borderRadius: rs(21), justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: fs(15) },
    callInfo: { flex: 1, minWidth: 0 },
    callName: { fontSize: fs(15), fontWeight: '700', color: C.text, flexShrink: 1 },
    callNumber: { fontSize: fs(13), color: C.textSub, marginTop: rs(2) },
    callDate: { fontSize: fs(11), color: C.textMuted, marginTop: rs(3) },
    callRight: { alignItems: 'flex-end', gap: rs(6), flexShrink: 0 },
    callDuration: { fontSize: fs(12), color: C.textSub, fontWeight: '600', textAlign: 'right' },
    actionRow: { flexDirection: 'row', gap: rs(6) },
    editBtn: { paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(8), backgroundColor: C.primarySoft },
    editBtnText: { color: C.primary, fontWeight: '700', fontSize: fs(12) },
    delBtn: { paddingHorizontal: rs(10), paddingVertical: rs(5), borderRadius: rs(8), backgroundColor: C.redSoft },
    delBtnText: { color: C.red, fontWeight: '700', fontSize: fs(12) },
    callCardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), paddingTop: rs(8), borderTopWidth: 1, borderTopColor: C.border },

    // Badges
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20), gap: rs(4) },
    statusDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
    badgeText: { fontSize: fs(11), fontWeight: '700' },
    dispBadge: { paddingHorizontal: rs(9), paddingVertical: rs(4), borderRadius: rs(20) },
    dispText: { fontSize: fs(11), fontWeight: '600' },

    // Empty / error states
    emptyState: { alignItems: 'center', padding: rs(48), gap: rs(8) },
    stateEmoji: { fontSize: rs(48) },
    stateTitle: { fontSize: fs(17), fontWeight: '700', color: C.text },
    stateBody: { fontSize: fs(14), color: C.textSub, textAlign: 'center' },
    retryBtn: { backgroundColor: C.primarySoft, paddingHorizontal: rs(20), paddingVertical: rs(10), borderRadius: rs(20), marginTop: rs(8) },
    retryText: { color: C.primary, fontWeight: '700', fontSize: fs(14) },

    // Pagination
    pagination: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: rs(16), paddingVertical: rs(12),
        backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    },
    pageBtn: { paddingHorizontal: rs(16), paddingVertical: rs(8), borderRadius: rs(10), backgroundColor: C.primarySoft },
    pageBtnOff: { backgroundColor: C.surfaceAlt },
    pageBtnText: { color: C.primary, fontWeight: '700', fontSize: fs(13) },
    pageBtnTextOff: { color: C.textMuted },
    pageInfo: { fontSize: fs(13), color: C.textSub, fontWeight: '600' },
});

// ── Modal Styles ──────────────────────────────────────────────
const M = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(13, 20, 38, 0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: C.surface, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), maxHeight: '92%', ...shadowMd },
    drag: { width: rs(40), height: rs(4), borderRadius: rs(2), backgroundColor: C.border, alignSelf: 'center', marginTop: rs(12) },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: rs(20), paddingVertical: rs(16), borderBottomWidth: 1, borderBottomColor: C.border },
    title: { fontSize: fs(17), fontWeight: '800', color: C.text },
    closeBtn: { width: rs(30), height: rs(30), borderRadius: rs(15), backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
    closeText: { color: C.textSub, fontWeight: '700', fontSize: fs(14) },
    body: { padding: rs(20) },
    row: { flexDirection: 'row' },
    field: { marginBottom: rs(14) },
    label: { fontSize: fs(12), fontWeight: '700', color: C.textSub, marginBottom: rs(6), textTransform: 'uppercase', letterSpacing: 0.3 },
    req: { color: C.red },
    input: { backgroundColor: C.surfaceAlt, borderRadius: rs(12), borderWidth: 1.5, borderColor: C.border, paddingHorizontal: rs(14), paddingVertical: rs(12), fontSize: fs(14), color: C.text },
    textarea: { minHeight: rs(80), textAlignVertical: 'top' },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
    pickerOpt: { paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: rs(10), backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
    pickerOptActive: { backgroundColor: C.primarySoft, borderColor: C.primary },
    pickerOptText: { fontSize: fs(13), color: C.textSub, fontWeight: '600' },
    pickerOptTextActive: { color: C.primary, fontWeight: '700' },
    errorBox: { backgroundColor: C.redSoft, borderRadius: rs(10), padding: rs(12), marginBottom: rs(12) },
    errorText: { color: C.red, fontSize: fs(13), fontWeight: '600' },
    footer: { flexDirection: 'row', padding: rs(16), gap: rs(12), borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === 'ios' ? rs(32) : rs(16) },
    cancelBtn: { flex: 1, paddingVertical: rs(14), borderRadius: rs(14), alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
    cancelText: { color: C.textSub, fontWeight: '700', fontSize: fs(15) },
    saveBtn: { flex: 2, paddingVertical: rs(14), borderRadius: rs(14), alignItems: 'center', backgroundColor: C.primary, ...shadow },
    saveText: { color: '#fff', fontWeight: '700', fontSize: fs(15) },

    // Delete confirm (center modal)
    confirmSheet: { backgroundColor: C.surface, borderRadius: rs(24), padding: rs(28), alignItems: 'center', ...shadowMd },
    confirmIcon: { fontSize: rs(44), marginBottom: rs(12) },
    confirmTitle: { fontSize: fs(20), fontWeight: '800', color: C.text, marginBottom: rs(8) },
    confirmBody: { fontSize: fs(14), color: C.textSub, textAlign: 'center', lineHeight: fs(22), marginBottom: rs(24) },
    confirmBtns: { flexDirection: 'row', gap: rs(12), width: '100%' },
    deleteBtn: { flex: 1, paddingVertical: rs(14), borderRadius: rs(14), alignItems: 'center', backgroundColor: C.red },

    // Import modal
    importHint: { backgroundColor: C.primarySoft, borderRadius: rs(12), padding: rs(14), marginBottom: rs(8), borderWidth: 1, borderColor: C.primaryMid, gap: rs(4) },
    importHintTitle: { color: C.primary, fontSize: fs(13), fontWeight: '800' },
    importHintText: { color: C.primary, fontSize: fs(12), fontWeight: '600' },
    exampleBox: { backgroundColor: C.surfaceAlt, borderRadius: rs(8), padding: rs(10), marginBottom: rs(12), borderWidth: 1, borderColor: C.border },
    exampleTitle: { fontSize: fs(11), fontWeight: '700', color: C.text, marginBottom: rs(4) },
    exampleText: { fontSize: fs(11), color: C.textSub, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    inputLabel: { fontSize: fs(12), fontWeight: '700', color: C.textSub, marginBottom: rs(8) },
    csvInput: {
        backgroundColor: C.surfaceAlt, borderRadius: rs(12), borderWidth: 1.5, borderColor: C.border,
        padding: rs(14), fontSize: fs(12), color: C.text, minHeight: rs(160),
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: fs(18),
    },
});