-- =====================================================
-- VIDEOnJOB - Complete Authentication Schema
-- Roles: admin, worker (candidate), business (company)
-- =====================================================

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'business', 'admin')) DEFAULT 'worker',
  display_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  video_reel_url TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  job_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view active profiles
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (is_active = true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- 2. BUSINESS_PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  company_logo_url TEXT,
  company_description TEXT,
  website TEXT,
  business_type TEXT,
  address TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view business profiles
CREATE POLICY "business_profiles_select_public" ON public.business_profiles
  FOR SELECT USING (true);

-- Business owners can insert their own
CREATE POLICY "business_profiles_insert_own" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Business owners can update their own
CREATE POLICY "business_profiles_update_own" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Business owners can delete their own
CREATE POLICY "business_profiles_delete_own" ON public.business_profiles
  FOR DELETE USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "business_profiles_admin_all" ON public.business_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- 3. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'full_time',
  position TEXT,
  description TEXT,
  requirements TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_display TEXT,
  location TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  start_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active jobs
CREATE POLICY "jobs_select_public" ON public.jobs
  FOR SELECT USING (is_active = true);

-- Business can insert their own jobs
CREATE POLICY "jobs_insert_own" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = business_id);

-- Business can update their own jobs
CREATE POLICY "jobs_update_own" ON public.jobs
  FOR UPDATE USING (auth.uid() = business_id);

-- Business can delete their own jobs
CREATE POLICY "jobs_delete_own" ON public.jobs
  FOR DELETE USING (auth.uid() = business_id);

-- Admins can do everything
CREATE POLICY "jobs_admin_all" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- 4. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Workers can see their own applications
CREATE POLICY "applications_select_worker" ON public.applications
  FOR SELECT USING (auth.uid() = worker_id);

-- Business can see applications for their jobs
CREATE POLICY "applications_select_business" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id AND jobs.business_id = auth.uid()
    )
  );

-- Workers can insert applications
CREATE POLICY "applications_insert_worker" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- Workers can update their own applications (withdraw)
CREATE POLICY "applications_update_worker" ON public.applications
  FOR UPDATE USING (auth.uid() = worker_id);

-- Business can update applications for their jobs (accept/reject)
CREATE POLICY "applications_update_business" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id AND jobs.business_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "applications_admin_all" ON public.applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );


-- 5. SAVED_JOBS TABLE
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_jobs_select_own" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_jobs_insert_own" ON public.saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_jobs_delete_own" ON public.saved_jobs
  FOR DELETE USING (auth.uid() = user_id);


-- 6. RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, job_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Everyone can view ratings
CREATE POLICY "ratings_select_public" ON public.ratings
  FOR SELECT USING (true);

-- Authenticated users can insert ratings
CREATE POLICY "ratings_insert_own" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Users can update their own ratings
CREATE POLICY "ratings_update_own" ON public.ratings
  FOR UPDATE USING (auth.uid() = from_user_id);


-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "messages_update_receiver" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);


-- 8. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'worker'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- If user_type is business, also create a business_profiles row
  IF COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'worker') = 'business' THEN
    INSERT INTO public.business_profiles (id, company_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- 9. TRIGGER: Update rating averages
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating = (SELECT COALESCE(AVG(score), 0) FROM public.ratings WHERE to_user_id = NEW.to_user_id),
    total_ratings = (SELECT COUNT(*) FROM public.ratings WHERE to_user_id = NEW.to_user_id),
    updated_at = NOW()
  WHERE id = NEW.to_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_rating_created ON public.ratings;

CREATE TRIGGER on_rating_created
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();


-- 10. TRIGGER: Updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS jobs_updated_at ON public.jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS applications_updated_at ON public.applications;
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 11. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON public.jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON public.applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON public.ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);
