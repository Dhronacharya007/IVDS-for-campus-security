import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Animated } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import Brand from '../components/Brand';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

export default function UserHomeScreen({ route, navigation }) {
  const username = route.params?.username || 'Demo User';
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const pulse = useState(new Animated.Value(1))[0];

  useEffect(() => {
    (async () => {
      const demo = await isDemoMode();
      if (demo) {
        setLocation({ latitude: 11.0692, longitude: 77.0042 });
        setLoading(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access denied.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handleSOS = async () => {
    if (!location) {
      Alert.alert('Wait', 'Location not available yet.');
      return;
    }
    const demo = await isDemoMode();
    if (demo) {
      Alert.alert('SOS Sent', 'Security has been notified. (Demo Mode)');
      return;
    }
    try {
      const res = await fetch(`${SERVER_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, location }),
      });
      const data = await res.json();
      if (data.success) Alert.alert('SOS Sent', 'Security has been notified.');
      else Alert.alert('Failed', 'Could not send SOS');
    } catch {
      Alert.alert('Network Error', 'Could not reach the backend.');
    }
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.topBar}>
        <Brand size={22} />
        <Pressable
          onPress={() => navigation.navigate('Profile', { username })}
          style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
        >
          <LinearGradient colors={gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.profileLabel}>Profile</Text>
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.greetingTitle}>Stay safe on campus</Text>
        <Text style={styles.greetingSub}>
          Your location is being securely monitored. In an emergency, tap the SOS button below.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(0,224,164,0.18)' }]}>
            <View style={styles.greenDot} />
          </View>
          <View>
            <Text style={styles.statLabel}>STATUS</Text>
            <Text style={styles.statValue}>Active</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(124,92,255,0.18)' }]}>
            <Text style={styles.statIconEmoji}>◷</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Text style={styles.cardLabel}>LIVE LOCATION</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Fetching location...</Text>
        ) : (
          <View style={styles.locationRow}>
            <View style={styles.locationItem}>
              <Text style={styles.locationKey}>LATITUDE</Text>
              <Text style={styles.locationValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.locationItem}>
              <Text style={styles.locationKey}>LONGITUDE</Text>
              <Text style={styles.locationValue}>{location.longitude.toFixed(6)}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.sosWrap}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable onPress={handleSOS} disabled={loading}>
            <LinearGradient
              colors={['#ff4d6d', '#ff8a3c']}
              style={styles.sosOuter}
            >
              <LinearGradient
                colors={['#ff4d6d', '#ff2855']}
                style={styles.sosInner}
              >
                <Text style={styles.sosBang}>!</Text>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosHint}>Tap to send emergency alert</Text>
              </LinearGradient>
            </LinearGradient>
          </Pressable>
        </Animated.View>
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
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    paddingLeft: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  profileLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  greeting: { marginBottom: 18 },
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconEmoji: { color: colors.accentPrimary, fontSize: 18 },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accentSuccess,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  statValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  locationCard: {
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentDanger },
  liveText: { color: colors.accentDanger, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationItem: { flex: 1, gap: 5 },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 12 },
  locationKey: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  locationValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  sosWrap: { alignItems: 'center', marginVertical: 20 },
  sosOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  sosInner: {
    width: 204,
    height: 204,
    borderRadius: 102,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sosBang: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  sosText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  sosHint: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.85,
    marginTop: 4,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
