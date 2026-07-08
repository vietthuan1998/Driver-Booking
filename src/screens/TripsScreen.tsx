import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import { getMyTripsByDate } from '../services/tripService';
import type { Trip } from '../types';
import { CARD_SHADOW, COLORS } from '../utils/constants';
import { addDays, formatDate, isSameDay } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

export default function TripsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      setError(null);
      setTrips(await getMyTripsByDate(date));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(selectedDate);
    }, [load, selectedDate]),
  );

  const changeDay = (delta: number) => setSelectedDate((d) => addDays(d, delta));
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <View style={styles.container}>
      <View style={styles.datePicker}>
        <Pressable style={styles.dateArrow} onPress={() => changeDay(-1)}>
          <Text style={styles.dateArrowText}>‹</Text>
        </Pressable>
        <Pressable style={styles.dateCenter} onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {!isToday && <Text style={styles.todayHint}>Chạm để về hôm nay</Text>}
        </Pressable>
        <Pressable style={styles.dateArrow} onPress={() => changeDay(1)}>
          <Text style={styles.dateArrowText}>›</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(selectedDate)} />}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={(t) => navigation.navigate('TripDetail', { tripId: t.id })} />
        )}
        ListEmptyComponent={
          loading ? null : <EmptyState message="Không có chuyến nào trong ngày này" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...CARD_SHADOW,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: { fontSize: 22, color: COLORS.primary, fontWeight: '700', marginTop: -2 },
  dateCenter: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  todayHint: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  list: { padding: 16 },
  error: { color: COLORS.danger, paddingHorizontal: 16, paddingTop: 8 },
});
