import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, TrendingUp, Filter } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SupabaseService, CassavaAnalysis } from '@/components/SupabaseService';
import { useFocusEffect } from '@react-navigation/native';

interface AnalysisRecord extends CassavaAnalysis {
  date: string;
  time: string;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'healthy' | 'diseased'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SupabaseService.getAnalyses();
      
      // Transform data to include formatted date and time
      const transformedData: AnalysisRecord[] = data.map(analysis => {
        const date = new Date(analysis.created_at!);
        return {
          ...analysis,
          date: date.toLocaleDateString('fr-FR'),
          time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
      });
      
      setAnalyses(transformedData);
    } catch (error) {
      console.error('Error loading analyses:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAnalyses();
    }, [])
  );
  const filteredAnalyses = analyses.filter(analysis => {
    if (filterType === 'all') return true;
    if (filterType === 'healthy') return analysis.disease_detected === t('diseases.healthy');
    if (filterType === 'diseased') return analysis.disease_detected !== t('diseases.healthy');
    return true;
  });

  const getDiseaseStats = () => {
    const total = analyses.length;
    const healthy = analyses.filter(a => a.disease_detected === t('diseases.healthy')).length;
    const diseased = total - healthy;
    return { total, healthy, diseased };
  };

  const stats = getDiseaseStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
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
            <Text style={styles.statLabel}>{t('history.total')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#1F7A1F15' }]}>
              <Text style={[styles.statIconText, { color: '#1F7A1F' }]}>✓</Text>
            </View>
            <Text style={styles.statNumber}>{stats.healthy}</Text>
            <Text style={styles.statLabel}>{t('history.healthy')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DC262615' }]}>
              <Text style={[styles.statIconText, { color: '#DC2626' }]}>!</Text>
            </View>
            <Text style={styles.statNumber}>{stats.diseased}</Text>
            <Text style={styles.statLabel}>{t('history.diseased')}</Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
              {t('history.all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'healthy' && styles.filterTabActive]}
            onPress={() => setFilterType('healthy')}
          >
            <Text style={[styles.filterTabText, filterType === 'healthy' && styles.filterTabTextActive]}>
              {t('history.healthy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'diseased' && styles.filterTabActive]}
            onPress={() => setFilterType('diseased')}
          >
            <Text style={[styles.filterTabText, filterType === 'diseased' && styles.filterTabTextActive]}>
              {t('history.diseased')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Analysis Records */}
        <View style={styles.recordsContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAnalyses}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filteredAnalyses.map((analysis, index) => (
            <Animated.View 
              key={analysis.id!}
              entering={FadeInDown.delay(300 + index * 100)}
              style={styles.recordCard}
            >
              <Image source={{ uri: analysis.image_url }} style={styles.recordImage} />
              
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
                  analysis.disease_detected === t('diseases.healthy') ? styles.healthyText : styles.diseaseText
                ]}>
                  {analysis.disease_detected}
                </Text>

                <View style={styles.recordMetrics}>
                  <Text style={styles.confidenceText}>
                    {t('camera.confidence')}: {Math.round(analysis.confidence_score * 100)}%
                  </Text>
                  {analysis.severity_level && (
                    <Text style={[
                      styles.severityText,
                      analysis.severity_level === 'high' ? styles.severityHigh :
                      analysis.severity_level === 'moderate' ? styles.severityMedium :
                      styles.severityLow
                    ]}>
                      {t(`diseases.severity.${analysis.severity_level}`)}
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {!loading && !error && filteredAnalyses.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>{t('history.noAnalysisFound')}</Text>
            <Text style={styles.emptyStateSubtext}>
              {t('history.startAnalyzing')}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2D5016',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});