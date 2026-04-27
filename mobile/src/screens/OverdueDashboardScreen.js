import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode, mockOverdueVisitors } from '../mockData';

export default function OverdueDashboardScreen({ navigation }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const demo = await isDemoMode();
      if (demo) {
        setVisitors(mockOverdueVisitors);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${SERVER_URL}/overdue-visitors`);
        const data = res.data;
        const arr = Array.isArray(data) ? data : (data.visitors || []);
        setVisitors(arr);
      } catch (e) {
        console.error(e);
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ScreenContainer scroll>
      <View style={{ marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <PageHeader
        eyebrow="VISITOR TRACKING"
        title="Overdue Visitors"
        subtitle="Visitors who have not yet checked out by their expected exit time."
        eyebrowColor={colors.accentOrange}
      />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CURRENTLY OVERDUE</Text>
          <Text style={styles.statValue}>{loading ? '—' : visitors.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>STATUS</Text>
          <Text style={[
            styles.statValue,
            { fontSize: 18, color: visitors.length > 0 ? colors.accentDanger : colors.accentSuccess }
          ]}>
            {visitors.length > 0 ? 'Action needed' : 'All clear'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accentPrimary} />
          <Text style={styles.muted}>Loading overdue visitors...</Text>
        </View>
      ) : visitors.length === 0 ? (
        <View style={styles.emptyBox}>
          <LinearGradient colors={gradients.successCyan} style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>✓</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptyText}>No overdue visitors at the moment.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visitors.map((v, i) => (
            <View key={i} style={styles.row}>
              <LinearGradient colors={gradients.danger} style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{(v.name || '?').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{v.name}</Text>
                <Text style={styles.rowMeta}>{v.phone} • Out: {v.out_time}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>OVERDUE</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 18 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  statValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  loadingBox: { padding: 32, alignItems: 'center', gap: 10 },
  muted: { color: colors.textSecondary, fontSize: 14 },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowAvatar: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rowName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowMeta: { color: colors.textSecondary, fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  badgeText: { color: colors.accentDanger, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
