import React, { useEffect, useState } from 'react';
import { SERVER_URL } from '../config';

const SecuritySosScreen = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/sos-alerts`)
      .then(res => res.json())
      .then(data => setAlerts(data.alerts))
      .catch(err => console.error('Error fetching sos:', err));
  }, []);

  const handlePress = (item) => {
    alert(`User: ${item.username}\nTime: ${new Date(item.timestamp * 1000).toLocaleString()}\nLocation: ${item.location}`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>SOS Alerts</h2>
      {alerts.length === 0 ? (
        <p style={styles.empty}>No SOS alerts yet.</p>
      ) : (
        alerts.map((item, idx) => (
          <div key={idx} style={styles.card} onClick={() => handlePress(item)}>
            <p style={styles.userName}>User: {item.username}</p>
            <p style={styles.time}>Time: {new Date(item.timestamp * 1000).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

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
  title: {
    fontSize: '24px',
    color: '#E91E63',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: '10px',
    padding: '10px',
    marginBottom: '10px',
    cursor: 'pointer'
  },
  userName: {
    fontWeight: 'bold'
  },
  time: {
    color: '#999',
    marginTop: '4px'
  },
  empty: {
    color: '#888',
    marginTop: '20px',
    textAlign: 'center'
  }
};

export default SecuritySosScreen;
