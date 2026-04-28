import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import { colors, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode, mockSosAlerts } from '../mockData';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f1424' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a8b3cf' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0e1a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161b2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#070a14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

// Voice-triggered alerts may have no location. Returns coords if both lat/lng
// are real numbers, else null.
function getCoords(alert) {
  const loc = alert?.location;
  if (!loc) return null;
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}

function formatTimestamp(ts) {
  if (!ts) return 'Unknown time';
  const ms = ts > 10_000_000_000 ? ts : ts * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return 'Unknown time';
  return d.toLocaleTimeString();
}

export default function SecurityMapScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  // Ids that we've deleted locally — keep these filtered out of any subsequent
  // poll response so a slow backend doesn't briefly resurrect a deleted alert.
  const deletedIdsRef = useRef(new Set());
  // Pause the polling fetch while a destructive op is in flight.
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const isDemo = await isDemoMode();
      if (cancelled) return;
      setDemo(isDemo);

      if (isDemo) {
        setAlerts(
          mockSosAlerts.map((a, idx) => ({ ...a, id: a.id || `demo-${idx}` }))
        );
        setLoading(false);
        return;
      }

      if (inFlightRef.current) return;
      try {
        const res = await axios.get(`${SERVER_URL}/sos-alerts`);
        if (cancelled) return;
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.alerts || [];
        const filtered = list.filter(
          (a) => !deletedIdsRef.current.has(a.id)
        );
        setAlerts(filtered);
      } catch (e) {
        if (cancelled) return;
        console.warn('[SOS map] fetch failed:', e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const { mappable, unmappable } = useMemo(() => {
    const mappable = [];
    const unmappable = [];
    for (const a of alerts) {
      const coords = getCoords(a);
      if (coords) mappable.push({ alert: a, coords });
      else unmappable.push(a);
    }
    return { mappable, unmappable };
  }, [alerts]);

  const center = mappable[0]?.coords || { latitude: 11.0692, longitude: 77.0042 };

  function removeFromState(id) {
    deletedIdsRef.current.add(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function performDelete(alert) {
    const id = alert?.id;
    if (!id) {
      Alert.alert('Cannot dismiss', 'This alert has no id.');
      return;
    }

    if (demo) {
      removeFromState(id);
      return;
    }

    setDeletingId(id);
    inFlightRef.current = true;
    try {
      await axios.delete(`${SERVER_URL}/sos-alerts/${encodeURIComponent(id)}`);
      removeFromState(id);
    } catch (err) {
      console.error('[SOS map] delete failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not dismiss this alert.';
      Alert.alert('Dismiss failed', msg);
    } finally {
      setDeletingId(null);
      inFlightRef.current = false;
    }
  }

  function confirmDelete(alert) {
    Alert.alert(
      'Dismiss alert?',
      `Dismiss SOS alert from ${alert.username || 'unknown user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => performDelete(alert),
        },
      ]
    );
  }

  async function performClearAll() {
    if (alerts.length === 0 || clearingAll) return;
    const ids = alerts.map((a) => a.id).filter(Boolean);

    if (demo) {
      ids.forEach((id) => deletedIdsRef.current.add(id));
      setAlerts([]);
      return;
    }

    setClearingAll(true);
    inFlightRef.current = true;
    try {
      await axios.delete(`${SERVER_URL}/sos-alerts`);
      ids.forEach((id) => deletedIdsRef.current.add(id));
      setAlerts([]);
    } catch (err) {
      console.error('[SOS map] clear-all failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not clear alerts.';
      Alert.alert('Clear failed', msg);
    } finally {
      setClearingAll(false);
      inFlightRef.current = false;
    }
  }

  function confirmClearAll() {
    if (alerts.length === 0 || clearingAll) return;
    Alert.alert(
      'Dismiss all alerts?',
      `Dismiss all ${alerts.length} active alert${
        alerts.length === 1 ? '' : 's'
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

  const totalCount = alerts.length;

  return (
    <ScreenContainer scroll>
      <View style={{ marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <PageHeader
            eyebrow="EMERGENCY RESPONSE"
            title="Live SOS Map"
            subtitle="Real-time emergency alert locations across the campus."
            eyebrowColor={colors.accentDanger}
          />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.activeBadge}>
            <View style={styles.redDot} />
            <Text style={styles.activeText}>{totalCount} ACTIVE</Text>
          </View>
          {!loading && totalCount > 0 && (
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
          )}
        </View>
      </View>

      {!loading && unmappable.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {unmappable.length} alert
            {unmappable.length === 1 ? '' : 's'} without location{' '}
            {unmappable.length === 1 ? "doesn't" : "don't"} appear on the map.
            See the list below.
          </Text>
        </View>
      )}

      <View style={styles.mapCard}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accentPrimary} />
            <Text style={styles.muted}>Loading map...</Text>
          </View>
        ) : (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {mappable.map(({ alert, coords }) => (
              <Marker
                key={`m-${alert.id}`}
                coordinate={coords}
                title={`SOS — ${alert.username || 'Unknown'}`}
                description={formatTimestamp(alert.timestamp)}
                pinColor={
                  alert.source === 'voice'
                    ? colors.accentPrimary
                    : colors.accentDanger
                }
              />
            ))}
          </MapView>
        )}
      </View>

      {!loading && totalCount > 0 && (
        <View style={styles.list}>
          <Text style={styles.listLabel}>ACTIVE ALERTS</Text>
          {alerts.map((a, i) => {
            const coords = getCoords(a);
            const isVoice = a.source === 'voice';
            const isDeleting = deletingId === a.id;
            return (
              <View
                key={a.id || i}
                style={[styles.row, isDeleting && { opacity: 0.55 }]}
              >
                <View
                  style={[
                    styles.rowDot,
                    isVoice && { backgroundColor: 'rgba(124, 92, 255, 0.18)' },
                  ]}
                >
                  <View
                    style={[
                      styles.rowDotInner,
                      isVoice && { backgroundColor: colors.accentPrimary },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{a.username || 'Unknown user'}</Text>
                  <Text style={styles.rowMeta}>
                    {coords
                      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                      : 'Location unavailable'}{' '}
                    • {formatTimestamp(a.timestamp)}
                  </Text>
                  {isVoice && a.phrase ? (
                    <Text style={styles.rowPhrase}>“{a.phrase}”</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.sosBadge,
                    isVoice && {
                      backgroundColor: 'rgba(124, 92, 255, 0.18)',
                      borderColor: 'rgba(124, 92, 255, 0.4)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sosBadgeText,
                      isVoice && { color: colors.accentPrimary },
                    ]}
                  >
                    {isVoice ? 'VOICE' : 'SOS'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDelete(a)}
                  disabled={isDeleting}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityLabel={`Dismiss alert from ${a.username || 'unknown user'}`}
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentDanger },
  activeText: { color: colors.accentDanger, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.45)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    color: '#ff8fa3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 182, 39, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 39, 0.3)',
  },
  warningText: { color: '#ffb627', fontSize: 12, fontWeight: '500' },
  mapCard: {
    height: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 16,
  },
  map: { ...StyleSheet.absoluteFillObject },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: colors.textSecondary, fontSize: 14 },
  list: { marginTop: 18, gap: 8 },
  listLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 77, 109, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accentDanger },
  rowName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowMeta: { color: colors.textSecondary, fontSize: 11 },
  rowPhrase: { color: '#a78bfa', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  sosBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 77, 109, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.4)',
  },
  sosBadgeText: { color: colors.accentDanger, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.45)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#ff8fa3',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
});
