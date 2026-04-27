import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

export default function SecurityMapScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const demo = await isDemoMode();
      if (demo) {
        setAlerts(mockSosAlerts);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${SERVER_URL}/sos-alerts`);
        const data = res.data;
        setAlerts(Array.isArray(data) ? data : (data?.alerts || []));
      } catch (e) {
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const center = alerts[0]?.location || { latitude: 11.0692, longitude: 77.0042 };

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
        <View style={styles.activeBadge}>
          <View style={styles.redDot} />
          <Text style={styles.activeText}>{alerts.length} ACTIVE</Text>
        </View>
      </View>

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
            {alerts.map((a, i) => (
              <Marker
                key={i}
                coordinate={{
                  latitude: a.location.latitude,
                  longitude: a.location.longitude,
                }}
                title={`SOS — ${a.username}`}
                description={new Date(a.timestamp * 1000).toLocaleString()}
                pinColor={colors.accentDanger}
              />
            ))}
          </MapView>
        )}
      </View>

      {alerts.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.listLabel}>ACTIVE ALERTS</Text>
          {alerts.map((a, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.rowDot}>
                <View style={styles.rowDotInner} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{a.username}</Text>
                <Text style={styles.rowMeta}>
                  {a.location.latitude.toFixed(4)}, {a.location.longitude.toFixed(4)} •{' '}
                  {new Date(a.timestamp * 1000).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.sosBadge}>
                <Text style={styles.sosBadgeText}>SOS</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
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
    marginTop: 4,
  },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentDanger },
  activeText: { color: colors.accentDanger, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
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
  sosBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 77, 109, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.4)',
  },
  sosBadgeText: { color: colors.accentDanger, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
