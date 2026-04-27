import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { mockClips } from '../mockData';

const SERVER_URL = 'http://127.0.0.1:8080';

const classificationColor = (cls) => {
  const c = (cls || '').toLowerCase();
  if (c.includes('fight') || c.includes('violence')) return { bg: 'rgba(255, 77, 109, 0.15)', border: 'rgba(255, 77, 109, 0.4)', text: '#ff4d6d' };
  if (c.includes('crowd')) return { bg: 'rgba(255, 182, 39, 0.15)', border: 'rgba(255, 182, 39, 0.4)', text: '#ffb627' };
  if (c.includes('suspicious')) return { bg: 'rgba(124, 92, 255, 0.15)', border: 'rgba(124, 92, 255, 0.4)', text: '#7c5cff' };
  return { bg: 'rgba(0, 212, 255, 0.15)', border: 'rgba(0, 212, 255, 0.4)', text: '#00d4ff' };
};

const SecurityVideosScreen = () => {
  const navigate = useNavigate();
  const [clips, setClips] = useState([]);
  const [selectedClipUri, setSelectedClipUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setClips(mockClips);
      setLoading(false);
      return;
    }

    fetch(`${SERVER_URL}/clips`, { mode: 'cors' })
      .then(async (res) => {
        if (!res.ok) {
          const textErr = await res.text();
          throw new Error(`Server error: ${res.status} - ${textErr}`);
        }
        return res.json();
      })
      .then(json => {
        console.log("✅ Clips from backend:", json);
        setClips(json.clips || []);
        setLoading(false);
      })
      .catch(err => {
        alert('❌ Failed to fetch video clips. Check console for more info.');
        console.error("❌ Could not fetch or parse /clips:", err);
        setLoading(false);
      });
  }, []);

  if (selectedClipUri) {
    return (
      <div style={styles.videoContainer}>
        <VideoPlayer clipUri={selectedClipUri} onBack={() => setSelectedClipUri(null)} />
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>AI Surveillance</p>
          <h1 style={styles.title}>Detected Clips</h1>
          <p style={styles.subtitle}>
            Footage automatically flagged by the AI threat-detection model.
          </p>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <div className="spinner" />
            <p style={styles.loadingText}>Loading detected clips...</p>
          </div>
        ) : clips.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>▶</div>
            <h3 style={styles.emptyTitle}>No clips detected</h3>
            <p style={styles.emptyText}>The AI hasn't flagged any incidents yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {clips.map((item, idx) => {
              const color = classificationColor(item.classification);
              return (
                <button
                  key={idx}
                  style={styles.card}
                  onClick={() => setSelectedClipUri(`${SERVER_URL}/clips/${item.filename}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={styles.thumb}>
                    <div style={styles.playIcon}>▶</div>
                    <span style={{ ...styles.tag, background: color.bg, borderColor: color.border, color: color.text }}>
                      {item.classification}
                    </span>
                  </div>
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardTitle}>{item.filename}</h3>
                    <p style={styles.cardMeta}>
                      <span style={styles.metaIcon}>◷</span>
                      {new Date(item.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  videoContainer: {
    background: '#0a0e1a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  topBar: {
    width: '100%',
    maxWidth: 1100,
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
    maxWidth: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    textAlign: 'left',
  },
  eyebrow: {
    fontSize: '0.85rem',
    color: '#00d4ff',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: 0,
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    overflow: 'hidden',
    cursor: 'pointer',
    color: '#f5f7fb',
    textAlign: 'left',
    transition: 'all 0.25s ease',
  },
  thumb: {
    position: 'relative',
    aspectRatio: '16 / 9',
    background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(0, 212, 255, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.4rem',
    paddingLeft: 4,
  },
  tag: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '0.3rem 0.7rem',
    borderRadius: 999,
    border: '1px solid',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    backdropFilter: 'blur(8px)',
  },
  cardBody: {
    padding: '1rem 1.1rem 1.1rem',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f5f7fb',
    marginBottom: '0.4rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: '#a8b3cf',
  },
  metaIcon: {
    color: '#6b7691',
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
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 900,
    margin: '0 auto 1rem',
    paddingLeft: 4,
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
};

export default SecurityVideosScreen;
