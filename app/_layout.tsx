import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth, AuthProvider } from '@/components/AuthService';
import i18n from '@/utils/i18n';
import { Text, View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

function RootLayoutContent() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const handleI18nInitialized = () => {
      setIsI18nInitialized(true);
    };

    if (i18n.isInitialized) {
      setIsI18nInitialized(true);
    } else {
      i18n.on('initialized', handleI18nInitialized);
    }

    return () => {
      i18n.off('initialized', handleI18nInitialized);
    };
  }, []);

  // Handle authentication routing
  useEffect(() => {
    if (!isI18nInitialized || authLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreen = segments[1] === 'auth';

    if (!user && inAuthGroup && !inAuthScreen) {
      // User is not authenticated and trying to access protected routes
      router.replace('/(tabs)/auth');
    } else if (user && inAuthScreen) {
      // User is authenticated but on auth screen, redirect to home
      router.replace('/(tabs)/');
    }
  }, [user, segments, isI18nInitialized, authLoading]);

  if (!isI18nInitialized || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2D5016" />
        <Text style={{ marginTop: 16, color: '#666666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}