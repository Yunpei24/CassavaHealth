# CassavaHealth - Application de Détection des Maladies du Cassava

Une application mobile intelligente utilisant l'intelligence artificielle pour détecter les maladies des feuilles de cassava (manioc) et aider les agriculteurs à maintenir des cultures saines. L'application supporte deux modes d'analyse : **modèle local intégré** (hors ligne) et **API externe** (en ligne).

## 🌱 Fonctionnalités

- **Double mode d'analyse** : Choisissez entre modèle local (hors ligne) ou API externe (en ligne)
- **Analyse en temps réel** : Prenez une photo d'une feuille de cassava et obtenez un diagnostic instantané
- **Import d'images** : Analysez des photos existantes depuis votre galerie
- **Historique complet** : Suivez toutes vos analyses précédentes avec statistiques
- **Guide des maladies** : Informations détaillées sur les maladies courantes du cassava
- **Multilingue** : Interface disponible en français et anglais
- **Conseils de traitement** : Recommandations personnalisées pour chaque maladie détectée

## 🚀 Installation et Configuration

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI installé globalement : `npm install -g @expo/cli`
- Application Expo Go sur votre téléphone mobile

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd cassava-health
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'API**

Si vous souhaitez utiliser le mode API, modifiez le fichier `.env` à la racine du projet :

```env
# URL de votre API de détection des maladies du cassava
EXPO_PUBLIC_API_URL=https://votre-api-cassava.com

# Clé d'authentification pour votre API (si nécessaire)
EXPO_PUBLIC_API_KEY=votre_cle_api_secrete
```

4. **Configuration du modèle local (optionnel)**

Si vous souhaitez utiliser un modèle local :

a. **Convertissez votre modèle** en format TensorFlow.js :
```bash
# Si vous avez un modèle TensorFlow/Keras
tensorflowjs_converter --input_format=keras your_model.h5 assets/models/

# Si vous avez un modèle TensorFlow SavedModel
tensorflowjs_converter --input_format=tf_saved_model your_saved_model/ assets/models/
```

b. **Placez les fichiers du modèle** dans `assets/models/` :
```
assets/models/
├── cassava-model.json    # Modèle TensorFlow.js
├── cassava-model.bin     # Poids du modèle
└── labels.json          # Configuration des labels
```

c. **Créez le fichier `labels.json`** :
```json
{
  "classes": [
    "healthy",
    "cassavaMosaicDisease", 
    "cassavaBrownStreak",
    "cassavaBacterialBlight"
  ],
  "treatments": {
    "healthy": "Aucun traitement nécessaire",
    "cassavaMosaicDisease": "Utiliser des plants résistants, éliminer les plants infectés"
  },
  "recommendations": {
    "healthy": ["regularMonitoring"],
    "cassavaMosaicDisease": ["isolate", "preventiveTreatment", "regularMonitoring"]
  }
}
```

5. **Lancer l'application en mode développement**
```bash
npm run dev
```

6. **Scanner le QR code**
   - Ouvrez l'application **Expo Go** sur votre téléphone
   - Scannez le QR code affiché dans votre terminal
   - L'application se lancera automatiquement sur votre téléphone

## 🔄 Basculer entre les modes d'analyse

L'utilisateur peut choisir le mode d'analyse dans les **Paramètres** de l'application :

1. Ouvrez l'onglet **"Paramètres"**
2. Dans la section **"Analyse"**, activez/désactivez **"Mode d'analyse"**
   - **Activé** : Utilise le modèle local (hors ligne)
   - **Désactivé** : Utilise l'API externe (en ligne)
3. Le mode choisi est sauvegardé automatiquement

## ⚙️ Configuration pour Usage Réel

### 1. Configuration du Modèle Local

**Fichier : `components/LocalModelService.ts`**

```typescript
// Modifiez ces lignes pour pointer vers vos fichiers de modèle
const modelAsset = Asset.fromModule(require('../assets/models/votre-modele.json'));
const labelsAsset = Asset.fromModule(require('../assets/models/votre-labels.json'));

// Ajustez la taille d'entrée selon votre modèle
[{ resize: { width: 224, height: 224 } }] // Changez 224x224 si nécessaire
```

### 1. Configuration de l'API

Pour connecter l'application à votre modèle de computer vision, vous devez modifier le service API :

**Fichier : `components/ApiService.ts`**

