-- =====================================================
-- CAMARERO POR FAVOR - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This script creates all tables with proper relationships
-- for a production-ready hospitality job platform
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('worker', 'business', 'admin', 'superadmin');

-- User account status
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending_verification', 'deleted');

-- Main users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  role user_role NOT NULL DEFAULT 'worker',
  account_status account_status DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  fcm_token TEXT, -- Firebase Cloud Messaging token for push notifications
  google_id TEXT UNIQUE, -- Google OAuth ID
  avatar_url TEXT,
  full_name TEXT
);

-- =====================================================
-- 2. CATEGORIES & JOB TYPES
-- =====================================================

-- Job categories (Camarero, Chef, Sommelier, etc.)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT, -- English translation
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories (e.g., Camarero -> Sala, Barra)
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- =====================================================
-- 3. WORKER PROFILES
-- =====================================================

-- Experience level enum
CREATE TYPE experience_level AS ENUM ('sin_experiencia', '1-2_años', '3-5_años', '5-10_años', 'mas_de_10_años');

-- Availability enum
CREATE TYPE availability_type AS ENUM ('inmediata', '1_semana', '2_semanas', '1_mes', 'a_convenir');

-- Contract type preference
CREATE TYPE contract_preference AS ENUM ('indefinido', 'temporal', 'por_horas', 'freelance', 'cualquiera');

-- Worker profiles
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Location
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'España',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Professional info
  primary_category_id UUID REFERENCES public.categories(id),
  experience_level experience_level DEFAULT 'sin_experiencia',
  experience_years INTEGER DEFAULT 0,
  
  -- Availability
  availability availability_type DEFAULT 'a_convenir',
  contract_preference contract_preference DEFAULT 'cualquiera',
  expected_salary_min INTEGER, -- Monthly in EUR
  expected_salary_max INTEGER,
  willing_to_relocate BOOLEAN DEFAULT FALSE,
  
  -- Media
  avatar_url TEXT,
  video_presentation_url TEXT, -- Main video CV
  video_thumbnail_url TEXT, -- Thumbnail for video
  portfolio_images TEXT[], -- Array of image URLs
  
  -- Stats
  profile_views INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  identity_verified BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_looking_for_work BOOLEAN DEFAULT TRUE,
  profile_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker specializations (many-to-many with subcategories)
CREATE TABLE IF NOT EXISTS public.worker_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_profile_id, subcategory_id)
);

-- Worker languages
CREATE TABLE IF NOT EXISTS public.worker_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL, -- 'es', 'en', 'fr', etc.
  language_name TEXT NOT NULL,
  proficiency TEXT NOT NULL, -- 'básico', 'intermedio', 'avanzado', 'nativo'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_profile_id, language_code)
);

-- Worker certifications
CREATE TABLE IF NOT EXISTS public.worker_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. BUSINESS PROFILES
-- =====================================================

-- Business type enum
CREATE TYPE business_type AS ENUM ('restaurante', 'hotel', 'bar', 'catering', 'cafeteria', 'club', 'evento', 'otro');

-- Business profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  business_type business_type NOT NULL,
  cif TEXT UNIQUE, -- Tax ID
  description TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'España',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  phone TEXT,
  website TEXT,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[],
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Stats
  total_job_posts INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. JOB POSTS
-- =====================================================

-- Job status enum
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');

-- Job posts
CREATE TABLE IF NOT EXISTS public.job_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  -- Job details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.subcategories(id),
  
  -- Requirements
  experience_required experience_level DEFAULT 'sin_experiencia',
  contract_type contract_preference NOT NULL,
  
  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_period TEXT DEFAULT 'mensual', -- 'mensual', 'anual', 'por_hora'
  
  -- Location
  city TEXT NOT NULL,
  province TEXT,
  postal_code TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  
  -- Schedule
  start_date DATE,
  schedule_details TEXT,
  hours_per_week INTEGER,
  
  -- Status
  status job_status DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  
  -- Dates
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. APPLICATIONS
-- =====================================================

-- Application status enum
CREATE TYPE application_status AS ENUM ('pending', 'viewed', 'shortlisted', 'interview', 'rejected', 'accepted', 'withdrawn');

-- Job applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  
  -- Application details
  cover_letter TEXT,
  status application_status DEFAULT 'pending',
  
  -- Tracking
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(job_post_id, worker_profile_id)
);

-- =====================================================
-- 7. SAVED PROFILES & JOBS
-- =====================================================

