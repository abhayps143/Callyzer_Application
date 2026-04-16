// import React, { useContext } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Text } from 'react-native';
// import { AuthContext } from '../context/AuthContext';

// import LoginScreen from '../screens/LoginScreen';
// import DashboardScreen from '../screens/DashboardScreen';
// import CallLogsScreen from '../screens/CallLogsScreen';
// import AttendanceScreen from '../screens/AttendanceScreen';
// import ReportsScreen from '../screens/ReportsScreen';
// import LeaderboardScreen from '../screens/LeaderboardScreen';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// function MainTabs() {
//     return (
//         <Tab.Navigator
//             screenOptions={{
//                 tabBarStyle: {
//                     backgroundColor: '#1e293b',
//                     borderTopColor: '#334155',
//                     height: 60,
//                     paddingBottom: 8,
//                 },
//                 tabBarActiveTintColor: '#6366f1',
//                 tabBarInactiveTintColor: '#64748b',
//                 headerShown: false,
//             }}
//         >
//             <Tab.Screen
//                 name="Dashboard"
//                 component={DashboardScreen}
//                 options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }}
//             />
//             <Tab.Screen
//                 name="Call Logs"
//                 component={CallLogsScreen}
//                 options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📞</Text> }}
//             />
//             <Tab.Screen
//                 name="Attendance"
//                 component={AttendanceScreen}
//                 options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📍</Text> }}
//             />
//             <Tab.Screen
//                 name="Reports"
//                 component={ReportsScreen}
//                 options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text> }}
//             />
//             <Tab.Screen
//                 name="Leaderboard"
//                 component={LeaderboardScreen}
//                 options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏆</Text> }}
//             />
//         </Tab.Navigator>
//     );
// }

// export default function AppNavigator() {
//     const { token, loading } = useContext(AuthContext);
//     if (loading) return null;

//     return (
//         <NavigationContainer>
//             <Stack.Navigator screenOptions={{ headerShown: false }}>
//                 {token ? (
//                     <Stack.Screen name="Main" component={MainTabs} />
//                 ) : (
//                     <Stack.Screen name="Login" component={LoginScreen} />
//                 )}
//             </Stack.Navigator>
//         </NavigationContainer>
//     );
// }

import React, { useContext } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CallLogsScreen from '../screens/CallLogsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import EmployeeLeavesScreen from '../screens/EmployeeLeavesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BASE_TAB_STYLE = {
    tabBarStyle: {
        backgroundColor: '#1e293b',
        borderTopColor: '#334155',
        height: 62,
        paddingBottom: 8,
        paddingTop: 4,
    },
    tabBarInactiveTintColor: '#64748b',
    headerShown: false,
};

const icon = (emoji) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

// ── EMPLOYEE tabs  ────────────────────────────────────────────
function EmployeeTabs() {
    return (
        <Tab.Navigator screenOptions={{ ...BASE_TAB_STYLE, tabBarActiveTintColor: '#6366f1' }}>
            <Tab.Screen name="Dashboard"   component={DashboardScreen}      options={{ tabBarIcon: icon('🏠'), tabBarLabel: 'Home' }} />
            <Tab.Screen name="CallLogs"    component={CallLogsScreen}       options={{ tabBarIcon: icon('📞'), tabBarLabel: 'Calls' }} />
            <Tab.Screen name="Attendance"  component={AttendanceScreen}     options={{ tabBarIcon: icon('📍'), tabBarLabel: 'Attend' }} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen}    options={{ tabBarIcon: icon('🏆'), tabBarLabel: 'Board' }} />
            <Tab.Screen name="MyLeaves"    component={EmployeeLeavesScreen} options={{ tabBarIcon: icon('🗓️'), tabBarLabel: 'Leaves' }} />
        </Tab.Navigator>
    );
}

// ── MANAGER tabs ──────────────────────────────────────────────
function ManagerTabs() {
    return (
        <Tab.Navigator screenOptions={{ ...BASE_TAB_STYLE, tabBarActiveTintColor: '#8b5cf6' }}>
            <Tab.Screen name="Dashboard"   component={DashboardScreen}   options={{ tabBarIcon: icon('🏠'), tabBarLabel: 'Home' }} />
            <Tab.Screen name="CallLogs"    component={CallLogsScreen}    options={{ tabBarIcon: icon('📞'), tabBarLabel: 'Calls' }} />
            <Tab.Screen name="Reports"     component={ReportsScreen}     options={{ tabBarIcon: icon('📊'), tabBarLabel: 'Reports' }} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarIcon: icon('🏆'), tabBarLabel: 'Board' }} />
            <Tab.Screen name="Attendance"  component={AttendanceScreen}  options={{ tabBarIcon: icon('📍'), tabBarLabel: 'Attend' }} />
        </Tab.Navigator>
    );
}

// ── HR tabs ───────────────────────────────────────────────────
function HrTabs() {
    return (
        <Tab.Navigator screenOptions={{ ...BASE_TAB_STYLE, tabBarActiveTintColor: '#22c55e' }}>
            <Tab.Screen name="Dashboard"   component={DashboardScreen}   options={{ tabBarIcon: icon('🏠'), tabBarLabel: 'Home' }} />
            <Tab.Screen name="CallLogs"    component={CallLogsScreen}    options={{ tabBarIcon: icon('📞'), tabBarLabel: 'Calls' }} />
            <Tab.Screen name="Reports"     component={ReportsScreen}     options={{ tabBarIcon: icon('📊'), tabBarLabel: 'Reports' }} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarIcon: icon('🏆'), tabBarLabel: 'Board' }} />
            <Tab.Screen name="Attendance"  component={AttendanceScreen}  options={{ tabBarIcon: icon('📍'), tabBarLabel: 'Attend' }} />
        </Tab.Navigator>
    );
}

// ── ADMIN tabs ────────────────────────────────────────────────
function AdminTabs() {
    return (
        <Tab.Navigator screenOptions={{ ...BASE_TAB_STYLE, tabBarActiveTintColor: '#ef4444' }}>
            <Tab.Screen name="Dashboard"   component={DashboardScreen}   options={{ tabBarIcon: icon('🏠'), tabBarLabel: 'Home' }} />
            <Tab.Screen name="CallLogs"    component={CallLogsScreen}    options={{ tabBarIcon: icon('📞'), tabBarLabel: 'Calls' }} />
            <Tab.Screen name="Reports"     component={ReportsScreen}     options={{ tabBarIcon: icon('📊'), tabBarLabel: 'Reports' }} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarIcon: icon('🏆'), tabBarLabel: 'Board' }} />
            <Tab.Screen name="Attendance"  component={AttendanceScreen}  options={{ tabBarIcon: icon('📍'), tabBarLabel: 'Attend' }} />
        </Tab.Navigator>
    );
}

// ── Route to correct tabs by role ─────────────────────────────
function MainTabs() {
    const { user } = useContext(AuthContext);
    const role = user?.role?.toLowerCase();
    if (role === 'manager') return <ManagerTabs />;
    if (role === 'hr')      return <HrTabs />;
    if (role === 'admin')   return <AdminTabs />;
    return <EmployeeTabs />;
}

export default function AppNavigator() {
    const { token, loading } = useContext(AuthContext);
    if (loading) return null;
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token
                    ? <Stack.Screen name="Main"  component={MainTabs}    />
                    : <Stack.Screen name="Login" component={LoginScreen} />
                }
            </Stack.Navigator>
        </NavigationContainer>
    );
}
