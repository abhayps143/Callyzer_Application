// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_BASE_URL } from '../config';
 
// const getToken = async () => AsyncStorage.getItem("token");
 
// const authHeaders = async () => {
//     const token = await getToken();
//     return {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//     };
// };
 
// export const api = {
 
//     // ── AUTH ──────────────────────────────────────────────
//     login: async (email, password) => {
//         const res = await fetch(`${API_BASE_URL}/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email, password }),
//         });
//         return res.json();
//     },
 
//     forgotPassword: async (email) => {
//         const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email }),
//         });
//         return res.json();
//     },
 
//     // ── ADMIN STATS ───────────────────────────────────────
//     getAdminStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
//         return res.json();
//     },
 
//     getAdminRecentUsers: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/recent-users`, { headers });
//         return res.json();
//     },
 
//     // ── ADMIN USERS ───────────────────────────────────────
//     getUsers: async (params = {}) => {
//         const headers = await authHeaders();
//         const query = new URLSearchParams({
//             ...(params.search && { search: params.search }),
//             ...(params.role && params.role !== 'All' && { role: params.role }),
//             ...(params.page && { page: params.page }),
//         });
//         const res = await fetch(`${API_BASE_URL}/admin/users?${query}`, { headers });
//         return res.json();
//     },
 
//     createUser: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users`, {
//             method: 'POST', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
 
//     updateUser: async (id, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
 
//     deleteUser: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
//             method: 'DELETE', headers,
//         });
//         return res.json();
//     },
 
//     // ── ADMIN SETTINGS ────────────────────────────────────
//     getAdminSettings: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers });
//         return res.json();
//     },
 
//     updateAdminSettings: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/settings`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
 
//     // ── CALL LOGS ─────────────────────────────────────────
//     getCallLogs: async (params = {}) => {
//         const headers = await authHeaders();
//         const queryParams = new URLSearchParams();
//         queryParams.append('page', params.page || 1);
//         queryParams.append('limit', params.limit || 20);
//         queryParams.append('sortField', params.sortField || 'calledAt');
//         queryParams.append('sortDir', params.sortDir || 'desc');
//         if (params.search?.trim()) queryParams.append('search', params.search.trim());
//         if (params.callType && params.callType !== 'All') queryParams.append('callType', params.callType);
//         if (params.callStatus && params.callStatus !== 'All') queryParams.append('callStatus', params.callStatus);
//         if (params.dateFrom?.trim()) queryParams.append('dateFrom', params.dateFrom);
//         if (params.dateTo?.trim()) queryParams.append('dateTo', params.dateTo);
//         if (params.agentId?.trim()) queryParams.append('agentId', params.agentId);
//         const res = await fetch(`${API_BASE_URL}/calls?${queryParams.toString()}`, { headers });
//         return res.json();
//     },
 
//     getCallStats: async (params = {}) => {
//         const headers = await authHeaders();
//         const queryParams = new URLSearchParams();
//         if (params.callType) queryParams.append('callType', params.callType);
//         if (params.callStatus) queryParams.append('callStatus', params.callStatus);
//         if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
//         if (params.dateTo) queryParams.append('dateTo', params.dateTo);
//         if (params.agentId) queryParams.append('agentId', params.agentId);
//         if (params.search) queryParams.append('search', params.search);
//         const q = queryParams.toString();
//         const res = await fetch(`${API_BASE_URL}/calls/stats${q ? "?" + q : ""}`, { headers });
//         return res.json();
//     },
 
//     createCallLog: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls`, {
//             method: 'POST', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
 
//     updateCallLog: async (id, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
 
//     deleteCallLog: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
//             method: 'DELETE', headers,
//         });
//         return res.json();
//     },
 
//     getPendingFollowUps: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/follow-ups`, { headers });
//         return res.json();
//     },
 
//     // ── DEVICE SYNC ───────────────────────────────────────
//     syncDeviceCallLogs: async (calls) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify({ calls, source: 'device_sync' }),
//         });
//         return res.json();
//     },
 
//     bulkCreateCallLogs: async (calls) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify({ calls }),
//         });
//         return res.json();
//     },
 
//     getSyncStatus: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/sync-status`, { headers });
//         return res.json();
//     },
 
//     // ── LEADERBOARD ───────────────────────────────────────
//     getLeaderboard: async (period = 'weekly') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
//         return res.json();
//     },
 
