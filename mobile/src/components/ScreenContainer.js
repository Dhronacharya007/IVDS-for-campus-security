import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function ScreenContainer({ children, scroll = true, contentContainerStyle, centered = false }) {
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgSecondary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.aurora1} />
      <View style={styles.aurora2} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Body
          style={{ flex: 1 }}
          contentContainerStyle={[
            scroll ? styles.scrollContent : styles.viewContent,
            centered && styles.centered,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Body>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  viewContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aurora1: {
    position: 'absolute',
    top: -150,
    left: -150,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
    opacity: 0.5,
  },
  aurora2: {
    position: 'absolute',
    bottom: -200,
    right: -150,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(0, 212, 255, 0.14)',
    opacity: 0.5,
  },
});
