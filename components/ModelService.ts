import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-platform-react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export interface ModelPrediction {
  disease: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high';
  treatment: string;
  recommendations: string[];
}

export interface ModelInfo {
  version: string;
  input_size: number[];
  num_classes: number;
  accuracy: number;
}

export class ModelService {
  private static instance: ModelService;
  private model: tf.LayersModel | null = null;
  private labels: string[] = [];
  private modelInfo: ModelInfo | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService();
    }
    return ModelService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing TensorFlow.js...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js ready');

      // Load model and labels
      await this.loadModel();
      await this.loadLabels();

      this.isInitialized = true;
      console.log('Model service initialized successfully');
    } catch (error) {
      console.error('Error initializing model service:', error);
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    try {
      // Try to load local model first
      const modelPath = `${FileSystem.documentDirectory}models/cassava_model/model.json`;
      const modelExists = await FileSystem.getInfoAsync(modelPath);

      if (modelExists.exists) {
        console.log('Loading local model...');
        this.model = await tf.loadLayersModel(`file://${modelPath}`);
      } else {
        // Fallback: Load from assets
        console.log('Loading model from assets...');
        const modelAsset = Asset.fromModule(require('../assets/models/model.json'));
        await modelAsset.downloadAsync();
        
        if (modelAsset.localUri) {
          this.model = await tf.loadLayersModel(modelAsset.localUri);
        } else {
          throw new Error('Could not load model from assets');
        }
      }

      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error('Failed to load AI model');
    }
  }

  private async loadLabels(): Promise<void> {
    try {
      // Try to load local labels first
      const labelsPath = `${FileSystem.documentDirectory}models/labels.json`;
      const labelsExists = await FileSystem.getInfoAsync(labelsPath);

      let labelsData: any;

      if (labelsExists.exists) {
        console.log('Loading local labels...');
        const labelsContent = await FileSystem.readAsStringAsync(labelsPath);
        labelsData = JSON.parse(labelsContent);
      } else {
        // Fallback: Load from assets
        console.log('Loading labels from assets...');
        const labelsAsset = Asset.fromModule(require('../assets/models/labels.json'));
        await labelsAsset.downloadAsync();
        
        if (labelsAsset.localUri) {
          const labelsContent = await FileSystem.readAsStringAsync(labelsAsset.localUri);
          labelsData = JSON.parse(labelsContent);
        } else {
          throw new Error('Could not load labels from assets');
        }
      }

      this.labels = labelsData.labels;
      this.modelInfo = labelsData.model_info;
      
      console.log('Labels loaded successfully:', this.labels);
    } catch (error) {
      console.error('Error loading labels:', error);
      // Fallback labels
      this.labels = [
        'Cassava Bacterial Blight (CBB)',
        'Cassava Brown Streak Disease (CBSD)',
        'Cassava Green Mottle (CGM)',
        'Cassava Mosaic Disease (CMD)',
        'Healthy'
      ];
    }
  }

  async predictFromImage(imageUri: string): Promise<ModelPrediction> {
    if (!this.isInitialized || !this.model) {
      throw new Error('Model not initialized');
    }

    try {
      console.log('Processing image for prediction...');

      // Load and preprocess image
      const tensor = await this.preprocessImage(imageUri);
      
      // Make prediction
      const prediction = this.model.predict(tensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Get the class with highest probability
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const confidence = probabilities[maxIndex];
      const disease = this.labels[maxIndex] || 'Unknown';

      // Determine severity based on confidence and disease type
      const severity = this.determineSeverity(disease, confidence);

      // Get treatment and recommendations
      const treatment = this.getTreatment(disease);
      const recommendations = this.getRecommendations(disease, severity);

      // Clean up tensors
      tensor.dispose();
      prediction.dispose();

      console.log('Prediction completed:', { disease, confidence, severity });

      return {
        disease,
        confidence,
        severity,
        treatment,
        recommendations,
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private async preprocessImage(imageUri: string): Promise<tf.Tensor> {
    try {
      // Load image as tensor
      const response = await fetch(imageUri);
      const imageData = await response.arrayBuffer();
      
      // Decode image
      const imageTensor = tf.node.decodeImage(new Uint8Array(imageData), 3);
      
      // Resize to model input size (usually 224x224)
      const inputSize = this.modelInfo?.input_size || [224, 224, 3];
      const resized = tf.image.resizeBilinear(imageTensor, [inputSize[0], inputSize[1]]);
      
      // Normalize pixel values to [0, 1]
      const normalized = resized.div(255.0);
      
      // Add batch dimension
      const batched = normalized.expandDims(0);
      
      // Clean up intermediate tensors
      imageTensor.dispose();
      resized.dispose();
      normalized.dispose();
      
      return batched;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw error;
    }
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
      'Cassava Bacterial Blight (CBB)': 'Appliquer un traitement antibactérien et améliorer le drainage',
      'Cassava Brown Streak Disease (CBSD)': 'Utiliser des variétés tolérantes et surveiller régulièrement',
      'Cassava Green Mottle (CGM)': 'Éliminer les plants infectés et utiliser des variétés résistantes',
      'Cassava Mosaic Disease (CMD)': 'Utiliser des plants résistants et éliminer les plants infectés',
      'Healthy': 'Continuer les bonnes pratiques de culture',
    };

    return treatments[disease] || 'Consulter un expert agricole pour un diagnostic précis';
  }

  private getRecommendations(disease: string, severity: 'low' | 'moderate' | 'high'): string[] {
    const baseRecommendations: Record<string, string[]> = {
      'Cassava Bacterial Blight (CBB)': [
        'Améliorer le drainage du sol',
        'Éviter l\'arrosage excessif',
        'Appliquer un traitement antibactérien',
      ],
      'Cassava Brown Streak Disease (CBSD)': [
        'Utiliser des variétés tolérantes',
        'Surveiller régulièrement les symptômes',
        'Éliminer les plants gravement infectés',
      ],
      'Cassava Green Mottle (CGM)': [
        'Isoler les plants infectés',
        'Utiliser des variétés résistantes',
        'Améliorer la ventilation',
      ],
      'Cassava Mosaic Disease (CMD)': [
        'Éliminer immédiatement les plants infectés',
        'Utiliser des boutures saines',
        'Contrôler les vecteurs (mouches blanches)',
      ],
      'Healthy': [
        'Maintenir les bonnes pratiques',
        'Surveiller régulièrement',
        'Assurer une nutrition équilibrée',
      ],
    };

    let recommendations = baseRecommendations[disease] || [
      'Consulter un expert agricole',
      'Surveiller l\'évolution',
      'Appliquer les bonnes pratiques',
    ];

    // Add severity-specific recommendations
    if (severity === 'high') {
      recommendations.unshift('Action urgente requise');
    } else if (severity === 'moderate') {
      recommendations.push('Surveiller de près l\'évolution');
    }

    return recommendations;
  }

  async downloadModel(modelUrl: string): Promise<void> {
    try {
      console.log('Downloading model from:', modelUrl);
      
      const modelDir = `${FileSystem.documentDirectory}models/cassava_model/`;
      await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

      // Download model files
      const modelJsonUrl = `${modelUrl}/model.json`;
      const modelJsonPath = `${modelDir}model.json`;
      
      await FileSystem.downloadAsync(modelJsonUrl, modelJsonPath);
      
      // Download weights (assuming they follow TensorFlow.js naming convention)
      const weightsUrl = `${modelUrl}/weights.bin`;
      const weightsPath = `${modelDir}weights.bin`;
      
      await FileSystem.downloadAsync(weightsUrl, weightsPath);
      
      console.log('Model downloaded successfully');
    } catch (error) {
      console.error('Error downloading model:', error);
      throw error;
    }
  }

  getModelInfo(): ModelInfo | null {
    return this.modelInfo;
  }

  isModelReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
  }
}

export const modelService = ModelService.getInstance();