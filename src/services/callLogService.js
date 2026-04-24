import { Platform, PermissionsAndroid, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import { API_BASE_URL } from '../config';

const LAST_SYNC_KEY = '@callyzer:lastSyncTs';
const SYNC_LOCK_KEY = '@callyzer:syncLock';
const BG_TASK_NAME = 'CALLYZER_CALL_SYNC';

// ── Auth headers — same pattern as api.js ─────────────
const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// ─────────────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────────────

export const checkCallLogPermissions = async () => {
    if (Platform.OS !== 'android') return false;
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
};

export const requestCallLogPermissions = async () => {
    if (Platform.OS !== 'android') {
        return { granted: false, reason: 'Android only' };
    }
    try {
        const readCallLog = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
            {
                title: 'Call Log Access',
                message:
                    'CallyzerApp needs your call history to automatically sync ' +
                    'call activity with your team dashboard.',
                buttonNeutral: 'Ask Later',
                buttonNegative: 'Deny',
                buttonPositive: 'Allow',
            }
        );
        const readPhoneState = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            {
                title: 'Phone State Access',
                message: 'CallyzerApp needs phone state access to detect calls in real-time.',
                buttonNeutral: 'Ask Later',
                buttonNegative: 'Deny',
                buttonPositive: 'Allow',
            }
        );
        const granted =
            readCallLog === PermissionsAndroid.RESULTS.GRANTED &&
            readPhoneState === PermissionsAndroid.RESULTS.GRANTED;

        return {
            granted,
            readCallLog,
            readPhoneState,
            reason: granted ? null : 'Permission denied',
        };
    } catch (err) {
        return { granted: false, reason: err.message };
    }
};

// ─────────────────────────────────────────────────────
// CALL TYPE / STATUS MAPPING
// ─────────────────────────────────────────────────────

const TYPE_INT_MAP = {
    1: 'Incoming',
    2: 'Outgoing',
    3: 'Missed',
    4: 'Voicemail',
    5: 'Rejected',
    6: 'Blocked',
};

const mapCallType = (rawType, rawTypeStr) => {
    const byInt = TYPE_INT_MAP[parseInt(rawType)];
    if (byInt) return byInt;
    const u = (rawTypeStr || '').toUpperCase();
    if (u.includes('INCOMING')) return 'Incoming';
    if (u.includes('OUTGOING')) return 'Outgoing';
    if (u.includes('MISSED')) return 'Missed';
    if (u.includes('REJECTED')) return 'Rejected';
    return 'Incoming';
};

const mapCallStatus = (callType, durationSec) => {
    if (['Missed', 'Voicemail'].includes(callType)) return 'Missed';
    if (['Rejected', 'Blocked'].includes(callType)) return 'Rejected';
    return durationSec === 0 ? 'Missed' : 'Connected';
};

// ─────────────────────────────────────────────────────
// READ DEVICE CALL LOGS
// ─────────────────────────────────────────────────────

// export const readDeviceCallLogs = async (maxCount = 150, daysBack = 7) => {
//     if (Platform.OS !== 'android') {
//         throw new Error('readDeviceCallLogs is Android-only');
//     }

//     const hasPerm = await checkCallLogPermissions();
//     if (!hasPerm) {
//         const res = await requestCallLogPermissions();
//         if (!res.granted) throw new Error('READ_CALL_LOG permission denied');
//     }

//     const CallLogs = require('react-native-call-log').default;
//     const cutoffMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;

//     const raw = await CallLogs.loadAll(String(maxCount), {
//         minTimestamp: String(cutoffMs),
//     });

export const readDeviceCallLogs = async (maxCount = 150, daysBack = 7) => {
    if (Platform.OS !== 'android') {
        throw new Error('readDeviceCallLogs is Android-only');
    }

    const hasPerm = await checkCallLogPermissions();
    if (!hasPerm) {
        const res = await requestCallLogPermissions();
        if (!res.granted) throw new Error('READ_CALL_LOG permission denied');
    }

    // Safe import with null check
    let CallLogsModule;
    try {
        const mod = require('react-native-call-log');
        CallLogsModule = mod.default || mod;
    } catch (e) {
        throw new Error('react-native-call-log not installed. Run: npm install react-native-call-log');
    }

    if (!CallLogsModule || typeof CallLogsModule.loadAll !== 'function') {
        throw new Error('react-native-call-log module loaded but loadAll not found. Rebuild the app.');
    }

    const cutoffMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const raw = await CallLogsModule.loadAll(String(maxCount), {
        minTimestamp: String(cutoffMs),
    });

    return (raw || []).map((log) => {
        const duration = parseInt(log.duration) || 0;
        const callType = mapCallType(log.rawType, log.type);
        const callStatus = mapCallStatus(callType, duration);
        const ts = parseInt(log.timestamp);
        const phone = (log.phoneNumber || log.number || '').replace(/\D/g, '');

        return {
            customerNumber: log.phoneNumber || log.number || '',
            customerName: log.name || log.cachedName || 'Unknown',
            callType,
            callStatus,
            durationSeconds: duration,
            calledAt: new Date(ts).toISOString(),
            source: 'device_sync',
            deviceLogId: `device_${ts}_${phone}`,
        };
    });
};

// ─────────────────────────────────────────────────────
// SYNC ENGINE
// ─────────────────────────────────────────────────────

