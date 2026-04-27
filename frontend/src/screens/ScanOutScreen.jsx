import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function ScanOutScreen() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-out",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] // ✅ Fixed
      },
      false
    );

    scanner.render(
      async (result) => {
        scanner.clear();
        setScanResult(result);
        const qr_id = result.replace('visitor:', '');
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
    <div style={styles.container}>
      <h2 style={styles.title}>Scan Out Visitor QR Code</h2>
      {scanResult ? (
        <p style={styles.success}>✅ Visitor Out Scanned: {scanResult}</p>
      ) : (
        <div id="qr-reader-out" style={styles.qr}></div>
      )}
    </div>
  );
}

const styles = {
    container: {
        backgroundColor: '#000',
        color: '#fff',
        width: '100vw',
        height: '100vh',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
  title: {
    color: '#4CAF50',
    fontSize: '24px',
    marginBottom: '20px',
  },
  success: {
    fontSize: '18px',
    marginTop: '20px',
    color: '#4CAF50',
  },
  qr: {
    margin: '0 auto',
    width: '300px',
  }
};
