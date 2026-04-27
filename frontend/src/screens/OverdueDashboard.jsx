import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { mockOverdueVisitors } from '../mockData';

export default function OverdueDashboard() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setVisitors(mockOverdueVisitors);
      setLoading(false);
      return;
    }

    axios
      .get(`${SERVER_URL}/overdue-visitors`)
      .then(res => {
        const data = res.data;
        const visitorArray = Array.isArray(data) ? data : (data.visitors || []);
        setVisitors(visitorArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching overdue visitors', err);
        setVisitors([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Visitor Tracking</p>
          <h1 style={styles.title}>Overdue Visitors</h1>
          <p style={styles.subtitle}>
            Visitors who have not yet checked out by their expected exit time.
          </p>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Currently overdue</span>
            <span style={styles.statValue}>{loading ? '—' : visitors.length}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Status</span>
            <span style={{ ...styles.statValue, color: visitors.length > 0 ? '#ff4d6d' : '#00e0a4', fontSize: '1.1rem' }}>
              {visitors.length > 0 ? 'Action needed' : 'All clear'}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <div className="spinner" />
            <p style={styles.loadingText}>Loading overdue visitors...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>✓</div>
            <h3 style={styles.emptyTitle}>All clear</h3>
            <p style={styles.emptyText}>No overdue visitors at the moment.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {visitors.map((v, i) => (
              <div key={i} style={styles.row}>
                <div style={styles.rowAvatar}>
                  {v.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={styles.rowInfo}>
                  <h3 style={styles.rowName}>{v.name}</h3>
                  <p style={styles.rowMeta}>
                    <span>{v.phone}</span>
                    <span style={styles.dotSep}>•</span>
                    <span>Out: {v.out_time}</span>
                  </p>
                </div>
                <span style={styles.badge}>OVERDUE</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 820,
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
    maxWidth: 820,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    textAlign: 'left',
  },
  eyebrow: {
    fontSize: '0.85rem',
    color: '#ff8a3c',
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    padding: '1.25rem',
    borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7691',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#f5f7fb',
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
    boxShadow: '0 0 32px rgba(0, 224, 164, 0.3)',
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
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #ff8a3c, #ff4d6d)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
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
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  dotSep: {
    color: '#6b7691',
  },
  badge: {
    padding: '0.3rem 0.7rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.3)',
    color: '#ff4d6d',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
};
