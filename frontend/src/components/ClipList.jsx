import React from 'react';

export default function ClipList({ clips, onSelect }) {
  return (
    <div style={styles.list}>
      {clips.length === 0 ? (
        <p style={styles.empty}>No clips available</p>
      ) : (
        clips.map((clip, index) => (
          <div key={index} style={styles.item} onClick={() => onSelect(clip)}>
            <p style={styles.text}>{clip}</p>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  list: {
    width: '100%',
    padding: '10px',
  },
  item: {
    padding: '12px',
    borderBottom: '1px solid #ccc',
    cursor: 'pointer',
  },
  text: {
    fontSize: '18px',
    margin: 0,
  },
  empty: {
    padding: '10px',
    fontStyle: 'italic',
    color: '#555',
  },
};
