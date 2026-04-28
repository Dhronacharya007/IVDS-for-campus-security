import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SERVER_URL } from '../config';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ENABLED_KEY = 'voiceSOS:enabled';
const USERNAME_KEY = 'voiceSOS:username';

// What the user has to say. Keep these short and unambiguous.
export const VOICE_SOS_PHRASES = ['help me', 'save me', 'emergency'];

// Don't fire the SOS more than once per cooldown window — protects against
// the recognizer matching the same buffered transcript repeatedly and
// against a panicked user shouting the phrase several times in a row.
const COOLDOWN_MS = 30 * 1000;

const VoiceSOSContext = createContext(null);

export function VoiceSOSProvider({ children }) {
  const [enabled, setEnabled] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(ENABLED_KEY) === 'true'
  );
  const [username, setUsername] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem(USERNAME_KEY) || ''
  );
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [lastTriggeredAt, setLastTriggeredAt] = useState(null);
  const [lastPhrase, setLastPhrase] = useState(null);
  const [lastErrorMessage, setLastErrorMessage] = useState(null);

  const cooldownRef = useRef(0);
  // Latest geolocation fix from our background watcher. Reading this when SOS
  // fires is instant — vastly more reliable than waiting on a one-shot
  // getCurrentPosition() call inside the trigger handler.
  const lastKnownLocationRef = useRef(null);

  const enableVoiceSOS = useCallback(({ username: u } = {}) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENABLED_KEY, 'true');
      if (u) localStorage.setItem(USERNAME_KEY, u);
    }
    if (u) setUsername(u);
    setEnabled(true);
    setStatus('idle');
    setLastErrorMessage(null);
  }, []);

  const disableVoiceSOS = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ENABLED_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
    setEnabled(false);
    setUsername('');
    setStatus('idle');
    lastKnownLocationRef.current = null;
  }, []);

  // While voice SOS is enabled, keep a watchPosition running so we always
  // have a recent fix ready the instant "help me" is heard. Cleaned up when
  // disabled so we're not holding the OS location subsystem unnecessarily.
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return undefined;

    let cancelled = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        lastKnownLocationRef.current = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: Date.now(),
        };
      },
      (err) => {
        // Don't surface this; the indicator already covers permission issues
        // via the speech-recognition error path. Stale fixes are still usable.
        console.warn('[VoiceSOS] geolocation watch error:', err?.message || err);
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 30_000 }
    );

    return () => {
      cancelled = true;
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);

  // One-shot fallback used only when the watcher hasn't produced a fix yet
  // (e.g. user said "help me" within the first second after login).
  const fetchLocationOnce = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false }
      );
    });
  }, []);

  const triggerSOS = useCallback(
    async (phrase, fullTranscript) => {
      const now = Date.now();
      if (now - cooldownRef.current < COOLDOWN_MS) return;
      cooldownRef.current = now;

      setLastPhrase(phrase);
      setLastTriggeredAt(now);
      setStatus('sending');

      const isDemo =
        typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';

      // Prefer the last fix from our background watcher.
      let location = null;
      const cached = lastKnownLocationRef.current;
      if (cached) {
        location = { latitude: cached.latitude, longitude: cached.longitude };
      } else {
        location = await fetchLocationOnce();
      }

      if (isDemo) {
        console.log('[VoiceSOS] demo mode — phrase matched:', phrase, location);
        setStatus('sent');
        return;
      }

      try {
        const res = await fetch(`${SERVER_URL}/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username || 'unknown',
            location,
            source: 'voice',
            phrase,
            transcript: fullTranscript,
          }),
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        setStatus('sent');
      } catch (err) {
        console.error('[VoiceSOS] failed to send SOS:', err);
        setLastErrorMessage(err?.message || 'Could not reach the server');
        setStatus('error');
      }
    },
    [fetchLocationOnce, username]
  );

  const { listening, error: recognitionError, transcript, supported } =
    useSpeechRecognition({
      enabled,
      phrases: VOICE_SOS_PHRASES,
      onPhrase: triggerSOS,
    });

  // If the recognizer reports a permission error, persist that as the user-
  // visible error (and, in the case of "not-allowed", flip enabled off so we
  // don't keep retrying without microphone access).
  useEffect(() => {
    if (!recognitionError) return;
    setLastErrorMessage(recognitionError);
    if (recognitionError.toLowerCase().includes('denied')) {
      setEnabled(false);
      if (typeof window !== 'undefined') localStorage.removeItem(ENABLED_KEY);
    }
  }, [recognitionError]);

  // Auto-clear the "sent" / "error" status after a moment so the chip returns
  // to the calm "listening" state.
  useEffect(() => {
    if (status !== 'sent' && status !== 'error') return;
    const t = setTimeout(() => setStatus('idle'), 6000);
    return () => clearTimeout(t);
  }, [status]);

  const value = useMemo(
    () => ({
      enabled,
      listening,
      supported,
      transcript,
      username,
      status,
      lastPhrase,
      lastTriggeredAt,
      lastErrorMessage,
      enableVoiceSOS,
      disableVoiceSOS,
      phrases: VOICE_SOS_PHRASES,
    }),
    [
      enabled,
      listening,
      supported,
      transcript,
      username,
      status,
      lastPhrase,
      lastTriggeredAt,
      lastErrorMessage,
      enableVoiceSOS,
      disableVoiceSOS,
    ]
  );

  return <VoiceSOSContext.Provider value={value}>{children}</VoiceSOSContext.Provider>;
}

export function useVoiceSOS() {
  const ctx = useContext(VoiceSOSContext);
  if (!ctx) {
    throw new Error('useVoiceSOS must be used inside <VoiceSOSProvider>');
  }
  return ctx;
}
