// screens/TestModelScreen.jsx
import React, { useState } from 'react';
import { SERVER_URL } from '../config';

export default function TestModelScreen() {
  const [videoFile, setVideoFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!videoFile) return alert("Please select a video");

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/test-model`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResult(data.result || 'No category detected');
    } catch (err) {
      alert('❌ Error testing video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🧪 Test Video for Category</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} style={styles.fileInput} />
      <button style={styles.button} onClick={handleUpload} disabled={loading}>
        {loading ? 'Analyzing...' : 'Upload & Test'}
      </button>
      {result && (
        <div style={styles.resultBox}>
          <strong>Result:</strong> {result}
        </div>
      )}
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
    fontSize: '1.6rem',
    color: '#4CAF50',
    marginBottom: '1rem',
  },
  fileInput: {
    marginBottom: '1rem',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
  },
  resultBox: {
    marginTop: '1.5rem',
    backgroundColor: '#1e1e1e',
    padding: '1rem',
    borderRadius: '8px',
  }
};
