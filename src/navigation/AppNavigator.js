import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, SafeAreaView, Dimensions, Animated,
    Easing, Pressable, Modal, ActivityIndicator,
} from 'react-native';
 
import { C } from '../theme';
import { AuthContext } from '../context/AuthContext';
import Constants from 'expo-constants';
 
import LoginScreen from '../screens/LoginScreen';
import CallLogsScreen from '../screens/CallLogsScreen';
import DeviceCallSyncScreen from '../screens/DeviceCallSyncScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
 
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
 
import BusinessDashboardScreen from '../screens/BusinessDashboardScreen';
 
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;
 
const ROLE_COLOR = {
    super_admin:   '#8B5CF6',
    business_user: '#10B981',
};
 
const MENUS = {
    super_admin: [
        { id: 'AdminDashboard', label: 'Dashboard',   icon: '🏠' },
        { id: 'AdminUsers',     label: 'Users',       icon: '👥' },
        { id: 'CallLogs',       label: 'Call Logs',   icon: '📞' },
        { id: 'DeviceCallSync', label: 'Device Sync', icon: '📲' },
        { id: 'Reports',        label: 'Reports',     icon: '📊' },
        { id: 'Leaderboard',    label: 'Leaderboard', icon: '🏆' },
        { id: 'AdminSettings',  label: 'Settings',    icon: '⚙️' },
    ],
    business_user: [
        { id: 'BusinessDashboard', label: 'Dashboard',   icon: '🏠' },
        { id: 'CallLogs',          label: 'Call Logs',   icon: '📞' },
        { id: 'DeviceCallSync',    label: 'Device Sync', icon: '📲' },
        { id: 'Reports',           label: 'Reports',     icon: '📊' },
        { id: 'Leaderboard',       label: 'Leaderboard', icon: '🏆' },
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
                Animated.timing(translateX, {
                    toValue: 0, duration: 300,
                    easing: Easing.bezier(0.5, 0.01, 0, 1), useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.5, duration: 300, useNativeDriver: true
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -DRAWER_WIDTH, duration: 300,
                    easing: Easing.bezier(0.5, 0.01, 0, 1), useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0, duration: 300, useNativeDriver: true
                }),
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
    const isSuperAdmin = user?.role === 'super_admin';
    const menuKey = isSuperAdmin ? 'super_admin' : 'business_user';
    const menuItems = MENUS[menuKey];
    const roleColor = ROLE_COLOR[user?.role] || "#10B981";
 
    const handleNavigation = (screenName) => {
        setMenuVisible(false);
        setTimeout(() => navigation.navigate(screenName), 150);
    };
    const handleLogout = () => {
        setMenuVisible(false);
        setTimeout(() => onLogout(), 150);
    };
 
    return (
        <>
            <View style={[headerStyles.container, { borderBottomColor: roleColor + "50" }]}>
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
            <AnimatedDrawer visible={menuVisible} onClose={() => setMenuVisible(false)}>
                <SafeAreaView style={drawerStyles.safeArea}>
                    <View style={[drawerStyles.header, { borderBottomColor: roleColor + "40" }]}>
                        <View style={[drawerStyles.avatar, { backgroundColor: roleColor + "30" }]}>
                            <Text style={[drawerStyles.avatarText, { color: roleColor }]}>
                                {(user?.name || "U").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={drawerStyles.userName}>{user?.name || "User"}</Text>
                        <Text style={drawerStyles.userEmail}>{user?.email || ""}</Text>
                        <View style={[drawerStyles.roleBadge, { backgroundColor: roleColor + "20" }]}>
                            <Text style={[drawerStyles.roleText, { color: roleColor }]}>
                                {user?.role?.replace('_', ' ') || 'User'}
                            </Text>
                        </View>
                    </View>
                    <ScrollView style={drawerStyles.menuContainer} showsVerticalScrollIndicator={false}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    drawerStyles.menuItem,
                                    currentRoute === item.id && [drawerStyles.menuItemActive, { backgroundColor: roleColor + "20" }]
                                ]}
                                onPress={() => handleNavigation(item.id)}
                                activeOpacity={0.6}
                            >
                                <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
                                <Text style={[
                                    drawerStyles.menuLabel,
                                    currentRoute === item.id && [drawerStyles.menuLabelActive, { color: roleColor }]
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={drawerStyles.logoutBtn} onPress={handleLogout} activeOpacity={0.6}>
                        <Text style={drawerStyles.logoutIcon}>🚪</Text>
                        <Text style={drawerStyles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                    <View style={drawerStyles.drawerFooter}>
                        <View style={drawerStyles.footerLogoRow}>
                            <View style={drawerStyles.footerLogoBox}>
                                <Text style={drawerStyles.footerLogoEmoji}>📞</Text>
                            </View>
                            <View>
                                <Text style={drawerStyles.footerAppName}>Callyzer</Text>
                                <Text style={drawerStyles.footerVersion}>
                                    v{Constants.expoConfig?.version || '1.0.0'}
                                </Text>
                            </View>
                        </View>
                        <Text style={drawerStyles.footerTagline}>Call Management System</Text>
                    </View>
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
 
// ── Super Admin Stack ────────────────────────────────────────────
function SuperAdminStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('AdminDashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator
            screenListeners={{
                state: (e) => {
                    const r = e.data.state.routes;
                    if (r.length > 0) setCurrentRoute(r[r.length - 1].name);
                }
            }}
        >
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen}
                options={makeHeaderOptions('Admin Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen}
                options={makeHeaderOptions('Manage Users', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="CallLogs" component={CallLogsScreen}
                options={makeHeaderOptions('Call Logs', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="DeviceCallSync" component={DeviceCallSyncScreen}
                options={makeHeaderOptions('Device Call Sync', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Reports" component={ReportsScreen}
                options={makeHeaderOptions('Reports', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen}
                options={makeHeaderOptions('Leaderboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="AdminSettings" component={AdminSettingsScreen}
                options={makeHeaderOptions('Settings', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}
 
// ── Business User Stack ──────────────────────────────────────────
function BusinessUserStack() {
    const { user, logout } = useContext(AuthContext);
    const [currentRoute, setCurrentRoute] = useState('BusinessDashboard');
    const userRef = useRef(user);
    const logoutRef = useRef(logout);
    const currentRouteRef = useRef(currentRoute);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { logoutRef.current = logout; }, [logout]);
    useEffect(() => { currentRouteRef.current = currentRoute; }, [currentRoute]);
    return (
        <Stack.Navigator
            screenListeners={{
                state: (e) => {
                    const r = e.data.state.routes;
                    if (r.length > 0) setCurrentRoute(r[r.length - 1].name);
                }
            }}
        >
            <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen}
                options={makeHeaderOptions('Dashboard', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="CallLogs" component={CallLogsScreen}
                options={makeHeaderOptions('Call Logs', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="DeviceCallSync" component={DeviceCallSyncScreen}
                options={makeHeaderOptions('Device Call Sync', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Reports" component={ReportsScreen}
                options={makeHeaderOptions('Reports', userRef, logoutRef, currentRouteRef)} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen}
                options={makeHeaderOptions('Leaderboard', userRef, logoutRef, currentRouteRef)} />
        </Stack.Navigator>
    );
}
 
// ── Root Navigator ───────────────────────────────────────────────
export default function AppNavigator() {
    const { token, user, loading } = useContext(AuthContext);
 
    if (loading) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }
 
    const isSuperAdmin = user?.role === 'super_admin';
 
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!token ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : isSuperAdmin ? (
                    <Stack.Screen name="SuperAdminMain" component={SuperAdminStack} />
                ) : (
                    <Stack.Screen name="BusinessUserMain" component={BusinessUserStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
 
const styles = StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 999 },
    drawer:   { position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: '#0f172a', zIndex: 1000, elevation: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
    splash:   { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
});
 
const headerStyles = StyleSheet.create({
    container:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, borderBottomWidth: 1 },
    menuBtn:     { padding: 8 },
    menuIcon:    { fontSize: 24, color: '#fff' },
    title:       { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    placeholder: { width: 40 },
});
 
const drawerStyles = StyleSheet.create({
    safeArea:       { flex: 1 },
    header:         { backgroundColor: '#1e293b', padding: 20, alignItems: 'center', borderBottomWidth: 1 },
    avatar:         { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    avatarText:     { fontSize: 28, fontWeight: 'bold' },
    userName:       { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    userEmail:      { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
    roleBadge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    roleText:       { fontSize: 12, textTransform: 'capitalize', fontWeight: '600' },
    menuContainer:  { flex: 1, paddingTop: 16 },
    menuItem:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20, marginHorizontal: 8, borderRadius: 12, marginBottom: 4 },
    menuItemActive: {},
    menuIcon:       { fontSize: 22, width: 36, color: '#cbd5e1' },
    menuLabel:      { fontSize: 15, color: '#cbd5e1', fontWeight: '500' },
    menuLabelActive:{ fontWeight: 'bold' },
    logoutBtn:      { flexDirection: 'row', alignItems: 'center', padding: 16, margin: 16, backgroundColor: '#ef444420', borderRadius: 12, marginBottom: 8 },
    logoutIcon:     { fontSize: 20, marginRight: 12 },
    logoutText:     { color: '#ef4444', fontSize: 15, fontWeight: '600' },
    drawerFooter:   { borderTopWidth: 1, borderTopColor: "#ffffff15", paddingHorizontal: 20, paddingVertical: 16, marginBottom: 8 },
    footerLogoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    footerLogoBox:  { width: 36, height: 36, borderRadius: 10, backgroundColor: "#1E40AF", justifyContent: "center", alignItems: "center" },
    footerLogoEmoji:{ fontSize: 18 },
    footerAppName:  { color: '#ffffff', fontSize: 14, fontWeight: '700' },
    footerVersion:  { color: '#64748b', fontSize: 11, marginTop: 1 },
    footerTagline:  { color: '#475569', fontSize: 11 },
});
