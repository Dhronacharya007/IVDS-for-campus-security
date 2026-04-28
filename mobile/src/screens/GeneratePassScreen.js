import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import ScreenContainer from '../components/ScreenContainer';
import BackButton from '../components/BackButton';
import PageHeader from '../components/PageHeader';
import GradientButton from '../components/GradientButton';
import { colors, gradients, radius } from '../theme';
import { SERVER_URL } from '../config';
import { isDemoMode } from '../mockData';

// Local-time ISO without seconds/timezone — matches the format the web's
// <input type="datetime-local"> emits, so the backend's lexicographic
// overdue check works the same way for both clients.
function toLocalIsoMinute(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function parseLocalIso(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5])
  );
}

function formatPretty(value) {
  const d = parseLocalIso(value);
  if (!d) return '—';
  return d.toLocaleString();
}

const QUICK_DURATIONS = [
  { label: '+30 min', minutes: 30 },
  { label: '+1 hr', minutes: 60 },
  { label: '+2 hr', minutes: 120 },
  { label: '+4 hr', minutes: 240 },
  { label: '+8 hr', minutes: 480 },
  { label: '+1 day', minutes: 60 * 24 },
];

export default function GeneratePassScreen({ navigation }) {
  const [form, setForm] = useState(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      name: '',
      phone: '',
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    (async () => setDemo(await isDemoMode()))();
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const durationMinutes = useMemo(() => {
    const a = parseLocalIso(form.in_time);
    const b = parseLocalIso(form.out_time);
    if (!a || !b) return null;
    return Math.round((b.getTime() - a.getTime()) / 60_000);
  }, [form.in_time, form.out_time]);

  const useNowAsStart = () => {
    const start = new Date();
    const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 120;
    const end = new Date(start.getTime() + minutes * 60_000);
    setForm((prev) => ({
      ...prev,
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    }));
  };

  const applyQuickDuration = (minutes) => {
    const start = parseLocalIso(form.in_time) || new Date();
    const end = new Date(start.getTime() + minutes * 60_000);
    setForm((prev) => ({
      ...prev,
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    }));
  };

  const generate = async () => {
    setError(null);

    if (!form.name.trim() || !form.phone.trim() || !form.in_time || !form.out_time) {
      setError('Fill name, phone, start time and end time.');
      return;
    }
    const start = parseLocalIso(form.in_time);
    const end = parseLocalIso(form.out_time);
    if (!start || !end) {
      setError('Time fields must look like 2026-04-28T14:30 (use the chips below).');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError('End time must be after the start time.');
      return;
    }

    if (demo) {
      setResult({
        demo: true,
        visitor_id: 'demo-' + Date.now().toString(36),
        name: form.name,
        phone: form.phone,
        in_time: form.in_time,
        out_time: form.out_time,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${SERVER_URL}/generate-pass`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        in_time: form.in_time,
        out_time: form.out_time,
      });
      const data = res.data || {};
      setResult({
        ...data,
        name: form.name,
        phone: form.phone,
        in_time: form.in_time,
        out_time: form.out_time,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Could not generate pass.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const issueAnother = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    setForm({
      name: '',
      phone: '',
      in_time: toLocalIsoMinute(start),
      out_time: toLocalIsoMinute(end),
    });
    setResult(null);
    setError(null);
  };

  const openInBrowser = async (url, label = 'this URL') => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open', `No app can open ${label}: ${url}`);
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Open failed', e?.message || `Could not open ${label}.`);
    }
  };

  if (result) {
    // Always derive the URL from visitor_id when we have one — the backend
    // writes passes/<visitor_id>.png unconditionally during /generate-pass,
    // so this works even if an older backend's response doesn't include
    // qr_url / pdf_url yet.
    const qrSrc =
      !result.demo && result.visitor_id
        ? result.qr_url
          ? `${SERVER_URL}${result.qr_url}`
          : `${SERVER_URL}/passes/${result.visitor_id}.png`
        : null;
    const pdfUrl =
      !result.demo && result.visitor_id
        ? result.pdf_url
          ? `${SERVER_URL}${result.pdf_url}`
          : `${SERVER_URL}/passes/${result.visitor_id}.pdf`
        : null;
    return (
      <ScreenContainer scroll>
        <View style={{ marginBottom: 20 }}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <PageHeader
          eyebrow="PASS ISSUED"
          title="Visitor Pass Ready"
          subtitle={
            result.demo
              ? 'Demo mode — no QR was generated, but the flow is the same.'
              : 'Show this QR to the visitor — security can scan it on entry.'
          }
          eyebrowColor={colors.accentPrimary}
        />

        <View style={styles.resultCard}>
          <View style={styles.qrPanel}>
            {qrSrc && !result.demo ? (
              <Image
                source={{ uri: qrSrc }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Preview</Text>
              </View>
            )}
            <Text style={styles.visitorIdMono}>ID: {result.visitor_id}</Text>
          </View>

          <View style={styles.metaGrid}>
            <MetaCell label="VISITOR" value={result.name} />
            <MetaCell label="PHONE" value={result.phone} />
            <MetaCell label="VALID FROM" value={formatPretty(result.in_time)} />
            <MetaCell label="VALID UNTIL" value={formatPretty(result.out_time)} />
          </View>

          {!result.demo && (qrSrc || pdfUrl) ? (
            <View style={styles.downloadRow}>
              {qrSrc ? (
                <Pressable
                  onPress={() => openInBrowser(qrSrc, 'the QR image')}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { flex: 1 },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>⬇ QR (PNG)</Text>
                </Pressable>
              ) : null}
              {pdfUrl ? (
                <View style={{ flex: 1 }}>
                  <GradientButton
                    title="⬇ Pass (PDF)"
                    onPress={() => openInBrowser(pdfUrl, 'the pass PDF')}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={issueAnother}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.secondaryBtnText}>Issue another pass</Text>
          </Pressable>
          {!result.demo ? (
            <Text style={styles.tinyHint}>
              Tip: long-press the QR above to save the image directly. The
              download buttons open it in your browser where you can save or
              share.
            </Text>
          ) : null}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ marginBottom: 20 }}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <PageHeader
          eyebrow="VISITOR MANAGEMENT"
          title="Generate Visitor Pass"
          subtitle="Issue a digital pass with a custom validity window."
        />

        <View style={styles.card}>
          <Field
            label="VISITOR NAME"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="e.g. John Smith"
          />
          <Field
            label="PHONE NUMBER"
            value={form.phone}
            onChangeText={(v) => set('phone', v)}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>VALID FROM</Text>
              <Pressable onPress={useNowAsStart}>
                <Text style={styles.miniLink}>Use now</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="2026-04-28T14:30"
              placeholderTextColor={colors.textMuted}
              value={form.in_time}
              onChangeText={(v) => set('in_time', v)}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>{formatPretty(form.in_time)}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>VALID UNTIL</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-04-28T16:30"
              placeholderTextColor={colors.textMuted}
              value={form.out_time}
              onChangeText={(v) => set('out_time', v)}
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>{formatPretty(form.out_time)}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>QUICK DURATION</Text>
            <View style={styles.chipRow}>
              {QUICK_DURATIONS.map((q) => {
                const active = durationMinutes === q.minutes;
                return (
                  <Pressable
                    key={q.minutes}
                    onPress={() => applyQuickDuration(q.minutes)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && { opacity: 0.8 },
                    ]}
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
            <Text style={styles.helperText}>
              Sets the end time relative to the start time you picked.
            </Text>
          </View>

          {durationMinutes !== null && (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>PASS VALID FOR</Text>
              <Text style={styles.previewValue}>
                {durationMinutes <= 0
                  ? '— end before start —'
                  : durationMinutes < 60
                  ? `${durationMinutes} min`
                  : durationMinutes < 60 * 24
                  ? `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)} hr`
                  : `${(durationMinutes / (60 * 24)).toFixed(1)} day(s)`}
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <GradientButton
            title={loading ? 'Generating...' : 'Generate Pass'}
            icon={loading ? null : '→'}
            onPress={generate}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function MetaCell({ label, value }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
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
    gap: 4,
  },
  field: { marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
  },
  miniLink: {
    color: colors.accentSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: colors.textPrimary,
    fontSize: 15,
  },
  helperText: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipActive: {
    borderColor: 'rgba(124, 92, 255, 0.5)',
    backgroundColor: 'rgba(124, 92, 255, 0.18)',
  },
  chipText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#a78bfa' },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.2)',
    marginBottom: 12,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  previewValue: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  errorBanner: {
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    marginBottom: 8,
  },
  errorText: { color: '#ff8fa3', fontSize: 13 },

  // Result card
  resultCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  qrPanel: {
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#e5e7ef',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  qrPlaceholderText: { color: '#6b7691' },
  visitorIdMono: {
    marginTop: 10,
    color: '#0a0e1a',
    fontSize: 11,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaCell: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  downloadRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tinyHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
