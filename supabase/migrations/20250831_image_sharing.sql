-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('image_uploads', 'image_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow public access to images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'image_uploads');

-- Create policy to allow authenticated uploads
CREATE POLICY "Authenticated Users Can Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'image_uploads' AND auth.role() = 'authenticated');

-- Create shared_images table
CREATE TABLE IF NOT EXISTS shared_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  short_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS image_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES shared_images(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on short_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_shared_images_short_id ON shared_images(short_id);

-- Enable Row Level Security
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_images
CREATE POLICY "Public Read Access for shared_images" 
  ON shared_images FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated Users Can Insert shared_images" 
  ON shared_images FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create policies for image_comments
CREATE POLICY "Public Read Access for image_comments" 
  ON image_comments FOR SELECT 
  USING (true);

CREATE POLICY "Public Insert Access for image_comments" 
  ON image_comments FOR INSERT 
  WITH CHECK (true);

-- Function to generate a short ID for image links
CREATE OR REPLACE FUNCTION generate_image_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
  rand_index INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    rand_index := floor(random() * length(chars) + 1);
    result := result || substr(chars, rand_index, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new shared image
CREATE OR REPLACE FUNCTION create_shared_image(
  p_title TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_storage_path TEXT
)
RETURNS TABLE (
  id UUID,
  short_id TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT
) AS $$
DECLARE
  v_short_id TEXT;
  v_image_id UUID;
BEGIN
  -- Generate a unique short ID
  LOOP
    v_short_id := generate_image_short_id();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM shared_images WHERE short_id = v_short_id);
  END LOOP;
  
  -- Create the shared image
  INSERT INTO shared_images (title, description, image_url, storage_path, short_id)
  VALUES (
    p_title,
    p_description,
    p_image_url,
    p_storage_path,
    v_short_id
  )
  RETURNING id, short_id, title, description, image_url INTO v_image_id, v_short_id, p_title, p_description, p_image_url;
  
  RETURN QUERY SELECT v_image_id, v_short_id, p_title, p_description, p_image_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get image with comments by short_id
CREATE OR REPLACE FUNCTION get_image_with_comments(p_short_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_image_id UUID;
  v_result JSON;
BEGIN
  -- Get the image ID
  SELECT id INTO v_image_id
  FROM shared_images
  WHERE short_id = p_short_id;
  
  -- If no image found, return null
  IF v_image_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the image with its comments
  SELECT 
    json_build_object(
      'id', img.id,
      'title', img.title,
      'description', img.description,
      'image_url', img.image_url,
      'short_id', img.short_id,
      'created_at', img.created_at,
      'comments', (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'content', c.content,
            'author_name', c.author_name,
            'created_at', c.created_at
          )
        )
        FROM image_comments c
        WHERE c.image_id = img.id
        ORDER BY c.created_at DESC
      )
    ) INTO v_result
  FROM shared_images img
  WHERE img.id = v_image_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
