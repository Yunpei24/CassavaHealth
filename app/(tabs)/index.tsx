import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, Upload, TrendingUp, Shield } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Camera,
      title: t('home.rapidAnalysis.title'),
      description: t('home.rapidAnalysis.description'),
      action: () => router.push('/camera'),
      color: '#2D5016',
    },
    {
      icon: Upload,
      title: t('home.importImage.title'),
      description: t('home.importImage.description'),
      action: () => router.push('/camera?mode=gallery'),
      color: '#E07A3F',
    },
    {
      icon: TrendingUp,
      title: t('home.tracking.title'),
      description: t('home.tracking.description'),
      action: () => router.push('/history'),
      color: '#8B5A3C',
    },
    {
      icon: Shield,
      title: t('home.prevention.title'),
      description: t('home.prevention.description'),
      action: () => router.push('/settings'),
      color: '#1F7A1F',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/4750329/pexels-photo-4750329.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.headerImage}
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.headerTitle}>{t('home.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('home.subtitle')}
            </Text>
          </View>
        </Animated.View>

        {/* Quick Action */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.quickAction}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/camera')}
            activeOpacity={0.8}
          >
            <Camera size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('home.quickAction')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>{t('home.features')}</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={feature.action}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <feature.icon size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('home.impact')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>{t('home.stats.accuracy')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>2s</Text>
              <Text style={styles.statLabel}>{t('home.stats.analysis')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>{t('home.stats.available')}</Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45, 80, 22, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F0F0F0',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickAction: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#2D5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#2D5016',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresSection: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsSection: {
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
});