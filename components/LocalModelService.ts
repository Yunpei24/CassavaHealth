import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-platform-react-native';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import i18n from '@/utils/i18n';

export interface LocalAnalysisRequest {
  imageUri: string;
}

export interface LocalAnalysisResponse {
  disease: string;
  confidence: number;
  severity: 'Low' | 'Moderate' | 'High';
  treatment: string;
  recommendations: string[];
  timestamp: string;
}

export class LocalModelService {
  private static instance: LocalModelService;
  private model: tf.LayersModel | null = null;
  private labels: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): LocalModelService {
    if (!LocalModelService.instance) {
      LocalModelService.instance = new LocalModelService();
    }
    return LocalModelService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing TensorFlow.js...');
      await tf.ready();
      
      console.log('Loading model...');
      // Chargez votre modèle depuis le dossier assets
      // Remplacez par le chemin vers votre modèle
      const modelAsset = Asset.fromModule(require('../assets/models/cassava-model.json'));
      await modelAsset.downloadAsync();
      
      this.model = await tf.loadLayersModel(modelAsset.localUri!);
      console.log('Model loaded successfully');

      // Chargez les labels
      const labelsAsset = Asset.fromModule(require('../assets/models/labels.json'));
      await labelsAsset.downloadAsync();
      
      const response = await fetch(labelsAsset.localUri!);
      this.labels = await response.json();
      console.log('Labels loaded successfully');

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing local model:', error);
      throw new Error('Impossible d\'initialiser le modèle local');
    }
  }

  async preprocessImage(imageUri: string): Promise<tf.Tensor> {
    try {
      // Redimensionner et normaliser l'image
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }], // Ajustez selon votre modèle
        { compress: 1, format: SaveFormat.JPEG }
      );

      // Convertir l'image en tensor
      const response = await fetch(manipulatedImage.uri);
      const imageData = await response.arrayBuffer();
      const imageTensor = tf.node.decodeImage(new Uint8Array(imageData), 3);
      
      // Normaliser les pixels (0-255 -> 0-1)
      const normalized = imageTensor.cast('float32').div(255.0);
      
      // Ajouter une dimension batch
      const batched = normalized.expandDims(0);
      
      // Nettoyer les tensors intermédiaires
      imageTensor.dispose();
      normalized.dispose();
      
      return batched;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Erreur lors du prétraitement de l\'image');
    }
  }

  async analyzeImage(request: LocalAnalysisRequest): Promise<LocalAnalysisResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.model || !this.labels) {
      throw new Error('Modèle non initialisé');
    }

    try {
      console.log('Preprocessing image...');
      const inputTensor = await this.preprocessImage(request.imageUri);

      console.log('Running inference...');
      const predictions = this.model.predict(inputTensor) as tf.Tensor;
      const predictionData = await predictions.data();
      
      // Nettoyer les tensors
      inputTensor.dispose();
      predictions.dispose();

      // Trouver la classe avec la plus haute probabilité
      const maxIndex = predictionData.indexOf(Math.max(...Array.from(predictionData)));
      const confidence = predictionData[maxIndex];
      const predictedClass = this.labels.classes[maxIndex];

      console.log(`Predicted: ${predictedClass} with confidence: ${confidence}`);

      // Déterminer la sévérité basée sur la confiance
      let severity: 'Low' | 'Moderate' | 'High';
      if (confidence > 0.8) severity = 'High';
      else if (confidence > 0.6) severity = 'Moderate';
      else severity = 'Low';

      // Obtenir les traductions
      const diseaseKey = `diseases.${predictedClass}`;
      const disease = i18n.t(diseaseKey);
      const treatment = this.labels.treatments[predictedClass] || i18n.t(`diseases.treatments.${predictedClass}`);
      
      // Obtenir les recommandations traduites
      const recommendationKeys = this.labels.recommendations[predictedClass] || [];
      const recommendations = recommendationKeys.map((key: string) => 
        i18n.t(`diseases.recommendations.${key}`)
      );

      return {
        disease,
        confidence,
        severity,
        treatment,
        recommendations,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error during local analysis:', error);
      throw new Error('Erreur lors de l\'analyse locale');
    }
  }

  async getModelInfo(): Promise<{ isLoaded: boolean; inputShape?: number[]; outputShape?: number[] }> {
    if (!this.model) {
      return { isLoaded: false };
    }

    const inputShape = this.model.inputs[0].shape;
    const outputShape = this.model.outputs[0].shape;

    return {
      isLoaded: true,
      inputShape: inputShape ? Array.from(inputShape) : undefined,
      outputShape: outputShape ? Array.from(outputShape) : undefined,
    };
  }
}

export const localModelService = LocalModelService.getInstance();