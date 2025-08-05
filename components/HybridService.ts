import { SupabaseService } from './SupabaseService';
import { OfflineService, offlineService } from './OfflineService';
import { ModelService, modelService } from './ModelService';
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
      
      // Initialize model service
      await modelService.initialize();
      
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
      
      if (isOnline && modelService.isModelReady()) {
        // Use local model for analysis
        return await this.analyzeWithLocalModel(request);
      } else if (isOnline) {
        // Fallback to online API
        return await this.analyzeWithOnlineAPI(request);
      } else {
        // Offline mode with local model
        if (modelService.isModelReady()) {
          return await this.analyzeWithLocalModel(request);
        } else {
          throw new Error('No internet connection and local model not available');
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  private async analyzeWithLocalModel(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      console.log('Analyzing with local model...');
      
      // Use local AI model
      const prediction = await modelService.predictFromImage(request.imageUri);
      
      // Save to local database
      const analysisData = {
        user_id: request.userId,
        image_uri: request.imageUri,
        disease_detected: prediction.disease,
        confidence_score: prediction.confidence,
        severity_level: prediction.severity,
        treatment_recommendation: prediction.treatment,
        recommendations: prediction.recommendations,
        analysis_metadata: {
          model_version: modelService.getModelInfo()?.version || '1.0.0',
          analysis_type: 'local',
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      };

      const id = await offlineService.saveAnalysisOffline(analysisData);

      return {
        id,
        disease: prediction.disease,
        confidence: prediction.confidence,
        severity: prediction.severity,
        treatment: prediction.treatment,
        recommendations: prediction.recommendations,
        isOffline: true,
      };
    } catch (error) {
      console.error('Error with local model analysis:', error);
      throw error;
    }
  }

  private async analyzeWithOnlineAPI(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      console.log('Analyzing with online API...');
      
      // Upload image to Supabase
      const imageUrl = await SupabaseService.uploadImage(request.imageUri, request.userId);
      
      // Here you would call your online AI API
      // For now, we'll simulate the response
      const mockResult = {
        disease: 'Cassava Mosaic Disease',
        confidence: 0.92,
        severity: 'moderate',
        treatment: 'Use resistant plants, eliminate infected plants',
        recommendations: [
          'Isolate infected plants',
          'Apply preventive treatment',
          'Monitor regularly'
        ]
      };

      // Save to Supabase
      const analysisData = {
        image_url: imageUrl,
        disease_detected: mockResult.disease,
        confidence_score: mockResult.confidence,
        severity_level: mockResult.severity,
        treatment_recommendation: mockResult.treatment,
        recommendations: mockResult.recommendations,
        analysis_metadata: {
          analysis_type: 'online',
          timestamp: new Date().toISOString(),
        },
      };

      const savedAnalysis = await SupabaseService.saveAnalysis(analysisData);

      return {
        id: savedAnalysis.id!,
        disease: mockResult.disease,
        confidence: mockResult.confidence,
        severity: mockResult.severity,
        treatment: mockResult.treatment,
        recommendations: mockResult.recommendations,
        isOffline: false,
      };
    } catch (error) {
      console.error('Error with online API analysis:', error);
      throw error;
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

  async forcSync(): Promise<void> {
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
  }> {
    const isOnline = await this.isOnline();
    const pendingSync = await offlineService.getPendingSyncCount();
    
    return {
      isOnline,
      pendingSync,
      // You could store last sync time in AsyncStorage
    };
  }

  async clearOfflineData(): Promise<void> {
    await offlineService.clearOfflineData();
  }
}

export const hybridService = HybridService.getInstance();