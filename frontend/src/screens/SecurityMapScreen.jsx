import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockSosAlerts } from '../mockData';

const SERVER_URL = 'http://127.0.0.1:8080';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Voice-triggered SOS alerts may not have a location (geolocation denied or
// unavailable). Returns a `[lat, lng]` tuple if both are real numbers, else null.
function getCoords(alert) {
  const loc = alert?.location;
  if (!loc) return null;
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function formatTimestamp(ts) {
  if (!ts) return 'Unknown time';
  const ms = ts > 10_000_000_000 ? ts : ts * 1000; // accept seconds OR ms
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return 'Unknown time';
  return d.toLocaleString();
}

export default function SecurityMapScreen() {
  const navigate = useNavigate();
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demoMode = localStorage.getItem('demoMode') === 'true';
    setIsDemo(demoMode);
    if (demoMode) {
      // Synthesise stable ids for demo data so the delete UI still works locally.
      setSosAlerts(
        mockSosAlerts.map((a, idx) => ({ ...a, id: `demo-${idx}` }))
      );
      setLoading(false);
      return;
    }

    fetch(`${SERVER_URL}/sos-alerts`, { mode: 'cors' })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server responded with status ${res.status}: ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.alerts || [];
        setSosAlerts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Could not fetch or parse /sos-alerts:', err);
        setError(err.message || 'Failed to fetch SOS alerts');
        setLoading(false);
      });
  }, []);

  const handleDelete = async (alert) => {
    if (!alert?.id) return;
    if (!window.confirm(`Dismiss SOS alert from ${alert.username || 'unknown user'}?`)) return;

    if (isDemo) {
      // No backend round-trip in demo mode — just remove locally.
      setSosAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      return;
    }

    setDeletingId(alert.id);
    try {
      const res = await fetch(`${SERVER_URL}/sos-alerts/${alert.id}`, {
        method: 'DELETE',
        mode: 'cors',
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }
      setSosAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
      window.alert(`Failed to dismiss alert: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (sosAlerts.length === 0) return;
    if (!window.confirm(`Dismiss all ${sosAlerts.length} alerts? This cannot be undone.`)) {
      return;
    }

    if (isDemo) {
      setSosAlerts([]);
      return;
    }

    try {
      const res = await fetch(`${SERVER_URL}/sos-alerts`, {
        method: 'DELETE',
        mode: 'cors',
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }
      setSosAlerts([]);
    } catch (err) {
      console.error('Failed to clear alerts:', err);
      window.alert(`Failed to clear alerts: ${err.message || err}`);
    }
  };

  const { mappable, unmappable } = useMemo(() => {
    const mappable = [];
    const unmappable = [];
    for (const a of sosAlerts) {
      const coords = getCoords(a);
      if (coords) mappable.push({ alert: a, coords });
      else unmappable.push(a);
    }
    return { mappable, unmappable };
  }, [sosAlerts]);

  const mapCenter = mappable[0]?.coords || [11.0692, 77.0042];
  const totalCount = sosAlerts.length;

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Live Emergency Map</p>
            <h1 style={styles.title}>SOS Alert Map</h1>
            <p style={styles.subtitle}>
              Geographic distribution of active SOS calls across the campus.
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.statBadge}>
              <span style={styles.statBadgeDot} />
              <span style={styles.statBadgeText}>
                {loading
                  ? 'Loading...'
                  : `${totalCount} active ${totalCount === 1 ? 'alert' : 'alerts'}`}
              </span>
            </div>
            {!loading && totalCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={styles.clearAllBtn}
                title="Dismiss all SOS alerts"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {error && !loading && (
          <div style={styles.errorBanner}>
            <strong>Failed to load alerts.</strong> {error}
          </div>
        )}

        {!loading && unmappable.length > 0 && (
          <div style={styles.warningBanner}>
            {unmappable.length} alert{unmappable.length === 1 ? '' : 's'} without
            location {unmappable.length === 1 ? "doesn't" : "don't"} appear on the map.
            See the list below.
          </div>
        )}

        <div style={styles.mapCard}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div className="spinner" />
              <p style={styles.loadingText}>Loading map...</p>
            </div>
          ) : (
            <div style={styles.mapBox}>
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}-${mappable.length}`}
                center={mapCenter}
                zoom={mappable.length ? 14 : 12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                {mappable.map(({ alert, coords }) => (
                  <Marker key={`m-${alert.id}`} position={coords}>
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif' }}>
                        <strong style={{ color: '#ff4d6d' }}>SOS Alert</strong>
                        <br />
                        <strong>{alert.username || 'Unknown user'}</strong>
                        <br />
                        {formatTimestamp(alert.timestamp)}
                        <br />
                        <span style={{ color: '#666' }}>
                          {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                        </span>
                        {alert.source === 'voice' && (
                          <>
                            <br />
                            <span style={{ color: '#7c5cff', fontSize: 12, fontWeight: 600 }}>
                              🎙 Voice trigger
                              {alert.phrase ? ` · "${alert.phrase}"` : ''}
                            </span>
                          </>
                        )}
                        <br />
                        <button
                          type="button"
                          onClick={() => handleDelete(alert)}
                          disabled={deletingId === alert.id}
                          style={popupStyles.dismissBtn}
                        >
                          {deletingId === alert.id ? 'Dismissing…' : 'Dismiss alert'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {!loading && totalCount > 0 && (
          <div style={styles.alertsList}>
            <h3 style={styles.listTitle}>Active alerts</h3>
            {sosAlerts.map((alert) => {
              const coords = getCoords(alert);
              const isVoice = alert.source === 'voice';
              const isDeleting = deletingId === alert.id;
              return (
                <div key={alert.id} style={styles.alertRow}>
                  <div
                    style={{
                      ...styles.alertIcon,
                      background: isVoice
                        ? 'linear-gradient(135deg, #7c5cff, #00d4ff)'
                        : 'linear-gradient(135deg, #ff4d6d, #ff8a3c)',
                      boxShadow: isVoice
                        ? '0 0 24px rgba(124, 92, 255, 0.4)'
                        : '0 0 24px rgba(255, 77, 109, 0.4)',
                    }}
                  >
                    {isVoice ? '🎙' : '!'}
                  </div>
                  <div style={styles.alertInfo}>
                    <h4 style={styles.alertName}>{alert.username || 'Unknown user'}</h4>
                    <p style={styles.alertMeta}>
                      <span>{formatTimestamp(alert.timestamp)}</span>
                      <span style={styles.dotSep}>•</span>
                      <span>
                        {coords
                          ? `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`
                          : 'Location unavailable'}
                      </span>
                      {isVoice && alert.phrase && (
                        <>
                          <span style={styles.dotSep}>•</span>
                          <span style={{ color: '#a78bfa' }}>“{alert.phrase}”</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.alertBadge,
                      ...(isVoice ? styles.alertBadgeVoice : null),
                    }}
                  >
                    {isVoice ? 'VOICE' : 'SOS'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(alert)}
                    disabled={isDeleting}
                    style={{
                      ...styles.deleteBtn,
                      opacity: isDeleting ? 0.5 : 1,
                      cursor: isDeleting ? 'wait' : 'pointer',
                    }}
                    title="Dismiss this alert"
                    aria-label={`Dismiss alert from ${alert.username || 'unknown user'}`}
                  >
                    {isDeleting ? '…' : '×'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && totalCount === 0 && !error && (
          <div style={styles.emptyBox}>
            <h3 style={styles.emptyTitle}>No SOS alerts</h3>
            <p style={styles.emptyText}>
              You'll see live alerts here as soon as any user triggers an SOS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  clearAllBtn: {
    padding: '0.5rem 0.9rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  statBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.12)',
    border: '1px solid rgba(255, 77, 109, 0.3)',
  },
  statBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#ff4d6d',
    boxShadow: '0 0 8px rgba(255, 77, 109, 0.6)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  statBadgeText: {
    color: '#ff4d6d',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  errorBanner: {
    padding: '0.85rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 77, 109, 0.4)',
    background: 'rgba(255, 77, 109, 0.12)',
    color: '#ff8fa3',
    fontSize: '0.9rem',
  },
  warningBanner: {
    padding: '0.7rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 182, 39, 0.35)',
    background: 'rgba(255, 182, 39, 0.1)',
    color: '#ffd067',
    fontSize: '0.85rem',
  },
  mapCard: {
    padding: '0.75rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  mapBox: {
    height: '60vh',
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.8rem',
    padding: '4rem',
  },
  loadingText: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  listTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f5f7fb',
    marginBottom: '0.25rem',
  },
  alertRow: {
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
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  alertInfo: {
    flex: 1,
    minWidth: 0,
  },
  alertName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f5f7fb',
    marginBottom: '0.2rem',
  },
  alertMeta: {
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
  alertBadge: {
    padding: '0.3rem 0.7rem',
    borderRadius: 999,
    background: 'rgba(255, 77, 109, 0.15)',
    border: '1px solid rgba(255, 77, 109, 0.4)',
    color: '#ff4d6d',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  alertBadgeVoice: {
    background: 'rgba(124, 92, 255, 0.16)',
    borderColor: 'rgba(124, 92, 255, 0.45)',
    color: '#a78bfa',
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
  emptyBox: {
    textAlign: 'center',
    padding: '2.5rem 2rem',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.4rem',
  },
  emptyText: {
    color: '#a8b3cf',
    fontSize: '0.9rem',
  },
};

// Leaflet popups inject their own DOM with light styling, so the dismiss
// button uses a separate, "popup-friendly" stylesheet.
const popupStyles = {
  dismissBtn: {
    marginTop: 10,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #ffb3c1',
    background: '#fff5f7',
    color: '#d6336c',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
