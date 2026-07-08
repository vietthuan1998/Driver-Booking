import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TripsScreen from '../screens/TripsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import VehicleScreen from '../screens/VehicleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingView from '../components/LoadingView';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../utils/constants';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={focused ? styles.iconFocused : styles.icon}>{emoji}</Text>;
}

const renderHomeIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon emoji="🏠" focused={focused} />
);
const renderTripsIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon emoji="🗓️" focused={focused} />
);
const renderVehicleIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon emoji="🚐" focused={focused} />
);
const renderProfileIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon emoji="👤" focused={focused} />
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.card },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800', color: COLORS.text },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#1e3a8a',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{
          title: 'Chuyến đi',
          tabBarIcon: renderTripsIcon,
        }}
      />
      <Tab.Screen
        name="Vehicle"
        component={VehicleScreen}
        options={{
          title: 'Xe của tôi',
          tabBarIcon: renderVehicleIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Cá nhân',
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <LoadingView />;

  return (
    <NavigationContainer>
      {session && profile ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.card },
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '800', color: COLORS.text },
            headerTintColor: COLORS.primary,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="TripDetail"
            component={TripDetailScreen}
            options={{ title: 'Chi tiết chuyến', headerBackTitle: 'Quay lại' }}
          />
        </Stack.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20, opacity: 0.45 },
  iconFocused: { fontSize: 20, opacity: 1 },
});
