import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Dimensions, Animated,
    Easing, Pressable
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CallLogsScreen from '../screens/CallLogsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import EmployeeLeavesScreen from '../screens/EmployeeLeavesScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminLeavesScreen from '../screens/admin/AdminLeavesScreen';
import AdminAttendanceScreen from '../screens/admin/AdminAttendanceScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
// import CallLogsScreen from '../screens/CallLogsScreen';
// import ReportsScreen from '../screens/ReportsScreen';

const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

// ── Animated Menu Component ──
const AnimatedDrawer = ({ visible, onClose, children }) => {
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Open drawer
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.bezier(0.5, 0.01, 0, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Close drawer
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -DRAWER_WIDTH,
                    duration: 300,
                    easing: Easing.bezier(0.5, 0.01, 0, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <>
            <Animated.View style={[styles.backdrop, { opacity }]}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>
            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                {children}
            </Animated.View>
        </>
    );
};

// ── Custom Header with Menu Button ──
function CustomHeader({ navigation, title, user, onLogout, currentRoute }) {
    const [menuVisible, setMenuVisible] = useState(false);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    const menuItems = isAdmin ? [
        { id: 'dashboard', screenName: 'AdminDashboard', label: ' Dashboard', icon: '🏠' },
        { id: 'users', screenName: 'AdminUsers', label: ' Users', icon: '👥' },
        { id: 'leaves', screenName: 'AdminLeaves', label: ' Leave Requests', icon: '📋' },
        { id: 'attendance', screenName: 'AdminAttendance', label: ' Attendance', icon: '📍' },
        { id: 'callLogs', screenName: 'CallLogs', label: ' Call Logs', icon: '📞' },
        { id: 'reports', screenName: 'Reports', label: ' Reports', icon: '📊' },
        { id: 'settings', screenName: 'AdminSettings', label: ' Settings', icon: '⚙️' },
    ] : [
        { id: 'dashboard', screenName: 'Dashboard', label: '🏠 Dashboard', icon: '🏠' },
        { id: 'calls', screenName: 'CallLogs', label: '📞 Call Logs', icon: '📞' },
        { id: 'attendance', screenName: 'Attendance', label: '📍 Attendance', icon: '📍' },
        { id: 'reports', screenName: 'Reports', label: '📊 Reports', icon: '📊' },
        { id: 'leaderboard', screenName: 'Leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
        { id: 'leaves', screenName: 'EmployeeLeaves', label: '🗓️ My Leaves', icon: '🗓️' },
    ];

    const handleNavigation = (screenName) => {
        setMenuVisible(false);
        setTimeout(() => {
            navigation.navigate(screenName);
        }, 150);
    };

    const handleLogout = () => {
        setMenuVisible(false);
        setTimeout(() => {
            onLogout();
        }, 150);
    };

    return (
        <>
            <View style={headerStyles.container}>
                <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={headerStyles.menuBtn}
                    activeOpacity={0.7}
                >
                    <Text style={headerStyles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={headerStyles.title}>{title}</Text>
                <View style={headerStyles.placeholder} />
            </View>

            {/* Animated Drawer */}
            {menuVisible && (
                <AnimatedDrawer visible={menuVisible} onClose={() => setMenuVisible(false)}>
                    <SafeAreaView style={drawerStyles.safeArea}>
                        {/* Header */}
                        <View style={drawerStyles.header}>
                            <View style={drawerStyles.avatar}>
                                <Text style={drawerStyles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={drawerStyles.userName}>{user?.name || 'User'}</Text>
                            <Text style={drawerStyles.userEmail}>{user?.email || ''}</Text>
                            <View style={drawerStyles.roleBadge}>
                                <Text style={drawerStyles.roleText}>{user?.role || 'agent'}</Text>
                            </View>
                        </View>

                        {/* Menu Items */}
                        <ScrollView style={drawerStyles.menuContainer} showsVerticalScrollIndicator={false}>
                            {menuItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        drawerStyles.menuItem,
                                        currentRoute === item.screenName && drawerStyles.menuItemActive
                                    ]}
                                    onPress={() => handleNavigation(item.screenName)}
                                    activeOpacity={0.6}
                                >
                                    <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
                                    <Text style={[
                                        drawerStyles.menuLabel,
                                        currentRoute === item.screenName && drawerStyles.menuLabelActive
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Logout */}
                        <TouchableOpacity
                            style={drawerStyles.logoutBtn}
                            onPress={handleLogout}
                            activeOpacity={0.6}
                        >
                            <Text style={drawerStyles.logoutIcon}>🚪</Text>
                            <Text style={drawerStyles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </AnimatedDrawer>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 999,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#0f172a',
        zIndex: 1000,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
});

const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e293b',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 48,
    },
    menuBtn: {
        padding: 8,
    },
    menuIcon: {
        fontSize: 24,
        color: '#fff',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
});

const drawerStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        backgroundColor: '#1e293b',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    userName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: '#6366f120',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    roleText: {
        color: '#6366f1',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    menuContainer: {
        flex: 1,
        paddingTop: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 8,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemActive: {
        backgroundColor: '#6366f120',
    },
    menuIcon: {
        fontSize: 22,
        width: 32,
        color: '#cbd5e1',
    },
    menuLabel: {
        fontSize: 15,
        color: '#cbd5e1',
        fontWeight: '500',
    },
    menuLabelActive: {
        color: '#6366f1',
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        backgroundColor: '#ef444420',
        borderRadius: 12,
        marginBottom: 30,
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
});

// ── User Stack Navigator ──
function UserStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('Dashboard');

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            screenListeners={{
                state: (e) => {
                    const routes = e.data.state.routes;
                    if (routes.length > 0) {
                        setCurrentRoute(routes[routes.length - 1].name);
                    }
                },
            }}
        >
            <Stack.Screen name="Dashboard">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Dashboard"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <DashboardScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="CallLogs">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Call Logs"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <CallLogsScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="Attendance">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Attendance"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AttendanceScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="Reports">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Reports"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <ReportsScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="Leaderboard">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Leaderboard"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <LeaderboardScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="EmployeeLeaves">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="My Leaves"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <EmployeeLeavesScreen {...props} />
                    </>
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

// ── Admin Stack Navigator ──
function AdminStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('AdminDashboard');

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            screenListeners={{
                state: (e) => {
                    const routes = e.data.state.routes;
                    if (routes.length > 0) {
                        setCurrentRoute(routes[routes.length - 1].name);
                    }
                },
            }}
        >
            <Stack.Screen name="AdminDashboard">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Admin Dashboard"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AdminDashboardScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="AdminUsers">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Manage Users"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AdminUsersScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="AdminLeaves">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Leave Requests"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AdminLeavesScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="AdminAttendance">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Attendance"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AdminAttendanceScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="CallLogs">
                {(props) => (
                    <>
                        <CustomHeader navigation={props.navigation} title="Call Logs" user={user} onLogout={logout} currentRoute={currentRoute} />
                        <CallLogsScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="Reports">
                {(props) => (
                    <>
                        <CustomHeader navigation={props.navigation} title="Reports" user={user} onLogout={logout} currentRoute={currentRoute} />
                        <ReportsScreen {...props} />
                    </>
                )}
            </Stack.Screen>
            <Stack.Screen name="AdminSettings">
                {(props) => (
                    <>
                        <CustomHeader
                            navigation={props.navigation}
                            title="Settings"
                            user={user}
                            onLogout={logout}
                            currentRoute={currentRoute}
                        />
                        <AdminSettingsScreen {...props} />
                    </>
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

// ── Root Navigator ──
export default function AppNavigator() {
    const { token, user, loading, logout } = useContext(AuthContext);

    if (loading) return null;

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : isAdmin ? (
                    <Stack.Screen name="AdminMain" component={AdminStack} />
                ) : (
                    <Stack.Screen name="UserMain" component={UserStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}