import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import { colors, gradients, radius } from '../theme';

export default function ProfileScreen({ route, navigation }) {
  const username = route.params?.username || 'Demo User';
  const initial = username.charAt(0).toUpperCase();

  const handleSignOut = () => navigation.replace('Login');

  return (
    <ScreenContainer scroll centered>
      <View style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={gradients.primary} style={styles.ring}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.name}>{username}</Text>
        <Text style={styles.role}>ACTIVE MEMBER</Text>

        <View style={styles.grid}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>USERNAME</Text>
            <Text style={styles.detailValue}>{username}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>STATUS</Text>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={[styles.detailValue, { color: colors.accentSuccess }]}>Online</Text>
            </View>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>MEMBER SINCE</Text>
            <Text style={styles.detailValue}>April 2026</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>VERIFIED</Text>
            <Text style={styles.detailValue}>✓ Yes</Text>
          </View>
        </View>

        <View style={styles.signOutWrap}>
          <Text style={styles.signOutBtn} onPress={handleSignOut}>
            Sign Out
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  avatarWrap: { marginBottom: 16 },
  ring: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c5cff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 53,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  role: {
    fontSize: 11,
    color: colors.accentPrimary,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 24,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  detail: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentSuccess,
  },
  signOutWrap: { width: '100%' },
  signOutBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    color: '#ff6b85',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
});
