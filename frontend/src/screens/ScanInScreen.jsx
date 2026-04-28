import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { SERVER_URL } from '../config';

// Quick "extend / replace" options the security can pick instead of the
// pass's planned end time. The first option is the default no-op.
const QUICK_DURATIONS = [
  { id: 'planned', label: 'Use planned deadline', minutes: null },
  { id: 'm30', label: '+30 min', minutes: 30 },
  { id: 'h1', label: '+1 hr', minutes: 60 },
  { id: 'h2', label: '+2 hr', minutes: 120 },
  { id: 'h4', label: '+4 hr', minutes: 240 },
  { id: 'custom', label: 'Custom…', minutes: -1 },
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

export default function ScanInScreen() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  // Synchronous re-entry gate. html5-qrcode fires the success callback every
  // frame (~10 fps) while a QR is in view, so we MUST drop subsequent calls
  // immediately — `await stopScanner()` is async and lets dozens through
  // before the camera actually stops.
  const processingRef = useRef(false);
  const lastScanRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | configuring | success
  const [visitor, setVisitor] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [pickedId, setPickedId] = useState('planned');
  const [customHours, setCustomHours] = useState('1');
  const [loadingVisitor, setLoadingVisitor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const isDemo = typeof window !== 'undefined' &&
    localStorage.getItem('demoMode') === 'true';

  const stopScanner = useCallback(async () => {
    const inst = scannerRef.current;
    if (!inst) return;
    scannerRef.current = null;
    // pause() is synchronous and stops the scan loop immediately so further
    // success callbacks won't fire; clear() then tears down the DOM.
    try { inst.pause(true); } catch (e) { /* ignore */ }
    try { await inst.clear(); } catch (e) { /* benign on unmount */ }
  }, []);

  const handleScanned = useCallback(
    async (raw) => {
      // Synchronous gate — drop everything if we're already handling a scan.
      if (processingRef.current) return;
      const id = String(raw || '').replace('visitor:', '').trim();
      if (!id) return;
      // Also dedupe identical raw strings within this idle session.
      if (lastScanRef.current === id) return;
      processingRef.current = true;
      lastScanRef.current = id;

      // Stop the camera ASAP so no more frames decode.
      try { scannerRef.current?.pause(true); } catch (e) { /* ignore */ }
      await stopScanner();

      setVisitorId(id);
      setPickedId('planned');
      setCustomHours('1');
      setError(null);

      if (isDemo) {
        const fakeOut = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
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
        // Backend may be old (no /visitor/<id> route). Fall back to a
        // minimal record — we can still scan them in.
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
    [isDemo, stopScanner]
  );

  // Mount the QR scanner whenever we go back to the idle phase.
  useEffect(() => {
    if (phase !== 'idle') return undefined;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (raw) => {
        handleScanned(raw);
      },
      (err) => {
        // Continuous decode errors are expected; ignore.
        if (err && !String(err).includes('NotFoundException')) {
          console.warn('QR scan error', err);
        }
      }
    );

    return () => {
      stopScanner();
    };
  }, [phase, handleScanned, stopScanner]);

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

    // "planned" = no override, backend keeps existing out_time.
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

    if (isDemo) {
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
    // Re-arm the scan gate so the next QR is accepted.
    processingRef.current = false;
    lastScanRef.current = null;
    setPhase('idle');
  };

  const finalOutTime = result?.visitor?.out_time;
  const arrivedAt = result?.visitor?.actual_in_time;

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Visitor Check-In</p>
          <h1 style={styles.title}>Scan In Visitor</h1>
          <p style={styles.subtitle}>
            Point the camera at the visitor's QR pass. After scanning, the
            pass's existing deadline is used unless you choose to extend it.
          </p>
        </div>

        <div style={styles.card}>
          {phase === 'idle' && (
            <>
              <div style={styles.scanFrame}>
                <div id="qr-reader" style={styles.qrReader}></div>
              </div>
              <p style={styles.hint}>
                <span style={styles.greenDot} /> Scanner active — align the QR
                code inside the frame
              </p>
            </>
          )}

          {phase === 'configuring' && (
            <div style={styles.configBox}>
              <p style={styles.eyebrowSm}>Visitor Found</p>
              <h2 style={styles.visitorName}>
                {loadingVisitor
                  ? 'Loading…'
                  : visitor?.name || 'Unknown visitor'}
              </h2>
              <div style={styles.metaRow}>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>Phone</span>
                  <span style={styles.metaValue}>{visitor?.phone || '—'}</span>
                </div>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>Planned end</span>
                  <span style={styles.metaValue}>
                    {formatPretty(visitor?.out_time)}
                  </span>
                </div>
              </div>

              {visitor?.in_scanned ? (
                <div style={styles.warnBadge}>
                  This visitor has already checked in once. Re-scanning will
                  extend their stay.
                </div>
              ) : null}

              <p style={styles.sectionLabel}>End time for this visit</p>
              <div style={styles.chipRow}>
                {QUICK_DURATIONS.map((q) => {
                  const active = pickedId === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setPickedId(q.id)}
                      style={{
                        ...styles.chip,
                        ...(active ? styles.chipActive : {}),
                      }}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>

              {pickedId === 'custom' && (
                <div style={styles.customRow}>
                  <label style={styles.customLabel}>Hours from now</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    style={styles.customInput}
                  />
                </div>
              )}

              <div style={styles.previewBox}>
                <span style={styles.previewLabel}>
                  {pickedId === 'planned'
                    ? 'Will keep planned deadline'
                    : 'New deadline'}
                </span>
                <span style={styles.previewValue}>
                  {formatPretty(previewIso)}
                </span>
                <span style={styles.previewDelta}>
                  {describeDelta(previewIso)}
                </span>
              </div>

              {error ? <div style={styles.errorBox}>{error}</div> : null}

              <div style={styles.actionRow}>
                <button
                  onClick={rescan}
                  style={styles.secondaryBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmScanIn}
                  style={{
                    ...styles.button,
                    opacity: submitting ? 0.6 : 1,
                  }}
                  disabled={submitting || !visitorId}
                >
                  {submitting ? 'Confirming…' : 'Confirm check-in'}
                </button>
              </div>
            </div>
          )}

          {phase === 'success' && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>
                {result?.is_extension
                  ? 'Stay Extended'
                  : 'Visitor Checked In'}
              </h2>
              <div style={styles.successInfo}>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>Visitor</span>
                  <span style={styles.metaValue}>
                    {result?.visitor?.name || visitor?.name || visitorId}
                  </span>
                </div>
                {arrivedAt ? (
                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Arrived</span>
                    <span style={styles.metaValue}>
                      {formatPretty(arrivedAt)}
                    </span>
                  </div>
                ) : null}
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>End time</span>
                  <span style={styles.metaValue}>
                    {formatPretty(finalOutTime)}
                  </span>
                </div>
              </div>
              <p style={styles.successHint}>
                If they don't scan out before the end time, they will appear
                in the Overdue Visitors dashboard.
              </p>
              <button style={styles.button} onClick={rescan}>
                Scan Another
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 600,
    marginBottom: '2rem',
  },
  backBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: { textAlign: 'left' },
  eyebrow: {
    fontSize: '0.85rem',
    color: '#00e0a4',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  eyebrowSm: {
    fontSize: '0.75rem',
    color: '#00e0a4',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 700,
    marginBottom: '0.4rem',
    background: 'linear-gradient(135deg, #f5f7fb 0%, #a8b3cf 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: { color: '#a8b3cf', fontSize: '0.95rem' },
  card: {
    padding: '1.75rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  scanFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    background: '#000',
    border: '2px solid rgba(0, 224, 164, 0.3)',
    padding: 4,
    marginBottom: '1rem',
  },
  qrReader: { width: '100%' },
  hint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#a8b3cf',
    fontSize: '0.85rem',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00e0a4',
    boxShadow: '0 0 8px rgba(0, 224, 164, 0.6)',
  },
  configBox: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  visitorName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f5f7fb',
    margin: 0,
  },
  metaRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  metaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 120,
  },
  metaLabel: {
    fontSize: '0.7rem',
    color: '#7c8aa8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaValue: { fontSize: '0.95rem', color: '#f5f7fb', fontWeight: 600 },
  warnBadge: {
    padding: '0.6rem 0.85rem',
    borderRadius: 10,
    background: 'rgba(255, 196, 0, 0.1)',
    border: '1px solid rgba(255, 196, 0, 0.3)',
    color: '#ffd166',
    fontSize: '0.85rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    color: '#a8b3cf',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginTop: '0.5rem',
    marginBottom: '-0.25rem',
  },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  chip: {
    padding: '0.5rem 0.85rem',
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  chipActive: {
    background: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    color: '#0a0e1a',
    fontWeight: 700,
    border: '1px solid transparent',
  },
  customRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: '-0.25rem',
  },
  customLabel: {
    fontSize: '0.75rem',
    color: '#a8b3cf',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  customInput: {
    padding: '0.7rem 0.9rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.25)',
    color: '#f5f7fb',
    fontSize: '0.95rem',
    width: 140,
  },
  previewBox: {
    padding: '0.85rem 1rem',
    borderRadius: 12,
    background: 'rgba(0, 224, 164, 0.06)',
    border: '1px solid rgba(0, 224, 164, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  previewLabel: {
    fontSize: '0.7rem',
    color: '#00e0a4',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  previewValue: { fontSize: '1.05rem', color: '#f5f7fb', fontWeight: 700 },
  previewDelta: { fontSize: '0.8rem', color: '#a8b3cf' },
  errorBox: {
    padding: '0.75rem 0.9rem',
    borderRadius: 10,
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#fca5a5',
    fontSize: '0.85rem',
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    padding: '0.85rem 1.5rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  button: {
    padding: '0.85rem 1.75rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    color: '#0a0e1a',
    fontSize: '0.95rem',
    fontWeight: 700,
    boxShadow: '0 8px 24px rgba(0, 224, 164, 0.4)',
    cursor: 'pointer',
  },
  successBox: { textAlign: 'center', padding: '1.5rem 0.5rem' },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.4rem',
    fontWeight: 900,
    margin: '0 auto 1.25rem',
    boxShadow: '0 0 40px rgba(0, 224, 164, 0.5)',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '1rem',
  },
  successInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  successHint: {
    color: '#a8b3cf',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
};
