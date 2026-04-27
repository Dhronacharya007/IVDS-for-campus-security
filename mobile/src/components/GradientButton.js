import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius } from '../theme';

export default function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  gradient = gradients.primary,
  icon,
  style,
  textColor = '#fff',
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrap,
        style,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <>
              <Text style={[styles.text, { color: textColor }]}>{title}</Text>
              {icon && <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>}
            </>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#7c5cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  icon: {
    fontSize: 18,
  },
});
