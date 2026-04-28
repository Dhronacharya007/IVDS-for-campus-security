import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { mockOverdueVisitors } from '../mockData';

export default function OverdueDashboard() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demoMode = localStorage.getItem('demoMode') === 'true';
    setIsDemo(demoMode);
    if (demoMode) {
      // Mock data has no visitor_id; mint stable ones so the delete UI works.
      setVisitors(
        mockOverdueVisitors.map((v, idx) => ({
          ...v,
          visitor_id: v.visitor_id || `demo-${idx}`,
        }))
      );
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

  const handleDelete = async (visitor) => {
    const id = visitor?.visitor_id;
    if (!id) {
      window.alert("This visitor has no id and can't be deleted.");
      return;
    }
    if (!window.confirm(`Remove "${visitor.name || id}" from the overdue list?`)) {
      return;
    }

    if (isDemo) {
      setVisitors((prev) => prev.filter((v) => v.visitor_id !== id));
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(
        `${SERVER_URL}/overdue-visitors/${encodeURIComponent(id)}`,
        { method: 'DELETE', mode: 'cors' }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }
      setVisitors((prev) => prev.filter((v) => v.visitor_id !== id));
    } catch (err) {
      console.error('Failed to delete visitor:', err);
      window.alert(`Failed to remove visitor: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (visitors.length === 0 || clearingAll) return;
    if (
      !window.confirm(
        `Remove all ${visitors.length} overdue visitor${visitors.length === 1 ? '' : 's'}? This cannot be undone.`
      )
    ) {
      return;
    }

    if (isDemo) {
      setVisitors([]);
      return;
    }

    setClearingAll(true);
    try {
      const res = await fetch(`${SERVER_URL}/overdue-visitors`, {
        method: 'DELETE',
        mode: 'cors',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server returned ${res.status}`);
      }
      setVisitors([]);
    } catch (err) {
      console.error('Failed to clear overdue visitors:', err);
      window.alert(`Failed to clear list: ${err.message || err}`);
    } finally {
      setClearingAll(false);
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
          <div style={styles.headerLeft}>
            <p style={styles.eyebrow}>Visitor Tracking</p>
            <h1 style={styles.title}>Overdue Visitors</h1>
            <p style={styles.subtitle}>
              Visitors who have not yet checked out by their expected exit time.
            </p>
          </div>
          {!loading && visitors.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              style={{
                ...styles.clearAllBtn,
                opacity: clearingAll ? 0.6 : 1,
                cursor: clearingAll ? 'wait' : 'pointer',
              }}
              title="Remove every overdue visitor"
            >
              {clearingAll ? 'Clearing…' : 'Clear all'}
            </button>
          )}
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
            {visitors.map((v, i) => {
              const isDeleting = deletingId === v.visitor_id;
              return (
                <div
                  key={v.visitor_id || i}
                  style={{
                    ...styles.row,
                    opacity: isDeleting ? 0.55 : 1,
                  }}
                >
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
                  <button
                    type="button"
                    onClick={() => handleDelete(v)}
                    disabled={isDeleting}
                    style={{
                      ...styles.deleteBtn,
                      cursor: isDeleting ? 'wait' : 'pointer',
                    }}
                    title="Remove this visitor"
                    aria-label={`Remove visitor ${v.name || v.visitor_id}`}
                  >
                    {isDeleting ? '…' : '×'}
                  </button>
                </div>
              );
            })}
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
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  headerLeft: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  clearAllBtn: {
    padding: '0.55rem 1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 77, 109, 0.35)',
    background: 'rgba(255, 77, 109, 0.12)',
    color: '#ff8fa3',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    flexShrink: 0,
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
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid rgba(255, 77, 109, 0.35)',
    background: 'rgba(255, 77, 109, 0.12)',
    color: '#ff8fa3',
    fontSize: '1.2rem',
    fontWeight: 700,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
};
