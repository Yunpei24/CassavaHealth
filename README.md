# CassavaHealth - Application de Détection des Maladies du Cassava

Une application mobile intelligente utilisant l'intelligence artificielle pour détecter les maladies des feuilles de cassava (manioc) et aider les agriculteurs à maintenir des cultures saines.

## 🌱 Fonctionnalités

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

Modifiez le fichier `.env` à la racine du projet :

```env
# URL de votre API de détection des maladies du cassava
EXPO_PUBLIC_API_URL=https://votre-api-cassava.com

# Clé d'authentification pour votre API (si nécessaire)
EXPO_PUBLIC_API_KEY=votre_cle_api_secrete
```

4. **Lancer l'application en mode développement**
```bash
npm run dev
```

5. **Scanner le QR code**
   - Ouvrez l'application **Expo Go** sur votre téléphone
   - Scannez le QR code affiché dans votre terminal
   - L'application se lancera automatiquement sur votre téléphone

## ⚙️ Configuration pour Usage Réel

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

### 3. Personnalisation des Maladies

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
│   └── StorageService.ts  # Stockage local
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