export const syncCallLogsToBackend = async ({ silent = false } = {}) => {
    // Prevent concurrent syncs
    const lock = await AsyncStorage.getItem(SYNC_LOCK_KEY);
    if (lock === 'true') return { skipped: true, reason: 'Sync already in progress' };

    try {
        await AsyncStorage.setItem(SYNC_LOCK_KEY, 'true');

        if (Platform.OS !== 'android') return { success: false, reason: 'Android only' };

        const hasPerm = await checkCallLogPermissions();
        if (!hasPerm) return { success: false, reason: 'Missing READ_CALL_LOG permission' };

        const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
        const lastSyncTs = lastSyncStr ? parseInt(lastSyncStr) : 0;
        const daysBack = lastSyncTs
            ? Math.min(30, Math.ceil((Date.now() - lastSyncTs) / 86400000) + 1)
            : 7;

        if (!silent) console.log(`[Sync] Reading last ${daysBack} day(s)...`);

        const deviceLogs = await readDeviceCallLogs(200, daysBack);

        if (!deviceLogs.length) {
            await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
            return { success: true, synced: 0, total: 0, message: 'No calls on device' };
        }

        const newLogs = lastSyncTs
            ? deviceLogs.filter(l => new Date(l.calledAt).getTime() > lastSyncTs)
            : deviceLogs;

        if (!newLogs.length) {
            await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
            return { success: true, synced: 0, total: deviceLogs.length, message: 'Already up to date' };
        }

        if (!silent) console.log(`[Sync] Uploading ${newLogs.length} call(s)...`);

        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ calls: newLogs }),
        });
        const data = await res.json();

        if (res.ok && data.success !== false) {
            await AsyncStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
            const synced = data.imported ?? data.count ?? newLogs.length;
            if (!silent) console.log(`[Sync] SUCCESS - ${synced} call(s) synced`);
            return {
                success: true,
                synced,
                total: deviceLogs.length,
                message: `Synced ${synced} call${synced !== 1 ? 's' : ''}`,
            };
        }

        if (!silent) console.warn('[Sync] Backend error:', data);
        return { success: false, reason: data.message || `HTTP ${res.status}` };

    } catch (err) {
        if (!silent) console.error('[Sync] Exception:', err);
        return { success: false, reason: err.message || 'Unknown error' };
    } finally {
        await AsyncStorage.setItem(SYNC_LOCK_KEY, 'false');
    }
};

export const getLastSyncTime = async () => {
    const ts = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return ts ? new Date(parseInt(ts)) : null;
};

export const resetSyncState = async () => {
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    await AsyncStorage.setItem(SYNC_LOCK_KEY, 'false');
};

// ─────────────────────────────────────────────────────
// BACKGROUND SYNC  (expo-background-fetch)
// ─────────────────────────────────────────────────────

// defineTask MUST run at module top-level before any UI renders.
// App.js imports this file unconditionally to ensure this.
TaskManager.defineTask(BG_TASK_NAME, async () => {
    try {
        console.log('[BG] Background sync task fired');
        await syncCallLogsToBackend({ silent: true });
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
        console.error('[BG] Error:', err);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export const registerBackgroundSync = async () => {
    try {
        const status = await BackgroundFetch.getStatusAsync();
        if (
            status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
            status === BackgroundFetch.BackgroundFetchStatus.Denied
        ) {
            console.warn('[BG] Not available on this device');
            return false;
        }
        await BackgroundFetch.registerTaskAsync(BG_TASK_NAME, {
            minimumInterval: 15 * 60,   // 15 minutes
            stopOnTerminate: false,     // keep alive after app killed
            startOnBoot: true,      // restart after device reboot
        });
        console.log('[BG] Registered successfully');
        return true;
    } catch (err) {
        if (err.message?.includes('already registered')) return true;
        console.error('[BG] Registration failed:', err);
        return false;
    }
};

export const unregisterBackgroundSync = async () => {
    try { await BackgroundFetch.unregisterTaskAsync(BG_TASK_NAME); } catch (_) { }
};

export const isBackgroundSyncRegistered = async () => {
    try { return await TaskManager.isTaskRegisteredAsync(BG_TASK_NAME); }
    catch (_) { return false; }
};

// ─────────────────────────────────────────────────────
// REAL-TIME SYNC via AppState
// ─────────────────────────────────────────────────────
// No external package needed — uses React Native's built-in AppState.
// When user makes/receives a call, they leave the app (background).
// When they come back (active), we trigger sync automatically.
// This reliably catches all call endings on Android.
// ─────────────────────────────────────────────────────

let _appStateSub = null;
let _lastAppState = AppState.currentState;

export const startPhoneStateListener = async (onCallEnded = null) => {
    if (Platform.OS !== 'android') {
        console.warn('[PhoneState] Android only');
        return;
    }
    if (_appStateSub) {
        console.log('[PhoneState] Already active');
        return;
    }

    _lastAppState = AppState.currentState;

    _appStateSub = AppState.addEventListener('change', async (nextState) => {
        // App came to foreground from background/inactive (user returned after a call)
        if (
            (_lastAppState === 'background' || _lastAppState === 'inactive') &&
            nextState === 'active'
        ) {
            console.log('[PhoneState] App foregrounded — triggering sync in 1s');
            setTimeout(async () => {
                const result = await syncCallLogsToBackend({ silent: false });
                console.log('[PhoneState] Foreground sync result:', result);
                if (onCallEnded) onCallEnded(result);
            }, 1000);
        }
        _lastAppState = nextState;
    });

    console.log('[PhoneState] AppState listener started');
};

export const stopPhoneStateListener = () => {
    if (_appStateSub) {
        _appStateSub.remove?.();
        _appStateSub = null;
        _lastAppState = AppState.currentState;
        console.log('[PhoneState] AppState listener stopped');
    }
};

export const isPhoneStateListenerActive = () => !!_appStateSub;

// ─────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────
export default {
    checkCallLogPermissions,
    requestCallLogPermissions,
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
};
