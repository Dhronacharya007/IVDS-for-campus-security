import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

export default function TestModelScreen() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
    setResult('');
  };

  const handleUpload = async () => {
    if (!videoFile) return alert("Please select a video");

    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setLoading(true);
      setTimeout(() => {
        const demoResults = ['Fight Detected', 'Crowd Gathering', 'Suspicious Activity', 'Normal Activity'];
        setResult(demoResults[Math.floor(Math.random() * demoResults.length)]);
        setLoading(false);
      }, 1500);
      return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/test-model`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResult(data.result || 'No category detected');
    } catch (err) {
      alert('❌ Error testing video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>AI Threat Detection</p>
          <h1 style={styles.title}>Test the AI Model</h1>
          <p style={styles.subtitle}>
            Upload a video clip to classify it through the AI threat-detection pipeline.
          </p>
        </div>

        <div style={styles.card}>
          <label style={styles.dropzone}>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <div style={styles.dropzoneIcon}>↑</div>
            <h3 style={styles.dropzoneTitle}>
              {videoFile ? videoFile.name : 'Click to upload a video'}
            </h3>
            <p style={styles.dropzoneHint}>
              {videoFile
                ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`
                : 'MP4, MOV, AVI — any common video format'}
            </p>
          </label>

          <button
            onClick={handleUpload}
            disabled={loading || !videoFile}
            style={{
              ...styles.button,
              opacity: loading || !videoFile ? 0.5 : 1,
              cursor: loading || !videoFile ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Analyzing...
              </>
            ) : (
              <>
                Run Analysis
                <span>→</span>
              </>
            )}
          </button>

          {result && (
            <div style={styles.resultBox}>
              <div style={styles.resultHeader}>
                <span style={styles.resultLabel}>Detection result</span>
              </div>
              <div style={styles.resultContent}>
                <div style={styles.resultIcon}>✓</div>
                <div>
                  <p style={styles.resultClass}>{result}</p>
                  <p style={styles.resultMeta}>Model classification complete</p>
                </div>
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
    maxWidth: 720,
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
    maxWidth: 720,
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
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  dropzone: {
    cursor: 'pointer',
    padding: '2.5rem 1.5rem',
    borderRadius: 16,
    border: '2px dashed rgba(124, 92, 255, 0.4)',
    background: 'rgba(124, 92, 255, 0.05)',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  fileInput: {
    display: 'none',
  },
  dropzoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
  },
  dropzoneTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#f5f7fb',
    wordBreak: 'break-word',
  },
  dropzoneHint: {
    fontSize: '0.85rem',
    color: '#a8b3cf',
  },
  button: {
    padding: '0.95rem 1.25rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cff 0%, #00d4ff 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
  },
  resultBox: {
    padding: '1.25rem',
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(0, 224, 164, 0.1), rgba(0, 212, 255, 0.05))',
    border: '1px solid rgba(0, 224, 164, 0.25)',
  },
  resultHeader: {
    marginBottom: '0.6rem',
  },
  resultLabel: {
    fontSize: '0.7rem',
    color: '#00e0a4',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  resultContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: 900,
    flexShrink: 0,
    boxShadow: '0 0 20px rgba(0, 224, 164, 0.5)',
  },
  resultClass: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.15rem',
  },
  resultMeta: {
    fontSize: '0.8rem',
    color: '#a8b3cf',
  },
};
