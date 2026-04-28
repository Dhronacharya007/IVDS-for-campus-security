import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
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

const QUICK_DURATIONS = [
  { id: 'planned', label: 'Use planned deadline', minutes: null },
  { id: 'm30', label: '+30 min', minutes: 30 },
  { id: 'h1', label: '+1 hr', minutes: 60 },
  { id: 'h2', label: '+2 hr', minutes: 120 },
  { id: 'h4', label: '+4 hr', minutes: 240 },
  { id: 'custom', label: 'Custom', minutes: -1 },
];

function formatPretty(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function describeDelta(targetIso) {
  if (!targetIso) return '';
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return '';
  const diffMs = target - Date.now();
  const past = diffMs < 0;
  const totalMin = Math.round(Math.abs(diffMs) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts = [];
  if (h) parts.push(`${h} hr`);
  if (m) parts.push(`${m} min`);
  if (parts.length === 0) parts.push('< 1 min');
  return past ? `${parts.join(' ')} ago` : `in ${parts.join(' ')}`;
}

export default function ScanInScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('idle'); // idle | configuring | success
  const [visitor, setVisitor] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [pickedId, setPickedId] = useState('planned');
  const [customHours, setCustomHours] = useState('1');
  const [loadingVisitor, setLoadingVisitor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  // Synchronous re-entry gate. expo-camera fires onBarcodeScanned every frame
  // while a QR is in view, so React state isn't fast enough to dedupe — we
  // need a ref that flips before the next callback runs.
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
      setVisitorId(id);
      setPickedId('planned');
      setCustomHours('1');
      setError(null);

      const demo = await isDemoMode();
      if (demo) {
        const fakeOut = new Date(
          Date.now() + 2 * 60 * 60 * 1000
        ).toISOString();
        setVisitor({
          visitor_id: id,
          name: 'Demo Visitor',
          phone: '0000000000',
          in_time: new Date().toISOString(),
          out_time: fakeOut,
          in_scanned: false,
        });
        setPhase('configuring');
        return;
      }

      setLoadingVisitor(true);
      setPhase('configuring');
      try {
        const res = await axios.get(`${SERVER_URL}/visitor/${id}`);
        if (res.data?.success) {
          setVisitor(res.data.visitor);
        } else {
          setError(res.data?.error || 'Visitor not found');
          setVisitor({ visitor_id: id });
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setError('Visitor not found in the database.');
        } else {
          setError(
            'Could not fetch visitor details — you can still confirm check-in.'
          );
        }
        setVisitor({ visitor_id: id });
      } finally {
        setLoadingVisitor(false);
      }
    },
    [phase]
  );

  const computePreviewIso = () => {
    const opt = QUICK_DURATIONS.find((q) => q.id === pickedId);
    if (!opt) return visitor?.out_time || null;
    if (opt.id === 'planned') return visitor?.out_time || null;
    if (opt.id === 'custom') {
      const hours = parseFloat(customHours);
      if (!Number.isFinite(hours) || hours <= 0) return null;
      return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
    return new Date(Date.now() + opt.minutes * 60 * 1000).toISOString();
  };

  const previewIso = computePreviewIso();

  const confirmScanIn = async () => {
    if (!visitorId) return;
    setSubmitting(true);
    setError(null);

    const opt = QUICK_DURATIONS.find((q) => q.id === pickedId);
    const payload = { visitor_id: visitorId };

    if (opt && opt.id === 'custom') {
      const hours = parseFloat(customHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        setError('Enter a valid number of hours.');
        setSubmitting(false);
        return;
      }
      payload.duration_minutes = Math.round(hours * 60);
    } else if (opt && opt.minutes && opt.minutes > 0) {
      payload.duration_minutes = opt.minutes;
    }
    // "planned" => no override; backend keeps existing out_time.

    const demo = await isDemoMode();
    if (demo) {
      const newOut = previewIso || visitor?.out_time;
      setResult({
        visitor: { ...visitor, in_scanned: true, out_time: newOut },
        is_extension: !!visitor?.in_scanned,
        overridden: payload.duration_minutes != null,
      });
      setPhase('success');
      setSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${SERVER_URL}/scan-in`, payload);
      if (res.data?.success) {
        setResult(res.data);
        setPhase('success');
      } else {
        setError(res.data?.error || 'Scan-in failed');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const rescan = () => {
    setVisitor(null);
    setVisitorId(null);
    setPickedId('planned');
    setCustomHours('1');
    setError(null);
    setResult(null);
    processingRef.current = false;
    lastScanRef.current = null;
    setPhase('idle');
  };

  const finalOutTime = result?.visitor?.out_time;
  const arrivedAt = result?.visitor?.actual_in_time;

  return (
    <ScreenContainer scroll={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 20 }}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <PageHeader
          eyebrow="VISITOR CHECK-IN"
          title="Scan In Visitor"
          subtitle="Point the camera at the visitor's QR pass. The pass's existing deadline is used unless you choose to extend it."
          eyebrowColor={colors.accentSuccess}
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
                <View style={styles.greenDot} />
                <Text style={styles.hintText}>
                  Scanner active — align the QR code inside the frame
                </Text>
              </View>
            </>
          ) : phase === 'configuring' ? (
            <View style={styles.configBox}>
              <Text style={styles.eyebrowSm}>VISITOR FOUND</Text>
              <Text style={styles.visitorName}>
                {loadingVisitor ? 'Loading…' : visitor?.name || 'Unknown visitor'}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>PHONE</Text>
                  <Text style={styles.metaValue}>{visitor?.phone || '—'}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>PLANNED END</Text>
                  <Text style={styles.metaValue}>
                    {formatPretty(visitor?.out_time)}
                  </Text>
                </View>
              </View>

              {visitor?.in_scanned ? (
                <View style={styles.warnBadge}>
                  <Text style={styles.warnText}>
                    This visitor has already checked in once. Re-scanning will
                    extend their stay.
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>End time for this visit</Text>
              <View style={styles.chipRow}>
                {QUICK_DURATIONS.map((q) => {
                  const active = pickedId === q.id;
                  return (
                    <Pressable
                      key={q.id}
                      onPress={() => setPickedId(q.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {q.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {pickedId === 'custom' ? (
                <View style={styles.customRow}>
                  <Text style={styles.customLabel}>HOURS FROM NOW</Text>
                  <TextInput
                    value={customHours}
                    onChangeText={setCustomHours}
                    keyboardType="decimal-pad"
                    style={styles.customInput}
                    placeholder="e.g. 2"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              ) : null}

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>
                  {pickedId === 'planned'
                    ? 'WILL KEEP PLANNED DEADLINE'
                    : 'NEW DEADLINE'}
                </Text>
                <Text style={styles.previewValue}>
                  {formatPretty(previewIso)}
                </Text>
                <Text style={styles.previewDelta}>
                  {describeDelta(previewIso)}
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  onPress={rescan}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <GradientButton
                    title={submitting ? 'Confirming…' : 'Confirm check-in'}
                    onPress={confirmScanIn}
                    gradient={gradients.successCyan}
                    textColor={colors.bgPrimary}
                    disabled={submitting || !visitorId}
                  />
                </View>
              </View>
              {submitting ? (
                <ActivityIndicator
                  color={colors.accentSuccess}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.successBox}>
              <LinearGradient
                colors={gradients.successCyan}
                style={styles.successIcon}
              >
                <Text style={styles.successCheck}>✓</Text>
              </LinearGradient>
              <Text style={styles.successTitle}>
                {result?.is_extension ? 'Stay Extended' : 'Visitor Checked In'}
              </Text>
              <View style={styles.successInfo}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>VISITOR</Text>
                  <Text style={styles.metaValue}>
                    {result?.visitor?.name || visitor?.name || visitorId}
                  </Text>
                </View>
                {arrivedAt ? (
                  <View style={styles.metaCell}>
                    <Text style={styles.metaLabel}>ARRIVED</Text>
                    <Text style={styles.metaValue}>
                      {formatPretty(arrivedAt)}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>END TIME</Text>
                  <Text style={styles.metaValue}>
                    {formatPretty(finalOutTime)}
                  </Text>
                </View>
              </View>
              <Text style={styles.successHint}>
                If they don't scan out before the end time, they will appear
                in the Overdue Visitors dashboard.
              </Text>
              <GradientButton
                title="Scan Another"
                gradient={gradients.successCyan}
                textColor={colors.bgPrimary}
                onPress={rescan}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
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
    borderColor: 'rgba(0, 224, 164, 0.3)',
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
    borderColor: colors.accentSuccess,
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
    borderColor: colors.accentSuccess,
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
    borderColor: colors.accentSuccess,
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
    borderColor: colors.accentSuccess,
    borderBottomRightRadius: 8,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentSuccess,
  },
  hintText: { color: colors.textSecondary, fontSize: 13 },

  configBox: { gap: 12, padding: 4 },
  eyebrowSm: {
    fontSize: 11,
    color: colors.accentSuccess,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  visitorName: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaCell: { gap: 4, minWidth: 130 },
  metaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  metaValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  warnBadge: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 0, 0.3)',
  },
  warnText: { color: '#ffd166', fontSize: 13 },
  sectionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: {
    backgroundColor: colors.accentSuccess,
    borderColor: 'transparent',
  },
  chipText: { color: colors.textPrimary, fontSize: 13 },
  chipTextActive: { color: colors.bgPrimary, fontWeight: '700' },
  customRow: { gap: 6 },
  customLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  customInput: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: colors.textPrimary,
    fontSize: 14,
    width: 140,
  },
  previewBox: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 164, 0.25)',
    backgroundColor: 'rgba(0, 224, 164, 0.06)',
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    color: colors.accentSuccess,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  previewValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  previewDelta: { color: colors.textSecondary, fontSize: 12 },
  errorBox: {
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryBtnText: { color: colors.textPrimary, fontWeight: '600' },

  successBox: { alignItems: 'center', padding: 8 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheck: { color: '#fff', fontSize: 40, fontWeight: '900' },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  successInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 12,
  },
  successHint: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
});
