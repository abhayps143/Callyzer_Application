// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ─────────────────────────────────────────────────────────────────────────────
// // ⚠️  SERVER IP — Ek ko uncomment karo, baaki band rakho
// // ─────────────────────────────────────────────────────────────────────────────

// // Abhay ka IP
// const API_BASE_URL = 'http://192.168.1.51:5000/api';

// // Vinayak ka IP
// // const API_BASE_URL = 'http://192.168.1.65:5000/api';

// // Production server (jab deploy karo)
// // const API_BASE_URL = 'https://yourserver.com/api';

// // ─────────────────────────────────────────────────────────────────────────────

// const getToken = async () => AsyncStorage.getItem('token');

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
//     getDashboardStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers });
//         return res.json();
//     },

//     // ── CALL LOGS ─────────────────────────────────────────────
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

//     getCallStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/stats`, { headers });
//         return res.json();
//     },

//     addCallLog: async (callData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls`, {
//             method: 'POST', headers, body: JSON.stringify(callData),
//         });
//         return res.json();
//     },

//     updateCallLog: async (id, callData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
//             method: 'PUT', headers, body: JSON.stringify(callData),
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

//     // ── REPORTS ───────────────────────────────────────────────
//     getReports: async (range = 'month') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/reports?range=${range}`, { headers });
//         return res.json();
//     },

//     // ── LEADERBOARD ───────────────────────────────────────────
//     getLeaderboard: async (period = 'weekly') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/calls/leaderboard?period=${period}`, { headers });
//         return res.json();
//     },

//     // ── ATTENDANCE ────────────────────────────────────────────
//     getAttendanceToday: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/attendance/today`, { headers });
//         return res.json();
//     },

//     getAttendanceHistory: async (month) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/attendance/history?month=${month}`, { headers });
//         return res.json();
//     },

//     punchIn: async (location) => {
//         const headers = await authHeaders();
//         const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
//             method: 'POST', headers, body: JSON.stringify(body),
//         });
//         return res.json();
//     },

//     punchOut: async (location) => {
//         const headers = await authHeaders();
//         const body = location ? { latitude: location.latitude, longitude: location.longitude } : {};
//         const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
//             method: 'POST', headers, body: JSON.stringify(body),
//         });
//         return res.json();
//     },

//     // ── TARGETS ───────────────────────────────────────────────
//     getMyProgress: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/targets/my-progress`, { headers });
//         return res.json();
//     },

//     // ── EMPLOYEE LEAVES ───────────────────────────────────────
//     getMyLeaves: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, { headers });
//         return res.json();
//     },

//     applyLeave: async (leaveData) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, {
//             method: 'POST', headers, body: JSON.stringify(leaveData),
//         });
//         return res.json();
//     },

//     // ════════════════════════════════════════════════════════════
//     // ── HR ROLE APIs ──────────────────────────────────────────
//     // ════════════════════════════════════════════════════════════

//     // HR Dashboard Stats
//     // Returns: { totalEmployees, activeEmployees, inactiveEmployees, newThisWeek,
//     //            pendingLeaves, approvedLeaves, rejectedLeaves, roleCounts }
//     getHrStats: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/stats`, { headers });
//         return res.json();
//     },

//     // Recent Employees for HR Dashboard
//     // Returns: { employees: [...] }
//     getHrRecentEmployees: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/recent-employees`, { headers });
//         return res.json();
//     },

//     // All Employees with search/filter/pagination
//     // params: { search, role, isActive, page, limit }
//     // Returns: { employees: [...], pagination: { total, pages, page } }
//     getHrEmployees: async (params = {}) => {
//         const headers = await authHeaders();
//         const query = new URLSearchParams({
//             page: params.page || 1,
//             limit: params.limit || 10,
//             ...(params.search && { search: params.search }),
//             ...(params.role && { role: params.role }),
//             ...(params.isActive !== undefined && params.isActive !== '' && { isActive: params.isActive }),
//         });
//         const res = await fetch(`${API_BASE_URL}/hr/employees?${query}`, { headers });
//         return res.json();
//     },

//     // Update HR Record for an employee
//     // Body: { department, designation, joiningDate, employmentType, salary, leaveBalance, emergencyContact, notes }
//     updateHrRecord: async (employeeId, data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/employees/${employeeId}/hr-record`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },

//     // All Leave Requests (HR view)
//     // status: '' | 'pending' | 'approved' | 'rejected'
//     // Returns: { leaves: [...] }
//     getHrLeaves: async (status = '', params = {}) => {
//         const headers = await authHeaders();
//         const query = new URLSearchParams();
//         if (status) query.set('status', status);
//         if (params.leaveType) query.set('leaveType', params.leaveType);
//         if (params.search) query.set('search', params.search);
//         if (params.fromDate) query.set('fromDate', params.fromDate);
//         if (params.toDate) query.set('toDate', params.toDate);
//         const res = await fetch(`${API_BASE_URL}/hr/leaves?${query}`, { headers });
//         return res.json();
//     },

