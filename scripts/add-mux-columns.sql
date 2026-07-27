-- Add Mux video columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
ADD COLUMN IF NOT EXISTS mux_upload_id TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none';

-- Add Mux video columns to business_profiles  
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
ADD COLUMN IF NOT EXISTS mux_upload_id TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none';

-- Add index for quick lookups by mux_asset_id (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_mux_asset_id ON public.profiles(mux_asset_id);
CREATE INDEX IF NOT EXISTS idx_bp_mux_asset_id ON public.business_profiles(mux_asset_id);
