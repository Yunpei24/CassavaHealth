export interface AnalysisRequest {
  image: string; // base64 encoded image
  format?: 'jpg' | 'png';
}

export interface AnalysisResponse {
  disease: string;
  confidence: number;
  severity: 'Faible' | 'Modérée' | 'Élevée';
  treatment: string;
  recommendations: string[];
  timestamp: string;
}

export class CassavaApiService {
  private static instance: CassavaApiService;
  private baseUrl: string;

  private constructor() {
    // Remplacez par l'URL de votre API
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://votre-api.com';
  }

  static getInstance(): CassavaApiService {
    if (!CassavaApiService.instance) {
      CassavaApiService.instance = new CassavaApiService();
    }
    return CassavaApiService.instance;
  }

  async analyzeImage(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY || ''}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      throw new Error('Impossible d\'analyser l\'image. Vérifiez votre connexion.');
    }
  }

  async getHealthStatus(): Promise<{ status: 'online' | 'offline'; latency?: number }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY || ''}`,
        },
      });
      
      const latency = Date.now() - startTime;
      
      return {
        status: response.ok ? 'online' : 'offline',
        latency: response.ok ? latency : undefined,
      };
    } catch (error) {
      return { status: 'offline' };
    }
  }
}

export const apiService = CassavaApiService.getInstance();