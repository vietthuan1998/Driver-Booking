import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Trip } from '../types';
import { CARD_SHADOW, COLORS, TRIP_STATUS_COLOR, TRIP_STATUS_LABEL } from '../utils/constants';
import { formatTime } from '../utils/helpers';
import StatusBadge from './StatusBadge';

interface Props {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

export default function TripCard({ trip, onPress }: Props) {
  const statusColor = TRIP_STATUS_COLOR[trip.trip_status];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(trip)}
    >
      <View style={[styles.accent, { backgroundColor: statusColor }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.timeChip}>
            <Text style={styles.time}>{formatTime(trip.planned_departure_time)}</Text>
          </View>
          <StatusBadge label={TRIP_STATUS_LABEL[trip.trip_status]} color={statusColor} />
        </View>
        <Text style={styles.route}>
          {trip.route ? `${trip.route.origin}  →  ${trip.route.destination}` : 'Tuyến không xác định'}
        </Text>
        <View style={styles.row}>
          <Text style={styles.meta}>Mã chuyến: {trip.trip_code}</Text>
          {trip.vehicle && (
            <View style={styles.plateChip}>
              <Text style={styles.plateText}>{trip.vehicle.plate_number}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  accent: { width: 4 },
  body: { flex: 1, padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeChip: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  time: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  route: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 13, color: COLORS.textMuted },
  plateChip: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plateText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
});
