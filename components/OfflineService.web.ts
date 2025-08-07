import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineAnalysis {
  id: string;
  user_id: string;
  image_uri: string;
  disease_detected: string;
  confidence_score: number;
  severity_level?: string;
  treatment_recommendation?: string;
  recommendations?: string[];
  analysis_metadata?: any;
  created_at: string;
  synced: boolean;
}

export class OfflineService {
  private static instance: OfflineService;
  private static readonly ANALYSES_KEY = 'offline_analyses';
  private static readonly SYNC_QUEUE_KEY = 'sync_queue';

  private constructor() {}

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // For web, we just use AsyncStorage (localStorage)
      console.log('Offline service initialized for web');
    } catch (error) {
      console.error('Error initializing offline service:', error);
      throw error;
    }
  }

  async saveAnalysisOffline(analysis: Omit<OfflineAnalysis, 'id' | 'synced'>): Promise<string> {
    const id = Date.now().toString();
    const analysisWithId: OfflineAnalysis = {
      ...analysis,
      id,
      synced: false,
    };

    try {
      const existingData = await AsyncStorage.getItem(OfflineService.ANALYSES_KEY);
      const analyses = existingData ? JSON.parse(existingData) : [];
      
      analyses.push(analysisWithId);
      
      await AsyncStorage.setItem(OfflineService.ANALYSES_KEY, JSON.stringify(analyses));
      await this.addToSyncQueue(analysisWithId);

      return id;
    } catch (error) {
      console.error('Error saving analysis offline:', error);
      throw error;
    }
  }

  async getAnalysesOffline(userId: string): Promise<OfflineAnalysis[]> {
    try {
      const data = await AsyncStorage.getItem(OfflineService.ANALYSES_KEY);
      if (!data) return [];

      const analyses = JSON.parse(data);
      return analyses.filter((analysis: OfflineAnalysis) => analysis.user_id === userId);
    } catch (error) {
      console.error('Error getting analyses offline:', error);
      return [];
    }
  }

  async deleteAnalysisOffline(id: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(OfflineService.ANALYSES_KEY);
      if (!existingData) return;

      const analyses = JSON.parse(existingData);
      const filteredAnalyses = analyses.filter((analysis: OfflineAnalysis) => analysis.id !== id);
      
      await AsyncStorage.setItem(OfflineService.ANALYSES_KEY, JSON.stringify(filteredAnalyses));
    } catch (error) {
      console.error('Error deleting analysis offline:', error);
      throw error;
    }
  }

  private async addToSyncQueue(analysis: OfflineAnalysis): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(OfflineService.SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];
      
      queue.push({
        type: 'analysis',
        data: analysis,
        timestamp: Date.now(),
      });

      await AsyncStorage.setItem(OfflineService.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async syncWithServer(): Promise<void> {
    try {
      // Check network connectivity for web
      if (!navigator.onLine) {
        console.log('No internet connection, skipping sync');
        return;
      }

      const queueData = await AsyncStorage.getItem(OfflineService.SYNC_QUEUE_KEY);
      if (!queueData) return;

      const queue = JSON.parse(queueData);
      const syncedItems: any[] = [];

      for (const item of queue) {
        try {
          if (item.type === 'analysis') {
            // Here you would sync with your actual backend
            // await SupabaseService.saveAnalysis(item.data);
            
            // Mark as synced
            await this.markAsSynced(item.data.id);
            syncedItems.push(item);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
          // Continue with other items
        }
      }

      // Remove synced items from queue
      const remainingQueue = queue.filter((item: any) => !syncedItems.includes(item));
      await AsyncStorage.setItem(OfflineService.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));

      console.log(`Synced ${syncedItems.length} items`);
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  private async markAsSynced(analysisId: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(OfflineService.ANALYSES_KEY);
      if (!existingData) return;

      const analyses = JSON.parse(existingData);
      const updatedAnalyses = analyses.map((analysis: OfflineAnalysis) => 
        analysis.id === analysisId ? { ...analysis, synced: true } : analysis
      );
      
      await AsyncStorage.setItem(OfflineService.ANALYSES_KEY, JSON.stringify(updatedAnalyses));
    } catch (error) {
      console.error('Error marking analysis as synced:', error);
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      // For web, use navigator.onLine
      return navigator.onLine;
    } catch (error) {
      console.error('Error checking network state:', error);
      return false;
    }
  }

  async getPendingSyncCount(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(OfflineService.ANALYSES_KEY);
      if (!data) return 0;

      const analyses = JSON.parse(data);
      return analyses.filter((analysis: OfflineAnalysis) => !analysis.synced).length;
    } catch (error) {
      console.error('Error getting pending sync count:', error);
      return 0;
    }
  }

  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OfflineService.ANALYSES_KEY);
      await AsyncStorage.removeItem(OfflineService.SYNC_QUEUE_KEY);
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }
}

export const offlineService = OfflineService.getInstance();