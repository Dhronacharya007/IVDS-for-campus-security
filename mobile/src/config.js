import Constants from 'expo-constants';

// ============================================================
//   BACKEND URL
//
//   The mobile app reaches your PC's backend over your local
//   Wi-Fi. The phone can't use "localhost" (that's the phone
//   itself), so it has to use your PC's LAN IP.
//
//   This file is AUTO-DETECTING by default: it reads your
//   Mac's current Wi-Fi IP from Expo's dev manifest (the same
//   IP that Metro is bound to — visible in `npm start`'s
//   "Metro waiting on exp://<ip>:<port>" line). When DHCP
//   hands your Mac a new IP, the app follows along on the
//   next reload.
//
//   FORCE_IP only needs a value if you're (a) using a
//   production/standalone build, or (b) running on Expo
//   Go via tunnel, where auto-detection can't see the LAN IP.
// ============================================================

// Hard override. Leave empty ('') to auto-detect from Expo's dev manifest.
const FORCE_IP = '';
const BACKEND_PORT = 8080;
// Last-resort fallback used only when both FORCE_IP and auto-detection fail.
const FALLBACK_IP = '192.168.1.17';

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
