-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pinshots table
CREATE TABLE IF NOT EXISTS pinshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image TEXT NOT NULL, -- Base64 encoded image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pinshot_id UUID NOT NULL REFERENCES pinshots(id) ON DELETE CASCADE,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  color TEXT DEFAULT '#FF4D4F',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create share_links table with expiration support
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  short_id TEXT NOT NULL UNIQUE, -- For short URLs
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on expires_at for efficient querying of expired links
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);

-- Create index on short_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_share_links_short_id ON share_links(short_id);

-- Create RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access to share_links for viewing shared projects
CREATE POLICY "Allow anonymous access to share_links" 
  ON share_links FOR SELECT 
  USING (
    -- Only allow access to non-expired links or links with no expiration
    expires_at IS NULL OR expires_at > NOW()
  );

-- Create function to check if a share link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(link_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM share_links
    WHERE id = link_id
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate a short ID for share links
CREATE OR REPLACE FUNCTION generate_short_id()
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

-- Create function to create a new share link
CREATE OR REPLACE FUNCTION create_share_link(
  p_project_id UUID,
  p_expiration_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  short_id TEXT,
  url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_short_id TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_share_link_id UUID;
  v_url TEXT;
BEGIN
  -- Generate a unique short ID
  LOOP
    v_short_id := generate_short_id();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM share_links WHERE short_id = v_short_id);
  END LOOP;
  
  -- Calculate expiration date if provided
  IF p_expiration_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expiration_days || ' days')::INTERVAL;
  END IF;
  
  -- Create the share link
  INSERT INTO share_links (project_id, short_id, url, expires_at)
  VALUES (
    p_project_id,
    v_short_id,
    'https://pinner-app.vercel.app/view/' || v_short_id,
    v_expires_at
  )
  RETURNING id, short_id, url, expires_at INTO v_share_link_id, v_short_id, v_url, v_expires_at;
  
  RETURN QUERY SELECT v_share_link_id, v_short_id, v_url, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get project by share link
CREATE OR REPLACE FUNCTION get_project_by_share_link(p_short_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_project_id UUID;
  v_result JSON;
BEGIN
  -- Check if the share link exists and is not expired
  SELECT project_id INTO v_project_id
  FROM share_links
  WHERE short_id = p_short_id
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- If no valid share link found, return null
  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the project with its pinshots and pins
  SELECT 
    json_build_object(
      'id', p.id,
      'name', p.name,
      'pinshots', (
        SELECT json_agg(
          json_build_object(
            'id', ps.id,
            'name', ps.name,
            'image', ps.image,
            'pins', (
              SELECT json_agg(
                json_build_object(
                  'id', pin.id,
                  'x', pin.x,
                  'y', pin.y,
                  'comment', pin.comment,
                  'status', pin.status,
                  'color', pin.color
                )
              )
              FROM pins pin
              WHERE pin.pinshot_id = ps.id
            )
          )
        )
        FROM pinshots ps
        WHERE ps.project_id = p.id
      )
    ) INTO v_result
  FROM projects p
  WHERE p.id = v_project_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
