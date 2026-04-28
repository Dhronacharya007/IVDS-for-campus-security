import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import Brand from '../components/Brand';
import { colors, gradients, radius } from '../theme';

const tools = [
  {
    title: 'Test Model',
    description: 'Run video clips through the AI threat-detection model',
    icon: 'M',
    route: 'TestModel',
    gradient: gradients.primary,
  },
  {
    title: 'Detected Clips',
    description: 'Review flagged surveillance footage and incidents',
    icon: '▶',
    route: 'Clips',
    gradient: gradients.successCyan,
  },
  {
    title: 'SOS Map',
    description: 'Live map of active emergency alerts on campus',
    icon: '◉',
    route: 'SosMap',
    gradient: gradients.danger,
  },
  {
    title: 'Generate Pass',
    description: 'Create a digital visitor pass with QR code',
    icon: '✚',
    route: 'GeneratePass',
    gradient: gradients.warning,
  },
  {
    title: 'Scan In',
    description: 'Check visitors into campus by scanning QR codes',
    icon: '↓',
    route: 'ScanIn',
    gradient: gradients.success,
  },
  {
    title: 'Scan Out',
    description: 'Check visitors out and close their entry record',
    icon: '↑',
    route: 'ScanOut',
    gradient: gradients.purpleRed,
  },
  {
    title: 'Overdue Visitors',
    description: 'Visitors who have not yet signed out by their out-time',
    icon: '⏱',
    route: 'Overdue',
    gradient: ['#ff8a3c', '#ff4d6d'],
  },
];

export default function SecurityHomeScreen({ navigation }) {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const requestSignOut = () => setConfirmingSignOut(true);
  const cancelSignOut = () => setConfirmingSignOut(false);
  const confirmSignOut = () => {
    setConfirmingSignOut(false);
    navigation.replace('Login');
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.topBar}>
        <Brand size={22} tag="Console" />
        <Pressable
          onPress={requestSignOut}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {confirmingSignOut ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Sign out of Sentinel?</Text>
          <Text style={styles.confirmSub}>
            You'll be returned to the login screen. Any active sessions on
            this device will be cleared.
          </Text>
          <View style={styles.confirmRow}>
            <Pressable
              onPress={cancelSignOut}
              style={({ pressed }) => [
                styles.confirmCancelBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmSignOut}
              style={({ pressed }) => [
                styles.confirmSignOutBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.confirmSignOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.greeting}>
        <Text style={styles.eyebrow}>SECURITY DASHBOARD</Text>
        <Text style={styles.greetingTitle}>Hello, Officer</Text>
        <Text style={styles.greetingSub}>
          Monitor incidents, manage visitor flow, and respond to alerts in real time.
        </Text>
      </View>

      <View style={styles.miniRow}>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>USER</Text>
          <Text style={styles.miniValue}>SecurityUser</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniLabel}>ROLE</Text>
          <Text style={[styles.miniValue, { color: colors.accentSecondary }]}>Officer</Text>
        </View>
      </View>

      <View style={styles.list}>
        {tools.map((tool) => (
          <Pressable
            key={tool.title}
            onPress={() => navigation.navigate(tool.route)}
            style={({ pressed }) => [styles.toolCard, pressed && { transform: [{ scale: 0.98 }], borderColor: 'rgba(255,255,255,0.18)' }]}
          >
            <LinearGradient colors={tool.gradient} style={styles.toolIcon}>
              <Text style={styles.toolIconText}>{tool.icon}</Text>
            </LinearGradient>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDesc} numberOfLines={2}>{tool.description}</Text>
            </View>
            <Text style={styles.toolArrow}>→</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
  },
  signOutText: { color: colors.accentDanger, fontSize: 13, fontWeight: '600' },
  confirmCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    marginBottom: 18,
    gap: 8,
  },
  confirmTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  confirmCancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmSignOutBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.accentDanger,
    alignItems: 'center',
  },
  confirmSignOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  greeting: { marginBottom: 16 },
  eyebrow: {
    fontSize: 12,
    color: colors.accentPrimary,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  greetingSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  miniRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  miniCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  list: { gap: 10 },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  toolText: { flex: 1 },
  toolTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 3,
  },
  toolDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  toolArrow: { color: colors.textMuted, fontSize: 20, paddingTop: 4 },
});
