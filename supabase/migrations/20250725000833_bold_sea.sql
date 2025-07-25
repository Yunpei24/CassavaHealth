/*
  # Create cassava analysis tables

  1. New Tables
    - `cassava_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `image_url` (text, URL to stored image)
      - `disease_detected` (text, name of detected disease)
      - `confidence_score` (decimal, confidence percentage 0-1)
      - `severity_level` (text, severity: low/moderate/high)
      - `treatment_recommendation` (text, recommended treatment)
      - `recommendations` (jsonb, array of recommendations)
      - `analysis_metadata` (jsonb, additional analysis data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create bucket for cassava images
    - Set up RLS policies for secure access

  3. Security
    - Enable RLS on `cassava_analyses` table
    - Add policies for authenticated users to manage their own data
    - Configure storage bucket policies
*/

-- Create the cassava_analyses table
CREATE TABLE IF NOT EXISTS cassava_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  disease_detected text NOT NULL,
  confidence_score decimal(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  severity_level text CHECK (severity_level IN ('low', 'moderate', 'high')),
  treatment_recommendation text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  analysis_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cassava_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for cassava_analyses
CREATE POLICY "Users can view their own analyses"
  ON cassava_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON cassava_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON cassava_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON cassava_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for cassava images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cassava-images', 'cassava-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cassava-images bucket
CREATE POLICY "Users can upload their own images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cassava-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'cassava-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cassava-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cassava-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_user_id ON cassava_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_created_at ON cassava_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cassava_analyses_disease ON cassava_analyses(disease_detected);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cassava_analyses_updated_at
  BEFORE UPDATE ON cassava_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();