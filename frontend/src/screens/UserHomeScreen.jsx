import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

function UserHomeScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = 'SampleUser';

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        alert('Location access denied.');
        setLoading(false);
      }
    );
  }, []);

  const handleSOS = async () => {
    if (!location) {
      alert('Location not available.');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, location }),
      });

      const data = await response.json();
      if (data.success) {
        alert('🚨 SOS Sent. Security has been notified.');
      } else {
        alert('❌ Failed to send SOS');
      }
    } catch {
      alert('❌ Network Error');
    }
  };

  const goToProfile = () => navigate('/user-profile');

  return (
    <div style={styles.fullscreen}>
      <button onClick={goToProfile} style={styles.profileButton}>👤 Profile</button>
      <div style={styles.centerBox}>
        <h2 style={styles.title}>User Home</h2>
        {loading ? (
          <p>Fetching location...</p>
        ) : (
          <>
            <p>Latitude: {location.latitude}</p>
            <p>Longitude: {location.longitude}</p>
            <button style={styles.button} onClick={handleSOS}>🚨 Send SOS</button>
          </>
        )}
      </div>
    </div>
  );
}
const styles = {
  fullscreen: {
    backgroundColor: '#000',
    color: '#fff',
    width: '100vw',
    height: '100vh',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: '10px 15px',
    fontSize: '16px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid #ccc',
    cursor: 'pointer',
  },
  centerBox: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#121212',
    borderRadius: '15px',
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#4CAF50',
  },
  button: {
    marginTop: '1.5rem',
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#FF5252',
    color: '#fff',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default UserHomeScreen;
