const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .json to asset extensions
config.resolver.assetExts.push('json', 'tflite');

module.exports = config;