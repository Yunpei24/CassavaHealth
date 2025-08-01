import { Tabs } from 'expo-router';
import { Home, Camera, History, Settings, User } from 'lucide-react-native';
import { AuthProvider } from '@/components/AuthService';

export default function TabLayout() {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#2D5016',
            borderTopColor: '#4A7C59',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#A0A0A0',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Caméra',
            tabBarIcon: ({ color, size }) => (
              <Camera color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historique',
            tabBarIcon: ({ color, size }) => (
              <History color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Paramètres',
            tabBarIcon: ({ color, size }) => (
              <Settings color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="auth"
          options={{
            href: null,
            title: 'Connexion',
            tabBarIcon: ({ color, size }) => (
              <User color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}