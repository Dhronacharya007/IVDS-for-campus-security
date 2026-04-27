import React from 'react';

export default function VideoPlayer({ clipUri, onBack }) {
  return (
    <div style={styles.container}>
      <video controls style={styles.video}>
        <source src={clipUri} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <button onClick={onBack} style={styles.button}>Back</button>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#000',
    textAlign: 'center',
    paddingTop: '40px',
  },
  video: {
    width: '90%',
    height: 'auto',
    marginBottom: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};