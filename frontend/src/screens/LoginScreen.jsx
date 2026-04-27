import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
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
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button style={styles.button} onClick={handleSignIn}>
        Sign In
      </button>
      <p style={{ marginTop: '1rem', color: '#ccc', cursor: 'pointer' }} onClick={() => navigate('/signup')}>Don’t have an account? Signup →</p>
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
    marginBottom: 20,
    color: '#4CAF50',
  },
  input: {
    width: '80%',
    maxWidth: 300,
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    border: '1px solid #4CAF50',
  },
  button: {
    padding: 10,
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
};
