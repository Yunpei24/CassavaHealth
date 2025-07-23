import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera, RotateCcw, Image as ImageIcon, X, Check } from 'lucide-react-native';
import { StorageService } from '@/components/StorageService';
import { localModelService } from '@/components/LocalModelService';
import { apiService } from '@/components/ApiService';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

export default function CameraScreen() {
  const { t } = useTranslation();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={80} color="#2D5016" />
          <Text style={styles.permissionTitle}>{t('camera.permissionTitle')}</Text>
          <Text style={styles.permissionMessage}>
            {t('camera.permissionMessage')}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('camera.grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert(t('common.error'), t('camera.errorTakingPhoto'));
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // Récupérer le mode d'analyse choisi par l'utilisateur
      const analysisMode = await StorageService.getAnalysisMode();
      
      let result;
      
      if (analysisMode === 'local') {
        console.log('Using local model for analysis...');
        result = await localModelService.analyzeImage({ imageUri: capturedImage });
      } else {
        console.log('Using API for analysis...');
        // Pour l'API, vous devrez convertir l'image en base64
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        result = await apiService.analyzeImage({ 
          image: base64.split(',')[1], // Enlever le préfixe data:image/...
          format: 'jpg' 
        });
      }
      
      // Mapper la sévérité si nécessaire
      const mappedResult = {
        ...result,
        severity: result.severity === 'Low' ? t('diseases.severity.low') :
                 result.severity === 'Moderate' ? t('diseases.severity.moderate') :
                 t('diseases.severity.high')
      };
      
      setAnalysisResult(mappedResult);
      
      // Sauvegarder l'analyse dans l'historique
      await StorageService.saveAnalysis({
        imageUri: capturedImage,
        disease: mappedResult.disease,
        confidence: mappedResult.confidence,
        severity: mappedResult.severity,
        treatment: mappedResult.treatment,
        recommendations: mappedResult.recommendations,
        timestamp: mappedResult.timestamp,
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(t('common.error'), t('camera.errorAnalyzing'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={SlideInUp} style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <TouchableOpacity onPress={resetCamera} style={styles.backButton}>
              <X size={24} color="#2D5016" />
            </TouchableOpacity>
            <Text style={styles.resultTitle}>{t('camera.analysisResult')}</Text>
          </View>

          <Image source={{ uri: capturedImage! }} style={styles.resultImage} />

          <View style={styles.resultCard}>
            <View style={styles.diseaseInfo}>
              <Text style={styles.diseaseName}>{analysisResult.disease}</Text>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceText}>
                  {t('camera.confidence')}: {Math.round(analysisResult.confidence * 100)}%
                </Text>
                <Text style={[styles.severityText, 
                  analysisResult.severity === t('diseases.severity.high') ? styles.severityHigh :
                  analysisResult.severity === t('diseases.severity.moderate') ? styles.severityMedium :
                  styles.severityLow
                ]}>
                  {t('camera.severity')}: {analysisResult.severity}
                </Text>
              </View>
            </View>

            <View style={styles.treatmentSection}>
              <Text style={styles.sectionTitle}>{t('camera.recommendedTreatment')}</Text>
              <Text style={styles.treatmentText}>{analysisResult.treatment}</Text>
            </View>

            <View style={styles.recommendationsSection}>
              <Text style={styles.sectionTitle}>{t('camera.recommendations')}</Text>
              {analysisResult.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Check size={16} color="#1F7A1F" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.newAnalysisButton} onPress={resetCamera}>
            <Text style={styles.newAnalysisButtonText}>{t('camera.newAnalysis')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View entering={FadeIn} style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={resetCamera} style={styles.backButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>{t('camera.verifyImage')}</Text>
          </View>

          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={resetCamera}>
              <Text style={styles.retakeButtonText}>{t('camera.retake')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.analyzeButtonText}>{t('camera.analyze')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>{t('camera.positionLeaf')}</Text>
            <Text style={styles.cameraSubtitle}>{t('camera.ensureLighting')}</Text>
            <Text style={styles.cameraModeIndicator}>
              {analysisMode === 'local' ? '📱 Local' : '🌐 API'}
            </Text>
          </View>

          <View style={styles.focusFrame} />

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <ImageIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FDF8',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2D5016',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  cameraSubtitle: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  cameraModeIndicator: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  focusFrame: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    right: '15%',
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 40,
  },
  previewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#2D5016',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F8FDF8',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5016',
    textAlign: 'center',
    marginRight: 40,
  },
  resultImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  resultCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  diseaseInfo: {
    marginBottom: 20,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceText: {
    fontSize: 14,
    color: '#1F7A1F',
    fontWeight: '600',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
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
  treatmentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  newAnalysisButton: {
    margin: 16,
    backgroundColor: '#2D5016',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newAnalysisButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});