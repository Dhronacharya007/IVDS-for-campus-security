import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

function UserHomeScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const username = 'SampleUser';

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setLocation({ latitude: 11.0692, longitude: 77.0042 });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        alert('Location access denied.');
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSOS = async () => {
    if (!location) {
      alert('Location not available.');
      return;
    }

    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      alert('🚨 SOS Sent. Security has been notified. (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, location }),
      });

      const data = await response.json();
      if (data.success) {
        alert('🚨 SOS Sent. Security has been notified.');
      } else {
        alert('❌ Failed to send SOS');
      }
    } catch {
      alert('❌ Network Error');
    }
  };

  const goToProfile = () => navigate('/user-profile');

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
                stroke="url(#brandGrad)" strokeWidth="2" fill="rgba(124, 92, 255, 0.15)" />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={styles.brandText}>Sentinel</span>
        </div>
        <button onClick={goToProfile} style={styles.profileButton}>
          <span style={styles.avatar}>D</span>
          <span>Profile</span>
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.greetingSection}>
          <p style={styles.eyebrow}>Welcome back</p>
          <h1 style={styles.greeting}>Stay safe on campus</h1>
          <p style={styles.subtitle}>
            Your location is being securely monitored. In an emergency, tap the SOS button below.
          </p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(0,224,164,0.2), rgba(0,212,255,0.1))' }}>
              <span style={{ color: '#00e0a4', fontSize: '1.2rem' }}>●</span>
            </div>
            <div>
              <p style={styles.statLabel}>Status</p>
              <p style={styles.statValue}>Active</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, rgba(124,92,255,0.2), rgba(0,212,255,0.1))' }}>
              <span style={{ color: '#7c5cff', fontSize: '1.1rem' }}>◷</span>
            </div>
            <div>
              <p style={styles.statLabel}>Time</p>
              <p style={styles.statValue}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.locationCard}>
          <div style={styles.locationHeader}>
            <p style={styles.cardLabel}>Live Location</p>
            <span style={styles.liveDot}>
              <span style={styles.livePulse} /> LIVE
            </span>
          </div>
          {loading ? (
            <div style={styles.loadingRow}>
              <div className="spinner" />
              <p style={styles.loadingText}>Fetching location...</p>
            </div>
          ) : (
            <div style={styles.locationDetails}>
              <div style={styles.locationItem}>
                <span style={styles.locationKey}>LATITUDE</span>
                <span style={styles.locationValue}>{location.latitude.toFixed(6)}</span>
              </div>
              <div style={styles.locationDivider} />
              <div style={styles.locationItem}>
                <span style={styles.locationKey}>LONGITUDE</span>
                <span style={styles.locationValue}>{location.longitude.toFixed(6)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          style={styles.sosButton}
          onClick={handleSOS}
          disabled={loading}
        >
          <div style={styles.sosRing} />
          <div style={styles.sosCore}>
            <span style={styles.sosIcon}>!</span>
            <span style={styles.sosText}>SOS</span>
            <span style={styles.sosHint}>Tap to send emergency alert</span>
          </div>
        </button>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 720,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    marginBottom: '2.5rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(124, 92, 255, 0.12)',
    border: '1px solid rgba(124, 92, 255, 0.3)',
  },
  brandText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '1.2rem',
    color: '#f5f7fb',
  },
  profileButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem 0.9rem 0.5rem 0.5rem',
    borderRadius: 999,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f5f7fb',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: '#fff',
  },
  content: {
    width: '100%',
    maxWidth: 720,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  greetingSection: {
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
  greeting: {
    fontSize: '2.4rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.6rem',
    background: 'linear-gradient(135deg, #f5f7fb 0%, #a8b3cf 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#a8b3cf',
    fontSize: '1rem',
    maxWidth: 540,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '1rem',
    borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7691',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.15rem',
  },
  statValue: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#f5f7fb',
  },
  locationCard: {
    padding: '1.5rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  locationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.1rem',
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: '#a8b3cf',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  liveDot: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.25rem 0.65rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.3)',
    color: '#ff4d6d',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ff4d6d',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  locationDetails: {
    display: 'flex',
    alignItems: 'stretch',
  },
  locationItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  locationDivider: {
    width: 1,
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '0 1.2rem',
  },
  locationKey: {
    fontSize: '0.7rem',
    color: '#6b7691',
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
  locationValue: {
    fontFamily: "'Space Grotesk', monospace",
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#f5f7fb',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  loadingText: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  sosButton: {
    position: 'relative',
    width: 220,
    height: 220,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    margin: '1.5rem auto 2rem',
    padding: 0,
  },
  sosRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff4d6d 0%, #ff8a3c 100%)',
    boxShadow: '0 0 60px rgba(255, 77, 109, 0.5)',
    animation: 'pulseGlow 2s ease-in-out infinite',
  },
  sosCore: {
    position: 'absolute',
    inset: 8,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff4d6d 0%, #ff2855 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    border: '2px solid rgba(255, 255, 255, 0.15)',
  },
  sosIcon: {
    fontSize: '2rem',
    fontWeight: 900,
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: '-0.25rem',
  },
  sosText: {
    fontSize: '2.2rem',
    fontWeight: 800,
    letterSpacing: '0.12em',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  sosHint: {
    fontSize: '0.7rem',
    fontWeight: 500,
    opacity: 0.8,
    marginTop: '0.4rem',
    letterSpacing: '0.05em',
    textAlign: 'center',
    padding: '0 1rem',
  },
};

export default UserHomeScreen;
