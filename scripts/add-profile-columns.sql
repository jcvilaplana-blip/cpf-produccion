-- Add CV and additional video columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS cv_filename TEXT,
ADD COLUMN IF NOT EXISTS additional_videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to business_profiles for consistency
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id),
ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.cv_url IS 'URL to PDF CV file stored in Supabase Storage';
COMMENT ON COLUMN profiles.cv_filename IS 'Original filename of the uploaded CV';
COMMENT ON COLUMN profiles.additional_videos IS 'Array of additional video objects [{url, mux_playback_id, title}]';
COMMENT ON COLUMN business_profiles.additional_images IS 'Array of additional image URLs for portfolio';
