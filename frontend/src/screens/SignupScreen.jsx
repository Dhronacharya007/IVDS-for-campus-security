import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';

function SignupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (password !== confirmPass) {
      alert('Passwords do not match.');
      return;
    }

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
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create Account</h2>
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
      <input
        style={styles.input}
        type="password"
        placeholder="Confirm Password"
        value={confirmPass}
        onChange={(e) => setConfirmPass(e.target.value)}
      />
      <button style={styles.button} onClick={handleSignUp}>
        Sign Up
      </button>
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
  title: {
    color: '#4CAF50',
    fontSize: 28,
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    padding: 12,
    width: '80%',
    borderRadius: 8,
    border: 'none',
    outline: 'none',
    backgroundColor: '#1F1F1F',
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    cursor: 'pointer',
    width: '80%',
  },
};

export default SignupScreen;
