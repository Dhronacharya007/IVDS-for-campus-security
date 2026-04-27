import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_KEY = 'demoMode';

export async function setDemoMode(enabled) {
  await AsyncStorage.setItem(DEMO_KEY, enabled ? 'true' : 'false');
}

export async function isDemoMode() {
  const v = await AsyncStorage.getItem(DEMO_KEY);
  return v === 'true';
}

export const mockOverdueVisitors = [
  { name: 'John Doe', phone: '9876543210', out_time: '2026-04-27 16:00' },
  { name: 'Jane Smith', phone: '9123456789', out_time: '2026-04-27 15:30' },
  { name: 'Mike Johnson', phone: '9988776655', out_time: '2026-04-27 14:00' },
];

export const mockClips = [
  { filename: 'fight_detection_001.mp4', classification: 'Fight', timestamp: Date.now() / 1000 - 3600 },
  { filename: 'crowd_gathering_002.mp4', classification: 'Crowd', timestamp: Date.now() / 1000 - 7200 },
  { filename: 'suspicious_activity_003.mp4', classification: 'Suspicious', timestamp: Date.now() / 1000 - 10800 },
];

export const mockSosAlerts = [
  { username: 'Student1', location: { latitude: 11.0692, longitude: 77.0042 }, timestamp: Date.now() / 1000 - 600 },
  { username: 'Student2', location: { latitude: 11.0712, longitude: 77.0062 }, timestamp: Date.now() / 1000 - 1200 },
];
