-- =====================================================
-- ADD MISSING COLUMNS per PDF spec
-- profiles: specialties, contract_type_sought, availability_status,
--           portfolio_images, certificates, badges, points, level
-- jobs: work_schedule, experience_required, benefits, vacancies,
--       is_flash, is_highlighted, flash_expires_at, highlight_expires_at
-- business_profiles: photos, video_url, service_description,
--                    avg_salary_range, hiring_history_count, badges, points, level
-- =====================================================

-- PROFILES: extra fields for worker profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contract_type_sought text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS portfolio_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certificates jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;

-- JOBS: extra fields per PDF spec
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS work_schedule text,
  ADD COLUMN IF NOT EXISTS experience_required text,
  ADD COLUMN IF NOT EXISTS benefits text,
  ADD COLUMN IF NOT EXISTS vacancies integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_flash boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS highlight_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS start_date_text text,
  ADD COLUMN IF NOT EXISTS uniform_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS languages_required text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tpv_required boolean DEFAULT false;

-- BUSINESS_PROFILES: extra fields per PDF spec
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS service_description text,
  ADD COLUMN IF NOT EXISTS avg_salary_range text,
  ADD COLUMN IF NOT EXISTS hiring_history_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone text;

-- RATINGS: add detailed criteria columns
ALTER TABLE public.ratings
  ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT '{}';
