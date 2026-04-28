import React from 'react';
import { useVoiceSOS } from '../contexts/VoiceSOSContext';

export default function VoiceSOSIndicator() {
  const { enabled, listening, status, lastPhrase, supported, lastErrorMessage } =
    useVoiceSOS();

  if (!enabled) return null;

  // Pick a visual state for the chip.
  let state;
  if (!supported) {
    state = {
      label: 'VOICE SOS UNAVAILABLE',
      hint: 'Use Chrome, Edge, or Safari.',
      color: '#ffb627',
      glow: 'rgba(255, 182, 39, 0.4)',
    };
  } else if (status === 'sending') {
    state = {
      label: 'SENDING SOS…',
      hint: lastPhrase ? `Heard "${lastPhrase}"` : 'Triggering alert',
      color: '#ff8a3c',
      glow: 'rgba(255, 138, 60, 0.55)',
    };
  } else if (status === 'sent') {
    state = {
      label: 'SOS SENT',
      hint: 'Security has been notified.',
      color: '#00e0a4',
      glow: 'rgba(0, 224, 164, 0.55)',
    };
  } else if (status === 'error') {
    state = {
      label: 'SOS FAILED',
      hint: lastErrorMessage || 'Could not reach the server.',
      color: '#ff4d6d',
      glow: 'rgba(255, 77, 109, 0.55)',
    };
  } else if (lastErrorMessage) {
    const offline = /internet|reach|network/i.test(lastErrorMessage);
    state = {
      label: offline ? 'VOICE SOS — NO CONNECTION' : 'VOICE SOS WARNING',
      hint: lastErrorMessage,
      color: '#ffb627',
      glow: 'rgba(255, 182, 39, 0.45)',
    };
  } else if (listening) {
    state = {
      label: 'VOICE SOS ACTIVE',
      hint: 'Say "help me" to alert security.',
      color: '#00d4ff',
      glow: 'rgba(0, 212, 255, 0.45)',
    };
  } else {
    state = {
      label: 'VOICE SOS READY',
      hint: 'Listening will resume shortly…',
      color: '#7c5cff',
      glow: 'rgba(124, 92, 255, 0.45)',
    };
  }

  return (
    <div style={styles.wrap} aria-live="polite">
      <div
        style={{
          ...styles.chip,
          borderColor: state.color,
          boxShadow: `0 12px 32px ${state.glow}`,
        }}
      >
        <span
          style={{
            ...styles.dot,
            background: state.color,
            boxShadow: `0 0 12px ${state.color}`,
            animation: listening && status === 'idle' ? 'pulse 1.6s ease-in-out infinite' : 'none',
          }}
        />
        <div style={styles.text}>
          <span style={{ ...styles.label, color: state.color }}>{state.label}</span>
          <span style={styles.hint}>{state.hint}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    right: 'max(1.25rem, env(safe-area-inset-right))',
    bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  chip: {
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.7rem 0.95rem 0.7rem 0.85rem',
    borderRadius: 14,
    border: '1px solid',
    background: 'rgba(10, 14, 26, 0.78)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    color: '#f5f7fb',
    minWidth: 220,
    maxWidth: 320,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#a8b3cf',
    marginTop: 2,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
};
