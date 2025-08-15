import i18n from '@/utils/i18n';

export interface AnalysisRequest {
  imageUri: string;
  userId: string;
}

export interface AnalysisResponse {
  disease: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high';
  treatment: string;
  recommendations: string[];
  timestamp: string;
}

export class CassavaApiService {
  private static instance: CassavaApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  }

  static getInstance(): CassavaApiService {
    if (!CassavaApiService.instance) {
      CassavaApiService.instance = new CassavaApiService();
    }
    return CassavaApiService.instance;
  }

  async analyzeImage(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Create FormData for image upload
      const formData = new FormData();
      
      // Convert image URI to blob for upload
      const response = await fetch(request.imageUri);
      const blob = await response.blob();
      
      formData.append('file', blob, 'image.jpg');

      // Call FastAPI predict endpoint
      const apiResponse = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(`Erreur API: ${apiResponse.status} - ${errorData.detail || 'Erreur inconnue'}`);
      }

      const result = await apiResponse.json();
      
      // Transform FastAPI response to our format
      const disease = result.predicted_class;
      const confidence = this.parseConfidence(result.confidence);
      const severity = this.determineSeverity(disease, confidence);
      const treatment = this.getTreatment(disease);
      const recommendations = this.getRecommendations(disease, severity);

      return {
        disease,
        confidence,
        severity,
        treatment,
        recommendations,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      const errorMessage = i18n.language === 'fr' 
        ? 'Impossible d\'analyser l\'image. Vérifiez votre connexion et l\'URL de l\'API.'
        : 'Unable to analyze image. Check your connection and API URL.';
      throw new Error(errorMessage);
    }
  }

  private parseConfidence(confidenceStr: string): number {
    // Parse "85.23%" to 0.8523
    return parseFloat(confidenceStr.replace('%', '')) / 100;
  }

  private determineSeverity(disease: string, confidence: number): 'low' | 'moderate' | 'high' {
    if (disease.toLowerCase().includes('healthy')) {
      return 'low';
    }

    if (confidence > 0.8) {
      return 'high';
    } else if (confidence > 0.6) {
      return 'moderate';
    } else {
      return 'low';
    }
  }

  private getTreatment(disease: string): string {
    const treatments: Record<string, string> = {
      'Cassava Bacterial Blight (CBB)': i18n.language === 'fr' 
        ? 'Appliquer un traitement antibactérien et améliorer le drainage'
        : 'Apply antibacterial treatment and improve drainage',
      'Cassava Brown Streak Disease (CBSD)': i18n.language === 'fr'
        ? 'Utiliser des variétés tolérantes et surveiller régulièrement'
        : 'Use tolerant varieties and monitor regularly',
      'Cassava Green Mottle (CGM)': i18n.language === 'fr'
        ? 'Éliminer les plants infectés et utiliser des variétés résistantes'
        : 'Remove infected plants and use resistant varieties',
      'Cassava Mosaic Disease (CMD)': i18n.language === 'fr'
        ? 'Utiliser des plants résistants et éliminer les plants infectés'
        : 'Use resistant plants and remove infected plants',
      'Healthy': i18n.language === 'fr'
        ? 'Continuer les bonnes pratiques de culture'
        : 'Continue good cultivation practices',
    };

    return treatments[disease] || (i18n.language === 'fr' 
      ? 'Consulter un expert agricole pour un diagnostic précis'
      : 'Consult an agricultural expert for accurate diagnosis');
  }

  private getRecommendations(disease: string, severity: 'low' | 'moderate' | 'high'): string[] {
    const baseRecommendations: Record<string, string[]> = {
      'Cassava Bacterial Blight (CBB)': i18n.language === 'fr' ? [
        'Améliorer le drainage du sol',
        'Éviter l\'arrosage excessif',
        'Appliquer un traitement antibactérien',
      ] : [
        'Improve soil drainage',
        'Avoid excessive watering',
        'Apply antibacterial treatment',
      ],
      'Cassava Brown Streak Disease (CBSD)': i18n.language === 'fr' ? [
        'Utiliser des variétés tolérantes',
        'Surveiller régulièrement les symptômes',
        'Éliminer les plants gravement infectés',
      ] : [
        'Use tolerant varieties',
        'Monitor symptoms regularly',
        'Remove severely infected plants',
      ],
      'Cassava Green Mottle (CGM)': i18n.language === 'fr' ? [
        'Isoler les plants infectés',
        'Utiliser des variétés résistantes',
        'Améliorer la ventilation',
      ] : [
        'Isolate infected plants',
        'Use resistant varieties',
        'Improve ventilation',
      ],
      'Cassava Mosaic Disease (CMD)': i18n.language === 'fr' ? [
        'Éliminer immédiatement les plants infectés',
        'Utiliser des boutures saines',
        'Contrôler les vecteurs (mouches blanches)',
      ] : [
        'Remove infected plants immediately',
        'Use healthy cuttings',
        'Control vectors (whiteflies)',
      ],
      'Healthy': i18n.language === 'fr' ? [
        'Maintenir les bonnes pratiques',
        'Surveiller régulièrement',
        'Assurer une nutrition équilibrée',
      ] : [
        'Maintain good practices',
        'Monitor regularly',
        'Ensure balanced nutrition',
      ],
    };

    let recommendations = baseRecommendations[disease] || (i18n.language === 'fr' ? [
      'Consulter un expert agricole',
      'Surveiller l\'évolution',
      'Appliquer les bonnes pratiques',
    ] : [
      'Consult an agricultural expert',
      'Monitor evolution',
      'Apply good practices',
    ]);

    // Add severity-specific recommendations
    if (severity === 'high') {
      const urgentAction = i18n.language === 'fr' ? 'Action urgente requise' : 'Urgent action required';
      recommendations.unshift(urgentAction);
    } else if (severity === 'moderate') {
      const monitor = i18n.language === 'fr' ? 'Surveiller de près l\'évolution' : 'Monitor evolution closely';
      recommendations.push(monitor);
    }

    return recommendations;
  }

  async getHealthStatus(): Promise<{ status: 'online' | 'offline'; latency?: number }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
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