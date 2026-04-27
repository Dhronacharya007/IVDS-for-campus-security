import Constants from 'expo-constants';

// ============================================================
//   BACKEND URL
//
//   The mobile app reaches your PC's backend over your local
//   Wi-Fi. The phone can't use "localhost" (that's the phone
//   itself), so it has to use your PC's LAN IP.
//
//   ┌──────────────────────────────────────────────────────┐
//   │ ⚡  FORCE_IP — set this to the IP that you confirmed  │
//   │    works in your phone's browser (e.g. the URL that  │
//   │    returned JSON when you visited /clips).            │
//   │                                                       │
//   │    Set to '' to fall back to auto-detection from      │
//   │    Expo's dev manifest.                               │
//   └──────────────────────────────────────────────────────┘
// ============================================================

const FORCE_IP = 'x';      // 👈 your PC's LAN IP (overrides auto-detect)
const BACKEND_PORT = 8080;
const FALLBACK_IP = 'x';

function detectDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(':')[0];
}

const detectedHost = detectDevHost();

let host;
let mode;
if (FORCE_IP) {
  host = FORCE_IP;
  mode = 'forced';
} else if (detectedHost) {
  host = detectedHost;
  mode = 'auto';
} else {
  host = FALLBACK_IP;
  mode = 'fallback';
}

export const SERVER_URL = `http://${host}:${BACKEND_PORT}`;

if (__DEV__) {
  console.log('[Sentinel] backend URL:', SERVER_URL, `(${mode})`);
}
