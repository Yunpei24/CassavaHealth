import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, Shield, CircleHelp as HelpCircle, Info, ChevronRight, Globe, Camera } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabaseConfigService, SupabaseConfig } from '@/components/SupabaseConfigService';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [currentSupabaseConfig, setCurrentSupabaseConfig] = useState<SupabaseConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<SupabaseConfig[]>([]);

  React.useEffect(() => {
    loadSupabaseConfigs();
  }, []);

  const loadSupabaseConfigs = async () => {
    try {
      const current = supabaseConfigService.getCurrentConfig();
      const available = await supabaseConfigService.getAvailableConfigs();
      setCurrentSupabaseConfig(current);
      setAvailableConfigs(available);
    } catch (error) {
      console.error('Error loading Supabase configs:', error);
    }
  };

  const switchSupabaseConfig = async () => {
    Alert.alert(
      'Configuration Supabase',
      'Choisissez votre configuration Supabase',
      availableConfigs.map(config => ({
        text: `${config.name} (${config.mode})`,
        onPress: async () => {
          try {
            await supabaseConfigService.switchToConfig(config);
            setCurrentSupabaseConfig(config);
            Alert.alert('Succès', `Basculé vers ${config.name}`);
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de changer de configuration');
          }
        }
      })).concat([
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ])
    );
  };

  const changeLanguage = async () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    
    try {
      await i18n.changeLanguage(newLang);
      // Force a re-render by updating a state if needed
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('common.error'),
        'Unable to change language. Please try again.'
      );
    }
  };

  const getCurrentLanguage = () => {
    const lang = i18n.language || 'fr';
    return lang === 'fr' ? 'Français' : 'English';
  };

  const settingsData = [
    {
      title: t('settings.analysis'),
      items: [
        {
          icon: Camera,
          label: t('settings.highQuality'),
          type: 'switch',
          value: highQuality,
          onValueChange: setHighQuality,
        },
        {
          icon: Shield,
          label: t('settings.autoSave'),
          type: 'switch',
          value: autoSave,
          onValueChange: setAutoSave,
        },
      ],
    },
    {
      title: t('settings.notifications'),
      items: [
        {
          icon: Bell,
          label: t('settings.diseaseAlerts'),
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
      ],
    },
    {
      title: t('settings.general'),
      items: [
        {
          icon: Globe,
          label: t('settings.language'),
          type: 'navigation',
          value: getCurrentLanguage(),
          action: changeLanguage,
        },
        {
          icon: Shield,
          label: 'Supabase Configuration',
          type: 'navigation',
          value: currentSupabaseConfig ? `${currentSupabaseConfig.name} (${currentSupabaseConfig.mode})` : 'Non configuré',
          action: switchSupabaseConfig,
        },
        {
          icon: Settings,
          label: 'API Configuration',
          type: 'navigation',
          value: process.env.EXPO_PUBLIC_API_URL || 'localhost:8000',
          action: () => {
            Alert.alert(
              'API Configuration',
              `FastAPI URL: ${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}\n\nPour changer l'URL, modifiez EXPO_PUBLIC_API_URL dans votre fichier .env`
            );
          },
        },
        {
          icon: HelpCircle,
          label: t('settings.helpSupport'),
          type: 'navigation',
        },
        {
          icon: Info,
          label: t('settings.about'),
          type: 'navigation',
        },
      ],
    },
  ];

  const diseaseInfo = [
    {
      name: t('diseases.cassavaMosaicDisease'),
      description: t('diseases.descriptions.cassavaMosaicDisease'),
      prevention: t('diseases.preventions.cassavaMosaicDisease'),
    },
    {
      name: t('diseases.cassavaBrownStreak'),
      description: t('diseases.descriptions.cassavaBrownStreak'),
      prevention: t('diseases.preventions.cassavaBrownStreak'),
    },
    {
      name: t('diseases.cassavaBacterialBlight'),
      description: t('diseases.descriptions.cassavaBacterialBlight'),
      prevention: t('diseases.preventions.cassavaBacterialBlight'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#2D5016" />
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Settings Sections */}
        {settingsData.map((section, sectionIndex) => (
          <Animated.View 
            key={section.title}
            entering={FadeInDown.delay(100 + sectionIndex * 100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <item.icon size={20} color="#2D5016" />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#E5E5E5', true: '#2D501650' }}
                      thumbColor={item.value ? '#2D5016' : '#FFFFFF'}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      <TouchableOpacity onPress={item.action} style={styles.languageButton}>
                      {item.value && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                      <ChevronRight size={20} color="#CCCCCC" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Disease Information */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.diseaseGuide')}</Text>
          <View style={styles.sectionContent}>
            {diseaseInfo.map((disease, index) => (
              <View key={index} style={styles.diseaseCard}>
                <Text style={styles.diseaseName}>{disease.name}</Text>
                <Text style={styles.diseaseDescription}>{disease.description}</Text>
                <Text style={styles.diseasePreventionLabel}>{t('settings.prevention')}</Text>
                <Text style={styles.diseasePrevention}>{disease.prevention}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.appInfo}>
          <Text style={styles.appName}>{t('home.title')}</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            {t('settings.appDescription')}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FDF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D501610',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diseaseCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  diseasePreventionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 4,
  },
  diseasePrevention: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    marginTop: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});