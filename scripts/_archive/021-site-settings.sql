-- Create site_settings table for storing editable content like terms and privacy policy
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default entries
INSERT INTO site_settings (key, value) VALUES 
  ('terms_content', NULL),
  ('privacy_content', NULL),
  ('app_name', 'VideOnJob'),
  ('contact_email', 'admin@videonjob.es'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- Grant access
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading (public access for terms/privacy)
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Policy for admins to update
CREATE POLICY "Admins can update site settings" ON site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.rol IN (1, 2))
    )
  );