```typescript
// Remplacez cette URL par l'endpoint de votre API
private baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://votre-api.com';

// Modifiez la méthode analyzeImage selon votre format d'API
async analyzeImage(request: AnalysisRequest): Promise<AnalysisResponse> {
  const response = await fetch(`${this.baseUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
      'Accept-Language': i18n.language,
    },
    body: JSON.stringify({
      image: request.image, // Image en base64
      format: request.format || 'jpg'
    }),
  });

  return await response.json();
}
```

### 2. Format des Données API

Votre API doit retourner une réponse au format suivant :

```json
{
  "disease": "Cassava Mosaic Disease",
  "confidence": 0.94,
  "severity": "Moderate",
  "treatment": "Utiliser des plants résistants, éliminer les plants infectés",
  "recommendations": [
    "Isoler les plants infectés",
    "Appliquer un traitement préventif",
    "Surveiller régulièrement"
  ],
  "timestamp": "2025-01-15T14:30:00Z"
}
```

### 3. Personnalisation des Maladies (pour les deux modes)

Modifiez les fichiers de traduction pour ajouter vos propres maladies :

**Fichiers : `locales/fr.json` et `locales/en.json`**

```json
{
  "diseases": {
    "healthy": "Sain",
    "votreMaladie1": "Nom de votre maladie 1",
    "votreMaladie2": "Nom de votre maladie 2",
    "descriptions": {
      "votreMaladie1": "Description de la maladie 1"
    },
    "treatments": {
      "votreMaladie1": "Traitement recommandé pour la maladie 1"
    }
  }
}
```

### 4. Configuration des Couleurs et Thème

Modifiez les couleurs dans les fichiers de style pour correspondre à votre marque :

```typescript
// Couleurs principales
const colors = {
  primary: '#2D5016',    // Vert cassava
  secondary: '#E07A3F',  // Orange terre
  accent: '#F4E4BC',     // Beige
  success: '#1F7A1F',    // Vert succès
  warning: '#E07A3F',    // Orange avertissement
  error: '#DC2626'       // Rouge erreur
};
```

## 📱 Build et Déploiement

### Build pour Production

1. **Build web**
```bash
npm run build:web
```

2. **Build pour les stores (nécessite Expo EAS)**
```bash
# Installer EAS CLI
npm install -g eas-cli

# Configurer EAS
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

### Variables d'Environnement de Production

Créez un fichier `.env.production` :

```env
EXPO_PUBLIC_API_URL=https://votre-api-production.com
EXPO_PUBLIC_API_KEY=votre_cle_production
```

## 🔧 Développement

### Dépendances Principales

**Pour le mode API :**
- `expo-camera` : Accès à la caméra
- `expo-image-picker` : Sélection d'images
- `react-i18next` : Internationalisation

**Pour le mode local :**
- `@tensorflow/tfjs` : Exécution des modèles TensorFlow.js
- `@tensorflow/tfjs-react-native` : Support React Native
- `expo-image-manipulator` : Prétraitement des images
- `expo-gl` : Support WebGL pour TensorFlow.js

### Structure du Projet

```
├── app/                    # Pages de l'application (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Page d'accueil
│   │   ├── camera.tsx     # Interface caméra
│   │   ├── history.tsx    # Historique des analyses
│   │   └── settings.tsx   # Paramètres
│   └── _layout.tsx        # Layout racine
├── components/            # Composants réutilisables
│   ├── ApiService.ts      # Service API
│   ├── LocalModelService.ts # Service modèle local
│   └── StorageService.ts  # Stockage local
├── assets/models/         # Modèles de computer vision
│   ├── cassava-model.json # Modèle TensorFlow.js
│   ├── cassava-model.bin  # Poids du modèle
│   └── labels.json        # Configuration des labels
├── locales/              # Fichiers de traduction
│   ├── fr.json           # Traductions françaises
│   └── en.json           # Traductions anglaises
├── utils/                # Utilitaires
│   └── i18n.ts           # Configuration i18n
└── types/                # Types TypeScript
    └── env.d.ts          # Types d'environnement
```

### Scripts Disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build:web    # Build pour le web
npm run lint         # Vérifier le code
```

## 🐛 Dépannage

### Problèmes Courants

1. **Modèle local ne se charge pas**
   - Vérifiez que les fichiers sont dans `assets/models/`
   - Vérifiez que les chemins dans `LocalModelService.ts` sont corrects
   - Consultez les logs pour voir les erreurs de chargement

2. **Erreur "Metro bundler" avec TensorFlow.js**
   - Redémarrez le serveur Metro : `npx expo start --clear`
   - Vérifiez que toutes les dépendances TensorFlow.js sont installées

1. **QR code non visible**
   - Vérifiez que `npm run dev` est en cours d'exécution
   - Redémarrez le serveur avec `Ctrl+C` puis `npm run dev`

2. **Erreur de connexion API**
   - Vérifiez que `EXPO_PUBLIC_API_URL` est correctement configuré
   - Testez votre API avec un outil comme Postman

3. **Problème de langue**
   - Vérifiez que les fichiers de traduction sont complets
   - Redémarrez l'application après modification des traductions

4. **Erreur de caméra**
   - Accordez les permissions caméra sur votre téléphone
   - Testez sur un appareil physique (la caméra ne fonctionne pas sur simulateur)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou soumettre une pull request.

## 📞 Support

Pour toute question ou problème, contactez [votre-email@example.com]

---

**CassavaHealth** - Aidons les agriculteurs à maintenir des cultures saines grâce à l'intelligence artificielle 🌱