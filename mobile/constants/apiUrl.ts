import Constants from 'expo-constants';
import { Platform } from 'react-native';

const fromEnv =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Backend base URL (includes /api/v1).
 * - iOS Simulator → host Mac loopback (Expo Go / dev client).
 * - Android Emulator → host machine via 10.0.2.2.
 * - Physical device → EXPO_PUBLIC_API_URL (same LAN IP, Tailscale IP if phone has Tailscale, or an ngrok URL).
 */
export function getApiBaseUrl(): string {
  if (!__DEV__) {
    return fromEnv;
  }
  if (Platform.OS === 'ios' && Constants.isDevice === false) {
    return 'http://127.0.0.1:8000/api/v1';
  }
  if (Platform.OS === 'android' && Constants.isDevice === false) {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return fromEnv;
}

export const API_URL = getApiBaseUrl();
