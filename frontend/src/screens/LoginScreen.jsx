import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';
import { setDemoMode } from '../mockData';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (username === 'demo' && password === 'demo') {
      setDemoMode(true);
      navigate('/user-home', { state: { username: 'Demo User' } });
      return;
    }
    if (username === 'security' && password === 'demo') {
      setDemoMode(true);
      navigate('/security-home');
      return;
    }
    setDemoMode(false);
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        if (data.role === 'user') {
          navigate('/user-home', { state: { username } });
        } else if (data.role === 'security') {
          navigate('/security-home');
        }
      } else {
        alert(data.error || 'Invalid username or password');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSignIn();
  };

  return (
    <div className="app-page-centered">
      <div className="bg-aurora" />
      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
              stroke="url(#logoGrad)" strokeWidth="2" fill="rgba(124, 92, 255, 0.15)" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span style={styles.brandText}>Sentinel</span>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to access campus security tools</p>
        </div>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <span style={styles.buttonArrow}>→</span>}
          </button>
        </div>

        {/* <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>Demo access</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.demoChips}>
          <button
            style={styles.demoChip}
            onClick={() => { setUsername('demo'); setPassword('demo'); }}
          >
            <span style={styles.demoChipIcon}>U</span>
            <div style={styles.demoChipText}>
              <span style={styles.demoChipTitle}>User</span>
              <span style={styles.demoChipSub}>demo / demo</span>
            </div>
          </button>
          <button
            style={styles.demoChip}
            onClick={() => { setUsername('security'); setPassword('demo'); }}
          >
            <span style={{ ...styles.demoChipIcon, background: 'linear-gradient(135deg, #00e0a4, #00d4ff)' }}>S</span>
            <div style={styles.demoChipText}>
              <span style={styles.demoChipTitle}>Security</span>
              <span style={styles.demoChipSub}>security / demo</span>
            </div>
          </button>
        </div> */}

        <p style={styles.footer}>
          Don't have an account?{' '}
          <span style={styles.link} onClick={() => navigate('/signup')}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '2rem',
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(124, 92, 255, 0.12)',
    border: '1px solid rgba(124, 92, 255, 0.3)',
    boxShadow: '0 0 24px rgba(124, 92, 255, 0.3)',
  },
  brandText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #fff 0%, #a8b3cf 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: '2.5rem',
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
  },
  cardHeader: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.85rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#a8b3cf',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '0.9rem 1rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#f5f7fb',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.95rem 1.25rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #7c5cff 0%, #00d4ff 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 8px 24px rgba(124, 92, 255, 0.4)',
    transition: 'all 0.2s ease',
  },
  buttonArrow: {
    transition: 'transform 0.2s',
    fontSize: '1.1rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.75rem 0 1rem',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: '#6b7691',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  demoChips: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.6rem',
  },
  demoChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.65rem 0.85rem',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#f5f7fb',
    textAlign: 'left',
  },
  demoChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #7c5cff, #00d4ff)',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#fff',
    flexShrink: 0,
  },
  demoChipText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  demoChipTitle: {
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  demoChipSub: {
    fontSize: '0.7rem',
    color: '#6b7691',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#a8b3cf',
    fontSize: '0.9rem',
  },
  link: {
    color: '#00d4ff',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
