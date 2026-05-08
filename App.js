// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });


// import React from 'react';
// import { AuthProvider } from './src/context/AuthContext';
// import AppNavigator from './src/navigation/AppNavigator';
// import './src/services/callLogService';

// export default function App() {
//   return (
//     <AuthProvider>
//       <AppNavigator />
//     </AuthProvider>
//   );
// }





import React, { useEffect, useRef, useContext } from 'react';
import { Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/services/callLogService';
import { API_BASE_URL } from './src/config';

// Notification handler — background mein bhi dikhegi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Derive Socket URL from API_BASE_URL — strip /api suffix
// e.g. 'http://192.168.1.65:5000/api'  =>  'http://192.168.1.65:5000'
const SOCKET_URL = API_BASE_URL.replace('/api', '');

// ── Dial Listener — listens for dial-request from website ──
function DialListener() {
  const socketRef = useRef(null);
  const authCtx   = useContext(AuthContext);

  useEffect(() => {
    // Only connect when user is logged in
    if (!authCtx || !authCtx.token || !authCtx.user) return;

    const connect = async () => {
      try {
        const token  = await AsyncStorage.getItem('token');
        const stored = await AsyncStorage.getItem('user');
        if (!token || !stored) return;
        const user = JSON.parse(stored);

        const socket = io(SOCKET_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 3000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[DialSocket] Connected:', socket.id);
          // Join user room — isMobile:true lets backend detect mobile
          socket.emit('join-user', {
            userId:         user._id || user.id,
            role:           user.role,
            businessUserId: user.businessUserId || null,
            isMobile:       true,
          });
        });

        // ── MAIN EVENT — website triggers a call ──────────
        // socket.on('dial-request', ({ phoneNumber, customerName }) => {
        //   console.log('[DialSocket] Dial request:', phoneNumber, customerName);
        //   const dialUrl = `tel:${phoneNumber}`;
        //   Linking.canOpenURL(dialUrl).then(supported => {
        //     if (supported) {
        //       Linking.openURL(dialUrl);
        //     } else {
        //       Alert.alert(
        //         'Incoming Call Request',
        //         `Call ${customerName || phoneNumber}?\n${phoneNumber}`,
        //         [
        //           { text: 'Call', onPress: () => Linking.openURL(dialUrl) },
        //           { text: 'Cancel', style: 'cancel' },
        //         ]
        //       );
        //     }
        //   });
        // });

        // socket.on('dial-request', ({ phoneNumber, customerName }) => {
        //   console.log('[DialSocket] Dial request:', phoneNumber, customerName);
        //   const dialUrl = `tel:${phoneNumber}`;
        //   Linking.openURL(dialUrl).catch(err => {
        //     console.warn('[DialSocket] Could not open dialer:', err);
        //   });
        // });

        socket.on('dial-request', ({ phoneNumber, customerName }) => {
          console.log('[DialSocket] Dial request:', phoneNumber, customerName);
          const dialUrl = `tel:${phoneNumber}`;

          const appState = AppState.currentState;
          console.log('[DialSocket] AppState:', appState);

          if (appState === 'active') {
            // App foreground mein hai — seedha dialer kholo
            Linking.openURL(dialUrl).catch(err => {
              console.warn('[DialSocket] Could not open dialer:', err);
            });
          } else {
            // App background/home screen mein hai — notification bhejo
            Notifications.requestPermissionsAsync().then(({ status }) => {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: '📞 Call ' + (customerName || phoneNumber),
                  body: 'Tap to dial: ' + phoneNumber,
                  data: { dialUrl },
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: null, // turant show karo
              });
            });
          }
        });

        socket.on('disconnect', reason => console.log('[DialSocket] Disconnected:', reason));
        socket.on('connect_error', err => console.warn('[DialSocket] Error:', err.message));

      } catch (err) {
        console.error('[DialSocket] Setup error:', err);
      }
    };

    connect();

    const notifSub = Notifications.addNotificationResponseReceivedListener(response => {
      const dialUrl = response.notification.request.content.data?.dialUrl;
      if (dialUrl) {
        Linking.openURL(dialUrl).catch(err =>
          console.warn('[DialSocket] Notification dial error:', err)
        );
      }
    });

    return () => {
      notifSub.remove();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authCtx?.token]);   // re-connect when token changes

  return null;   // No UI — invisible background listener
}

// ── Root App ────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthContext.Consumer>
        {() => (
          <>
            <DialListener />
            <AppNavigator />
          </>
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  );
}

