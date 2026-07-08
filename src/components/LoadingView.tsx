import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../utils/constants';

export default function LoadingView() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
});
