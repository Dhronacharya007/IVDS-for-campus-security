import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import GradientButton from '../components/GradientButton';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

function formatPretty(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function ScanOutScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  // phase: idle | submitting | success | error
  const [phase, setPhase] = useState('idle');
  const [scanResult, setScanResult] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDemoSession, setIsDemoSession] = useState(false);

  // Synchronous dedupe gate — expo-camera's onBarcodeScanned fires every
  // frame while a QR is in view, so we drop everything after the first.
  const processingRef = useRef(false);
  const lastScanRef = useRef(null);

  useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  const handleScanned = useCallback(
    async ({ data }) => {
      if (processingRef.current || phase !== 'idle') return;
      const id = String(data || '').replace('visitor:', '').trim();
      if (!id) return;
      if (lastScanRef.current === id) return;
      processingRef.current = true;
      lastScanRef.current = id;

      setScanResult(id);
      setErrorMessage(null);
      setVisitor(null);
      setPhase('submitting');

      const demo = await isDemoMode();
      if (demo) {
        setIsDemoSession(true);
        setVisitor({ visitor_id: id, name: 'Demo Visitor' });
        setPhase('success');
        return;
      }
      setIsDemoSession(false);

      try {
        const res = await axios.post(`${SERVER_URL}/scan-out`, {
          visitor_id: id,
        });
        if (res.data?.success === false) {
          setErrorMessage(res.data?.error || 'Out-time scan failed.');
          setPhase('error');
          return;
        }
        // Best-effort: fetch visitor details so we can show them.
        try {
          const v = await axios.get(`${SERVER_URL}/visitor/${id}`);
          if (v.data?.success) setVisitor(v.data.visitor);
          else setVisitor({ visitor_id: id });
        } catch (_) {
          setVisitor({ visitor_id: id });
        }
        setPhase('success');
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Network error — could not reach the backend.';
        setErrorMessage(msg);
        setPhase('error');
      }
    },
    [phase]
  );

  const reset = () => {
    setScanResult(null);
    setVisitor(null);
    setErrorMessage(null);
    processingRef.current = false;
    lastScanRef.current = null;
    setPhase('idle');
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={{ marginBottom: 20 }}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <PageHeader
        eyebrow="VISITOR CHECK-OUT"
        title="Scan Out Visitor"
        subtitle="Point the camera at the visitor's QR pass to record exit."
      />

      <View style={styles.card}>
        {!permission ? (
          <Text style={styles.muted}>Loading camera...</Text>
        ) : !permission.granted ? (
          <View style={styles.permWrap}>
            <Text style={styles.permTitle}>Camera permission needed</Text>
            <Text style={styles.permSub}>
              Allow Sentinel to use your camera to scan QR codes.
            </Text>
            <GradientButton
              title="Grant access"
              onPress={requestPermission}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : phase === 'idle' ? (
          <>
            <View style={styles.scannerFrame}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleScanned}
              />
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <View style={styles.hintRow}>
              <View style={styles.purpleDot} />
              <Text style={styles.hintText}>
                Scanner active — align the QR code inside the frame
              </Text>
            </View>
          </>
        ) : phase === 'submitting' ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.accentPrimary} size="large" />
            <Text style={styles.statusTitle}>Recording exit…</Text>
            <Text style={styles.statusSub}>
              Sending check-out to the backend.
            </Text>
            <Text style={styles.idChip}>ID: {scanResult}</Text>
          </View>
        ) : phase === 'success' ? (
          <View style={styles.successBox}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.successIcon}
            >
              <Text style={styles.successCheck}>✓</Text>
            </LinearGradient>
            <Text style={styles.successTitle}>
              {isDemoSession ? 'Visitor Checked Out (Demo)' : 'Visitor Checked Out'}
            </Text>
            <View style={styles.successInfo}>
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>VISITOR</Text>
                <Text style={styles.metaValue}>
                  {visitor?.name || scanResult}
                </Text>
              </View>
              {visitor?.phone ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>PHONE</Text>
                  <Text style={styles.metaValue}>{visitor.phone}</Text>
                </View>
              ) : null}
              {visitor?.actual_in_time ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>ARRIVED</Text>
                  <Text style={styles.metaValue}>
                    {formatPretty(visitor.actual_in_time)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>EXIT RECORDED</Text>
                <Text style={styles.metaValue}>
                  {formatPretty(new Date().toISOString())}
                </Text>
              </View>
            </View>
            <Text style={styles.successText}>ID: {scanResult}</Text>
            <GradientButton
              title="Scan Another"
              onPress={reset}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          <View style={styles.errorBox}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <Text style={styles.errorTitle}>Scan-out Failed</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            {scanResult ? (
              <Text style={styles.idChip}>ID: {scanResult}</Text>
            ) : null}
            <View style={styles.actionRow}>
              <Pressable
                onPress={reset}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.secondaryBtnText}>Try Again</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <GradientButton title="Scan Another" onPress={reset} />
              </View>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  muted: { color: colors.textSecondary, padding: 20, textAlign: 'center' },
  permWrap: { padding: 24, alignItems: 'center' },
  permTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  permSub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  scannerFrame: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: 'rgba(124, 92, 255, 0.3)',
    position: 'relative',
  },
  camera: { ...StyleSheet.absoluteFillObject },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.accentPrimary,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.accentPrimary,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: colors.accentPrimary,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.accentPrimary,
    borderBottomRightRadius: 8,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  purpleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  hintText: { color: colors.textSecondary, fontSize: 13 },

  statusBox: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  statusSub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  idChip: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Courier',
    overflow: 'hidden',
  },

  successBox: { alignItems: 'center', padding: 16, gap: 10 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  successCheck: { color: '#fff', fontSize: 40, fontWeight: '900' },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  successInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 6,
  },
  metaCell: { gap: 4, minWidth: 130 },
  metaLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  metaValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  successText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Courier',
  },

  errorBox: { alignItems: 'center', padding: 16, gap: 10 },
  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 109, 0.4)',
    marginBottom: 6,
  },
  errorIconText: { color: '#ff8fa3', fontSize: 32, fontWeight: '900' },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    color: '#ff8fa3',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
});
