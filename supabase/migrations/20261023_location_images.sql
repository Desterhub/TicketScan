-- Migration: 20261023_location_images.sql
-- Table for caching contextual origin and destination location images

CREATE TABLE IF NOT EXISTS location_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  generation_prompt TEXT,
  source TEXT CHECK (source IN ('ai_generated', 'curated_stock')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_images_key ON location_images(location_key);

-- Enable RLS
ALTER TABLE location_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to location images so all ticket views can render fast
CREATE POLICY "Allow public read access on location_images"
  ON location_images FOR SELECT
  USING (true);

-- Allow authenticated or service role inserts
CREATE POLICY "Allow insert on location_images"
  ON location_images FOR INSERT
  WITH CHECK (true);
