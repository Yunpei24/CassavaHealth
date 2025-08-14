-- =====================================================
-- CASSAVAHEALTH DATABASE SCHEMA
-- Version: 1.0.0
-- Compatible avec: Supabase Cloud et Self-hosted
-- =====================================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users (gérée automatiquement par Supabase Auth)
-- =====================================================
-- Cette table est automatiquement créée par Supabase Auth
-- Pas besoin de la créer manuellement

-- =====================================================
-- TABLE: cassava_analyses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cassava_analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    disease_detected text NOT NULL,
    confidence_score numeric(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    severity_level text CHECK (severity_level IN ('low', 'moderate', 'high')),
    treatment_recommendation text,
    recommendations jsonb DEFAULT '[]'::jsonb,
    analysis_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_user_id ON public.cassava_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_created_at ON public.cassava_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_disease ON public.cassava_analyses(disease_detected);

-- =====================================================
-- FONCTION: Mise à jour automatique du timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGER: Mise à jour automatique du timestamp
-- =====================================================
DROP TRIGGER IF EXISTS update_cassava_analyses_updated_at ON public.cassava_analyses;
CREATE TRIGGER update_cassava_analyses_updated_at
    BEFORE UPDATE ON public.cassava_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.cassava_analyses ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres analyses
CREATE POLICY "Users can view their own analyses" ON public.cassava_analyses
    FOR SELECT USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres analyses
CREATE POLICY "Users can insert their own analyses" ON public.cassava_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres analyses
CREATE POLICY "Users can update their own analyses" ON public.cassava_analyses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres analyses
CREATE POLICY "Users can delete their own analyses" ON public.cassava_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE: Configuration pour les images
-- =====================================================
-- Créer le bucket pour les images de cassava
INSERT INTO storage.buckets (id, name, public)
VALUES ('cassava-images', 'cassava-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de storage: Permettre l'upload d'images
CREATE POLICY "Users can upload their own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'cassava-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique de storage: Permettre la lecture des images
CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'cassava-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Politique de storage: Permettre la suppression des images
CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'cassava-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- DONNÉES DE TEST (optionnel)
-- =====================================================
-- Vous pouvez décommenter cette section pour insérer des données de test

/*
-- Insérer des analyses de test (nécessite un utilisateur authentifié)
INSERT INTO public.cassava_analyses (
    user_id,
    image_url,
    disease_detected,
    confidence_score,
    severity_level,
    treatment_recommendation,
    recommendations,
    analysis_metadata
) VALUES (
    auth.uid(), -- Remplacez par un UUID d'utilisateur valide
    'https://example.com/test-image.jpg',
    'Cassava Mosaic Disease (CMD)',
    0.92,
    'high',
    'Utiliser des plants résistants et éliminer les plants infectés',
    '["Isoler les plants infectés", "Appliquer un traitement préventif", "Surveiller régulièrement"]'::jsonb,
    '{"model_version": "1.0.0", "analysis_type": "local"}'::jsonb
);
*/

-- =====================================================
-- VUES UTILES (optionnel)
-- =====================================================

-- Vue: Statistiques par utilisateur
CREATE OR REPLACE VIEW user_analysis_stats AS
SELECT 
    user_id,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN disease_detected = 'Healthy' THEN 1 END) as healthy_count,
    COUNT(CASE WHEN disease_detected != 'Healthy' THEN 1 END) as diseased_count,
    AVG(confidence_score) as avg_confidence,
    MAX(created_at) as last_analysis_date
FROM public.cassava_analyses
GROUP BY user_id;

-- Vue: Analyses récentes
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
    id,
    user_id,
    disease_detected,
    confidence_score,
    severity_level,
    created_at
FROM public.cassava_analyses
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- =====================================================
-- FONCTIONS UTILES
-- =====================================================

-- Fonction: Obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid uuid)
RETURNS TABLE(
    total_analyses bigint,
    healthy_count bigint,
    diseased_count bigint,
    avg_confidence numeric,
    last_analysis_date timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN ca.disease_detected = 'Healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN ca.disease_detected != 'Healthy' THEN 1 END) as diseased_count,
        AVG(ca.confidence_score) as avg_confidence,
        MAX(ca.created_at) as last_analysis_date
    FROM public.cassava_analyses ca
    WHERE ca.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES SUR LES TABLES
-- =====================================================
COMMENT ON TABLE public.cassava_analyses IS 'Table principale stockant les analyses de maladies du manioc';
COMMENT ON COLUMN public.cassava_analyses.id IS 'Identifiant unique de l''analyse';
COMMENT ON COLUMN public.cassava_analyses.user_id IS 'Référence vers l''utilisateur qui a effectué l''analyse';
COMMENT ON COLUMN public.cassava_analyses.image_url IS 'URL de l''image analysée stockée dans Supabase Storage';
COMMENT ON COLUMN public.cassava_analyses.disease_detected IS 'Nom de la maladie détectée ou "Healthy"';
COMMENT ON COLUMN public.cassava_analyses.confidence_score IS 'Score de confiance de l''IA (0.0 à 1.0)';
COMMENT ON COLUMN public.cassava_analyses.severity_level IS 'Niveau de sévérité: low, moderate, high';
COMMENT ON COLUMN public.cassava_analyses.treatment_recommendation IS 'Recommandation de traitement textuelle';
COMMENT ON COLUMN public.cassava_analyses.recommendations IS 'Liste des recommandations au format JSON';
COMMENT ON COLUMN public.cassava_analyses.analysis_metadata IS 'Métadonnées de l''analyse (version du modèle, etc.)';

-- =====================================================
-- INSTRUCTIONS DE DÉPLOIEMENT
-- =====================================================
/*
INSTRUCTIONS POUR SUPABASE CLOUD:
1. Connectez-vous à votre dashboard Supabase
2. Allez dans l'éditeur SQL
3. Copiez-collez ce script complet
4. Exécutez le script

INSTRUCTIONS POUR SUPABASE SELF-HOSTED:
1. Connectez-vous à votre instance PostgreSQL
2. Exécutez ce script via psql ou votre client SQL préféré
3. Assurez-vous que l'extension uuid-ossp est disponible
4. Vérifiez que les politiques RLS sont bien activées

VÉRIFICATION POST-INSTALLATION:
- Vérifiez que la table cassava_analyses existe
- Testez l'insertion d'une analyse avec un utilisateur authentifié
- Vérifiez que les politiques RLS fonctionnent correctement
- Testez l'upload d'images dans le bucket cassava-images
*/