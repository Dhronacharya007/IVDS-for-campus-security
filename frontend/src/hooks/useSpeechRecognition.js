import { useEffect, useRef, useState } from 'react';

/**
 * Continuous speech recognition that auto-restarts and watches for trigger
 * phrases. Powered by the Web Speech API (Chromium / Safari only — Firefox
 * doesn't ship it). Designed for always-on background listening.
 *
 *   const { listening, error, transcript, supported } = useSpeechRecognition({
 *     enabled: true,
 *     phrases: ['help me'],
 *     onPhrase: (matched) => sendSos(),
 *   });
 *
 * The hook re-mounts the underlying recognizer whenever `enabled` flips, so
 * starting and stopping is fully owned by the parent.
 */
export function useSpeechRecognition({
  enabled,
  phrases = [],
  onPhrase,
  lang = 'en-US',
} = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const onPhraseRef = useRef(onPhrase);
  const phrasesRef = useRef(phrases);

  useEffect(() => {
    onPhraseRef.current = onPhrase;
  }, [onPhrase]);

  useEffect(() => {
    phrasesRef.current = phrases;
  }, [phrases]);

  useEffect(() => {
    if (!supported) {
      if (enabled) {
        setError('Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.');
      }
      return undefined;
    }
    if (!enabled) {
      setListening(false);
      return undefined;
    }

    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    let stopped = false;
    let restartTimer = null;
    let lastTranscriptHandled = '';

    // Chrome's webkitSpeechRecognition relays audio to Google's cloud servers,
    // so anything that breaks that link (no internet, captive portal, corporate
    // proxy, certain regions) fires `error: 'network'`. Treat it as transient
    // and back off rather than disabling, but warn the user once it persists.
    let networkErrorCount = 0;
    let restartDelayMs = 300;
    const NETWORK_ERROR_THRESHOLD = 3;
    const MAX_RESTART_DELAY_MS = 10_000;

    const noteRecoveredFromTransientError = () => {
      if (networkErrorCount > 0) {
        networkErrorCount = 0;
        restartDelayMs = 300;
        setError(null);
      }
    };

    const safeStart = () => {
      try {
        recognition.start();
      } catch {
        // start() throws when already started; ignore.
      }
    };

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      // Real audio came back: we're definitely connected to the cloud again.
      noteRecoveredFromTransientError();

      // Build the cumulative transcript across ALL results (interim + final)
      // so we can match phrases as soon as they're spoken.
      let combined = '';
      for (let i = 0; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript;
        combined += ' ';
      }
      combined = combined.toLowerCase().trim();
      setTranscript(combined);

      // Skip work if nothing new since last match.
      if (!combined || combined === lastTranscriptHandled) return;

      const list = phrasesRef.current || [];
      for (const phrase of list) {
        if (!phrase) continue;
        if (combined.includes(phrase.toLowerCase())) {
          lastTranscriptHandled = combined;
          try {
            onPhraseRef.current?.(phrase, combined);
          } catch (err) {
            console.error('[useSpeechRecognition] onPhrase threw:', err);
          }
          // Force a fresh recognition session so the same buffer doesn't
          // keep matching every subsequent partial result.
          try {
            recognition.stop();
          } catch {
            /* ignore */
          }
          break;
        }
      }
    };

    recognition.onerror = (event) => {
      const err = event?.error;

      // Permanent: user denied microphone access. Stop retrying.
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setError('Microphone access was denied. Voice SOS is disabled.');
        stopped = true;
        return;
      }

      // Expected during silence — onend will restart us.
      if (err === 'no-speech' || err === 'aborted') {
        return;
      }

      // Transient cloud failure. Back off and only warn after several misses.
      if (err === 'network') {
        networkErrorCount += 1;
        restartDelayMs = Math.min(MAX_RESTART_DELAY_MS, Math.max(1000, restartDelayMs * 2));
        if (networkErrorCount >= NETWORK_ERROR_THRESHOLD) {
          setError(
            navigator.onLine
              ? "Voice SOS can't reach the speech-recognition service. We'll keep retrying."
              : 'Voice SOS needs an internet connection. Reconnect to resume.'
          );
        }
        return;
      }

      if (err) {
        setError(`Speech recognition error: ${err}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (stopped) return;
      restartTimer = setTimeout(() => {
        if (!stopped) safeStart();
      }, restartDelayMs);
    };

    // If the browser comes back online, drop the slow backoff so we resume
    // promptly.
    const handleOnline = () => {
      if (stopped) return;
      restartDelayMs = 300;
      noteRecoveredFromTransientError();
      try {
        recognition.stop();
      } catch {
        /* will trigger onend → restart */
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    safeStart();

    return () => {
      stopped = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
    };
  }, [enabled, supported, lang]);

  return { listening, error, transcript, supported };
}
