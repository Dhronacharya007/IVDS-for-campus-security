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
import {
  deleteCachedClip,
  downloadClip,
  listCachedFilenames,
} from '../utils/clipCache';

const classGradient = (cls) => {
  const c = (cls || '').toLowerCase();
  if (c.includes('fight') || c.includes('violence')) return ['#ff4d6d', '#ff8a3c'];
  if (c.includes('fire')) return ['#ff8a3c', '#ffb627'];
  if (c.includes('burglary')) return ['#7c5cff', '#ff4d6d'];
  if (c.includes('vandal')) return ['#ffb627', '#ff8a3c'];
  if (c.includes('abuse')) return ['#ff4d6d', '#7c5cff'];
  if (c.includes('crowd')) return ['#7c5cff', '#00d4ff'];
  if (c.includes('suspici')) return ['#ffb627', '#ff8a3c'];
  return gradients.primary;
};

export default function SecurityVideosScreen({ navigation }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  // filename -> 'cached' | 'downloading' | 'error'
  const [downloadStatus, setDownloadStatus] = useState({});
  const [deletingFilename, setDeletingFilename] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await isDemoMode();
      setDemo(d);
      if (d) {
        setClips(mockClips);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${SERVER_URL}/clips`);
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.clips || [];
        setClips(list);
        primeCache(list);
      } catch (e) {
        console.error(e);
        setClips([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pre-download every listed clip into the device's local storage so they
  // can be played offline and don't need to be re-fetched on every tap.
  async function primeCache(list) {
    try {
      const cachedKeys = await listCachedFilenames();
      const cachedSet = new Set(cachedKeys);

      const initial = {};
      for (const c of list) {
        if (cachedSet.has(c.filename)) initial[c.filename] = 'cached';
      }
      setDownloadStatus((prev) => ({ ...prev, ...initial }));

      for (const c of list) {
        if (cachedSet.has(c.filename)) continue;
        setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'downloading' }));
        try {
          await downloadClip(
            c.filename,
            `${SERVER_URL}/clips/${encodeURIComponent(c.filename)}`
          );
          setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'cached' }));
        } catch (err) {
          console.warn(`[SecurityVideos] failed to cache ${c.filename}:`, err);
          setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'error' }));
        }
      }
    } catch (err) {
      console.warn('[SecurityVideos] primeCache failed:', err);
    }
  }

  function openClip(c) {
    navigation.navigate('ClipPlayer', {
      filename: c.filename,
      classification: c.classification,
      timestamp: c.timestamp,
      demo,
    });
  }

  function removeClipFromState(filename) {
    setClips((prev) => prev.filter((c) => c.filename !== filename));
    setDownloadStatus((prev) => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
  }

  async function performDelete(c) {
    if (deletingFilename) return;

    if (demo) {
      removeClipFromState(c.filename);
      return;
    }

    setDeletingFilename(c.filename);
    try {
      await axios.delete(`${SERVER_URL}/clips/${encodeURIComponent(c.filename)}`);
      try {
        await deleteCachedClip(c.filename);
      } catch (cacheErr) {
        console.warn('[SecurityVideos] failed to remove cached file:', cacheErr);
      }
      removeClipFromState(c.filename);
    } catch (err) {
      console.error('[SecurityVideos] delete failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not delete this clip.';
      Alert.alert('Delete failed', msg);
    } finally {
      setDeletingFilename(null);
    }
  }

  function confirmDelete(c) {
    if (!c?.filename) return;
    Alert.alert(
      'Delete clip?',
      `"${c.filename}" will be permanently deleted from the server and this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(c),
        },
      ]
    );
  }

  async function performClearAll() {
    if (clips.length === 0 || clearingAll) return;
    const filenames = clips.map((c) => c.filename);

    if (demo) {
      setClips([]);
      setDownloadStatus({});
      filenames.forEach((f) => deleteCachedClip(f).catch(() => {}));
      return;
    }

    setClearingAll(true);
    try {
      await axios.delete(`${SERVER_URL}/clips`);
      setClips([]);
      setDownloadStatus({});
      filenames.forEach((f) => deleteCachedClip(f).catch(() => {}));
    } catch (err) {
      console.error('[SecurityVideos] clear-all failed:', err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not clear all clips.';
      Alert.alert('Clear failed', msg);
    } finally {
      setClearingAll(false);
    }
  }

  function confirmClearAll() {
    if (clips.length === 0 || clearingAll) return;
    Alert.alert(
      'Delete all clips?',
      `This will permanently remove all ${clips.length} clip${
        clips.length === 1 ? '' : 's'
      } from the server and this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: performClearAll,
        },
      ]
    );
  }

  const cachedCount = Object.values(downloadStatus).filter((s) => s === 'cached').length;

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

      {!loading && clips.length > 0 && (
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

      {!loading && !demo && clips.length > 0 && (
        <Text style={styles.cacheNote}>
          {cachedCount === clips.length
            ? `✓ All ${clips.length} clips saved to this device`
            : `Saving ${cachedCount}/${clips.length} clips to this device for offline playback...`}
        </Text>
      )}

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
          {clips.map((c, i) => {
            const status = downloadStatus[c.filename];
            const isDeleting = deletingFilename === c.filename;
            return (
              <Pressable
                key={c.filename || i}
                onPress={() => openClip(c)}
                disabled={isDeleting}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { transform: [{ scale: 0.98 }] },
                  isDeleting && { opacity: 0.5 },
                ]}
              >
                <LinearGradient colors={classGradient(c.classification)} style={styles.thumb}>
                  <Text style={styles.playIcon}>▶</Text>
                  {!demo && status ? (
                    <View
                      style={[
                        styles.statusPill,
                        status === 'cached' && styles.statusCached,
                        status === 'downloading' && styles.statusDownloading,
                        status === 'error' && styles.statusError,
                      ]}
                    >
                      <Text style={styles.statusPillText}>
                        {status === 'cached' && '● Saved'}
                        {status === 'downloading' && '↓ Saving'}
                        {status === 'error' && '! Online'}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => confirmDelete(c)}
                    disabled={isDeleting}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityLabel={`Delete clip ${c.filename}`}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#ff8fa3" />
                    ) : (
                      <Text style={styles.deleteBtnText}>×</Text>
                    )}
                  </Pressable>
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
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingBox: { padding: 32, alignItems: 'center', gap: 10 },
  muted: { color: colors.textSecondary, fontSize: 14 },
  cacheNote: {
    marginTop: 10,
    marginBottom: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
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
  statusPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  statusPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusCached: { borderColor: 'rgba(0, 224, 164, 0.55)' },
  statusDownloading: { borderColor: 'rgba(0, 212, 255, 0.55)' },
  statusError: { borderColor: 'rgba(255, 182, 39, 0.55)' },
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
    position: 'absolute',
    top: 10,
    left: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.55)',
    backgroundColor: 'rgba(20, 24, 38, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#ff8fa3',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },
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
