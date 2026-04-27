import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import { colors, radius } from '../theme';
import { SERVER_URL } from '../config';
import { downloadClip, getLocalClipUri } from '../utils/clipCache';

// Inner component that mounts only after we have a URI, so useVideoPlayer
// gets a real source on first render (it doesn't smoothly handle null -> uri).
function PlayerView({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
}

export default function ClipPlayerScreen({ route, navigation }) {
  const { filename, classification, timestamp, demo } = route.params || {};

  const [videoUri, setVideoUri] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (demo) {
          if (!cancelled) setError('Demo clips are placeholders and have no playable file.');
          return;
        }

        const local = await getLocalClipUri(filename);
        if (local) {
          if (!cancelled) {
            setVideoUri(local);
            setSavedLocally(true);
          }
          return;
        }

        const sourceUrl = `${SERVER_URL}/clips/${encodeURIComponent(filename)}`;
        const downloadedUri = await downloadClip(filename, sourceUrl, (p) => {
          if (!cancelled) setProgress(p);
        });
        if (!cancelled) {
          setVideoUri(downloadedUri);
          setSavedLocally(true);
        }
      } catch (err) {
        console.warn('[ClipPlayerScreen] download failed:', err);
        if (!cancelled) {
          setVideoUri(`${SERVER_URL}/clips/${encodeURIComponent(filename)}`);
          setSavedLocally(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filename, demo]);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ marginBottom: 16 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>NOW PLAYING</Text>
          <Text style={styles.title} numberOfLines={1}>
            {filename || 'Detected clip'}
          </Text>
          {classification ? (
            <Text style={styles.tag}>{String(classification).toUpperCase()}</Text>
          ) : null}
          {timestamp ? (
            <Text style={styles.meta}>{new Date(timestamp * 1000).toLocaleString()}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.videoWrap}>
        {videoUri ? (
          <PlayerView uri={videoUri} key={videoUri} />
        ) : (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accentSecondary} />
            <Text style={styles.muted}>
              {progress > 0
                ? `Downloading clip... ${Math.round(progress * 100)}%`
                : error
                  ? 'Unavailable'
                  : 'Preparing clip...'}
            </Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <Text style={styles.savedNote}>
          {savedLocally
            ? '● Saved on this device for offline playback'
            : videoUri
              ? '○ Streaming from backend (could not save locally)'
              : ''}
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  label: {
    fontSize: 11,
    color: colors.accentDanger,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  tag: {
    marginTop: 6,
    alignSelf: 'flex-start',
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
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  videoWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.border,
    aspectRatio: 16 / 9,
    width: '100%',
  },
  video: { width: '100%', height: '100%' },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  muted: { color: colors.textSecondary, fontSize: 13 },
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.4)',
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
  },
  errorText: { color: '#ff8fa3', fontSize: 13, lineHeight: 18 },
  savedNote: {
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
