import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, TrendingUp, Filter } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface AnalysisRecord {
  id: string;
  date: string;
  time: string;
  disease: string;
  confidence: number;
  severity: string;
  imageUri: string;
}

export default function HistoryScreen() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'healthy' | 'diseased'>('all');

  useEffect(() => {
    // Simuler des données d'historique
    const mockData: AnalysisRecord[] = [
      {
        id: '1',
        date: '15 Jan 2025',
        time: '14:30',
        disease: 'Cassava Mosaic Disease',
        confidence: 0.94,
        severity: 'Modérée',
        imageUri: 'https://images.pexels.com/photos/6146970/pexels-photo-6146970.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: '2',
        date: '14 Jan 2025',
        time: '09:15',
        disease: 'Sain',
        confidence: 0.98,
        severity: 'N/A',
        imageUri: 'https://images.pexels.com/photos/4750329/pexels-photo-4750329.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        id: '3',
        date: '13 Jan 2025',
        time: '16:45',
        disease: 'Cassava Brown Streak',
        confidence: 0.87,
        severity: 'Élevée',
        imageUri: 'https://images.pexels.com/photos/6146970/pexels-photo-6146970.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
    ];
    setAnalyses(mockData);
  }, []);

  const filteredAnalyses = analyses.filter(analysis => {
    if (filterType === 'all') return true;
    if (filterType === 'healthy') return analysis.disease === 'Sain';
    if (filterType === 'diseased') return analysis.disease !== 'Sain';
    return true;
  });

  const getDiseaseStats = () => {
    const total = analyses.length;
    const healthy = analyses.filter(a => a.disease === 'Sain').length;
    const diseased = total - healthy;
    return { total, healthy, diseased };
  };

  const stats = getDiseaseStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique des Analyses</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#2D5016" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#2D5016" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#1F7A1F15' }]}>
              <Text style={[styles.statIconText, { color: '#1F7A1F' }]}>✓</Text>
            </View>
            <Text style={styles.statNumber}>{stats.healthy}</Text>
            <Text style={styles.statLabel}>Saines</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DC262615' }]}>
              <Text style={[styles.statIconText, { color: '#DC2626' }]}>!</Text>
            </View>
            <Text style={styles.statNumber}>{stats.diseased}</Text>
            <Text style={styles.statLabel}>Malades</Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'healthy' && styles.filterTabActive]}
            onPress={() => setFilterType('healthy')}
          >
            <Text style={[styles.filterTabText, filterType === 'healthy' && styles.filterTabTextActive]}>
              Saines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'diseased' && styles.filterTabActive]}
            onPress={() => setFilterType('diseased')}
          >
            <Text style={[styles.filterTabText, filterType === 'diseased' && styles.filterTabTextActive]}>
              Malades
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Analysis Records */}
        <View style={styles.recordsContainer}>
          {filteredAnalyses.map((analysis, index) => (
            <Animated.View 
              key={analysis.id}
              entering={FadeInDown.delay(300 + index * 100)}
              style={styles.recordCard}
            >
              <Image source={{ uri: analysis.imageUri }} style={styles.recordImage} />
              
              <View style={styles.recordContent}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>
                    <Calendar size={14} color="#666666" /> {analysis.date}
                  </Text>
                  <Text style={styles.recordTime}>
                    <Clock size={14} color="#666666" /> {analysis.time}
                  </Text>
                </View>

                <Text style={[
                  styles.recordDisease,
                  analysis.disease === 'Sain' ? styles.healthyText : styles.diseaseText
                ]}>
                  {analysis.disease}
                </Text>

                <View style={styles.recordMetrics}>
                  <Text style={styles.confidenceText}>
                    Confiance: {Math.round(analysis.confidence * 100)}%
                  </Text>
                  {analysis.severity !== 'N/A' && (
                    <Text style={[
                      styles.severityText,
                      analysis.severity === 'Élevée' ? styles.severityHigh :
                      analysis.severity === 'Modérée' ? styles.severityMedium :
                      styles.severityLow
                    ]}>
                      {analysis.severity}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {filteredAnalyses.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>Aucune analyse trouvée</Text>
            <Text style={styles.emptyStateSubtext}>
              Commencez par analyser une feuille de cassava
            </Text>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2D5016',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  recordsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  recordContent: {
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#666666',
  },
  recordTime: {
    fontSize: 12,
    color: '#666666',
  },
  recordDisease: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  healthyText: {
    color: '#1F7A1F',
  },
  diseaseText: {
    color: '#DC2626',
  },
  recordMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceText: {
    fontSize: 14,
    color: '#1F7A1F',
    fontWeight: '500',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  severityHigh: {
    color: '#DC2626',
  },
  severityMedium: {
    color: '#E07A3F',
  },
  severityLow: {
    color: '#1F7A1F',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});