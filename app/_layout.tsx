import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { FinanceProvider, useFinance } from '../context/FinanceContext';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

function RootNavigation() {
  const { isOnboarded, loading } = useFinance();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Do nothing while loading

    const inOnboarding = segments[0] === 'onboarding';

    if (!isOnboarded && !inOnboarding) {
      // User is NOT onboarded, send to onboarding
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      // User IS onboarded, but trying to see onboarding page? Send home.
      router.replace('/');
    }
  }, [isOnboarded, loading, segments]);

  // Show Loading Spinner to prevent "Flash of Content" or "Race Conditions"
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}> 
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" />
      </Stack>
    </View>
  );
}

export default function Layout() {
  return (
    <FinanceProvider>
      <RootNavigation />
    </FinanceProvider>
  );
}