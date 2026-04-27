import React, { useState } from 'react';

export default function VideoPlayer({ clipUri, onBack }) {
  const [error, setError] = useState(null);

  const handleError = () => {
    setError(
      'This clip could not be played. The file may be missing or use an unsupported codec ' +
      '(only H.264 MP4 is playable in browsers). Try restarting the backend so legacy clips ' +
      'are re-encoded automatically.'
    );
  };

  return (
    <div style={styles.container}>
      <div className="bg-aurora" />
      <div style={styles.frame}>
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>← Back</button>
          <span style={styles.label}>NOW PLAYING</span>
        </div>
        <div style={styles.videoWrap}>
          <video
            key={clipUri}
            controls
            autoPlay
            playsInline
            preload="metadata"
            style={styles.video}
            onError={handleError}
          >
            <source src={clipUri} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.hint}>
          If the player stays blank,{' '}
          <a href={clipUri} target="_blank" rel="noreferrer" style={styles.link}>
            open the clip in a new tab
          </a>{' '}
          to download it.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: 1100,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    padding: '1.5rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  label: {
    padding: '0.3rem 0.7rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.3)',
    color: '#ff4d6d',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  videoWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    background: '#000',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  error: {
    marginTop: '0.9rem',
    padding: '0.7rem 0.9rem',
    borderRadius: 10,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.35)',
    color: '#ff8fa3',
    fontSize: '0.85rem',
    lineHeight: 1.5,
  },
  hint: {
    marginTop: '0.7rem',
    fontSize: '0.8rem',
    color: '#a8b3cf',
  },
  link: {
    color: '#00d4ff',
    textDecoration: 'underline',
  },
};
