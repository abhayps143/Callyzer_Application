// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ⚠️ Apna WiFi IP daalo - CMD me "ipconfig" chalao aur IPv4 Address copy karo
// // const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
// const API_BASE_URL = 'http://192.168.1.51:5000/api'; 
// // Android Emulator use kar rahe ho to: 'http://10.0.2.2:5000/api'

// const getToken = async () => {
//     return await AsyncStorage.getItem('token');
// };

// export const api = {
//     login: async (email, password) => {
//         const res = await fetch(`${API_BASE_URL}/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email, password }),
//         });
//         return res.json();
//     },

//     getDashboardStats: async () => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.json();
//     },

//     getCallLogs: async () => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/calls`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.json();
//     },

//     getReports: async (range) => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.json();
//     },

//     getLeaderboard: async () => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/calls/leaderboard`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.json();
//     },

//     punchIn: async (location) => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({ location }),
//         });
//         return res.json();
//     },

//     punchOut: async () => {
//         const token = await getToken();
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
//             method: 'POST',
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.json();
//     },
// };

// export default api;


// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ⚠️ Apna server URL yahan daalo
// // Local WiFi ke liye: 'http://192.168.X.X:5000/api'  (CMD > ipconfig se IPv4 dekho)
// // Production server ke liye: 'https://yourserver.com/api'
// const API_BASE_URL = 'http://192.168.1.51:5000/api';

// const getToken = async () => {
//     return await AsyncStorage.getItem('token');
// };

// const authHeaders = async () => {
//     const token = await getToken();
//     return {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${token}`,
//     };
// };

// export const api = {
//     // ── AUTH ──────────────────────────────────────────────────
//     login: async (email, password) => {
//         const res = await fetch(`${API_BASE_URL}/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email, password }),
//         });
//         return res.json();
//     },

//     // ── DASHBOARD ─────────────────────────────────────────────
//     // Returns: { summary, weeklyTrend, recentCalls, topAgents, user }
//     getDashboardStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers });
//         return res.json();
//     },

//     // ── CALL LOGS ─────────────────────────────────────────────
//     // Returns: { logs: [...], pagination: { total, pages } }
//     getCallLogs: async (params = {}) => {
//         const headers = await authHeaders();
//         const query = new URLSearchParams({
//             page: params.page || 1,
//             limit: params.limit || 20,
//             sortField: params.sortField || 'calledAt',
//             sortDir: params.sortDir || 'desc',
//             ...(params.search && { search: params.search }),
//             ...(params.callType && params.callType !== 'All' && { callType: params.callType }),
//             ...(params.callStatus && params.callStatus !== 'All' && { callStatus: params.callStatus }),
//             ...(params.dateFrom && { dateFrom: params.dateFrom }),
//             ...(params.dateTo && { dateTo: params.dateTo }),
//         });
//         const res = await fetch(`${API_BASE_URL}/calls?${query}`, { headers });
//         return res.json();
//     },

//     // Returns: { total, incoming, outgoing, connected, missed, todayCalls }
//     getCallStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/stats`, { headers });
//         return res.json();
//     },

//     // Add a new call log
//     addCallLog: async (callData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify(callData),
//         });
//         return res.json();
//     },

//     // ── REPORTS ───────────────────────────────────────────────
//     // range: 'today' | 'yesterday' | 'week' | 'month' | 'quarter'
//     // Returns: { summaryCards, monthlySummary, weeklyTrend, callDistribution, agentPerformance }
//     getReports: async (range = 'month') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, { headers });
//         return res.json();
//     },

//     // ── LEADERBOARD ───────────────────────────────────────────
//     // period: 'weekly' | 'monthly'
//     // Returns: { leaderboard: [{ agentName, agentEmail, totalCalls, salesDone, totalDuration }] }
//     getLeaderboard: async (period = 'weekly') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
//         return res.json();
//     },

//     // ── ATTENDANCE ────────────────────────────────────────────
//     // Returns: { record, today }
//     getAttendanceToday: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/attendance/today`, { headers });
//         return res.json();
//     },

//     // Returns: { records: [...] }
//     getAttendanceHistory: async (month) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/attendance/history?month=${month}`, { headers });
//         return res.json();
//     },

