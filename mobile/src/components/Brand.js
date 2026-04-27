import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

export default function Brand({ size = 22, showText = true, tag }) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { width: size + 14, height: size + 14, borderRadius: (size + 14) / 3 }]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <SvgGradient id="brandGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#7c5cff" />
              <Stop offset="100%" stopColor="#00d4ff" />
            </SvgGradient>
          </Defs>
          <Path
            d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
            stroke="url(#brandGrad)"
            strokeWidth={2}
            fill="rgba(124, 92, 255, 0.15)"
          />
        </Svg>
      </View>
      {showText && <Text style={styles.text}>Sentinel</Text>}
      {tag && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mark: {
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  tag: {
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.3)',
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
