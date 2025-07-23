import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredAnalysis {
  id: string;
  imageUri: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  recommendations: string[];
  timestamp: string;
  date: string;
  time: string;
}

export class StorageService {
  private static readonly ANALYSES_KEY = 'cassava_analyses';
  private static readonly SETTINGS_KEY = 'cassava_settings';

  static async saveAnalysis(analysis: Omit<StoredAnalysis, 'id' | 'date' | 'time'>): Promise<void> {
    try {
      const id = Date.now().toString();
      const now = new Date();
      const date = now.toLocaleDateString('fr-FR');
      const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const newAnalysis: StoredAnalysis = {
        ...analysis,
        id,
        date,
        time,
      };

      const existingAnalyses = await this.getAnalyses();
      const updatedAnalyses = [newAnalysis, ...existingAnalyses];
      
      await AsyncStorage.setItem(this.ANALYSES_KEY, JSON.stringify(updatedAnalyses));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder l\'analyse');
    }
  }

  static async getAnalyses(): Promise<StoredAnalysis[]> {
    try {
      const data = await AsyncStorage.getItem(this.ANALYSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return [];
    }
  }

  static async deleteAnalysis(id: string): Promise<void> {
    try {
      const analyses = await this.getAnalyses();
      const updatedAnalyses = analyses.filter(analysis => analysis.id !== id);
      await AsyncStorage.setItem(this.ANALYSES_KEY, JSON.stringify(updatedAnalyses));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer l\'analyse');
    }
  }

  static async clearAllAnalyses(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ANALYSES_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de vider l\'historique');
    }
  }

  static async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  }

  static async getSettings(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return {};
    }
  }
}