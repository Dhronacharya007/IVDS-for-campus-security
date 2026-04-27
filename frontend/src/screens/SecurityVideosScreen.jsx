import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { mockClips } from '../mockData';
import {
  downloadAndCache,
  getCachedObjectUrl,
  listCachedFilenames,
} from '../utils/clipCache';

const SERVER_URL = 'http://127.0.0.1:8080';

const classificationColor = (cls) => {
  const c = (cls || '').toLowerCase();
  if (c.includes('fight') || c.includes('violence')) return { bg: 'rgba(255, 77, 109, 0.15)', border: 'rgba(255, 77, 109, 0.4)', text: '#ff4d6d' };
  if (c.includes('fire')) return { bg: 'rgba(255, 138, 60, 0.18)', border: 'rgba(255, 138, 60, 0.45)', text: '#ff8a3c' };
  if (c.includes('burglary')) return { bg: 'rgba(124, 92, 255, 0.18)', border: 'rgba(124, 92, 255, 0.45)', text: '#a78bfa' };
  if (c.includes('vandal')) return { bg: 'rgba(255, 182, 39, 0.18)', border: 'rgba(255, 182, 39, 0.4)', text: '#ffb627' };
  if (c.includes('abuse')) return { bg: 'rgba(255, 77, 109, 0.18)', border: 'rgba(255, 77, 109, 0.4)', text: '#ff8fa3' };
  if (c.includes('crowd')) return { bg: 'rgba(255, 182, 39, 0.15)', border: 'rgba(255, 182, 39, 0.4)', text: '#ffb627' };
  if (c.includes('suspicious')) return { bg: 'rgba(124, 92, 255, 0.15)', border: 'rgba(124, 92, 255, 0.4)', text: '#7c5cff' };
  return { bg: 'rgba(0, 212, 255, 0.15)', border: 'rgba(0, 212, 255, 0.4)', text: '#00d4ff' };
};

const SecurityVideosScreen = () => {
  const navigate = useNavigate();
  const [clips, setClips] = useState([]);
  const [selected, setSelected] = useState(null); // { uri, isBlob }
  const [loading, setLoading] = useState(true);
  // filename -> 'cached' | 'downloading' | 'error'
  const [downloadStatus, setDownloadStatus] = useState({});
  const isDemoRef = useRef(false);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    isDemoRef.current = isDemoMode;
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
      .then((json) => {
        const list = json.clips || [];
        setClips(list);
        setLoading(false);
        primeCache(list);
      })
      .catch((err) => {
        alert('❌ Failed to fetch video clips. Check console for more info.');
        console.error('❌ Could not fetch or parse /clips:', err);
        setLoading(false);
      });
  }, []);

  // Pre-download every listed clip into IndexedDB so playback is local + offline.
  async function primeCache(list) {
    try {
      const cachedKeys = await listCachedFilenames();
      const cachedSet = new Set(cachedKeys);

      const initial = {};
      for (const c of list) {
        if (cachedSet.has(c.filename)) initial[c.filename] = 'cached';
      }
      setDownloadStatus((prev) => ({ ...prev, ...initial }));

      for (const c of list) {
        if (cachedSet.has(c.filename)) continue;
        setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'downloading' }));
        try {
          await downloadAndCache(c.filename, `${SERVER_URL}/clips/${c.filename}`);
          setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'cached' }));
        } catch (err) {
          console.warn(`Failed to cache ${c.filename}:`, err);
          setDownloadStatus((prev) => ({ ...prev, [c.filename]: 'error' }));
        }
      }
    } catch (err) {
      console.warn('Clip cache unavailable:', err);
    }
  }

  async function handleSelect(item) {
    if (isDemoRef.current) {
      // Demo clips are not real files; just pretend.
      setSelected({ uri: `${SERVER_URL}/clips/${item.filename}`, isBlob: false });
      return;
    }

    // Try local cache first.
    try {
      const blobUrl = await getCachedObjectUrl(item.filename);
      if (blobUrl) {
        setSelected({ uri: blobUrl, isBlob: true });
        return;
      }
    } catch (err) {
      console.warn('Cache read failed, falling back to network:', err);
    }

    // Network fallback while caching kicks in.
    try {
      setDownloadStatus((prev) => ({ ...prev, [item.filename]: 'downloading' }));
      await downloadAndCache(item.filename, `${SERVER_URL}/clips/${item.filename}`);
      const blobUrl = await getCachedObjectUrl(item.filename);
      setDownloadStatus((prev) => ({ ...prev, [item.filename]: 'cached' }));
      setSelected({ uri: blobUrl || `${SERVER_URL}/clips/${item.filename}`, isBlob: !!blobUrl });
    } catch (err) {
      console.warn('Live download failed, streaming from server:', err);
      setDownloadStatus((prev) => ({ ...prev, [item.filename]: 'error' }));
      setSelected({ uri: `${SERVER_URL}/clips/${item.filename}`, isBlob: false });
    }
  }

  function handleBack() {
    if (selected?.isBlob && selected.uri) {
      URL.revokeObjectURL(selected.uri);
    }
    setSelected(null);
  }

  if (selected) {
    return (
      <div style={styles.videoContainer}>
        <VideoPlayer clipUri={selected.uri} onBack={handleBack} />
      </div>
    );
  }

  const cachedCount = Object.values(downloadStatus).filter((s) => s === 'cached').length;

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
          {!loading && clips.length > 0 && !isDemoRef.current && (
            <p style={styles.cacheNote}>
              {cachedCount === clips.length
                ? `✓ All ${clips.length} clips saved to this device`
                : `Saving ${cachedCount}/${clips.length} clips to this device for offline playback...`}
            </p>
          )}
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
              const status = downloadStatus[item.filename];
              return (
                <button
                  key={idx}
                  style={styles.card}
                  onClick={() => handleSelect(item)}
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
                    {status && (
                      <span style={{ ...styles.statusPill, ...statusPillStyle(status) }}>
                        {status === 'cached' && '● Saved'}
                        {status === 'downloading' && '↓ Saving...'}
                        {status === 'error' && '! Online only'}
                      </span>
                    )}
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

const statusPillStyle = (status) => {
  if (status === 'cached') return { color: '#00e0a4', borderColor: 'rgba(0, 224, 164, 0.4)', background: 'rgba(0, 224, 164, 0.12)' };
  if (status === 'downloading') return { color: '#00d4ff', borderColor: 'rgba(0, 212, 255, 0.4)', background: 'rgba(0, 212, 255, 0.12)' };
  return { color: '#ffb627', borderColor: 'rgba(255, 182, 39, 0.4)', background: 'rgba(255, 182, 39, 0.12)' };
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
  cacheNote: {
    marginTop: '0.6rem',
    fontSize: '0.8rem',
    color: '#6b7691',
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
  statusPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '0.25rem 0.6rem',
    borderRadius: 999,
    border: '1px solid',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
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