-- Businesses save worker profiles
CREATE TABLE IF NOT EXISTS public.saved_worker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_profile_id, worker_profile_id)
);

-- Workers save job posts
CREATE TABLE IF NOT EXISTS public.saved_job_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_profile_id, job_post_id)
);

-- =====================================================
-- 8. MESSAGING SYSTEM
-- =====================================================

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Related to job application (optional)
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  
  -- Status
  is_archived_by_p1 BOOLEAN DEFAULT FALSE,
  is_archived_by_p2 BOOLEAN DEFAULT FALSE,
  
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(participant_1_id, participant_2_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT, -- 'image', 'document', 'video'
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. REVIEWS & RATINGS
-- =====================================================

-- Reviews (businesses review workers after hiring)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Response from reviewee
  response TEXT,
  responded_at TIMESTAMPTZ,
  
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(reviewer_id, reviewee_id, application_id)
);

-- =====================================================
-- 10. NOTIFICATIONS
-- =====================================================

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
  'new_message',
  'new_application',
  'application_status_change',
  'profile_view',
  'job_match',
  'review_received',
  'system_announcement'
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  related_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  
  -- Action URL
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Push notification
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. SUBSCRIPTION & PAYMENTS (Stripe)
-- =====================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER, -- in cents
  features JSONB, -- Array of features
  max_job_posts INTEGER,
  max_applications INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. ADMIN & MODERATION
-- =====================================================

-- Reported content
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- What is being reported
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reported_job_id UUID REFERENCES public.job_posts(id) ON DELETE CASCADE,
  reported_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Moderation
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  moderator_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_account_status ON public.users(account_status);

-- Worker profiles
CREATE INDEX idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_city ON public.worker_profiles(city);
CREATE INDEX idx_worker_profiles_primary_category ON public.worker_profiles(primary_category_id);
CREATE INDEX idx_worker_profiles_is_active ON public.worker_profiles(is_active);
CREATE INDEX idx_worker_profiles_is_looking ON public.worker_profiles(is_looking_for_work);

-- Business profiles
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_city ON public.business_profiles(city);
CREATE INDEX idx_business_profiles_type ON public.business_profiles(business_type);

-- Job posts
CREATE INDEX idx_job_posts_business_id ON public.job_posts(business_profile_id);
CREATE INDEX idx_job_posts_category ON public.job_posts(category_id);
CREATE INDEX idx_job_posts_status ON public.job_posts(status);
CREATE INDEX idx_job_posts_city ON public.job_posts(city);
CREATE INDEX idx_job_posts_published_at ON public.job_posts(published_at);

-- Applications
CREATE INDEX idx_applications_job_id ON public.applications(job_post_id);
CREATE INDEX idx_applications_worker_id ON public.applications(worker_profile_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- Messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Worker profiles: Public read, owner can update
CREATE POLICY "Worker profiles are publicly readable" ON public.worker_profiles
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Workers can update own profile" ON public.worker_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Business profiles: Public read, owner can update
CREATE POLICY "Business profiles are publicly readable" ON public.business_profiles
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Businesses can update own profile" ON public.business_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Job posts: Public read active jobs, business can manage own
CREATE POLICY "Active job posts are publicly readable" ON public.job_posts
  FOR SELECT USING (status = 'active');

CREATE POLICY "Businesses can manage own job posts" ON public.job_posts
  FOR ALL USING (
    business_profile_id IN (
      SELECT id FROM public.business_profiles WHERE user_id = auth.uid()
    )
  );

-- Applications: Only involved parties can see
CREATE POLICY "Workers can view own applications" ON public.applications
  FOR SELECT USING (
    worker_profile_id IN (
      SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Businesses can view applications to their jobs" ON public.applications
  FOR SELECT USING (
    job_post_id IN (
      SELECT jp.id FROM public.job_posts jp
      JOIN public.business_profiles bp ON jp.business_profile_id = bp.id
      WHERE bp.user_id = auth.uid()
    )
  );

-- Messages: Only conversation participants can access
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

-- Notifications: Users can only see own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_profiles_updated_at BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_posts_updated_at BEFORE UPDATE ON public.job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update worker rating when review is added
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.worker_profiles
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.reviews
      WHERE reviewee_id = (SELECT user_id FROM public.worker_profiles WHERE id = NEW.reviewee_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = (SELECT user_id FROM public.worker_profiles WHERE id = NEW.reviewee_id)
    )
  WHERE user_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worker_rating_trigger AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_worker_rating();

-- =====================================================
-- COMPLETED
-- =====================================================
