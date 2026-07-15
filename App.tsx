/**
 * CarBooking Driver — ứng dụng dành cho tài xế
 * Hệ thống xe ghép Huế ↔ Đà Nẵng/Hội An
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { Alert, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator, { navigationRef } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';
import {
  subscribeForegroundMessages,
  subscribeNotificationTap,
} from './src/services/notificationService';

function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const cleanup = useAuthStore((s) => s.cleanup);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  // Bấm noti khi app tắt hẳn: getInitialNotification trả về trước khi auth
  // load xong (NavigationContainer chưa mount) → phải giữ lại, đợi đăng nhập
  // xong mới navigate. Không dùng navigationRef.isReady() làm điều kiện duy
  // nhất vì nó không reactive.
  const [pendingTripId, setPendingTripId] = useState<string | null>(null);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    initializeAuth();
    return cleanup;
  }, [initializeAuth, cleanup]);

  useEffect(() => {
    // App đang mở: FCM không tự hiện banner → hiện Alert
    const unsubMessage = subscribeForegroundMessages((title, body) => {
      Alert.alert(title, body);
    });
    // Bấm noti (background/quit) → mở thẳng chi tiết chuyến
    const unsubTap = subscribeNotificationTap((tripId) => {
      setPendingTripId(tripId);
    });
    return () => {
      unsubMessage();
      unsubTap();
    };
  }, []);

  useEffect(() => {
    // Route TripDetail chỉ tồn tại khi đã đăng nhập (session + profile)
    if (!pendingTripId || !session || !profile) return;
    if (!navReady || !navigationRef.isReady()) return;

    navigationRef.navigate('TripDetail', { tripId: pendingTripId });
    setPendingTripId(null);
  }, [pendingTripId, session, profile, navReady]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator onReady={() => setNavReady(true)} />
    </SafeAreaProvider>
  );
}

export default App;
