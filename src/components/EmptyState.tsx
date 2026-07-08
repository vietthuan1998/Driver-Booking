import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

export default function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🚐</Text>
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 32 },
  text: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', maxWidth: 240 },
});
