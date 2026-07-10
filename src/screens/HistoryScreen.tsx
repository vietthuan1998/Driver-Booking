import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { getTripHistoryByMonth } from '../services/statsService';
import type { TripHistoryItem } from '../services/statsService';
import type { RootStackParamList } from '../navigation/types';
import { CARD_SHADOW, COLORS } from '../utils/constants';
import { formatDateShort, fCurrency } from '../utils/helpers';

type HistoryScreenRouteProps = RouteProp<RootStackParamList, 'History'>;
type HistoryScreenNavigationProps = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProps>();
  const route = useRoute<HistoryScreenRouteProps>();
  const initialMonth = (route.params?.month as Date) || new Date();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadTrips = useCallback(
    async (month: Date, newOffset: number = 0) => {
      try {
        setError(null);
        if (newOffset === 0) setLoading(true);
        const data = await getTripHistoryByMonth(month, 20, newOffset);
        if (newOffset === 0) {
          setTrips(data);
        } else {
          setTrips((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === 20);
        setOffset(newOffset);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadTrips(selectedMonth, 0);
    }, [loadTrips, selectedMonth]),
  );

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadTrips(selectedMonth, offset + 20);
    }
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setSelectedMonth(newMonth);
  };

  const monthLabel = selectedMonth.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const renderTrip = ({ item }: { item: TripHistoryItem }) => (
    <Pressable
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripCode}>{item.trip_code}</Text>
          <Text style={styles.tripRoute}>
            {item.route?.origin} → {item.route?.destination}
          </Text>
        </View>
        <StatusBadge status={item.trip_status} />
      </View>

      <View style={styles.tripDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Ngày:</Text>
          <Text style={styles.detailValue}>{formatDateShort(item.planned_departure_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🚗 Xe:</Text>
          <Text style={styles.detailValue}>{item.vehicle?.plate_number}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👥 Khách:</Text>
          <Text style={styles.detailValue}>{item.passengersCount} người</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰 Doanh thu:</Text>
          <Text style={[styles.detailValue, styles.fareValue]}>
            {fCurrency(item.totalFare)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <Pressable style={styles.monthArrow} onPress={() => changeMonth(-1)}>
          <Text style={styles.monthArrowText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable style={styles.monthArrow} onPress={() => changeMonth(1)}>
          <Text style={styles.monthArrowText}>›</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        scrollEnabled={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={loading && offset === 0} onRefresh={() => loadTrips(selectedMonth, 0)} />}
        renderItem={renderTrip}
        ListEmptyComponent={
          loading && offset === 0 ? null : (
            <EmptyState message="Không có chuyến nào trong tháng này" />
          )
        }
        ListFooterComponent={
          loading && offset > 0 ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    ...CARD_SHADOW,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  tripCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...CARD_SHADOW,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  tripInfo: {
    flex: 1,
  },
  tripCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  tripRoute: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tripDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  fareValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footerLoader: {
    marginVertical: 16,
  },
});
