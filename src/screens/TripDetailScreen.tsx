import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import StatusBadge from '../components/StatusBadge';
import LoadingView from '../components/LoadingView';
import {
  completeTrip,
  getTripById,
  getTripSeatsWithBookings,
  startTrip,
} from '../services/tripService';
import type { Trip, TripSeatRow } from '../types';
import {
  BOOKING_STATUS_LABEL,
  CARD_SHADOW,
  COLORS,
  TRIP_STATUS_COLOR,
  TRIP_STATUS_LABEL,
} from '../utils/constants';
import { formatDateShort, formatTime } from '../utils/helpers';
import type { RootStackParamList } from '../navigation/types';

export default function TripDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetail'>>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<TripSeatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [tripData, seatData] = await Promise.all([
        getTripById(tripId),
        getTripSeatsWithBookings(tripId),
      ]);
      setTrip(tripData);
      setSeats(seatData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleStart = () => {
    Alert.alert('Bắt đầu chuyến', 'Xác nhận bắt đầu chuyến đi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bắt đầu',
        onPress: async () => {
          setUpdating(true);
          try {
            await startTrip(tripId);
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Hoàn thành chuyến', 'Xác nhận đã hoàn thành chuyến đi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hoàn thành',
        onPress: async () => {
          setUpdating(true);
          try {
            await completeTrip(tripId);
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading && !trip) return <LoadingView />;
  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Không tìm thấy chuyến'}</Text>
      </View>
    );
  }

  // seat_order 1 là ghế tài xế — không tính khách
  const bookedSeats = seats.filter(
    (s) => s.status === 'booked' && s.booking && (s.seat?.seat_order ?? 0) > 1,
  );
  const passengerCapacity = trip.vehicle ? trip.vehicle.seat_count : 0;

  // Gom ghế theo booking để hiển thị mỗi khách 1 thẻ
  const bookingGroups = new Map<string, { seats: string[]; row: TripSeatRow }>();
  for (const s of bookedSeats) {
    const key = s.booking!.id;
    const group = bookingGroups.get(key);
    if (group) group.seats.push(s.seat?.seat_code ?? '?');
    else bookingGroups.set(key, { seats: [s.seat?.seat_code ?? '?'], row: s });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.tripCode}>{trip.trip_code}</Text>
          <StatusBadge
            label={TRIP_STATUS_LABEL[trip.trip_status]}
            color={TRIP_STATUS_COLOR[trip.trip_status]}
          />
        </View>

        {/* Timeline điểm đi → điểm đến */}
        <View style={styles.timeline}>
          <View style={styles.timelineRail}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: COLORS.danger }]} />
          </View>
          <View style={styles.timelineStops}>
            <Text style={styles.stopText}>{trip.route?.origin ?? '—'}</Text>
            <Text style={styles.stopText}>{trip.route?.destination ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <InfoItem label="Ngày" value={formatDateShort(trip.planned_departure_time)} />
          <InfoItem label="Giờ xuất phát" value={formatTime(trip.planned_departure_time)} />
          <InfoItem label="Xuất phát thực tế" value={formatTime(trip.actual_departure_time)} />
          <InfoItem label="Đến nơi thực tế" value={formatTime(trip.actual_arrival_time)} />
          <InfoItem label="Xe" value={trip.vehicle?.plate_number ?? '—'} />
          <InfoItem
            label="Khách / sức chứa"
            value={`${bookedSeats.length}/${passengerCapacity}`}
          />
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {trip.trip_status === 'scheduled' && (
        <ActionButton label="Bắt đầu chuyến" color={COLORS.primary} busy={updating} onPress={handleStart} />
      )}
      {trip.trip_status === 'in_progress' && (
        <ActionButton label="Hoàn thành chuyến" color={COLORS.success} busy={updating} onPress={handleComplete} />
      )}

      <View style={styles.sectionRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.section}>Hành khách ({bookingGroups.size})</Text>
      </View>
      {bookingGroups.size === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Chưa có khách đặt ghế</Text>
        </View>
      ) : (
        [...bookingGroups.values()].map(({ seats: seatCodes, row }) => {
          const b = row.booking!;
          const initial = b.customer?.full_name?.trim().split(' ').slice(-1)[0]?.charAt(0) ?? 'K';
          return (
            <View key={b.id} style={styles.card}>
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{initial.toUpperCase()}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{b.customer?.full_name ?? 'Khách lẻ'}</Text>
                  <Text style={styles.muted}>
                    {BOOKING_STATUS_LABEL[b.status]} · {b.booking_code}
                  </Text>
                </View>
                <View style={styles.seatChip}>
                  <Text style={styles.seatCodes}>Ghế {seatCodes.join(', ')}</Text>
                </View>
              </View>
              <View style={styles.addressBlock}>
                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.address}>Đón: {b.pickup_address}</Text>
                </View>
                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, { backgroundColor: COLORS.danger }]} />
                  <Text style={styles.address}>Trả: {b.dropoff_address}</Text>
                </View>
              </View>
              {b.customer?.phone && (
                <Pressable
                  style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
                  onPress={() => Linking.openURL(`tel:${b.customer!.phone}`)}
                >
                  <Text style={styles.callButtonText}>📞 Gọi {b.customer.phone}</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  color,
  busy,
  onPress,
}: {
  label: string;
  color: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, { backgroundColor: color }, (pressed || busy) && styles.pressed]}
      onPress={onPress}
      disabled={busy}
    >
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    ...CARD_SHADOW,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripCode: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  timeline: { flexDirection: 'row', gap: 10, marginTop: 2 },
  timelineRail: { alignItems: 'center', paddingVertical: 5 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginVertical: 3 },
  timelineStops: { flex: 1, justifyContent: 'space-between', gap: 14 },
  stopText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', paddingVertical: 5 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: COLORS.primary },
  section: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.textMuted },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  customerInfo: { flex: 1, gap: 1 },
  customerName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  seatChip: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seatCodes: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  addressBlock: { gap: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressDot: { width: 8, height: 8, borderRadius: 4 },
  address: { fontSize: 13, color: COLORS.text, flex: 1 },
  callButton: {
    marginTop: 2,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callButtonText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  action: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    ...CARD_SHADOW,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  error: { color: COLORS.danger, marginBottom: 8 },
});
