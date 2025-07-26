import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CassavaAnalysis {
  id?: string;
  user_id?: string;
  image_url: string;
  disease_detected: string;
  confidence_score: number;
  severity_level?: string;
  treatment_recommendation?: string;
  recommendations?: string[];
  analysis_metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseService {
  static async uploadImage(imageUri: string, userId: string): Promise<string> {
    try {
      // Read the image file
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('cassava-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cassava-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Impossible d\'uploader l\'image');
    }
  }

  static async saveAnalysis(analysis: Omit<CassavaAnalysis, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CassavaAnalysis> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Insert analysis
      const { data, error } = await supabase
        .from('cassava_analyses')
        .insert({
          ...analysis,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  static async getAnalyses(): Promise<CassavaAnalysis[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Fetch user's analyses
      const { data, error } = await supabase
        .from('cassava_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching analyses:', error);
      throw error;
    }
  }

  static async deleteAnalysis(id: string): Promise<void> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Get analysis to delete associated image
      const { data: analysis, error: fetchError } = await supabase
        .from('cassava_analyses')
        .select('image_url')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching analysis:', fetchError);
        throw new Error('Analyse non trouvée');
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('cassava_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
      }

      // Delete image from storage if it exists
      if (analysis?.image_url) {
        try {
          const imagePath = analysis.image_url.split('/').pop();
          if (imagePath) {
            await supabase.storage
              .from('cassava-images')
              .remove([`${user.id}/${imagePath}`]);
          }
        } catch (storageError) {
          console.warn('Could not delete image from storage:', storageError);
          // Don't throw error for storage deletion failure
        }
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}