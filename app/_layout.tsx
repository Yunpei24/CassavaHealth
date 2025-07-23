import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import i18n from '@/utils/i18n';
import { Text } from 'react-native';

export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useFrameworkReady();

  useEffect(() => {
    const initI18n = async () => {
      try {
        await i18n.init();
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setIsI18nInitialized(true); // Continue anyway
      }
    };

    if (!i18n.isInitialized) {
      initI18n();
    } else {
      setIsI18nInitialized(true);
    }
  }, []);

  if (!isI18nInitialized) {
    return <Text>Loading...</Text>;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );