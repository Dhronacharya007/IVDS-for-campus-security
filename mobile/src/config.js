import Constants from 'expo-constants';

// ============================================================
//   ZERO-CONFIG BACKEND URL
//
//   When you run `npm start` on your PC, Expo already knows
//   your PC's LAN IP (it has to, to send the bundle to your
//   phone). We pull it from Expo's dev manifest automatically
//   and point the backend at <PC_IP>:BACKEND_PORT.
//
//   No editing required for development.
//
//   ▸ The only thing you may need to change is BACKEND_PORT
//     below if your backend runs on a different port.
//
//   ▸ FALLBACK_IP is only used when the app is built as a
//     standalone APK (no dev server). Replace it with your
//     PC's LAN IP if you build an APK and want it to talk
//     to your local backend.
// ============================================================

const BACKEND_PORT = 8080;
const FALLBACK_IP = '192.168.1.5';

function detectDevHost() {
  // Expo SDK 49+
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    // Older expo
    Constants.manifest?.debuggerHost ||
    Constants.manifest?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (!hostUri) return null;
  // hostUri looks like "192.168.1.5:8081" — strip the port
  return hostUri.split(':')[0];
}

const detectedHost = detectDevHost();
const host = detectedHost || FALLBACK_IP;

export const SERVER_URL = `http://${host}:${BACKEND_PORT}`;

// Log it so you can verify in the Expo dev console
if (__DEV__) {
  console.log('[Sentinel] backend URL:', SERVER_URL, detectedHost ? '(auto)' : '(fallback)');
}
