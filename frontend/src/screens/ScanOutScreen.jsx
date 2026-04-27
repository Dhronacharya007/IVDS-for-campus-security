import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function ScanOutScreen() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-out",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scanner.render(
      async (result) => {
        scanner.clear();
        setScanResult(result);
        const qr_id = result.replace('visitor:', '');
        const isDemoMode = localStorage.getItem('demoMode') === 'true';
        if (isDemoMode) {
          alert("✅ Out-Time Scan Successful (Demo Mode)");
          return;
        }
        try {
          await axios.post(`${SERVER_URL}/scan-out`, { visitor_id: qr_id });
          alert("✅ Out-Time Scan Successful");
        } catch (err) {
          alert("❌ Out-Time scan failed");
        }
      },
      (err) => {
        console.warn("QR scan error", err);
      }
    );
  }, []);

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
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
          {scanResult ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>Visitor Checked Out</h2>
              <p style={styles.successText}>{scanResult}</p>
              <button style={styles.button} onClick={() => window.location.reload()}>
                Scan Another
              </button>
            </div>
          ) : (
            <>
              <div style={styles.scanFrame}>
                <div id="qr-reader-out" style={styles.qrReader}></div>
              </div>
              <p style={styles.hint}>
                <span style={styles.purpleDot} /> Scanner active — align the QR code inside the frame
              </p>
            </>
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
  },
  content: {
    width: '100%',
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    textAlign: 'left',
  },
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
  subtitle: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
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
  qrReader: {
    width: '100%',
  },
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
    animation: 'pulse 2s ease-in-out infinite',
  },
  successBox: {
    textAlign: 'center',
    padding: '2rem 1rem',
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
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.5rem',
  },
  successText: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
    marginBottom: '1.75rem',
    fontFamily: "'Space Grotesk', monospace",
    wordBreak: 'break-all',
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
  },
};
