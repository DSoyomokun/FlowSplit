/**
 * Root Layout
 * App entry point with providers and navigation structure
 *
 * Story 68: Expo Router file structure
 * Story 69: Auth guard
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { setupNotificationHandlers } from '@/utils/linking';

// Prevent splash screen from hiding until fonts load
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Handle auth redirect
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  // Set up notification handlers
  useEffect(() => {
    const cleanup = setupNotificationHandlers((url) => {
      // Navigate to the URL from the notification
      Linking.openURL(url);
    });

    return cleanup;
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      {/* Auth screens */}
      <Stack.Screen name="(auth)" />

      {/* Main tab screens */}
      <Stack.Screen name="(tabs)" />

      {/* Deposit setup */}
      <Stack.Screen
        name="deposit/setup"
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Deposit flow screens */}
      <Stack.Screen
        name="deposit/[id]/allocate"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="deposit/[id]/confirm"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="deposit/[id]/processing"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="deposit/[id]/complete"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      {/* Bucket configuration */}
      <Stack.Screen
        name="buckets/configure"
        options={{
          animation: 'slide_from_right',
        }}
      />

      {/* Split plan modal */}
      <Stack.Screen
        name="split-plan/[id]"
        options={{
          headerShown: true,
          title: 'Split Plan',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
