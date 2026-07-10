import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BOOKING_STATUS_LABEL, TRIP_STATUS_LABEL, TRIP_STATUS_COLOR, BOOKING_STATUS_LABEL as BOOKING_COLORS } from '../utils/constants';
import type { BookingStatus, TripStatus } from '../types';

interface PropsWithLabel {
  label: string;
  color: string;
  status?: never;
}

interface PropsWithStatus {
  status: TripStatus | BookingStatus;
  label?: never;
  color?: never;
}

type Props = PropsWithLabel | PropsWithStatus;

export default function StatusBadge(props: Props) {
  let label: string;
  let color: string;

  if ('status' in props && props.status) {
    const status = props.status;
    // Kiểm xem có phải trip status không
    if (status in TRIP_STATUS_LABEL) {
      label = TRIP_STATUS_LABEL[status as TripStatus];
      color = TRIP_STATUS_COLOR[status as TripStatus];
    } else {
      label = BOOKING_STATUS_LABEL[status as BookingStatus];
      color = '#2563eb'; // default color
    }
  } else {
    label = props.label;
    color = props.color;
  }

  return (
    <View style={[styles.badge, { backgroundColor: color + '16' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});
