import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SecurityHomeScreen() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      navigate('/login');
    }
  };

  const tools = [
    {
      title: 'Test Model',
      description: 'Run video clips through the AI threat-detection model',
      icon: 'M',
      path: '/test-model',
      gradient: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    },
    {
      title: 'Detected Clips',
      description: 'Review flagged surveillance footage and incidents',
      icon: '▶',
      path: '/clips',
      gradient: 'linear-gradient(135deg, #00d4ff, #00e0a4)',
    },
    {
      title: 'SOS Map',
      description: 'Live map of active emergency alerts on campus',
      icon: '◉',
      path: '/sos-map',
      gradient: 'linear-gradient(135deg, #ff4d6d, #ff8a3c)',
    },
    {
      title: 'Generate Pass',
      description: 'Create a digital visitor pass with QR code',
      icon: '✚',
      path: '/generate-pass',
      gradient: 'linear-gradient(135deg, #ffb627, #ff8a3c)',
    },
    {
      title: 'Scan In',
      description: 'Check visitors into campus by scanning QR codes',
      icon: '↓',
      path: '/scan-in',
      gradient: 'linear-gradient(135deg, #00e0a4, #00d4ff)',
    },
    {
      title: 'Scan Out',
      description: 'Check visitors out and close their entry record',
      icon: '↑',
      path: '/scan-out',
      gradient: 'linear-gradient(135deg, #7c5cff, #ff4d6d)',
    },
    {
      title: 'Overdue Visitors',
      description: 'Visitors who have not yet signed out by their out-time',
      icon: '⏱',
      path: '/overdue-dashboard',
      gradient: 'linear-gradient(135deg, #ff8a3c, #ff4d6d)',
    },
  ];

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
                stroke="url(#secBrandGrad)" strokeWidth="2" fill="rgba(124, 92, 255, 0.15)" />
              <defs>
                <linearGradient id="secBrandGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#7c5cff" />
                  <stop offset="100%" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={styles.brandText}>Sentinel</span>
          <span style={styles.brandTag}>Security Console</span>
        </div>
        <button style={styles.signOutBtn} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.heroSection}>
          <div style={styles.heroLeft}>
            <p style={styles.eyebrow}>Security Dashboard</p>
            <h1 style={styles.title}>Hello, Security Officer</h1>
            <p style={styles.subtitle}>
              Monitor incidents, manage visitor flow, and respond to alerts in real time.
            </p>
          </div>
          <div style={styles.heroRight}>
            <div style={styles.miniCard}>
              <span style={styles.miniLabel}>USER</span>
              <span style={styles.miniValue}>SecurityUser</span>
            </div>
            <div style={styles.miniCard}>
              <span style={styles.miniLabel}>ROLE</span>
              <span style={{ ...styles.miniValue, color: '#00d4ff' }}>Officer</span>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {tools.map((tool) => (
            <button
              key={tool.title}
              style={styles.toolCard}
              onClick={() => handleNavigation(tool.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{ ...styles.toolIcon, background: tool.gradient }}>
                {tool.icon}
              </div>
              <div style={styles.toolText}>
                <h3 style={styles.toolTitle}>{tool.title}</h3>
                <p style={styles.toolDescription}>{tool.description}</p>
              </div>
              <span style={styles.toolArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 1200,
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
  brandTag: {
    marginLeft: '0.5rem',
    padding: '0.25rem 0.65rem',
    borderRadius: 999,
    background: 'rgba(124, 92, 255, 0.12)',
    border: '1px solid rgba(124, 92, 255, 0.3)',
    color: '#a8b3cf',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  signOutBtn: {
    padding: '0.6rem 1.1rem',
    borderRadius: 10,
    border: '1px solid rgba(255, 77, 109, 0.3)',
    background: 'rgba(255, 77, 109, 0.1)',
    color: '#ff4d6d',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  content: {
    width: '100%',
    maxWidth: 1200,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  heroSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  heroLeft: {
    flex: 1,
    minWidth: 280,
  },
  eyebrow: {
    fontSize: '0.85rem',
    color: '#7c5cff',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
  },
  title: {
    fontSize: '2.6rem',
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
  heroRight: {
    display: 'flex',
    gap: '0.75rem',
  },
  miniCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    padding: '0.85rem 1.1rem',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    minWidth: 130,
  },
  miniLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#6b7691',
    letterSpacing: '0.08em',
  },
  miniValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#f5f7fb',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '1rem',
  },
  toolCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.25rem',
    borderRadius: 18,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    color: '#f5f7fb',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.25s ease',
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.3rem',
    fontWeight: 700,
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
    flexShrink: 0,
  },
  toolText: {
    flex: 1,
    minWidth: 0,
  },
  toolTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#f5f7fb',
    marginBottom: '0.25rem',
  },
  toolDescription: {
    fontSize: '0.85rem',
    color: '#a8b3cf',
    lineHeight: 1.5,
  },
  toolArrow: {
    color: '#6b7691',
    fontSize: '1.2rem',
    marginTop: '0.25rem',
  },
};
