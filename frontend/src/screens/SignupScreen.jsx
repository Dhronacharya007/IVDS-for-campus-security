import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

function SignupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (password !== confirmPass) {
      alert('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'user' }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Sign-up successful!');
        navigate('/login');
      } else {
        alert(data.message || 'Sign-up failed');
      }
    } catch (err) {
      alert('Network error during sign-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page-centered">
      <div className="bg-aurora" />

      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
              stroke="url(#logoGrad2)" strokeWidth="2" fill="rgba(124, 92, 255, 0.15)" />
            <defs>
              <linearGradient id="logoGrad2" x1="0" y1="0" x2="24" y2="24">
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
          <h1 style={styles.title}>Create your account</h1>
          <p style={styles.subtitle}>Join the Sentinel campus security system</p>
        </div>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Re-enter your password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <span>→</span>}
          </button>
        </div>

        <p style={styles.footer}>
          Already have an account?{' '}
          <span style={styles.link} onClick={() => navigate('/login')}>
            Sign in
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

export default SignupScreen;
