import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../config';

export default function GeneratePassScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    in_time: '',
    out_time: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generatePass = async () => {
    if (!form.name || !form.phone || !form.in_time || !form.out_time) {
      return alert('Please fill all fields.');
    }

    const isDemoMode = localStorage.getItem('demoMode') === 'true';
    if (isDemoMode) {
      alert('✅ Visitor pass generated! (Demo Mode)');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${SERVER_URL}/generate-pass`, form);
      alert('✅ Visitor pass generated!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to generate pass');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <div className="bg-aurora" />

      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Visitor Management</p>
          <h1 style={styles.title}>Generate Visitor Pass</h1>
          <p style={styles.subtitle}>Issue a digital pass for an upcoming visitor.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Visitor name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Check-in time</label>
              <input
                name="in_time"
                value={form.in_time}
                onChange={handleChange}
                placeholder="2026-04-27 14:30"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Check-out time</label>
              <input
                name="out_time"
                value={form.out_time}
                onChange={handleChange}
                placeholder="2026-04-27 16:00"
                style={styles.input}
              />
            </div>
          </div>

          <button
            onClick={generatePass}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Pass'}
            {!loading && <span>→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    width: '100%',
    maxWidth: 720,
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
    maxWidth: 720,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  header: {
    textAlign: 'left',
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
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#f5f7fb',
    marginBottom: '0.4rem',
    background: 'linear-gradient(135deg, #f5f7fb 0%, #a8b3cf 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#a8b3cf',
    fontSize: '0.95rem',
  },
  card: {
    padding: '2rem',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
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
};