//     // Approve / Reject a Leave Request
//     // action: 'approved' | 'rejected'
//     // Returns: { message, leave }
//     hrLeaveAction: async (hrRecordId, leaveId, action, remarks = '') => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/leaves/${hrRecordId}/${leaveId}/action`, {
//             method: 'PATCH', headers,
//             body: JSON.stringify({ action, remarks }),
//         });
//         return res.json();
//     },

//     // All Attendance Records (HR/Admin view)
//     // month: 'YYYY-MM' e.g. '2026-04'
//     // Returns: { records: [...] }
//     getAllAttendance: async (month) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/attendance/all?month=${month}`, { headers });
//         return res.json();
//     },

//     // HR Profile
//     // GET returns: { hr: { name, email, role, isActive, phone, createdAt } }
//     getHrProfile: async () => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/profile`, { headers });
//         return res.json();
//     },

//     // PUT body: { name, phone }
//     updateHrProfile: async (data) => {
//         const headers = await authHeaders();
//         const res = await fetch(`${API_BASE_URL}/hr/profile`, {
//             method: 'PUT', headers, body: JSON.stringify(data),
//         });
//         return res.json();
//     },
// };

// export default api;
// export { API_BASE_URL };

// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ─────────────────────────────────────────────────────────────────────────────
// // ⚠️  SERVER IP — Ek ko uncomment karo, baaki band rakho
// // ─────────────────────────────────────────────────────────────────────────────

// // Abhay ka IP
const API_BASE_URL = 'http://192.168.1.51:5000/api';

// // Vinayak ka IP
// // const API_BASE_URL = 'http://192.168.1.65:5000/api';

// // Production server (jab deploy karo)
// // const API_BASE_URL = 'https://yourserver.com/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


