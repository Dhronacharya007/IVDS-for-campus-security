import React, { useEffect, useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';
// Backend API base URL
const SERVER_URL = 'http://127.0.0.1:8080';

const SecurityVideosScreen = () => {
  const [clips, setClips] = useState([]);
  const [selectedClipUri, setSelectedClipUri] = useState(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/clips`, { mode: 'cors' })
      .then(async (res) => {
        // If the response is not OK, read text for error details (e.g., HTML error page)
        if (!res.ok) {
          const textErr = await res.text();
          throw new Error(`Server error: ${res.status} - ${textErr}`);
        }
        return res.json();
      })
      .then(json => {
        console.log("✅ Clips from backend:", json);
        setClips(json.clips || []);
      })
      .catch(err => {
        alert('❌ Failed to fetch video clips. Check console for more info.');
        console.error("❌ Could not fetch or parse /clips:", err);
      });
  }, []);

  if (selectedClipUri) {
    return (
      <div style={styles.videoContainer}>
        <VideoPlayer clipUri={selectedClipUri} onBack={() => setSelectedClipUri(null)} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎥 Detected Clips</h2>
      {clips.length === 0 ? (
        <p style={styles.empty}>No clips found.</p>
      ) : (
        clips.map((item, idx) => (
          <div
            key={idx}
            style={styles.card}
            onClick={() => setSelectedClipUri(`${SERVER_URL}/clips/${item.filename}`)}
          >
            <p style={styles.clipName}>{item.filename}</p>
            <p style={styles.classification}>Type: {item.classification}</p>
            <p style={styles.time}>📅 {new Date(item.timestamp * 1000).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
};

const styles = {
  videoContainer: {
    backgroundColor: '#000',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
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
    color: '#4CAF50',
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
  clipName: {
    fontWeight: 'bold'
  },
  classification: {
    color: '#4CAF50'
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

export default SecurityVideosScreen;
