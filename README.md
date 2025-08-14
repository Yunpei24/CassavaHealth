# CassavaHealth - Application de Détection des Maladies du Manioc

Une application mobile intelligente utilisant l'intelligence artificielle pour détecter les maladies du manioc à partir de photos de feuilles.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration du Modèle IA](#configuration-du-modèle-ia)
- [Configuration de la Base de Données](#configuration-de-la-base-de-données)
- [Mode Hors Ligne](#mode-hors-ligne)
- [Exécution de l'Application](#exécution-de-lapplication)
- [Déploiement](#déploiement)
- [Structure du Projet](#structure-du-projet)
- [Dépannage](#dépannage)

## 🚀 Fonctionnalités

- **Détection IA** : Analyse automatique des maladies du manioc
- **Mode Hors Ligne** : Fonctionnement sans connexion internet
- **Historique** : Sauvegarde locale et cloud des analyses
- **Multilingue** : Support français et anglais
- **Interface Intuitive** : Design moderne et accessible

## 📋 Prérequis

### Système
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Expo CLI** >= 6.0.0
- **Git**

### Pour le développement mobile
- **Android Studio** (pour Android)
- **Xcode** (pour iOS, macOS uniquement)

### Outils optionnels
- **Expo Dev Client** pour les tests sur appareil
- **EAS CLI** pour le déploiement

## 🛠 Installation

### 1. Cloner le Projet

```bash
git clone <url-du-repo>
cd cassava-health
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Installer Expo CLI (si pas déjà installé)

```bash
npm install -g @expo/cli
```

## 🤖 Configuration du Modèle IA

### 1. Préparation du Modèle TensorFlow

Après avoir entraîné votre modèle avec TensorFlow, vous devez le convertir pour une utilisation mobile :

```python
# Exemple de conversion du modèle
import tensorflow as tf

# Charger votre modèle entraîné
model = tf.keras.models.load_model('path/to/your/trained_model.h5')

# Convertir en TensorFlow Lite pour mobile
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Sauvegarder le modèle optimisé
with open('cassava_model.tflite', 'wb') as f:
    f.write(tflite_model)
```

### 2. Placement du Modèle

Créez le dossier et placez votre modèle :

```bash
mkdir -p assets/models
# Copiez votre fichier cassava_model.tflite dans assets/models/
cp path/to/your/cassava_model.tflite assets/models/
```

### 3. Configuration des Labels

Créez le fichier de labels correspondant à votre modèle :

```bash
# Créer le fichier de labels
touch assets/models/labels.json
```

Contenu du fichier `assets/models/labels.json` :

```json
{
  "labels": [
    "Cassava Bacterial Blight (CBB)",
    "Cassava Brown Streak Disease (CBSD)",
    "Cassava Green Mottle (CGM)",
    "Cassava Mosaic Disease (CMD)",
    "Healthy"
  ],
  "model_info": {
    "version": "1.0.0",
    "input_size": [224, 224, 3],
    "num_classes": 5,
    "accuracy": 0.95
  }
}
```

### 4. Installation des Dépendances IA

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow/tfjs-platform-react-native
```

## 🗄 Configuration de la Base de Données

### 1. Configuration Supabase (Mode Online)

#### Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé API

#### Importer le Schéma de Base de Données

1. Dans votre dashboard Supabase, allez dans l'éditeur SQL
2. Copiez le contenu du fichier `database/schema.sql`
3. Collez-le dans l'éditeur et exécutez le script
4. Vérifiez que la table `cassava_analyses` et les politiques RLS sont créées

#### Configuration des Variables d'Environnement

Copiez le fichier `.env.example` vers `.env` et configurez vos valeurs :

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos vraies valeurs :

```env
# Configuration Supabase Cloud
EXPO_PUBLIC_SUPABASE_MODE=cloud
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Configuration Supabase Self-hosted (optionnel)
EXPO_PUBLIC_SUPABASE_SELF_HOSTED_URL=https://your-selfhosted-supabase.com
EXPO_PUBLIC_SUPABASE_SELF_HOSTED_ANON_KEY=your-selfhosted-anon-key
```

### 2. Configuration Supabase Self-hosted (Optionnel)

#### Déployer Supabase Self-hosted

1. Suivez la [documentation officielle Supabase](https://supabase.com/docs/guides/self-hosting) pour déployer votre instance
2. Configurez PostgreSQL et les services Supabase
3. Importez le schéma avec le fichier `database/schema.sql`
4. Configurez les variables d'environnement pour pointer vers votre instance

#### Basculer entre Cloud et Self-hosted

**Via les variables d'environnement :**
```env
# Pour utiliser Supabase Cloud
EXPO_PUBLIC_SUPABASE_MODE=cloud

# Pour utiliser Supabase Self-hosted
EXPO_PUBLIC_SUPABASE_MODE=self-hosted
```

**Via l'interface de l'application :**
1. Allez dans Paramètres > Configuration Supabase
2. Sélectionnez la configuration désirée
3. L'application basculera automatiquement

### 3. Schéma de Base de Données

Le fichier `database/schema.sql` contient :
- **Table `cassava_analyses`** : Stockage des analyses
- **Politiques RLS** : Sécurité au niveau des lignes
- **Storage policies** : Gestion des images
- **Indexes** : Optimisation des performances
- **Fonctions utiles** : Statistiques et vues

**Structure principale :**
```sql
CREATE TABLE cassava_analyses (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    image_url text NOT NULL,
    disease_detected text NOT NULL,
    confidence_score numeric(3,2),
    severity_level text,
    treatment_recommendation text,
    recommendations jsonb,
    analysis_metadata jsonb,
    created_at timestamptz,
    updated_at timestamptz
);
```

### 2. Configuration SQLite (Mode Offline)

#### Installation des Dépendances

```bash
npm install expo-sqlite @react-native-async-storage/async-storage
```

## 📱 Mode Hors Ligne

L'application supporte un mode hors ligne complet avec :

### Fonctionnalités Offline
- **Modèle IA Local** : Analyse sans internet
- **Base de Données SQLite** : Stockage local des données
- **Synchronisation** : Sync automatique quand la connexion revient

### Configuration Automatique

L'application détecte automatiquement :
- La disponibilité d'internet
- La présence du modèle local
- L'état de la base de données

## 🚀 Exécution de l'Application

### 1. Mode Développement

#### Web
```bash
npm run dev
# ou
expo start --web
```

#### Mobile (Simulateur)
```bash
expo start
# Puis appuyez sur 'i' pour iOS ou 'a' pour Android
```

#### Mobile (Appareil Physique)
```bash
expo start
# Scannez le QR code avec l'app Expo Go
```

### 2. Build de Production

#### Web
```bash
npm run build:web
```

#### Mobile (avec EAS)
```bash
# Installer EAS CLI
npm install -g eas-cli

# Login EAS
eas login

# Configurer le projet
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## 🌐 Déploiement

### 1. Déploiement Web

#### Netlify
```bash
# Build
npm run build:web

# Déployer (après avoir configuré Netlify CLI)
netlify deploy --prod --dir=dist
```

#### Vercel
```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod
```

### 2. Déploiement Mobile

#### Google Play Store
```bash
# Build AAB
eas build --platform android --profile production

# Soumettre
eas submit --platform android
```

#### Apple App Store
```bash
# Build IPA
eas build --platform ios --profile production

# Soumettre
eas submit --platform ios
```

### 3. Configuration des Profils de Build

Fichier `eas.json` :

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 📁 Structure du Projet

```
cassava-health/
├── app/                          # Routes Expo Router
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── index.tsx            # Page d'accueil
│   │   ├── camera.tsx           # Analyse photo
│   │   ├── history.tsx          # Historique
│   │   ├── settings.tsx         # Paramètres
│   │   └── auth.tsx             # Authentification
│   └── _layout.tsx              # Layout racine
├── assets/                       # Ressources statiques
│   ├── models/                  # Modèles IA
│   │   ├── cassava_model.tflite # Modèle TensorFlow Lite
│   │   └── labels.json          # Labels du modèle
│   └── images/                  # Images
├── components/                   # Composants réutilisables
│   ├── AuthService.tsx          # Service d'authentification
│   ├── SupabaseService.ts       # Service Supabase
│   ├── OfflineService.ts        # Service hors ligne
│   └── ModelService.ts          # Service modèle IA
├── locales/                     # Traductions
│   ├── fr.json                  # Français
│   └── en.json                  # Anglais
├── utils/                       # Utilitaires
│   └── i18n.ts                  # Configuration i18n
├── supabase/                    # Configuration Supabase
│   └── migrations/              # Migrations DB
├── .env                         # Variables d'environnement
├── app.json                     # Configuration Expo
└── package.json                 # Dépendances
```

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur de Modèle IA
```bash
# Vérifier la présence du modèle
ls -la assets/models/

# Vérifier les permissions
chmod 644 assets/models/cassava_model.tflite
```

#### 2. Problème de Base de Données
```bash
# Réinitialiser la DB locale
rm -rf .expo/
expo start --clear
```

#### 3. Erreur de Build
```bash
# Nettoyer le cache
npm run clean
rm -rf node_modules
npm install
```

#### 4. Problème de Permissions Caméra
- Vérifiez les permissions dans `app.json`
- Testez sur un appareil physique

### Logs de Debug

#### Activer les Logs Détaillés
```bash
export EXPO_DEBUG=true
expo start
```

#### Logs du Modèle IA
Les logs du modèle sont visibles dans la console du développeur.

### Support

Pour obtenir de l'aide :
1. Vérifiez les [Issues GitHub](lien-vers-issues)
2. Consultez la [Documentation Expo](https://docs.expo.dev)
3. Rejoignez notre [Discord](lien-discord)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir `CONTRIBUTING.md` pour les guidelines.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025