# Modèles de Computer Vision

Placez vos fichiers de modèle dans ce dossier.

## Format supporté
- **TensorFlow.js** : Fichiers `.json` (modèle) et `.bin` (poids)
- **TensorFlow Lite** : Fichiers `.tflite`

## Structure recommandée
```
assets/models/
├── cassava-model.json          # Modèle TensorFlow.js
├── cassava-model.bin           # Poids du modèle
├── labels.json                 # Labels des classes
└── README.md                   # Ce fichier
```

## Configuration des labels

Créez un fichier `labels.json` avec la structure suivante :

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
    "cassavaMosaicDisease": "Utiliser des plants résistants, éliminer les plants infectés",
    "cassavaBrownStreak": "Appliquer un traitement préventif, surveiller les symptômes",
    "cassavaBacterialBlight": "Traitement antibactérien, améliorer le drainage"
  },
  "recommendations": {
    "healthy": ["Continuer la surveillance", "Maintenir les bonnes pratiques"],
    "cassavaMosaicDisease": ["isolate", "preventiveTreatment", "regularMonitoring"],
    "cassavaBrownStreak": ["preventiveTreatment", "regularMonitoring", "removeInfected"],
    "cassavaBacterialBlight": ["improveVentilation", "reduceMoisture", "removeInfected"]
  }
}
```