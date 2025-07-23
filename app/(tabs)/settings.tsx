import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, Shield, CircleHelp as HelpCircle, Info, ChevronRight, Globe, Camera } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  const settingsData = [
    {
      title: 'Analyse',
      items: [
        {
          icon: Camera,
          label: 'Qualité d\'image élevée',
          type: 'switch',
          value: highQuality,
          onValueChange: setHighQuality,
        },
        {
          icon: Shield,
          label: 'Sauvegarde automatique',
          type: 'switch',
          value: autoSave,
          onValueChange: setAutoSave,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Alertes de maladie',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
      ],
    },
    {
      title: 'Général',
      items: [
        {
          icon: Globe,
          label: 'Langue',
          type: 'navigation',
          value: 'Français',
        },
        {
          icon: HelpCircle,
          label: 'Aide et Support',
          type: 'navigation',
        },
        {
          icon: Info,
          label: 'À propos',
          type: 'navigation',
        },
      ],
    },
  ];

  const diseaseInfo = [
    {
      name: 'Cassava Mosaic Disease',
      description: 'Maladie virale causant des motifs en mosaïque sur les feuilles',
      prevention: 'Utiliser des variétés résistantes, éliminer les plants infectés',
    },
    {
      name: 'Cassava Brown Streak',
      description: 'Maladie virale provoquant des stries brunes sur les tiges et racines',
      prevention: 'Planter des variétés tolérantes, surveiller régulièrement',
    },
    {
      name: 'Cassava Bacterial Blight',
      description: 'Infection bactérienne causant le flétrissement des feuilles',
      prevention: 'Éviter l\'humidité excessive, rotation des cultures',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color="#2D5016" />
        <Text style={styles.headerTitle}>Paramètres</Text>
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
                      {item.value && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                      <ChevronRight size={20} color="#CCCCCC" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Disease Information */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Guide des Maladies</Text>
          <View style={styles.sectionContent}>
            {diseaseInfo.map((disease, index) => (
              <View key={index} style={styles.diseaseCard}>
                <Text style={styles.diseaseName}>{disease.name}</Text>
                <Text style={styles.diseaseDescription}>{disease.description}</Text>
                <Text style={styles.diseasePreventionLabel}>Prévention:</Text>
                <Text style={styles.diseasePrevention}>{disease.prevention}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.appInfo}>
          <Text style={styles.appName}>CassavaHealth</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Application de détection intelligente des maladies du manioc utilisant 
            l'intelligence artificielle pour aider les agriculteurs à maintenir 
            des cultures saines.
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