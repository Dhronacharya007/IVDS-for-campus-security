import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode, mockClips } from '../mockData';

const classGradient = (cls) => {
  const c = (cls || '').toLowerCase();
  if (c.includes('fight')) return ['#ff4d6d', '#ff8a3c'];
  if (c.includes('crowd')) return ['#7c5cff', '#00d4ff'];
  if (c.includes('suspici')) return ['#ffb627', '#ff8a3c'];
  return gradients.primary;
};

export default function SecurityVideosScreen({ navigation }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const demo = await isDemoMode();
      if (demo) {
        setClips(mockClips);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${SERVER_URL}/clips`);
        setClips(res.data || []);
      } catch (e) {
        console.error(e);
        setClips([]);
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
        eyebrow="SURVEILLANCE"
        title="Detected Clips"
        subtitle="Flagged surveillance footage automatically classified by the AI model."
        eyebrowColor={colors.accentSecondary}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accentPrimary} />
          <Text style={styles.muted}>Loading clips...</Text>
        </View>
      ) : clips.length === 0 ? (
        <View style={styles.emptyBox}>
          <LinearGradient colors={gradients.successCyan} style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>▶</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>No clips yet</Text>
          <Text style={styles.emptyText}>The AI model hasn't flagged any footage.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {clips.map((c, i) => (
            <Pressable
              key={i}
              onPress={() =>
                Alert.alert(
                  c.classification || 'Clip',
                  `${c.filename}\n\nVideo playback opens to backend stream when connected.`
                )
              }
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient colors={classGradient(c.classification)} style={styles.thumb}>
                <Text style={styles.playIcon}>▶</Text>
              </LinearGradient>
              <View style={styles.cardBody}>
                <View style={styles.cardHead}>
                  <Text style={styles.tag}>{c.classification || 'Clip'}</Text>
                  <Text style={styles.timeStamp}>
                    {new Date(c.timestamp * 1000).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{c.filename}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingBox: { padding: 32, alignItems: 'center', gap: 10 },
  muted: { color: colors.textSecondary, fontSize: 14 },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconText: { color: '#fff', fontSize: 28 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  list: { marginTop: 18, gap: 12 },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  thumb: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 38 },
  cardBody: { padding: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
    color: colors.accentPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  timeStamp: { color: colors.textMuted, fontSize: 11 },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
});
