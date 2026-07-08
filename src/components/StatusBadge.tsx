import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  color: string;
}

export default function StatusBadge({ label, color }: Props) {
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
