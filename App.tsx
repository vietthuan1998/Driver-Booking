/**
 * CarBooking Driver — ứng dụng dành cho tài xế
 * Hệ thống xe ghép Huế ↔ Đà Nẵng/Hội An
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';

function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const cleanup = useAuthStore((s) => s.cleanup);

  useEffect(() => {
    initializeAuth();
    return cleanup;
  }, [initializeAuth, cleanup]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
