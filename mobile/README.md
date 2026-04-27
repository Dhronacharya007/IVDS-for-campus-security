# Sentinel Mobile (React Native)

Mobile companion app for the **IVDS Campus Security** system.

Same backend, same demo mode, same UI design — running natively on your phone via Expo.

---

## Quick Start (≈ 3 minutes — no IP editing required)

### 1. Install Expo Go on your phone

- Android → [Play Store: Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS → [App Store: Expo Go](https://apps.apple.com/app/expo-go/id982107779)

### 2. Bind your backend to `0.0.0.0` (so the phone can reach it)

| Backend | Wrong | Right |
|---|---|---|
| Flask | `app.run()` | `app.run(host='0.0.0.0', port=8080)` |
| Express | `app.listen(8080)` | `app.listen(8080, '0.0.0.0', ...)` |
| FastAPI | `uvicorn.run(app)` | `uvicorn.run(app, host='0.0.0.0', port=8080)` |

> macOS may pop up a firewall prompt the first time — click **Allow**.

### 3. Run the mobile app

In your normal terminal:

```bash
cd mobile
npm install            # only the first time
npm start
```

Scan the QR code with **Expo Go** on Android, or the **Camera app** on iOS.

That's it. The app **automatically detects your PC's LAN IP** from Expo's dev server and points the backend at `http://<your-pc-ip>:8080`. No editing of any files needed.

> 💡 Phone and PC must be on the **same Wi-Fi network**.

---

## How auto-detection works

When you run `npm start`, Expo binds Metro to your PC's LAN IP (e.g. `192.168.1.5:8081`) so the phone can pull the JS bundle.  We read that same IP from `expo-constants` and use it for the backend URL too:

```js
// src/config.js
const detectedHost = Constants.expoConfig?.hostUri.split(':')[0]; // 192.168.1.5
export const SERVER_URL = `http://${detectedHost}:8080`;
```

Open the Expo dev console and you'll see a log like:

```
[Sentinel] backend URL: http://192.168.1.5:8080 (auto)
```

### Different backend port?

Edit `BACKEND_PORT` in `src/config.js`:

```js
const BACKEND_PORT = 8080;   // 👈 change me if needed
```

---

## Demo Mode (no backend required)

The login screen has two demo chips. Tap either to skip the backend entirely:

| Username | Password | Routes to |
|----------|----------|-----------|
| `demo` | `demo` | User home (with mock SOS, location) |
| `security` | `demo` | Security console (with mock visitors, clips, SOS map) |

When demo mode is active, every screen uses mock data — useful for testing UI without the backend running.

---

## Building a standalone APK (optional)

For an installable APK that works without the dev server:

```bash
npm install -g eas-cli
eas login                                   # free Expo account
eas build -p android --profile preview      # ~15 min on Expo's cloud
```

When done you get a download link for an `.apk` file. Install it on any Android phone.

> ⚠️ **APK + local backend**: Once installed, the APK has no Expo dev server to read the IP from, so it falls back to `FALLBACK_IP` in `src/config.js`. Edit that to your PC's LAN IP **before** running `eas build` if you want the APK to talk to your local backend.

---

## Project structure

```
mobile/
├── App.js              # Navigation root
├── app.json            # Expo config (permissions, package, etc.)
├── src/
│   ├── config.js       # Auto-detects PC IP from Expo
│   ├── theme.js        # Colors, gradients, spacing
│   ├── mockData.js     # Mock data + demo-mode helpers
│   ├── components/     # Reusable UI (Brand, GlassCard, GradientButton, ...)
│   └── screens/        # All 12 screens
```

---

## Backend endpoints used

| Method | Path | Used by |
|--------|------|---------|
| POST | `/login` | LoginScreen |
| POST | `/signup` | SignupScreen |
| POST | `/sos` | UserHomeScreen |
| POST | `/generate-pass` | GeneratePassScreen |
| POST | `/scan-in` | ScanInScreen |
| POST | `/scan-out` | ScanOutScreen |
| GET | `/overdue-visitors` | OverdueDashboardScreen |
| GET | `/clips` | SecurityVideosScreen |
| GET | `/sos-alerts` | SecurityMapScreen |
| POST | `/test-model` | TestModelScreen |

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| "Network request failed" | Backend bound to `127.0.0.1` instead of `0.0.0.0` | See step 2 above |
| App stuck on "fetching" | Phone and PC on different Wi-Fi networks | Connect both to same Wi-Fi |
| Connection refused | macOS firewall blocking incoming | Allow in **System Settings → Network → Firewall** |
| Auto-detected IP wrong | You're on VPN or multiple network adapters | Set `FALLBACK_IP` manually in `src/config.js` |
| Map shows blank tiles | No internet connection | Check Wi-Fi |
| "Camera permission denied" | First-time permission denial | Settings → Apps → Expo Go → Permissions → Camera |
