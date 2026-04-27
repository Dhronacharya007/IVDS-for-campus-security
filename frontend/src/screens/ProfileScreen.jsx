import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Demo User';
  const initial = username.charAt(0).toUpperCase();

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <div className="app-page-centered">
      <div className="bg-aurora" />

      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div style={styles.card}>
        <div style={styles.avatarWrap}>
          <div style={styles.avatarRing}>
            <div style={styles.avatar}>{initial}</div>
          </div>
        </div>

        <h1 style={styles.name}>{username}</h1>
        <p style={styles.role}>Active Member</p>

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Username</span>
            <span style={styles.detailValue}>{username}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Status</span>
            <span style={{ ...styles.detailValue, color: '#00e0a4', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={styles.statusDot} /> Online
            </span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Member since</span>
            <span style={styles.detailValue}>April 2026</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Verified</span>
            <span style={styles.detailValue}>✓ Yes</span>
          </div>
        </div>

        <button style={styles.signOutBtn} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  backBtn: {
    position: 'absolute',
    top: 28,
    left: 28,
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: '2.5rem',
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
  },
  avatarWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    padding: 3,
    background: 'linear-gradient(135deg, #7c5cff 0%, #00d4ff 100%)',
    boxShadow: '0 0 40px rgba(124, 92, 255, 0.4)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '2.6rem',
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  name: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.3rem',
  },
  role: {
    fontSize: '0.9rem',
    color: '#7c5cff',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '2rem',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.75rem',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    padding: '0.85rem 1rem',
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'left',
  },
  detailLabel: {
    fontSize: '0.7rem',
    color: '#6b7691',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '0.95rem',
    color: '#f5f7fb',
    fontWeight: 500,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00e0a4',
    boxShadow: '0 0 8px rgba(0, 224, 164, 0.6)',
  },
  signOutBtn: {
    width: '100%',
    padding: '0.95rem 1.25rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 77, 109, 0.3)',
    background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.18), rgba(255, 138, 60, 0.12))',
    color: '#ff6b85',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
};
