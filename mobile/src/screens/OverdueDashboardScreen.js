import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
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
  const [demo, setDemo] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    (async () => {
      const isDemo = await isDemoMode();
      setDemo(isDemo);
      if (isDemo) {
        // Mock data has no visitor_id — synthesise stable ones for the delete UI.
        setVisitors(
          mockOverdueVisitors.map((v, idx) => ({
            ...v,
            visitor_id: v.visitor_id || `demo-${idx}`,
          }))
        );
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

  function removeFromState(id) {
    setVisitors((prev) => prev.filter((v) => v.visitor_id !== id));
  }

  async function performDelete(visitor) {
    const id = visitor?.visitor_id;
    if (!id) {
      Alert.alert('Cannot delete', "This visitor has no id.");
      return;
    }

    if (demo) {
      removeFromState(id);
      return;
    }

    setDeletingId(id);
    try {
      await axios.delete(`${SERVER_URL}/overdue-visitors/${encodeURIComponent(id)}`);
      removeFromState(id);
    } catch (err) {
      console.error('[Overdue] delete failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not remove this visitor.';
      Alert.alert('Delete failed', msg);
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(visitor) {
    Alert.alert(
      'Remove visitor?',
      `Remove "${visitor.name || visitor.visitor_id}" from the overdue list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => performDelete(visitor),
        },
      ]
    );
  }

  async function performClearAll() {
    if (visitors.length === 0 || clearingAll) return;

    if (demo) {
      setVisitors([]);
      return;
    }

    setClearingAll(true);
    try {
      await axios.delete(`${SERVER_URL}/overdue-visitors`);
      setVisitors([]);
    } catch (err) {
      console.error('[Overdue] clear failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not clear the overdue list.';
      Alert.alert('Clear failed', msg);
    } finally {
      setClearingAll(false);
    }
  }

  function confirmClearAll() {
    if (visitors.length === 0 || clearingAll) return;
    Alert.alert(
      'Clear overdue list?',
      `Remove all ${visitors.length} overdue visitor${
        visitors.length === 1 ? '' : 's'
      }? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: performClearAll,
        },
      ]
    );
  }

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

      {!loading && visitors.length > 0 && (
        <View style={styles.actionRow}>
          <Pressable
            onPress={confirmClearAll}
            disabled={clearingAll}
            style={({ pressed }) => [
              styles.clearAllBtn,
              (pressed || clearingAll) && { opacity: 0.6 },
            ]}
          >
            {clearingAll ? (
              <ActivityIndicator color="#ff8fa3" size="small" />
            ) : (
              <Text style={styles.clearAllText}>Clear all</Text>
            )}
          </Pressable>
        </View>
      )}

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
          {visitors.map((v, i) => {
            const isDeleting = deletingId === v.visitor_id;
            return (
              <View
                key={v.visitor_id || i}
                style={[styles.row, isDeleting && { opacity: 0.55 }]}
              >
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
                <Pressable
                  onPress={() => confirmDelete(v)}
                  disabled={isDeleting}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityLabel={`Remove visitor ${v.name || v.visitor_id}`}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ff8fa3" />
                  ) : (
                    <Text style={styles.deleteBtnText}>×</Text>
                  )}
                </Pressable>
              </View>
            );
          })}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  clearAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.45)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    color: '#ff8fa3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.45)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  deleteBtnText: {
    color: '#ff8fa3',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
});