//     // ── REPORTS ───────────────────────────────────────────
//     getReports: async (period = 'month') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/reports/summary?period=${period}`, { headers });
//         return res.json();
//     },
 
//     // ── BUSINESS USER — TEAM CALL STATS ──────────────────
//     getTeamCallStats: async (params = {}) => {
//         const headers = await authHeaders();
//         const queryParams = new URLSearchParams();
//         if (params.date) queryParams.append('date', params.date);
//         if (params.agentId) queryParams.append('agentId', params.agentId);
//         const q = queryParams.toString();
//         const res = await fetch(`${API_BASE_URL}/calls/team-stats${q ? "?" + q : ""}`, { headers });
//         return res.json();
//     },
//     // ── AUTH — REGISTER (NEW) ─────────────────────────────────
//     register: async (data) => {
//         const res = await fetch(`${API_BASE_URL}/auth/register`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//         });
//         return res.json();
//     },
    
//     // ── ADMIN — PENDING APPROVALS (NEW) ──────────────────────
//     getPendingApprovals: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/pending-approvals`, { headers });
//         return res.json();
//     },
    
//     approveUser: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}/approve`, {
//             method: 'PATCH', headers,
//         });
//         return res.json();
//     },
    
//     rejectUser: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reject`, {
//             method: 'PATCH', headers,
//         });
//         return res.json();
//     },
    
//     toggleUserStatus: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}/toggle-status`, {
//             method: 'PATCH', headers,
//         });
//         return res.json();
//     },
    
//     resetUserPassword: async (id, newPassword) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
//             method: 'PATCH', headers,
//             body: JSON.stringify({ newPassword }),
//         });
//         return res.json();
//     },
    
//     // ── BUSINESS USER — MY TEAM (NEW) ────────────────────────
//     getMyTeam: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/team`, { headers });
//         return res.json();
//     },
    
//     createSalesperson: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/salespersons`, {
//             method: 'POST', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
    
//     updateSalesperson: async (id, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
    
//     toggleSalespersonStatus: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}/toggle-status`, {
//             method: 'PATCH', headers,
//         });
//         return res.json();
//     },
    
//     resetSalespersonPassword: async (id, newPassword) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}/reset-password`, {
//             method: 'PATCH', headers,
//             body: JSON.stringify({ newPassword }),
//         });
//         return res.json();
//     },
    
//     // ── HOURLY REPORT (NEW) ───────────────────────────────────
//     getHourlyReport: async (date, agentId) => {
//         const headers = await authHeaders();
//         const params = new URLSearchParams({ date: date || new Date().toISOString().split('T')[0] });
//         if (agentId) params.append('agentId', agentId);
//         const res = await fetch(`${API_BASE_URL}/calls/hourly?${params}`, { headers });
//         return res.json();
//     },
    
//     getSettings: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers });
//         return res.json();
//     },

//     updateSettings: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/admin/settings`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },

// //     getBusinessDashboard: async () => {
// //         const headers = await authHeaders();
// //         const res = await fetch(`${API_BASE_URL}/business/dashboard`, { headers });
// //         return res.json();
// //     },
// // };

//     getBusinessDashboard: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/business/dashboard`, { headers });
//         return res.json();
//     },

//     // ── LEADS ──────────────────────────────────────────────────
//     getLeads: async (params = {}) => {
//         const headers = await authHeaders();
//         const query = new URLSearchParams();
//         if (params.status) query.append('status', params.status);
//         if (params.search) query.append('search', params.search);
//         if (params.fromDate) query.append('fromDate', params.fromDate);
//         if (params.toDate) query.append('toDate', params.toDate);
//         if (params.page) query.append('page', params.page);
//         if (params.limit) query.append('limit', params.limit);
//         const res = await fetch(`${API_BASE_URL}/leads?${query}`, { headers });
//         return res.json();
//     },

//     getLeadById: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/${id}`, { headers });
//         return res.json();
//     },

//     createLead: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads`, {
//             method: 'POST', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },

//     updateLead: async (id, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },

//     deleteLead: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
//             method: 'DELETE', headers,
//         });
//         return res.json();
//     },

//     importLeads: async (leads) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/import`, {
//             method: 'POST', headers, body: JSON.stringify({ leads }),
//         });
//         return res.json();
//     },

//     addFollowUp: async (id, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/${id}/followup`, {
//             method: 'POST', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },

