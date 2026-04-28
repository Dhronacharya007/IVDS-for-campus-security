import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { SERVER_URL } from '../config';

function formatPretty(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function ScanOutScreen() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  // Synchronous re-entry gate. html5-qrcode fires the success callback every
  // frame (~10 fps) while a QR is in view, so without a sync gate every frame
  // would issue another /scan-out request.
  const processingRef = useRef(false);
  const lastScanRef = useRef(null);

  // phase: idle | submitting | success | error
  const [phase, setPhase] = useState('idle');
  const [visitorId, setVisitorId] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [exitedAt, setExitedAt] = useState(null);

  const stopScanner = useCallback(async () => {
    const inst = scannerRef.current;
    if (!inst) return;
    scannerRef.current = null;
    try { inst.pause(true); } catch (e) { /* ignore */ }
    try { await inst.clear(); } catch (e) { /* benign on unmount */ }
  }, []);

  const handleScanned = useCallback(
    async (raw) => {
      if (processingRef.current) return;
      const id = String(raw || '').replace('visitor:', '').trim();
      if (!id) return;
      if (lastScanRef.current === id) return;
      processingRef.current = true;
      lastScanRef.current = id;

      try { scannerRef.current?.pause(true); } catch (e) { /* ignore */ }
      await stopScanner();

      setVisitorId(id);
      setErrorMessage(null);
      setVisitor(null);
      setExitedAt(null);
      setPhase('submitting');

      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      if (isDemoMode) {
        setIsDemoSession(true);
        setVisitor({ visitor_id: id, name: 'Demo Visitor' });
        setExitedAt(new Date().toISOString());
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
        // Best-effort visitor lookup so we can show name/phone in the UI.
        try {
          const v = await axios.get(`${SERVER_URL}/visitor/${id}`);
          if (v.data?.success) setVisitor(v.data.visitor);
          else setVisitor({ visitor_id: id });
        } catch (_) {
          setVisitor({ visitor_id: id });
        }
        setExitedAt(new Date().toISOString());
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
    [stopScanner]
  );

  // Mount the QR scanner whenever we go back to the idle phase.
  useEffect(() => {
    if (phase !== 'idle') return undefined;

    const scanner = new Html5QrcodeScanner(
      'qr-reader-out',
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
        if (err && !String(err).includes('NotFoundException')) {
          console.warn('QR scan error', err);
        }
      }
    );

    return () => {
      stopScanner();
    };
  }, [phase, handleScanned, stopScanner]);

  const reset = () => {
    setVisitorId(null);
    setVisitor(null);
    setErrorMessage(null);
    setExitedAt(null);
    processingRef.current = false;
    lastScanRef.current = null;
    setPhase('idle');
  };

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
          <p style={styles.eyebrow}>Visitor Check-Out</p>
          <h1 style={styles.title}>Scan Out Visitor</h1>
          <p style={styles.subtitle}>
            Point the camera at the visitor's QR pass to record exit.
          </p>
        </div>

        <div style={styles.card}>
          {phase === 'idle' && (
            <>
              <div style={styles.scanFrame}>
                <div id="qr-reader-out" style={styles.qrReader}></div>
              </div>
              <p style={styles.hint}>
                <span style={styles.purpleDot} /> Scanner active — align the QR
                code inside the frame
              </p>
            </>
          )}

          {phase === 'submitting' && (
            <div style={styles.statusBox}>
              <div style={styles.spinner} />
              <h2 style={styles.statusTitle}>Recording exit…</h2>
              <p style={styles.statusSub}>
                Sending check-out to the backend.
              </p>
              <div style={styles.idChip}>ID: {visitorId}</div>
            </div>
          )}

          {phase === 'success' && (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>
                {isDemoSession ? 'Visitor Checked Out (Demo)' : 'Visitor Checked Out'}
              </h2>
              <div style={styles.metaRow}>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>Visitor</span>
                  <span style={styles.metaValue}>
                    {visitor?.name || visitorId}
                  </span>
                </div>
                {visitor?.phone ? (
                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Phone</span>
                    <span style={styles.metaValue}>{visitor.phone}</span>
                  </div>
                ) : null}
                {visitor?.actual_in_time ? (
                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Arrived</span>
                    <span style={styles.metaValue}>
                      {formatPretty(visitor.actual_in_time)}
                    </span>
                  </div>
                ) : null}
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>Exit recorded</span>
                  <span style={styles.metaValue}>{formatPretty(exitedAt)}</span>
                </div>
              </div>
              <p style={styles.idLine}>ID: {visitorId}</p>
              <button style={styles.button} onClick={reset}>
                Scan Another
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>!</div>
              <h2 style={styles.errorTitle}>Scan-out Failed</h2>
              <p style={styles.errorMessage}>{errorMessage}</p>
              {visitorId ? (
                <div style={styles.idChip}>ID: {visitorId}</div>
              ) : null}
              <div style={styles.actionRow}>
                <button style={styles.secondaryBtn} onClick={reset}>
                  Try Again
                </button>
                <button style={styles.button} onClick={reset}>
                  Scan Another
                </button>
              </div>
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
    color: '#7c5cff',
    fontWeight: 500,
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
    border: '2px solid rgba(124, 92, 255, 0.3)',
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
  purpleDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#7c5cff',
    boxShadow: '0 0 8px rgba(124, 92, 255, 0.6)',
  },
  statusBox: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '4px solid rgba(124, 92, 255, 0.2)',
    borderTopColor: '#7c5cff',
    animation: 'spin 0.9s linear infinite',
  },
  statusTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f5f7fb',
    margin: '0.5rem 0 0',
  },
  statusSub: {
    color: '#a8b3cf',
    fontSize: '0.9rem',
    margin: 0,
  },
  successBox: {
    textAlign: 'center',
    padding: '1.5rem 0.5rem',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.4rem',
    fontWeight: 900,
    margin: '0 auto 1.25rem',
    boxShadow: '0 0 40px rgba(124, 92, 255, 0.5)',
  },
  successTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '1rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    textAlign: 'left',
    marginBottom: '1rem',
  },
  metaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 130,
  },
  metaLabel: {
    fontSize: '0.7rem',
    color: '#7c8aa8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaValue: {
    fontSize: '0.95rem',
    color: '#f5f7fb',
    fontWeight: 600,
  },
  idLine: {
    color: '#a8b3cf',
    fontSize: '0.78rem',
    fontFamily: "'Space Grotesk', monospace",
    marginBottom: '1.25rem',
    wordBreak: 'break-all',
  },
  idChip: {
    display: 'inline-block',
    padding: '0.4rem 0.85rem',
    borderRadius: 999,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#a8b3cf',
    fontSize: '0.75rem',
    fontFamily: "'Space Grotesk', monospace",
  },
  errorBox: {
    textAlign: 'center',
    padding: '1.5rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: 'rgba(255, 77, 109, 0.15)',
    border: '2px solid rgba(255, 77, 109, 0.4)',
    color: '#ff8fa3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 900,
  },
  errorTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f5f7fb',
    margin: 0,
  },
  errorMessage: {
    color: '#ff8fa3',
    fontSize: '0.9rem',
    maxWidth: 420,
    margin: 0,
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
    cursor: 'pointer',
  },
};
