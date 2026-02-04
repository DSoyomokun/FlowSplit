/**
 * Deep Linking Configuration
 * Handle push notifications and deep links
 *
 * Story 71: Deep links for deposits
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

/**
 * URL prefix for deep links
 */
export const URL_PREFIX = Linking.createURL('/');

/**
 * Deep link configuration for Expo Router
 */
export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    URL_PREFIX,
    'flowsplit://',
    'https://flowsplit.app',
    'https://*.flowsplit.app',
  ],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: 'dashboard',
          buckets: 'buckets',
          history: 'history',
          settings: 'settings',
        },
      },
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
        },
      },
      deposit: {
        screens: {
          setup: 'deposit/setup',
          '[id]': {
            path: 'deposit/:id',
            screens: {
              allocate: 'allocate',
              confirm: 'confirm',
              processing: 'processing',
              complete: 'complete',
            },
          },
        },
      },
    },
  },
};

/**
 * Parse deep link URL to extract deposit ID
 */
export function parseDepositDeepLink(url: string): {
  depositId: string | null;
  screen: string | null;
} {
  try {
    const { path, queryParams } = Linking.parse(url);

    // Match patterns like /deposit/123/allocate
    const depositMatch = path?.match(/deposit\/([^/]+)(?:\/(.+))?/);

    if (depositMatch) {
      return {
        depositId: depositMatch[1],
        screen: depositMatch[2] || 'allocate',
      };
    }

    return { depositId: null, screen: null };
  } catch {
    return { depositId: null, screen: null };
  }
}

/**
 * Generate deep link URL for a deposit
 */
export function generateDepositLink(depositId: string, screen = 'allocate'): string {
  return `flowsplit://deposit/${depositId}/${screen}`;
}

/**
 * Handle incoming push notification
 */
export async function handleNotificationNavigation(
  notification: Notifications.Notification
): Promise<string | null> {
  const data = notification.request.content.data;

  if (!data) return null;

  // Handle deposit notification
  if (data.type === 'deposit_received' && data.deposit_id) {
    return generateDepositLink(data.deposit_id as string, 'allocate');
  }

  // Handle split complete notification
  if (data.type === 'split_complete' && data.deposit_id) {
    return generateDepositLink(data.deposit_id as string, 'complete');
  }

  // Handle manual action required notification
  if (data.type === 'manual_action_required' && data.deposit_id) {
    return generateDepositLink(data.deposit_id as string, 'processing');
  }

  return null;
}

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return token.data;
}

/**
 * Set up notification handlers
 */
export function setupNotificationHandlers(
  onNavigate: (url: string) => void
): () => void {
  // Handle notification received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      // Could show in-app notification banner
      console.log('Notification received in foreground:', notification);
    }
  );

  // Handle notification tap
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const url = await handleNotificationNavigation(response.notification);
      if (url) {
        onNavigate(url);
      }
    }
  );

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}
