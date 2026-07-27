-- Create saved_profiles table for businesses to save/favorite worker profiles
CREATE TABLE IF NOT EXISTS saved_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, worker_id)
);

-- RLS
ALTER TABLE saved_profiles ENABLE ROW LEVEL SECURITY;

-- Business can view their own saved profiles
CREATE POLICY "saved_profiles_select_own" ON saved_profiles
  FOR SELECT USING (auth.uid() = business_id);

-- Business can save profiles
CREATE POLICY "saved_profiles_insert_own" ON saved_profiles
  FOR INSERT WITH CHECK (auth.uid() = business_id);

-- Business can remove saved profiles
CREATE POLICY "saved_profiles_delete_own" ON saved_profiles
  FOR DELETE USING (auth.uid() = business_id);