//     getLeadStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/leads/stats`, { headers });
//         return res.json();
//     },
// };

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

    getFullReport: async (range = 'week') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, { headers });
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
    // ── AUTH — REGISTER (NEW) ─────────────────────────────────
    register: async (data) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // ── ADMIN — PENDING APPROVALS (NEW) ──────────────────────
    getPendingApprovals: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/pending-approvals`, { headers });
        return res.json();
    },

    approveUser: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/approve`, {
            method: 'PATCH', headers,
        });
        return res.json();
    },

    rejectUser: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reject`, {
            method: 'PATCH', headers,
        });
        return res.json();
    },

    toggleUserStatus: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/toggle-status`, {
            method: 'PATCH', headers,
        });
        return res.json();
    },

    resetUserPassword: async (id, newPassword) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ newPassword }),
        });
        return res.json();
    },

    // ── BUSINESS USER — MY TEAM (NEW) ────────────────────────
    getMyTeam: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/team`, { headers });
        return res.json();
    },

    createSalesperson: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/salespersons`, {
            method: 'POST', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    updateSalesperson: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    toggleSalespersonStatus: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}/toggle-status`, {
            method: 'PATCH', headers,
        });
        return res.json();
    },

    resetSalespersonPassword: async (id, newPassword) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/salespersons/${id}/reset-password`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ newPassword }),
        });
        return res.json();
    },

    // ── HOURLY REPORT (NEW) ───────────────────────────────────
    getHourlyReport: async (date, agentId) => {
        const headers = await authHeaders();
        const params = new URLSearchParams({ date: date || new Date().toISOString().split('T')[0] });
        if (agentId) params.append('agentId', agentId);
        const res = await fetch(`${API_BASE_URL}/calls/hourly?${params}`, { headers });
        return res.json();
    },

    // ── SALESPERSON — own call log report ─────────────────
    getMyCallLogReport: async ({ fromDate, toDate } = {}) => {
        const headers = await authHeaders();
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        const res = await fetch(`${API_BASE_URL}/reports/my-calllogs?${params}`, { headers });
        return res.json();
    },

    // ── BUSINESS USER — list own salespersons ─────────────
    getMySalespersons: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/reports/my-salespersons`, { headers });
        return res.json();
    },

    // ── BUSINESS USER — specific salesperson report ────────
    getSalespersonCallReport: async (salespersonId, { fromDate, toDate } = {}) => {
        const headers = await authHeaders();
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        const res = await fetch(`${API_BASE_URL}/reports/salesperson/${salespersonId}?${params}`, { headers });
        return res.json();
    },

    getSettings: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers });
        return res.json();
    },

    updateSettings: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    //     getBusinessDashboard: async () => {
    //         const headers = await authHeaders();
    //         const res = await fetch(`${API_BASE_URL}/business/dashboard`, { headers });
    //         return res.json();
    //     },
    // };

    getBusinessDashboard: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/business/dashboard`, { headers });
        return res.json();
    },

    // ── LEADS ──────────────────────────────────────────────────
    getLeads: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams();
        if (params.status) query.append('status', params.status);
        if (params.search) query.append('search', params.search);
        if (params.fromDate) query.append('fromDate', params.fromDate);
        if (params.toDate) query.append('toDate', params.toDate);
        if (params.page) query.append('page', params.page);
        if (params.limit) query.append('limit', params.limit);
        const res = await fetch(`${API_BASE_URL}/leads?${query}`, { headers });
        return res.json();
    },

    getLeadById: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/${id}`, { headers });
        return res.json();
    },

    getWorkedLeads: async (params = {}) => {
        const query = new URLSearchParams();
        if (params.salespersonId) query.set('salespersonId', params.salespersonId);
        if (params.status)        query.set('status',        params.status);
        if (params.fromDate)      query.set('fromDate',      params.fromDate);
        if (params.toDate)        query.set('toDate',        params.toDate);
        if (params.page)          query.set('page',          params.page);
        if (params.limit)         query.set('limit',         params.limit);
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/worked?${query}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch worked leads');
        return res.json();
    },

    createLead: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads`, {
            method: 'POST', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    updateLead: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteLead: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
            method: 'DELETE', headers,
        });
        return res.json();
    },

    importLeads: async (leads) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/import`, {
            method: 'POST', headers, body: JSON.stringify({ leads }),
        });
        return res.json();
    },

    addFollowUp: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/${id}/followup`, {
            method: 'POST', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    getLeadStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/leads/stats`, { headers });
        return res.json();
    },
};


