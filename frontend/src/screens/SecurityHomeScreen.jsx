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

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Security Dashboard</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => navigate('/test-model')}>🧪 Test Model</button>
        <button style={styles.button} onClick={() => handleNavigation('/clips')}>🎥 Clips</button>
        <button style={styles.button} onClick={() => handleNavigation('/sos-map')}>🗺️ SOS Map</button>
        <button style={styles.button} onClick={() => handleNavigation('/generate-pass')}>🪪 Generate Pass</button>
        <button style={styles.button} onClick={() => handleNavigation('/scan-in')}>📥 Scan In</button>
        <button style={styles.button} onClick={() => handleNavigation('/scan-out')}>📤 Scan Out</button>
        <button style={styles.button} onClick={() => handleNavigation('/overdue-dashboard')}>⏰ Overdue Dashboard</button>
      </div>

      <div style={styles.profile}>
        <p style={styles.username}>👤 Username: SecurityUser</p>
        <button style={styles.signOutBtn} onClick={handleSignOut}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

const styles = {
    container: {
        backgroundColor: '#000',
        color: '#fff',
        width: '100vw',
        height: '100vh',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      },
  heading: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#4CAF50',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  button: {
    padding: '1rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  profile: {
    marginTop: '2rem',
  },
  username: {
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  signOutBtn: {
    padding: '0.7rem 1.5rem',
    backgroundColor: '#FF5252',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};