const getToken = async () => AsyncStorage.getItem('token');

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

    // ── DASHBOARD ─────────────────────────────────────────
    getDashboardStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers });
        return res.json();
    },

    getMyProgress: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/targets/my-progress`, { headers });
        return res.json();
    },

    // ── CALL LOGS ─────────────────────────────────────────
    // getCallLogs: async (params = {}) => {
    //     const headers = await authHeaders();
    //     const query = new URLSearchParams({
    //         page: params.page || 1,
    //         limit: params.limit || 20,
    //         sortField: params.sortField || 'calledAt',
    //         sortDir: params.sortDir || 'desc',
    //         ...(params.search && { search: params.search }),
    //         ...(params.callType && params.callType !== 'All' && { callType: params.callType }),
    //         ...(params.callStatus && params.callStatus !== 'All' && { callStatus: params.callStatus }),
    //         ...(params.dateFrom && { dateFrom: params.dateFrom }),
    //         ...(params.dateTo && { dateTo: params.dateTo }),
    //     });
    //     const res = await fetch(`${API_BASE_URL}/calls?${query}`, { headers });
    //     return res.json();
    // },
    // api.js mein getCallLogs function ko REPLACE karo:

    getCallLogs: async (params = {}) => {
        const headers = await authHeaders();
        const queryParams = new URLSearchParams();

        // Always add these
        queryParams.append('page', params.page || 1);
        queryParams.append('limit', params.limit || 20);
        queryParams.append('sortField', params.sortField || 'calledAt');
        queryParams.append('sortDir', params.sortDir || 'desc');

        // Add optional params ONLY if they have value and not 'All'
        if (params.search && params.search.trim()) {
            queryParams.append('search', params.search.trim());
        }
        if (params.callType && params.callType !== 'All') {
            queryParams.append('callType', params.callType);
        }
        if (params.callStatus && params.callStatus !== 'All') {
            queryParams.append('callStatus', params.callStatus);
        }
        if (params.dateFrom && params.dateFrom.trim()) {
            queryParams.append('dateFrom', params.dateFrom);
        }
        if (params.dateTo && params.dateTo.trim()) {
            queryParams.append('dateTo', params.dateTo);
        }
        if (params.agentId && params.agentId.trim()) {
            queryParams.append('agentId', params.agentId);
        }

        const query = queryParams.toString();
        console.log('📞 API Call URL:', `${API_BASE_URL}/calls?${query}`);

        const res = await fetch(`${API_BASE_URL}/calls?${query}`, { headers });
        const data = await res.json();
        console.log('📞 API Response:', data);
        return data;
    },

    // getCallStats: async () => {
    //     const headers = await authHeaders();
    //     const res = await fetch(`${API_BASE_URL}/calls/stats`, { headers });
    //     return res.json();
    // },

    getCallStats: async (params = {}) => {
        const headers = await authHeaders();
        const queryParams = new URLSearchParams();
        if (params.callType) queryParams.append('callType', params.callType);
        if (params.callStatus) queryParams.append('callStatus', params.callStatus);
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params.agentId) queryParams.append('agentId', params.agentId);
        if (params.search) queryParams.append('search', params.search);
        const query = queryParams.toString();
        const res = await fetch(`${API_BASE_URL}/calls/stats${query ? '?' + query : ''}`, { headers });
        return res.json();
    },

    createCallLog: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateCallLog: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteCallLog: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'DELETE',
            headers,
        });
        return res.json();
    },

    getPendingFollowUps: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/follow-ups`, { headers });
        return res.json();
    },


    // ── ATTENDANCE ────────────────────────────────────────
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
        const body = location
            ? { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy }
            : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
            method: 'POST', headers, body: JSON.stringify(body),
        });
        return res.json();
    },

    punchOut: async (location) => {
        const headers = await authHeaders();
        const body = location
            ? { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy }
            : {};
        const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
            method: 'POST', headers, body: JSON.stringify(body),
        });
        return res.json();
    },

    // punchIn: async (location) => {
    //     const headers = await authHeaders();
    //     const res = await fetch(`${API_BASE_URL}/attendance/punch-in`, {
    //         method: 'POST',
    //         headers,
    //         body: JSON.stringify({ location }),
    //     });
    //     return res.json();
    // },

    // punchOut: async (location) => {
    //     const headers = await authHeaders();
    //     const res = await fetch(`${API_BASE_URL}/attendance/punch-out`, {
    //         method: 'POST',
    //         headers,
    //         body: JSON.stringify({ location }),
    //     });
    //     return res.json();
    // },

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

    // Add this function to your api.js
    bulkCreateCallLogs: async (calls) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ calls }),
        });
        return res.json();
    },

    // ── DEVICE CALL SYNC ─────────────────────────────────
    // Add this to your api object — needed by callLogService.js
    syncDeviceCallLogs: async (calls) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/bulk-import`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ calls, source: 'device_sync' }),
        });
        return res.json();
    },

    getSyncStatus: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/calls/sync-status`, { headers });
        return res.json();
    },

    // ── LEAVES ───────────────────────────────────────────
    getMyLeaves: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, { headers });
        return res.json();
    },

    applyLeave: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/my-leaves`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    cancelLeave: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/leave/${id}/cancel`, {
            method: 'PUT',
            headers,
        });
        return res.json();
    },

    // ── ADMIN ────────────────────────────────────────────
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
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateUser: async (id, data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteUser: async (id) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers,
        });
        return res.json();
    },

    getAdminLeaves: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.status && params.status !== 'All' && { status: params.status }),
        });
        const res = await fetch(`${API_BASE_URL}/hr/leaves?${query}`, { headers });
        return res.json();
    },

    updateLeaveStatus: async (id, status, reason) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/leaves/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status, reason }),
        });
        return res.json();
    },

    getAdminAttendance: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.date && { date: params.date }),
            ...(params.search && { search: params.search }),
        });
        const res = await fetch(`${API_BASE_URL}/admin/attendance?${query}`, { headers });
        return res.json();
    },

    getAdminStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
        return res.json();
    },

    // ── HR ───────────────────────────────────────────────
    getHrProfile: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/profile`, { headers });
        return res.json();
    },

    updateHrProfile: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    getHrStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/stats`, { headers });
        return res.json();
    },

    getHrRecentEmployees: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/recent-employees`, { headers });
        return res.json();
    },

    hrLeaveAction: async (hrRecordId, leaveId, action, remarks = '') => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/leaves/${hrRecordId}/${leaveId}/action`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ action, remarks }),
        });
        return res.json();
    },
    getHrEmployees: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.search && { search: params.search }),
            ...(params.role && params.role !== 'All' && { role: params.role }),
        });
        const res = await fetch(`${API_BASE_URL}/hr/employees?${query}`, { headers });
        return res.json();
    },

    getHrLeaves: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.status && params.status !== 'All' && { status: params.status }),
        });
        const res = await fetch(`${API_BASE_URL}/hr/leaves?${query}`, { headers });
        return res.json();
    },

    updateHrLeave: async (id, action, note) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/hr/leaves/${id}/${action}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ note }),
        });
        return res.json();
    },

    getAllAttendance: async (monthStr) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/attendance/all?month=${monthStr}`, { headers });
        return res.json();
    },

    getHrAttendance: async (params = {}) => {
        const headers = await authHeaders();
        const query = new URLSearchParams({
            ...(params.date && { date: params.date }),
            ...(params.search && { search: params.search }),
        });
        const res = await fetch(`${API_BASE_URL}/hr/attendance?${query}`, { headers });
        return res.json();
    },

    // ── MANAGER ──────────────────────────────────────────
    getManagerTeam: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/manager/team`, { headers });
        return res.json();
    },

    getManagerTargets: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/targets`, { headers });
        return res.json();
    },

    setTarget: async (data) => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/targets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return res.json();
    },

    getManagerStats: async () => {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE_URL}/manager/stats`, { headers });
        return res.json();
    },
};