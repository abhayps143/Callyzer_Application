import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Dimensions, Animated,
    Easing, Pressable, Modal
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CallLogsScreen from '../screens/CallLogsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import EmployeeLeavesScreen from '../screens/EmployeeLeavesScreen';
import DeviceCallSyncScreen from '../screens/DeviceCallSyncScreen';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminLeavesScreen from '../screens/admin/AdminLeavesScreen';
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

import HrDashboardScreen from '../screens/hr/HrDashboardScreen';
import HrLeavesScreen from '../screens/hr/HrLeavesScreen';
import HrEmployeesScreen from '../screens/hr/HrEmployeesScreen';
import HrAttendanceScreen from '../screens/hr/HrAttendanceScreen';
import HrProfileScreen from '../screens/hr/HrProfileScreen';

import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import ManagerTeamScreen from '../screens/manager/ManagerTeamScreen';
import ManagerTargetsScreen from '../screens/manager/ManagerTargetsScreen';
import ManagerProfileScreen from '../screens/manager/ManagerProfileScreen';

const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const ROLE_COLOR = {
    admin: '#3B82F6', super_admin: '#8B5CF6',
    hr: '#F59E0B', manager: '#6366F1',
    team_leader: '#0EA5E9', agent: '#10B981',
};

const MENUS = {
    admin: [
        { id: 'AdminDashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'AdminUsers', label: 'Users', icon: '👥' },
        { id: 'AdminLeaves', label: 'Leave Requests', icon: '📋' },
        { id: 'AdminAttendance', label: 'Attendance', icon: '📍' },
        { id: 'CallLogs', label: 'Call Logs', icon: '📞' },
        { id: 'DeviceCallSync', label: 'Device Sync', icon: '📲' },
        { id: 'Reports', label: 'Reports', icon: '📊' },
        { id: 'AdminSettings', label: 'Settings', icon: '⚙️' },
    ],
    hr: [
        { id: 'HrDashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'HrEmployees', label: 'Employees', icon: '👥' },
        { id: 'HrLeaves', label: 'Leave Requests', icon: '📋' },
        { id: 'HrAttendance', label: 'Attendance', icon: '📍' },
        { id: 'HrProfile', label: 'My Profile', icon: '👤' },
    ],
    manager: [
        { id: 'ManagerDashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'ManagerTeam', label: 'My Team', icon: '👥' },
        { id: 'ManagerTargets', label: 'Set Targets', icon: '🎯' },
        { id: 'CallLogs', label: 'Call Logs', icon: '📞' },
        { id: 'DeviceCallSync', label: 'Device Sync', icon: '📲' },
        { id: 'Reports', label: 'Reports', icon: '📊' },
        { id: 'ManagerProfile', label: 'My Profile', icon: '👤' },
    ],
    employee: [
        { id: 'Dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'CallLogs', label: 'Call Logs', icon: '📞' },
        { id: 'DeviceCallSync', label: 'Device Sync', icon: '📲' },
        { id: 'Attendance', label: 'Attendance', icon: '📍' },
        { id: 'Reports', label: 'Reports', icon: '📊' },
        { id: 'Leaderboard', label: 'Leaderboard', icon: '🏆' },
        { id: 'EmployeeLeaves', label: 'My Leaves', icon: '🗓️' },
    ],
};

const AnimatedDrawer = ({ visible, onClose, children }) => {
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.timing(translateX, { toValue: 0, duration: 300, easing: Easing.bezier(0.5, 0.01, 0, 1), useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.5, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 300, easing: Easing.bezier(0.5, 0.01, 0, 1), useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => setModalVisible(false));
        }
    }, [visible]);

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1 }}>
                <Animated.View style={[styles.backdrop, { opacity }]}>
                    <Pressable style={{ flex: 1 }} onPress={onClose} />
                </Animated.View>
                <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

function CustomHeader({ navigation, title, user, onLogout, currentRoute }) {
    const [menuVisible, setMenuVisible] = useState(false);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isHr = user?.role === 'hr';
    const isManager = user?.role === 'manager';
    const menuKey = isAdmin ? 'admin' : isHr ? 'hr' : isManager ? 'manager' : 'employee';
    const menuItems = MENUS[menuKey];
    const roleColor = ROLE_COLOR[user?.role] || '#6366F1';

    const handleNavigation = (screenName) => {
        setMenuVisible(false);
        setTimeout(() => navigation.navigate(screenName), 150);
    };
    const handleLogout = () => { setMenuVisible(false); setTimeout(() => onLogout(), 150); };

    return (
        <>
            <View style={[headerStyles.container, { borderBottomColor: roleColor + '50' }]}>
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={headerStyles.menuBtn} activeOpacity={0.7}>
                    <Text style={headerStyles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={headerStyles.title}>{title}</Text>
                <View style={headerStyles.placeholder} />
            </View>
            <AnimatedDrawer visible={menuVisible} onClose={() => setMenuVisible(false)}>
                <SafeAreaView style={drawerStyles.safeArea}>
                    <View style={[drawerStyles.header, { borderBottomColor: roleColor + '40' }]}>
                        <View style={[drawerStyles.avatar, { backgroundColor: roleColor + '30' }]}>
                            <Text style={[drawerStyles.avatarText, { color: roleColor }]}>
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={drawerStyles.userName}>{user?.name || 'User'}</Text>
                        <Text style={drawerStyles.userEmail}>{user?.email || ''}</Text>
                        <View style={[drawerStyles.roleBadge, { backgroundColor: roleColor + '20' }]}>
                            <Text style={[drawerStyles.roleText, { color: roleColor }]}>
                                {user?.role?.replace('_', ' ') || 'agent'}
                            </Text>
                        </View>
                    </View>
                    <ScrollView style={drawerStyles.menuContainer} showsVerticalScrollIndicator={false}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[drawerStyles.menuItem, currentRoute === item.id && [drawerStyles.menuItemActive, { backgroundColor: roleColor + '20' }]]}
                                onPress={() => handleNavigation(item.id)}
                                activeOpacity={0.6}
                            >
                                <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
                                <Text style={[drawerStyles.menuLabel, currentRoute === item.id && [drawerStyles.menuLabelActive, { color: roleColor }]]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={drawerStyles.logoutBtn} onPress={handleLogout} activeOpacity={0.6}>
                        <Text style={drawerStyles.logoutIcon}>🚪</Text>
                        <Text style={drawerStyles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </AnimatedDrawer>
        </>
    );
}

function makeHeaderOptions(title, userRef, logoutRef, currentRouteRef) {
    return {
        headerShown: true,
        header: ({ navigation }) => (
            <CustomHeader
                navigation={navigation}
                title={title}
                user={userRef.current}
                onLogout={logoutRef.current}
                currentRoute={currentRouteRef.current}
            />
        ),
    };
}

function AdminStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('AdminDashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator screenListeners={{ state: (e) => { const r = e.data.state.routes; if (r.length > 0) setCurrentRoute(r[r.length - 1].name); } }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={makeHeaderOptions('Admin Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={makeHeaderOptions('Manage Users', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminLeaves" component={AdminLeavesScreen} options={makeHeaderOptions('Leave Requests', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminAttendance" component={AdminAttendanceScreen} options={makeHeaderOptions('Attendance', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="CallLogs" component={CallLogsScreen} options={makeHeaderOptions('Call Logs', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="DeviceCallSync" component={DeviceCallSyncScreen} options={makeHeaderOptions('Device Call Sync', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={makeHeaderOptions('Reports', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={makeHeaderOptions('Settings', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}

function HrStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('HrDashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator screenListeners={{ state: (e) => { const r = e.data.state.routes; if (r.length > 0) setCurrentRoute(r[r.length - 1].name); } }}>
            <Stack.Screen name="HrDashboard" component={HrDashboardScreen} options={makeHeaderOptions('HR Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="HrEmployees" component={HrEmployeesScreen} options={makeHeaderOptions('Employees', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="HrLeaves" component={HrLeavesScreen} options={makeHeaderOptions('Leave Requests', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="HrAttendance" component={HrAttendanceScreen} options={makeHeaderOptions('Attendance', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="HrProfile" component={HrProfileScreen} options={makeHeaderOptions('My Profile', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}

function ManagerStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('ManagerDashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator screenListeners={{ state: (e) => { const r = e.data.state.routes; if (r.length > 0) setCurrentRoute(r[r.length - 1].name); } }}>
            <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} options={makeHeaderOptions('Manager Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="ManagerTeam" component={ManagerTeamScreen} options={makeHeaderOptions('My Team', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="ManagerTargets" component={ManagerTargetsScreen} options={makeHeaderOptions('Set Targets', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="CallLogs" component={CallLogsScreen} options={makeHeaderOptions('Call Logs', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="DeviceCallSync" component={DeviceCallSyncScreen} options={makeHeaderOptions('Device Call Sync', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={makeHeaderOptions('Reports', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="ManagerProfile" component={ManagerProfileScreen} options={makeHeaderOptions('My Profile', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}

function UserStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('Dashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator screenListeners={{ state: (e) => { const r = e.data.state.routes; if (r.length > 0) setCurrentRoute(r[r.length - 1].name); } }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={makeHeaderOptions('Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="CallLogs" component={CallLogsScreen} options={makeHeaderOptions('Call Logs', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="DeviceCallSync" component={DeviceCallSyncScreen} options={makeHeaderOptions('Device Call Sync', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} options={makeHeaderOptions('Attendance', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={makeHeaderOptions('Reports', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={makeHeaderOptions('Leaderboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="EmployeeLeaves" component={EmployeeLeavesScreen} options={makeHeaderOptions('My Leaves', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { token, user, loading } = useContext(AuthContext);

    if (loading) return null;

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isHr = user?.role === 'hr';
    const isManager = user?.role === 'manager';

    // Conditionally render screens based on token — this ensures logout and login
    // both instantly switch screens without needing a reload.
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : isAdmin ? (
                    <Stack.Screen name="AdminMain" component={AdminStack} />
                ) : isHr ? (
                    <Stack.Screen name="HrMain" component={HrStack} />
                ) : isManager ? (
                    <Stack.Screen name="ManagerMain" component={ManagerStack} />
                ) : (
                    <Stack.Screen name="UserMain" component={UserStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 999 },
    drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: '#0f172a', zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
});
const headerStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, borderBottomWidth: 1 },
    menuBtn: { padding: 8 },
    menuIcon: { fontSize: 24, color: '#fff' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    placeholder: { width: 40 },
});
const drawerStyles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { backgroundColor: '#1e293b', padding: 20, alignItems: 'center', borderBottomWidth: 1 },
    avatar: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 28, fontWeight: 'bold' },
    userName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    userEmail: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
    roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    roleText: { fontSize: 12, textTransform: 'capitalize', fontWeight: '600' },
    menuContainer: { flex: 1, paddingTop: 16 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 8, borderRadius: 12, marginBottom: 4 },
    menuItemActive: {},
    menuIcon: { fontSize: 22, width: 36, color: '#cbd5e1' },
    menuLabel: { fontSize: 15, color: '#cbd5e1', fontWeight: '500' },
    menuLabelActive: { fontWeight: 'bold' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, margin: 16, backgroundColor: '#ef444420', borderRadius: 12, marginBottom: 30 },
    logoutIcon: { fontSize: 20, marginRight: 12 },
    logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});