//     punchIn: async (location) => {
//         const headers = await authHeaders();
//         const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify(body),
//         });
//         return res.json();
//     },

//     punchOut: async (location) => {
//         const headers = await authHeaders();
//         const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify(body),
//         });
//         return res.json();
//     },

//     // ── TARGETS / PROGRESS ────────────────────────────────────
//     // Returns: { daily: { target, achieved, percentage }, monthly: { ... } }
//     getMyProgress: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/targets/my-progress`, { headers });
//         return res.json();
//     },
// };

// export default api;
// export { API_BASE_URL };


import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Apna server URL yahan daalo
// Local WiFi ke liye: 'http://192.168.X.X:5000/api'  (CMD > ipconfig se IPv4 dekho)
// Production server ke liye: 'https://yourserver.com/api'
const API_BASE_URL = 'http://192.168.1.51:5000/api';

const getToken = async () => {
    return await AsyncStorage.getItem('token');
};

const authHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export const api = {
    // ── AUTH ──────────────────────────────────────────────────
    login: async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    },

    // ── DASHBOARD ─────────────────────────────────────────────
    // Returns: { summary, weeklyTrend, recentCalls, topAgents, user }
    getDashboardStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers });
        return res.json();
    },

    // ── CALL LOGS ─────────────────────────────────────────────
    // Returns: { logs: [...], pagination: { total, pages } }
    getCallLogs: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 20,
            sortField: params.sortField || 'calledAt',
            sortDir: params.sortDir || 'desc',
            ...(params.search && { search: params.search }),
            ...(params.callType && params.callType !== 'All' && { callType: params.callType }),
            ...(params.callStatus && params.callStatus !== 'All' && { callStatus: params.callStatus }),
            ...(params.dateFrom && { dateFrom: params.dateFrom }),
            ...(params.dateTo && { dateTo: params.dateTo }),
        });
        const res = await fetch(`${API_BASE_URL}/calls?${query}`, { headers });
        return res.json();
    },

    // Returns: { total, incoming, outgoing, connected, missed, todayCalls }
    getCallStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/stats`, { headers });
        return res.json();
    },

    // Add a new call log
    addCallLog: async (callData) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls`, {
            method: 'POST',
            headers,
            body: JSON.stringify(callData),
        });
        return res.json();
    },

    // ── REPORTS ───────────────────────────────────────────────
    // range: 'today' | 'yesterday' | 'week' | 'month' | 'quarter'
    // Returns: { summaryCards, monthlySummary, weeklyTrend, callDistribution, agentPerformance }
    getReports: async (range = 'month') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, { headers });
        return res.json();
    },

    // ── LEADERBOARD ───────────────────────────────────────────
    // period: 'weekly' | 'monthly'
    // Returns: { leaderboard: [{ agentName, agentEmail, totalCalls, salesDone, totalDuration }] }
    getLeaderboard: async (period = 'weekly') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
        return res.json();
    },

    // ── ATTENDANCE ────────────────────────────────────────────
    // Returns: { record, today }
    getAttendanceToday: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/today`, { headers });
        return res.json();
    },

    // Returns: { records: [...] }
    getAttendanceHistory: async (month) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/history?month=${month}`, { headers });
        return res.json();
    },

    punchIn: async (location) => {
        const headers = await authHeaders();
        const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        return res.json();
    },

    punchOut: async (location) => {
        const headers = await authHeaders();
        const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        return res.json();
    },

    // ── TARGETS / PROGRESS ────────────────────────────────────
    // Returns: { daily: { target, achieved, percentage }, monthly: { ... } }
    getMyProgress: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/targets/my-progress`, { headers });
        return res.json();
    },

    // ── LEAVES ────────────────────────────────────────────────
    // GET: Returns { leaves: [...], leaveBalance: { sick, casual, earned } }
    getMyLeaves: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, { headers });
        return res.json();
    },

    // POST: Body { leaveType, fromDate, toDate, reason }
    // Returns: { leave, message }
    applyLeave: async (leaveData) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, {
            method: 'POST',
            headers,
            body: JSON.stringify(leaveData),
        });
        return res.json();
    },
};

export default api;
export { API_BASE_URL };