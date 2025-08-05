import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';

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
  private db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'cassava_offline.db';
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
      // Initialize SQLite database
      this.db = await SQLite.openDatabaseAsync(OfflineService.DB_NAME);
      
      // Create tables
      await this.createTables();
      
      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Error initializing offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createAnalysesTable = `
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        disease_detected TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        severity_level TEXT,
        treatment_recommendation TEXT,
        recommendations TEXT,
        analysis_metadata TEXT,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `;

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
      );
    `;

    await this.db.execAsync(createAnalysesTable);
    await this.db.execAsync(createUsersTable);
  }

  async saveAnalysisOffline(analysis: Omit<OfflineAnalysis, 'id' | 'synced'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const analysisWithId: OfflineAnalysis = {
      ...analysis,
      id,
      synced: false,
    };

    try {
      await this.db.runAsync(
        `INSERT INTO analyses (
          id, user_id, image_uri, disease_detected, confidence_score,
          severity_level, treatment_recommendation, recommendations,
          analysis_metadata, created_at, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          analysisWithId.id,
          analysisWithId.user_id,
          analysisWithId.image_uri,
          analysisWithId.disease_detected,
          analysisWithId.confidence_score,
          analysisWithId.severity_level || null,
          analysisWithId.treatment_recommendation || null,
          JSON.stringify(analysisWithId.recommendations || []),
          JSON.stringify(analysisWithId.analysis_metadata || {}),
          analysisWithId.created_at,
          0
        ]
      );

      // Add to sync queue
      await this.addToSyncQueue(analysisWithId);

      return id;
    } catch (error) {
      console.error('Error saving analysis offline:', error);
      throw error;
    }
  }

  async getAnalysesOffline(userId: string): Promise<OfflineAnalysis[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return result.map((row: any) => ({
        ...row,
        recommendations: JSON.parse(row.recommendations || '[]'),
        analysis_metadata: JSON.parse(row.analysis_metadata || '{}'),
        synced: Boolean(row.synced),
      }));
    } catch (error) {
      console.error('Error getting analyses offline:', error);
      throw error;
    }
  }

  async deleteAnalysisOffline(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM analyses WHERE id = ?', [id]);
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
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
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
            
            // Mark as synced in local database
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
    if (!this.db) return;

    try {
      await this.db.runAsync(
        'UPDATE analyses SET synced = 1 WHERE id = ?',
        [analysisId]
      );
    } catch (error) {
      console.error('Error marking analysis as synced:', error);
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected || false;
    } catch (error) {
      console.error('Error checking network state:', error);
      return false;
    }
  }

  async getPendingSyncCount(): Promise<number> {
    if (!this.db) return 0;

    try {
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM analyses WHERE synced = 0'
      );
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting pending sync count:', error);
      return 0;
    }
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.execAsync('DELETE FROM analyses');
      await AsyncStorage.removeItem(OfflineService.SYNC_QUEUE_KEY);
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }
}

export const offlineService = OfflineService.getInstance();