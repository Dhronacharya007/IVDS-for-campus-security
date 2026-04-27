import React from 'react';

export default function VideoPlayer({ clipUri, onBack }) {
  return (
    <div style={styles.container}>
      <div className="bg-aurora" />
      <div style={styles.frame}>
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>← Back</button>
          <span style={styles.label}>NOW PLAYING</span>
        </div>
        <div style={styles.videoWrap}>
          <video controls autoPlay style={styles.video}>
            <source src={clipUri} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
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
};
