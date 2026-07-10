import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getTodayStats,
  getThisWeekStats,
  getThisMonthStats,
  type StatsData,
} from '../services/statsService';
import type { RootStackParamList } from '../navigation/types';
import { CARD_SHADOW, COLORS } from '../utils/constants';
import { fCurrency } from '../utils/helpers';

type StatsPeriod = 'today' | 'week' | 'month';

export default function StatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [period, setPeriod] = useState<StatsPeriod>('today');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      let data;
      if (period === 'today') {
        data = await getTodayStats();
      } else if (period === 'week') {
        data = await getThisWeekStats();
      } else {
        data = await getThisMonthStats();
      }
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const periodLabels: Record<StatsPeriod, string> = {
    today: 'Hôm nay',
    week: 'Tuần này',
    month: 'Tháng này',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as StatsPeriod[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodBtn, p === period && styles.periodBtnActive]}
          >
            <Text style={[styles.periodBtnText, p === period && styles.periodBtnTextActive]}>
              {periodLabels[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading && !stats ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : stats ? (
        <>
          {/* Main Stats Grid */}
          <View style={styles.grid}>
            {/* Revenue Card */}
            <View style={[styles.statCard, styles.revenueCard]}>
              <Text style={styles.statLabel}>💰 Doanh thu</Text>
              <Text style={styles.statValue}>{fCurrency(stats.totalRevenue)}</Text>
            </View>

            {/* Completed Trips Card */}
            <View style={[styles.statCard, styles.tripsCard]}>
              <Text style={styles.statLabel}>✅ Chuyến hoàn thành</Text>
              <Text style={styles.statValue}>{stats.completedTrips}</Text>
              <Text style={styles.statSubtext}>Tổng: {stats.totalTrips}</Text>
            </View>

            {/* Passengers Card */}
            <View style={[styles.statCard, styles.passengersCard]}>
              <Text style={styles.statLabel}>👥 Hành khách</Text>
              <Text style={styles.statValue}>{stats.totalPassengers}</Text>
            </View>

            {/* Rating Card */}
            <View style={[styles.statCard, styles.ratingCard]}>
              <Text style={styles.statLabel}>⭐ Đánh giá</Text>
              <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statSubtext}>/ 5.0</Text>
            </View>
          </View>

          {/* Average Stats */}
          <View style={styles.averageSection}>
            <Text style={styles.sectionTitle}>Thống kê trung bình</Text>
            <View style={styles.averageGrid}>
              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Doanh thu/chuyến</Text>
                <Text style={styles.averageValue}>
                  {stats.completedTrips > 0
                    ? fCurrency(stats.totalRevenue / stats.completedTrips)
                    : '—'}
                </Text>
              </View>
              <View style={styles.averageItem}>
                <Text style={styles.averageLabel}>Khách/chuyến</Text>
                <Text style={styles.averageValue}>
                  {stats.completedTrips > 0
                    ? (stats.totalPassengers / stats.completedTrips).toFixed(1)
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* View History Button */}
          <Pressable style={styles.historyBtn} onPress={handleViewHistory}>
            <Text style={styles.historyBtnText}>📋 Xem lịch sử chuyến</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...CARD_SHADOW,
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginTop: 40,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    ...CARD_SHADOW,
    justifyContent: 'center',
  },
  revenueCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tripsCard: {
    backgroundColor: '#dbeafe',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  passengersCard: {
    backgroundColor: '#d1fae5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  ratingCard: {
    backgroundColor: '#fecdd3',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  averageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  averageGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  averageItem: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...CARD_SHADOW,
  },
  averageLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  averageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
