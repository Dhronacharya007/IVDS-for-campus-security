import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import GradientButton from '../components/GradientButton';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

const demoLabels = ['Fight detected', 'Crowd gathering', 'Suspicious activity', 'Normal scene'];

export default function TestModelScreen({ navigation }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [savedFilename, setSavedFilename] = useState(null);
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
    });
    if (r.canceled) return;
    const asset = r.assets[0];
    setFile(asset);
    setResult('');
    setSavedFilename(null);
  };

  const upload = async () => {
    if (!file) {
      Alert.alert('No file', 'Please pick a video first.');
      return;
    }
    setLoading(true);
    setResult('');
    setSavedFilename(null);

    const demo = await isDemoMode();
    if (demo) {
      setTimeout(() => {
        const r = demoLabels[Math.floor(Math.random() * demoLabels.length)];
        setResult(r);
        setLoading(false);
      }, 1400);
      return;
    }

    try {
      const data = new FormData();
      data.append('video', {
        uri: file.uri,
        name: file.name || 'upload.mp4',
        type: file.mimeType || 'video/mp4',
      });
      const res = await fetch(`${SERVER_URL}/test-model`, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      setResult(json.result || json.classification || 'No prediction');
      setSavedFilename(json.saved ? json.saved_filename : null);
    } catch (e) {
      Alert.alert('Upload failed', 'Could not reach the backend.');
    } finally {
      setLoading(false);
    }
  };

  const isNormal = (result || '').toLowerCase().includes('non-violence') || (result || '').toLowerCase().includes('normal');

  return (
    <ScreenContainer scroll>
      <View style={{ marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <PageHeader
        eyebrow="MODEL TESTING"
        title="Test Threat-Detection Model"
        subtitle="Upload a video clip and see what the AI classifies it as."
      />

      <View style={styles.card}>
        <Pressable
          onPress={pick}
          style={({ pressed }) => [styles.dropzone, pressed && { borderColor: colors.accentSecondary }]}
        >
          <LinearGradient colors={gradients.primary} style={styles.dropIcon}>
            <Text style={styles.dropIconText}>↑</Text>
          </LinearGradient>
          <Text style={styles.dropTitle}>{file ? file.name : 'Tap to select a video'}</Text>
          <Text style={styles.dropSub}>
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
              : 'MP4, MOV, AVI supported'}
          </Text>
        </Pressable>

        <GradientButton
          title={loading ? 'Analyzing...' : 'Run Analysis'}
          icon={loading ? null : '→'}
          loading={loading}
          onPress={upload}
          style={{ marginTop: 16 }}
        />

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>AI CLASSIFICATION</Text>
            <Text style={styles.resultValue}>{result}</Text>
            <Text style={styles.resultMeta}>
              {savedFilename
                ? '● Saved to Detected Clips'
                : isNormal
                  ? 'No threat detected — clip not saved'
                  : 'Classification complete'}
            </Text>
            {savedFilename ? (
              <Pressable
                onPress={() => navigation.navigate('Clips')}
                style={({ pressed }) => [styles.viewClipsBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.viewClipsBtnText}>View in Detected Clips →</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropzone: {
    padding: 28,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropIconText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  dropTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  dropSub: { color: colors.textSecondary, fontSize: 12 },
  resultBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 164, 0.3)',
    backgroundColor: 'rgba(0, 224, 164, 0.08)',
  },
  resultLabel: {
    fontSize: 11,
    color: colors.accentSuccess,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  resultValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  resultMeta: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
  },
  viewClipsBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 164, 0.45)',
    backgroundColor: 'rgba(0, 224, 164, 0.12)',
  },
  viewClipsBtnText: {
    color: colors.accentSuccess,
    fontSize: 13,
    fontWeight: '700',
  },
});
