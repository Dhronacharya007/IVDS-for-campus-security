import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

const GEO_ERROR_MESSAGES = {
  1: 'Location permission was denied. Enable it in your browser settings.',
  2: 'Could not determine your position. Check that location services are on.',
  3: 'Timed out fetching your location. Please retry.',
};

function UserHomeScreen() {
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const username = 'SampleUser';

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setLocation({ latitude: 11.0692, longitude: 77.0042 });
      setLocationLoading(false);
      return undefined;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      setLocationLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLocationLoading(true);
    setLocationError(null);

    // watchPosition keeps the coords live as the user moves *and* resolves the
    // first fix asynchronously. The timeout option is the critical fix — without
    // it the browser silently waits forever when no fix is available.
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationLoading(false);
        setLocationError(null);
      },
      (err) => {
        if (cancelled) return;
        setLocationError(GEO_ERROR_MESSAGES[err.code] || err.message || 'Location error');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 30_000,
      }
    );

    return () => {
      cancelled = true;
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {
        /* ignore */
      }
    };
  }, [retryNonce]);

  const retryLocation = useCallback(() => setRetryNonce((n) => n + 1), []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSOS = async () => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      alert('🚨 SOS Sent. Security has been notified. (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          location: location || null,
          source: 'manual',
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.has_location === false || !location) {
          alert('🚨 SOS Sent. Security has been notified (without location — please share location).');
        } else {
          alert('🚨 SOS Sent. Security has been notified.');
        }
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
            {location && !locationError ? (
              <span style={styles.liveDot}>
                <span style={styles.livePulse} /> LIVE
              </span>
            ) : (
              <span style={styles.offlineDot}>
                {locationError ? 'UNAVAILABLE' : 'WAITING'}
              </span>
            )}
          </div>

          {locationLoading && !location ? (
            <div style={styles.loadingRow}>
              <div className="spinner" />
              <p style={styles.loadingText}>Fetching location...</p>
            </div>
          ) : locationError && !location ? (
            <div style={styles.errorRow}>
              <p style={styles.errorText}>{locationError}</p>
              <button style={styles.retryBtn} onClick={retryLocation}>
                Try again
              </button>
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

        <button style={styles.sosButton} onClick={handleSOS}>
          <div style={styles.sosRing} />
          <div style={styles.sosCore}>
            <span style={styles.sosIcon}>!</span>
            <span style={styles.sosText}>SOS</span>
            <span style={styles.sosHint}>
              {location
                ? 'Tap to send emergency alert'
                : 'Tap to send alert (no location)'}
            </span>
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
  offlineDot: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.65rem',
    borderRadius: 999,
    background: 'rgba(255, 182, 39, 0.12)',
    border: '1px solid rgba(255, 182, 39, 0.3)',
    color: '#ffb627',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
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
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  errorText: {
    color: '#ffb627',
    fontSize: '0.9rem',
    margin: 0,
    flex: 1,
    minWidth: 220,
  },
  retryBtn: {
    padding: '0.5rem 0.9rem',
    borderRadius: 10,
    border: '1px solid rgba(124, 92, 255, 0.4)',
    background: 'rgba(124, 92, 255, 0.12)',
    color: '#a78bfa',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
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
