-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "cvs_public_read" ON storage.objects;
DROP POLICY IF EXISTS "cvs_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "cvs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "cvs_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_public_read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "photos_auth_delete" ON storage.objects;

-- Policies for cvs bucket
CREATE POLICY "cvs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'cvs');
CREATE POLICY "cvs_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');
CREATE POLICY "cvs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');
CREATE POLICY "cvs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'cvs' AND auth.role() = 'authenticated');

-- Policies for logos bucket
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "logos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "logos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Policies for portfolio bucket  
CREATE POLICY "portfolio_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "portfolio_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');
CREATE POLICY "portfolio_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio' AND auth.role() = 'authenticated');
CREATE POLICY "portfolio_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

-- Policies for photos bucket (business photos)
CREATE POLICY "photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "photos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "photos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
