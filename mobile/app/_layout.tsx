/**
 * Root Layout
 * App entry point with providers and navigation structure
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

// Prevent splash screen from hiding until ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="deposit/setup" />
          <Stack.Screen name="deposit/[id]/allocate" />
          <Stack.Screen name="deposit/[id]/confirm" />
          <Stack.Screen name="deposit/[id]/processing" />
          <Stack.Screen name="deposit/[id]/complete" />
          <Stack.Screen name="buckets/configure" />
          <Stack.Screen
            name="split-plan/[id]"
            options={{ presentation: 'modal', headerShown: true, title: 'Split Plan' }}
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
