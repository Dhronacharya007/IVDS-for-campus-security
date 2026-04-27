import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function OverdueDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/overdue-visitors`)
      .then(res => {
        // ✅ Safely get array from either direct array or object with .visitors
        const data = res.data;
        const visitorArray = Array.isArray(data) ? data : (data.visitors || []);
        setVisitors(visitorArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching overdue visitors', err);
        setVisitors([]); // fallback to empty array on error
        setLoading(false);
      });
  }, []);

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
      fontSize: 22,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginBottom: 20,
      textAlign: 'center',
    },
    card: {
      backgroundColor: '#1e1e1e',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
    },
    empty: {
      textAlign: 'center',
      color: '#aaa',
      marginTop: 20,
    },
    loading: {
      textAlign: 'center',
      color: '#aaa',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🚨 Overdue Visitors</h2>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : visitors.length === 0 ? (
        <p style={styles.empty}>✅ No overdue visitors found.</p>
      ) : (
        visitors.map((v, i) => (
          <div key={i} style={styles.card}>
            <p>👤 Name: {v.name}</p>
            <p>📞 Phone: {v.phone}</p>
            <p>🕒 Out Time: {v.out_time}</p>
          </div>
        ))
      )}
    </div>
  );
}
