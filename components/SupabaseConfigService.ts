import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  mode: 'cloud' | 'self-hosted';
  name: string;
}

export class SupabaseConfigService {
  private static instance: SupabaseConfigService;
  private static readonly CONFIG_KEY = 'supabase_config';
  private currentClient: SupabaseClient | null = null;
  private currentConfig: SupabaseConfig | null = null;

  private constructor() {}

  static getInstance(): SupabaseConfigService {
    if (!SupabaseConfigService.instance) {
      SupabaseConfigService.instance = new SupabaseConfigService();
    }
    return SupabaseConfigService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Charger la configuration sauvegardée ou utiliser la configuration par défaut
      const savedConfig = await this.getSavedConfig();
      const config = savedConfig || this.getDefaultConfig();
      
      await this.switchToConfig(config);
      console.log(`Supabase initialized in ${config.mode} mode: ${config.name}`);
    } catch (error) {
      console.error('Error initializing Supabase config:', error);
      // Fallback vers la configuration par défaut
      const defaultConfig = this.getDefaultConfig();
      await this.switchToConfig(defaultConfig);
    }
  }

  private getDefaultConfig(): SupabaseConfig {
    const mode = process.env.EXPO_PUBLIC_SUPABASE_MODE || 'cloud';
    
    if (mode === 'self-hosted') {
      const selfHostedUrl = process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_URL;
      const selfHostedKey = process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_ANON_KEY;
      
      if (selfHostedUrl && selfHostedKey) {
        return {
          url: selfHostedUrl,
          anonKey: selfHostedKey,
          mode: 'self-hosted',
          name: 'Self-hosted Supabase'
        };
      }
    }
    
    return {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      mode: 'cloud',
      name: 'Supabase Cloud'
    };
  }

  async switchToConfig(config: SupabaseConfig): Promise<void> {
    try {
      // Créer un nouveau client Supabase
      this.currentClient = createClient(config.url, config.anonKey);
      this.currentConfig = config;
      
      // Sauvegarder la configuration
      await this.saveConfig(config);
      
      console.log(`Switched to ${config.mode}: ${config.name}`);
    } catch (error) {
      console.error('Error switching Supabase config:', error);
      throw error;
    }
  }

  async switchToCloud(): Promise<void> {
    const cloudConfig: SupabaseConfig = {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      mode: 'cloud',
      name: 'Supabase Cloud'
    };
    
    await this.switchToConfig(cloudConfig);
  }

  async switchToSelfHosted(url: string, anonKey: string, name?: string): Promise<void> {
    const selfHostedConfig: SupabaseConfig = {
      url,
      anonKey,
      mode: 'self-hosted',
      name: name || 'Self-hosted Supabase'
    };
    
    await this.switchToConfig(selfHostedConfig);
  }

  async testConnection(config?: SupabaseConfig): Promise<boolean> {
    try {
      const testConfig = config || this.currentConfig;
      if (!testConfig) return false;
      
      const testClient = createClient(testConfig.url, testConfig.anonKey);
      
      // Test simple de connexion
      const { error } = await testClient.from('cassava_analyses').select('count', { count: 'exact', head: true });
      
      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  getClient(): SupabaseClient {
    if (!this.currentClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.currentClient;
  }

  getCurrentConfig(): SupabaseConfig | null {
    return this.currentConfig;
  }

  async getAvailableConfigs(): Promise<SupabaseConfig[]> {
    const configs: SupabaseConfig[] = [];
    
    // Configuration Cloud
    if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      configs.push({
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        mode: 'cloud',
        name: 'Supabase Cloud'
      });
    }
    
    // Configuration Self-hosted
    if (process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_URL && process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_ANON_KEY) {
      configs.push({
        url: process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_SELF_HOSTED_ANON_KEY,
        mode: 'self-hosted',
        name: 'Self-hosted Supabase'
      });
    }
    
    // Configurations personnalisées sauvegardées
    const customConfigs = await this.getCustomConfigs();
    configs.push(...customConfigs);
    
    return configs;
  }

  async addCustomConfig(config: SupabaseConfig): Promise<void> {
    try {
      const customConfigs = await this.getCustomConfigs();
      customConfigs.push(config);
      await AsyncStorage.setItem('custom_supabase_configs', JSON.stringify(customConfigs));
    } catch (error) {
      console.error('Error saving custom config:', error);
      throw error;
    }
  }

  private async getCustomConfigs(): Promise<SupabaseConfig[]> {
    try {
      const data = await AsyncStorage.getItem('custom_supabase_configs');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading custom configs:', error);
      return [];
    }
  }

  private async saveConfig(config: SupabaseConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(SupabaseConfigService.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  private async getSavedConfig(): Promise<SupabaseConfig | null> {
    try {
      const data = await AsyncStorage.getItem(SupabaseConfigService.CONFIG_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading saved config:', error);
      return null;
    }
  }
}

export const supabaseConfigService = SupabaseConfigService.getInstance();