import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../theme';

export default function GlassCard({ children, style, intensity = 28 }) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.fallback, style]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, style]}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  inner: {
    flex: 1,
  },
  fallback: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(20, 25, 45, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
