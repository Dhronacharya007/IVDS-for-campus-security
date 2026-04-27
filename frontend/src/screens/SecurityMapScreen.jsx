import React, { useEffect, useState } from 'react';
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

export default function SecurityMapScreen() {
  const navigate = useNavigate();
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      setSosAlerts(mockSosAlerts);
      setLoading(false);
      return;
    }

    fetch(`${SERVER_URL}/sos-alerts`, {
      mode: 'cors',
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server responded with status ${res.status}: ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
        setSosAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Could not fetch or parse /sos-alerts:", err);
        alert('❌ Failed to fetch SOS alerts. Check console for more info.');
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
          <div>
            <p style={styles.eyebrow}>Live Emergency Map</p>
            <h1 style={styles.title}>SOS Alert Map</h1>
            <p style={styles.subtitle}>
              Geographic distribution of active SOS calls across the campus.
            </p>
          </div>
          <div style={styles.statBadge}>
            <span style={styles.statBadgeDot} />
            <span style={styles.statBadgeText}>
              {loading ? 'Loading...' : `${sosAlerts.length} active ${sosAlerts.length === 1 ? 'alert' : 'alerts'}`}
            </span>
          </div>
        </div>

        <div style={styles.mapCard}>
          {loading ? (
            <div style={styles.loadingBox}>
              <div className="spinner" />
              <p style={styles.loadingText}>Loading map...</p>
            </div>
          ) : (
            <div style={styles.mapBox}>
              <MapContainer
                center={[11.0692, 77.0042]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                />
                {sosAlerts.map((alert, idx) => (
                  <Marker
                    key={idx}
                    position={[
                      alert.location.latitude,
                      alert.location.longitude,
                    ]}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Inter, sans-serif' }}>
                        <strong style={{ color: '#ff4d6d' }}>SOS Alert</strong>
                        <br />
                        <strong>{alert.username}</strong>
                        <br />
                        {new Date(alert.timestamp * 1000).toLocaleString()}
                        <br />
                        <span style={{ color: '#666' }}>
                          {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {!loading && sosAlerts.length > 0 && (
          <div style={styles.alertsList}>
            <h3 style={styles.listTitle}>Active alerts</h3>
            {sosAlerts.map((alert, idx) => (
              <div key={idx} style={styles.alertRow}>
                <div style={styles.alertIcon}>!</div>
                <div style={styles.alertInfo}>
                  <h4 style={styles.alertName}>{alert.username}</h4>
                  <p style={styles.alertMeta}>
                    <span>{new Date(alert.timestamp * 1000).toLocaleString()}</span>
                    <span style={styles.dotSep}>•</span>
                    <span>
                      {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                    </span>
                  </p>
                </div>
                <span style={styles.alertBadge}>SOS</span>
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
    background: 'linear-gradient(135deg, #ff4d6d, #ff8a3c)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '1.25rem',
    flexShrink: 0,
    boxShadow: '0 0 24px rgba(255, 77, 109, 0.4)',
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
};
