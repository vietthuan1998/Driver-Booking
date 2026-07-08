import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import { getMyTripsByDate } from '../services/tripService';
import { useAuthStore } from '../stores/authStore';
import type { Trip } from '../types';
import { CARD_SHADOW, COLORS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTrips(await getMyTripsByDate(new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload mỗi lần quay lại màn hình (sau khi đổi trạng thái chuyến ở TripDetail)
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      load();
      return () => StatusBar.setBarStyle('dark-content');
    }, [load]),
  );

  const inProgress = trips.filter((t) => t.trip_status === 'in_progress');
  const upcoming = trips.filter((t) => t.trip_status === 'scheduled');
  const done = trips.filter((t) => t.trip_status === 'completed');

  const openTrip = (trip: Trip) => navigation.navigate('TripDetail', { tripId: trip.id });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor="#fff" />
      }
    >
      {/* Lấp màu xanh khi kéo overscroll trên iOS */}
      <View style={styles.topFill} />
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.greeting}>Xin chào, {profile?.full_name ?? 'tài xế'} 👋</Text>
        <Text style={styles.date}>{formatDate(new Date())}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>Chuyến hôm nay</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{inProgress.length}</Text>
            <Text style={styles.statLabel}>Đang chạy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{done.length}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {inProgress.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View style={[styles.sectionAccent, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.section}>Chuyến đang chạy</Text>
            </View>
            {inProgress.map((t) => (
              <TripCard key={t.id} trip={t} onPress={openTrip} />
            ))}
          </>
        )}

        <View style={styles.sectionRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.section}>Chuyến sắp tới</Text>
        </View>
        {upcoming.length === 0 && !loading ? (
          <EmptyState message="Không còn chuyến nào sắp tới trong hôm nay" />
        ) : (
          upcoming.map((t) => <TripCard key={t.id} trip={t} onPress={openTrip} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 32 },
  topFill: {
    position: 'absolute',
    top: -400,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: COLORS.primary,
  },
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 52,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  date: { fontSize: 14, color: '#cfe0ff', marginTop: 4, textTransform: 'capitalize' },
  body: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: -36, marginBottom: 20 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
    ...CARD_SHADOW,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: COLORS.primary },
  section: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  error: { color: COLORS.danger, marginBottom: 8 },
});
