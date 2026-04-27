import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
 
const getToken = async () => AsyncStorage.getItem("token");
 
const authHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};
 
export const api = {
 
    // ── AUTH ──────────────────────────────────────────────
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    },
 
    forgotPassword: async (email) => {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return res.json();
    },
 
    // ── ADMIN STATS ───────────────────────────────────────
    getAdminStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
        return res.json();
    },
 
    getAdminRecentUsers: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/recent-users`, { headers });
        return res.json();
    },
 
    // ── ADMIN USERS ───────────────────────────────────────
    getUsers: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.search && { search: params.search }),
            ...(params.role && params.role !== 'All' && { role: params.role }),
            ...(params.page && { page: params.page }),
        });
        const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, { headers });
        return res.json();
    },
 
    createUser: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
 
    updateUser: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
 
    deleteUser: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE', headers,
        });
        return res.json();
    },
 
    // ── ADMIN SETTINGS ────────────────────────────────────
    getAdminSettings: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers });
        return res.json();
    },
 
    updateAdminSettings: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
 
    // ── CALL LOGS ─────────────────────────────────────────
    getCallLogs: async (params = {}) => {
        const headers = await authHeaders();
        const queryParams = new URLSearchParams();
        queryParams.append('page', params.page || 1);
        queryParams.append('limit', params.limit || 20);
        queryParams.append('sortField', params.sortField || 'calledAt');
        queryParams.append('sortDir', params.sortDir || 'desc');
        if (params.search?.trim()) queryParams.append('search', params.search.trim());
        if (params.callType && params.callType !== 'All') queryParams.append('callType', params.callType);
        if (params.callStatus && params.callStatus !== 'All') queryParams.append('callStatus', params.callStatus);
        if (params.dateFrom?.trim()) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo?.trim()) queryParams.append('dateTo', params.dateTo);
        if (params.agentId?.trim()) queryParams.append('agentId', params.agentId);
        const res = await fetch(`${API_BASE_URL}/calls?${queryParams.toString()}`, { headers });
        return res.json();
    },
 
    getCallStats: async (params = {}) => {
        const headers = await authHeaders();
        const queryParams = new URLSearchParams();
        if (params.callType) queryParams.append('callType', params.callType);
        if (params.callStatus) queryParams.append('callStatus', params.callStatus);
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params.agentId) queryParams.append('agentId', params.agentId);
        if (params.search) queryParams.append('search', params.search);
        const q = queryParams.toString();
        const res = await fetch(`${API_BASE_URL}/calls/stats${q ? "?" + q : ""}`, { headers });
        return res.json();
    },
 
    createCallLog: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls`, {
            method: 'POST', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
 
    updateCallLog: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
 
    deleteCallLog: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'DELETE', headers,
        });
        return res.json();
    },
 
    getPendingFollowUps: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/follow-ups`, { headers });
        return res.json();
    },
 
    // ── DEVICE SYNC ───────────────────────────────────────
    syncDeviceCallLogs: async (calls) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ calls, source: 'device_sync' }),
        });
        return res.json();
    },
 
    bulkCreateCallLogs: async (calls) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ calls }),
        });
        return res.json();
    },
 
    getSyncStatus: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/sync-status`, { headers });
        return res.json();
    },
 
    // ── LEADERBOARD ───────────────────────────────────────
    getLeaderboard: async (period = 'weekly') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
        return res.json();
    },
 
    // ── REPORTS ───────────────────────────────────────────
    getReports: async (period = 'month') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/reports/summary?period=${period}`, { headers });
        return res.json();
    },
 
    // ── BUSINESS USER — TEAM CALL STATS ──────────────────
    getTeamCallStats: async (params = {}) => {
        const headers = await authHeaders();
        const queryParams = new URLSearchParams();
        if (params.date) queryParams.append('date', params.date);
        if (params.agentId) queryParams.append('agentId', params.agentId);
        const q = queryParams.toString();
        const res = await fetch(`${API_BASE_URL}/calls/team-stats${q ? "?" + q : ""}`, { headers });
        return res.json();
    },
 
};
