import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import i18n from '@/utils/i18n';
import { localModelService } from '@/components/LocalModelService';
import { Text } from 'react-native';

export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [isModelInitialized, setIsModelInitialized] = useState(false);

  useFrameworkReady();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialiser i18n
        await i18n.init();
        setIsI18nInitialized(true);
        
        // Initialiser le modèle local en arrière-plan (optionnel)
        try {
          await localModelService.initialize();
          setIsModelInitialized(true);
          console.log('Local model initialized successfully');
        } catch (error) {
          console.warn('Local model initialization failed, will use API mode:', error);
          setIsModelInitialized(true); // Continue même si le modèle local échoue
        }
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        setIsI18nInitialized(true); // Continue anyway
        setIsModelInitialized(true);
      }
    };

    if (!i18n.isInitialized) {
      initializeApp();
    } else {
      setIsI18nInitialized(true);
      setIsModelInitialized(true);
    }
  }, []);

  if (!isI18nInitialized || !isModelInitialized) {
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
}