import React, { useEffect, useState } from 'react';
import { SERVER_URL } from '../config';
import { mockSosAlerts } from '../mockData';

const SecuritySosScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setAlerts(mockSosAlerts);
      setLoading(false);
      return;
    }

    fetch(`${SERVER_URL}/sos-alerts`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sos:', err);
        setLoading(false);
      });
  }, []);

  const handlePress = (item) => {
    alert(`User: ${item.username}\nTime: ${new Date(item.timestamp * 1000).toLocaleString()}`);
  };

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Emergency Center</p>
          <h1 style={styles.title}>SOS Alerts</h1>
          <p style={styles.subtitle}>Active emergency calls received from users.</p>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <div className="spinner" />
            <p style={styles.loadingText}>Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>✓</div>
            <h3 style={styles.emptyTitle}>All clear</h3>
            <p style={styles.emptyText}>No active SOS alerts.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {alerts.map((item, idx) => (
              <button
                key={idx}
                style={styles.row}
                onClick={() => handlePress(item)}
              >
                <div style={styles.rowIcon}>!</div>
                <div style={styles.rowInfo}>
                  <h4 style={styles.rowName}>{item.username}</h4>
                  <p style={styles.rowMeta}>
                    {new Date(item.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <span style={styles.badge}>SOS</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
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
    color: '#ff4d6d',
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
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.8rem',
    padding: '3rem',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  loadingText: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '3rem 2rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 900,
    margin: '0 auto 1rem',
  },
  emptyTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.4rem',
  },
  emptyText: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#f5f7fb',
    cursor: 'pointer',
    textAlign: 'left',
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #ff4d6d, #ff8a3c)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f5f7fb',
    marginBottom: '0.2rem',
  },
  rowMeta: {
    fontSize: '0.85rem',
    color: '#a8b3cf',
  },
  badge: {
    padding: '0.3rem 0.7rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.15)',
    border: '1px solid rgba(255, 77, 109, 0.4)',
    color: '#ff4d6d',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
};

export default SecuritySosScreen;
