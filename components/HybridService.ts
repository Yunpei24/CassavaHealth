import { SupabaseService } from './SupabaseService';
import { OfflineService, offlineService } from './OfflineService';
import { apiService } from './ApiService';
import * as Network from 'expo-network';

export interface AnalysisRequest {
  imageUri: string;
  userId: string;
}

export interface AnalysisResult {
  id: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  recommendations: string[];
  isOffline: boolean;
}

export class HybridService {
  private static instance: HybridService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): HybridService {
    if (!HybridService.instance) {
      HybridService.instance = new HybridService();
    }
    return HybridService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing hybrid service...');
      
      // Initialize offline service
      await offlineService.initialize();
      
      this.isInitialized = true;
      console.log('Hybrid service initialized successfully');
      
      // Start background sync
      this.startBackgroundSync();
    } catch (error) {
      console.error('Error initializing hybrid service:', error);
      throw error;
    }
  }

  async analyzeImage(request: AnalysisRequest): Promise<AnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Hybrid service not initialized');
    }

    try {
      const isOnline = await this.isOnline();
      
      if (isOnline) {
        // Use FastAPI for analysis
        return await this.analyzeWithFastAPI(request);
      } else {
        // Offline mode - save for later sync
        throw new Error('No internet connection. Analysis requires online connection to FastAPI server.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  private async analyzeWithFastAPI(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      console.log('Analyzing with FastAPI...');
      
      // Use FastAPI service
      const prediction = await apiService.analyzeImage(request);
      
      // Upload image to Supabase
      const imageUrl = await SupabaseService.uploadImage(request.imageUri, request.userId);
      
      // Save to Supabase
      const analysisData = {
        image_url: imageUrl,
        disease_detected: prediction.disease,
        confidence_score: prediction.confidence,
        severity_level: prediction.severity,
        treatment_recommendation: prediction.treatment,
        recommendations: prediction.recommendations,
        analysis_metadata: {
          analysis_type: 'fastapi',
          api_timestamp: prediction.timestamp,
          timestamp: new Date().toISOString(),
        },
      };

      const savedAnalysis = await SupabaseService.saveAnalysis(analysisData);

      return {
        id: savedAnalysis.id!,
        disease: prediction.disease,
        confidence: prediction.confidence,
        severity: prediction.severity,
        treatment: prediction.treatment,
        recommendations: prediction.recommendations,
        isOffline: false,
      };
    } catch (error) {
      console.error('Error with FastAPI analysis:', error);
      
      // Fallback: save offline for later sync
      const analysisData = {
        user_id: request.userId,
        image_uri: request.imageUri,
        disease_detected: 'Analysis Failed',
        confidence_score: 0,
        severity_level: 'unknown',
        treatment_recommendation: 'Retry when online',
        recommendations: ['Check internet connection', 'Verify API URL'],
        analysis_metadata: {
          analysis_type: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      };

      const id = await offlineService.saveAnalysisOffline(analysisData);

      return {
        id,
        disease: 'Analysis Failed',
        confidence: 0,
        severity: 'unknown',
        treatment: 'Retry when online',
        recommendations: ['Check internet connection', 'Verify API URL'],
        isOffline: true,
      };
    }
  }

  async getAnalyses(userId: string): Promise<any[]> {
    try {
      const isOnline = await this.isOnline();
      
      if (isOnline) {
        // Try to get from Supabase first
        try {
          const onlineAnalyses = await SupabaseService.getAnalyses();
          return onlineAnalyses.map(analysis => ({
            ...analysis,
            isOffline: false,
          }));
        } catch (error) {
          console.warn('Failed to get online analyses, falling back to offline');
        }
      }
      
      // Fallback to offline data
      const offlineAnalyses = await offlineService.getAnalysesOffline(userId);
      return offlineAnalyses.map(analysis => ({
        ...analysis,
        isOffline: true,
      }));
    } catch (error) {
      console.error('Error getting analyses:', error);
      throw error;
    }
  }

  async deleteAnalysis(id: string, isOffline: boolean): Promise<void> {
    try {
      if (isOffline) {
        await offlineService.deleteAnalysisOffline(id);
      } else {
        const online = await this.isOnline();
        if (online) {
          await SupabaseService.deleteAnalysis(id);
        } else {
          // Mark for deletion when online
          await offlineService.deleteAnalysisOffline(id);
        }
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }

  private async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected || false;
    } catch (error) {
      console.error('Error checking network state:', error);
      return false;
    }
  }

  private startBackgroundSync(): void {
    // Sync every 5 minutes when online
    setInterval(async () => {
      try {
        const isOnline = await this.isOnline();
        if (isOnline) {
          await offlineService.syncWithServer();
        }
      } catch (error) {
        console.error('Background sync error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async forceSync(): Promise<void> {
    try {
      const isOnline = await this.isOnline();
      if (isOnline) {
        await offlineService.syncWithServer();
        console.log('Manual sync completed');
      } else {
        throw new Error('No internet connection for sync');
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<{
    isOnline: boolean;
    pendingSync: number;
    lastSync?: Date;
    apiStatus: 'online' | 'offline';
  }> {
    const isOnline = await this.isOnline();
    const pendingSync = await offlineService.getPendingSyncCount();
    
    // Check FastAPI status
    const apiHealth = await apiService.getHealthStatus();
    
    return {
      isOnline,
      pendingSync,
      apiStatus: apiHealth.status,
      // You could store last sync time in AsyncStorage
    };
  }

  async clearOfflineData(): Promise<void> {
    await offlineService.clearOfflineData();
  }
}

export const hybridService = HybridService.getInstance();