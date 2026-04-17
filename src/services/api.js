// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ⚠️ Apna server URL yahan daalo
// // Local WiFi ke liye: 'http://192.168.X.X:5000/api'  (CMD > ipconfig se IPv4 dekho)
// // Production server ke liye: 'https://yourserver.com/api'
// //Abhay IP-Adress
// const API_BASE_URL = 'http://192.168.1.51:5000/api';

// //Vinayak Ip-Adress
// // const API_BASE_URL = 'http://192.168.1.65:5000/api';


// const getToken = async () => {
//     return await AsyncStorage.getItem('token');
// };

// const authHeaders = async () => {
//     const token = await getToken();
//     console.log('📝 Token being sent:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

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
//     // Update a call log
//     updateCallLog: async (id, callData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
//             method: 'PUT',
//             headers,
//             body: JSON.stringify(callData),
//         });
//         return res.json();
//     },

//     // Delete a call log
//     deleteCallLog: async (id) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
//             method: 'DELETE',
//             headers,
//         });
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

//     // ── LEAVES ────────────────────────────────────────────────
//     // GET: Returns { leaves: [...], leaveBalance: { sick, casual, earned } }
//     getMyLeaves: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, { headers });
//         return res.json();
//     },

//     // POST: Body { leaveType, fromDate, toDate, reason }
//     // Returns: { leave, message }
//     applyLeave: async (leaveData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, {
//             method: 'POST',
//             headers,
//             body: JSON.stringify(leaveData),
//         });
//         return res.json();
//     },
// };

// export default api;
// export { API_BASE_URL };


import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  SERVER IP — Ek ko uncomment karo, baaki band rakho
// ─────────────────────────────────────────────────────────────────────────────

// Abhay ka IP
// const API_BASE_URL = 'http://192.168.1.51:5000/api';

// Vinayak ka IP
const API_BASE_URL = 'http://192.168.1.65:5000/api';

// Production server (jab deploy karo)
// const API_BASE_URL = 'https://yourserver.com/api';

// ─────────────────────────────────────────────────────────────────────────────

const getToken = async () => AsyncStorage.getItem('token');

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
    getDashboardStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers });
        return res.json();
    },

    // ── CALL LOGS ─────────────────────────────────────────────
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

    getCallStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/stats`, { headers });
        return res.json();
    },

    addCallLog: async (callData) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls`, {
            method: 'POST', headers, body: JSON.stringify(callData),
        });
        return res.json();
    },

    updateCallLog: async (id, callData) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'PUT', headers, body: JSON.stringify(callData),
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

    // ── REPORTS ───────────────────────────────────────────────
    getReports: async (range = 'month') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, { headers });
        return res.json();
    },

    // ── LEADERBOARD ───────────────────────────────────────────
    getLeaderboard: async (period = 'weekly') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
        return res.json();
    },

    // ── ATTENDANCE ────────────────────────────────────────────
    getAttendanceToday: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/today`, { headers });
        return res.json();
    },

    getAttendanceHistory: async (month) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/history?month=${month}`, { headers });
        return res.json();
    },

    punchIn: async (location) => {
        const headers = await authHeaders();
        const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
            method: 'POST', headers, body: JSON.stringify(body),
        });
        return res.json();
    },

    punchOut: async (location) => {
        const headers = await authHeaders();
        const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
            method: 'POST', headers, body: JSON.stringify(body),
        });
        return res.json();
    },

    // ── TARGETS ───────────────────────────────────────────────
    getMyProgress: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/targets/my-progress`, { headers });
        return res.json();
    },

    // ── EMPLOYEE LEAVES ───────────────────────────────────────
    getMyLeaves: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, { headers });
        return res.json();
    },

    applyLeave: async (leaveData) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, {
            method: 'POST', headers, body: JSON.stringify(leaveData),
        });
        return res.json();
    },

    // ════════════════════════════════════════════════════════════
    // ── HR ROLE APIs ──────────────────────────────────────────
    // ════════════════════════════════════════════════════════════

    // HR Dashboard Stats
    // Returns: { totalEmployees, activeEmployees, inactiveEmployees, newThisWeek,
    //            pendingLeaves, approvedLeaves, rejectedLeaves, roleCounts }
    getHrStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/stats`, { headers });
        return res.json();
    },

    // Recent Employees for HR Dashboard
    // Returns: { employees: [...] }
    getHrRecentEmployees: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/recent-employees`, { headers });
        return res.json();
    },

    // All Employees with search/filter/pagination
    // params: { search, role, isActive, page, limit }
    // Returns: { employees: [...], pagination: { total, pages, page } }
    getHrEmployees: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.search && { search: params.search }),
            ...(params.role && { role: params.role }),
            ...(params.isActive !== undefined && params.isActive !== '' && { isActive: params.isActive }),
        });
        const res = await fetch(`${API_BASE_URL}/hr/employees?${query}`, { headers });
        return res.json();
    },

    // Update HR Record for an employee
    // Body: { department, designation, joiningDate, employmentType, salary, leaveBalance, emergencyContact, notes }
    updateHrRecord: async (employeeId, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/employees/${employeeId}/hr-record`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },

    // All Leave Requests (HR view)
    // status: '' | 'pending' | 'approved' | 'rejected'
    // Returns: { leaves: [...] }
    getHrLeaves: async (status = '', params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams();
        if (status) query.set('status', status);
        if (params.leaveType) query.set('leaveType', params.leaveType);
        if (params.search) query.set('search', params.search);
        if (params.fromDate) query.set('fromDate', params.fromDate);
        if (params.toDate) query.set('toDate', params.toDate);
        const res = await fetch(`${API_BASE_URL}/hr/leaves?${query}`, { headers });
        return res.json();
    },

    // Approve / Reject a Leave Request
    // action: 'approved' | 'rejected'
    // Returns: { message, leave }
    hrLeaveAction: async (hrRecordId, leaveId, action, remarks = '') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/leaves/${hrRecordId}/${leaveId}/action`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ action, remarks }),
        });
        return res.json();
    },

    // All Attendance Records (HR/Admin view)
    // month: 'YYYY-MM' e.g. '2026-04'
    // Returns: { records: [...] }
    getAllAttendance: async (month) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/all?month=${month}`, { headers });
        return res.json();
    },

    // HR Profile
    // GET returns: { hr: { name, email, role, isActive, phone, createdAt } }
    getHrProfile: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/profile`, { headers });
        return res.json();
    },

    // PUT body: { name, phone }
    updateHrProfile: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/profile`, {
            method: 'PUT', headers, body: JSON.stringify(data),
        });
        return res.json();
    },
};

export default api;
export { API_BASE_URL };
