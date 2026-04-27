import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function BackButton({ onPress, label = '← Back' }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
