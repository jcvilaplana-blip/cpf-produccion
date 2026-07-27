-- =====================================================
-- CAMARERO POR FAVOR (CPF) - CONSOLIDATED SCHEMA
-- =====================================================
-- Single source of truth for a fresh/empty Supabase project.
-- Supersedes every other script in this folder: the 001_*/005_*
-- drafts used a different, abandoned table-naming scheme
-- (users/worker_profiles/job_posts/...) that the live application
-- code never queries. This file matches exactly what the app's
-- API routes, server actions and components reference today.
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS /
-- ON CONFLICT DO NOTHING).
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- 1. PROFILES (shared by workers, businesses and admins)
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null default 'worker', -- 'worker' | 'business' | 'admin'
  is_admin boolean not null default false,  -- authoritative admin flag (see lib/admin-auth.ts)
  rol integer,                              -- legacy/informational: 1=superadmin, 2=worker, 3=business
  display_name text not null default '',
  email text,
  phone text,
  location text,
  bio text,
  avatar_url text,
  video_reel_url text,
  phone_verified boolean default false,

  rating numeric(3,2) default 0,
  total_ratings integer default 0,

  job_category text,
  job_subcategory text,
  category_id uuid,
  subcategory_id uuid,
  custom_subcategory text,

  is_active boolean default true,
  specialties text[] default '{}',
  contract_type_sought text[] default '{}',
  availability_status text default 'available', -- available | busy | not_looking

  portfolio_images text[] default '{}',
  certificates jsonb default '[]',
  badges text[] default '{}',
  points integer default 0,
  level integer default 1,
  experience_years integer default 0,
  languages jsonb default '[]', -- [{ language, level }]

  is_premium boolean default false,
  premium_expires_at timestamptz,
  subscription_tier text,

  mux_asset_id text,
  mux_playback_id text,
  mux_upload_id text,
  video_status text default 'none', -- none | uploading | processing | ready | errored
  cv_url text,
  cv_filename text,
  additional_videos jsonb default '[]',

  profile_completed boolean default false,
  latitude numeric(10, 8),
  longitude numeric(11, 8),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 2. CATEGORIES / SUBCATEGORIES / LOCATION REFERENCE DATA
-- =====================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer default 0,
  role_type text not null default 'candidate' check (role_type in ('candidate','business')),
  created_at timestamptz default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  unique(category_id, slug)
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  name_en text,
  flag text,
  phone_prefix text,
  currency text default 'EUR',
  is_active boolean default true,
  sort_order integer default 0
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete cascade,
  name text,
  name_en text,
  region text,
  latitude numeric,
  longitude numeric,
  is_active boolean default true,
  sort_order integer default 0
);

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  native_name text,
  flag text,
  is_active boolean default true,
  sort_order integer default 0
);

-- Now that categories/subcategories exist, wire up the FKs on profiles
alter table public.profiles
  add constraint profiles_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null;
alter table public.profiles
  add constraint profiles_subcategory_id_fkey foreign key (subcategory_id) references public.subcategories(id) on delete set null;

-- =====================================================
-- 3. BUSINESS PROFILES
-- =====================================================

create table if not exists public.business_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null default '',
  company_logo_url text,
  company_description text,
  website text,
  business_type text, -- restaurante | hotel | bar | catering | cafeteria | club | evento | otro
  address text,
  city text,
  custom_subcategory text,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  latitude numeric(10, 8),
  longitude numeric(11, 8),

  verified boolean default false,
  subscription_plan text default 'free',
  subscription_expires_at timestamptz,

  photos text[] default '{}',
  additional_images jsonb default '[]',
  video_url text,
  service_description text,
  avg_salary_range text,
  hiring_history_count integer default 0,

  badges text[] default '{}',
  points integer default 0,
  level integer default 1,
  is_premium boolean default false,
  premium_expires_at timestamptz,

  phone text,
  email text,
  phone_verified boolean default false,
  mux_asset_id text,
  mux_playback_id text,
  mux_upload_id text,
  video_status text default 'none',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 4. JOBS
-- =====================================================

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  category text not null,
  contract_type text not null default 'full_time',
  job_type text,
  position text,
  description text,
  requirements text,

  salary_min numeric,
  salary_max numeric,
  salary_display text,

  location text,
  city text,
  latitude numeric,
  longitude numeric,

  start_date timestamptz,
  start_date_text text,
  work_schedule text,
  experience_required text,
  benefits text,
  vacancies integer default 1,

  is_active boolean default true,
  views integer default 0,

  is_flash boolean default false,
  is_highlighted boolean default false,
  flash_expires_at timestamptz,
  highlight_expires_at timestamptz,
  image_url text,

  uniform_required boolean default false,
  languages_required text[] default '{}',
  tpv_required boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- 5. APPLICATIONS / SAVED JOBS / SAVED PROFILES
-- =====================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  cv_url text,
  cover_letter text,
  status text not null default 'pending', -- pending | accepted | rejected | withdrawn
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, worker_id)
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

create table if not exists public.saved_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(business_id, worker_id)
);

-- A worker (or anyone) following/favoriting a business from its profile page.
-- Opposite direction from saved_profiles above (business saving a worker).
create table if not exists public.saved_businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, business_id)
);
alter table public.saved_businesses enable row level security;
create policy saved_businesses_select_own on public.saved_businesses for select using (auth.uid() = user_id);
create policy saved_businesses_insert_own on public.saved_businesses for insert with check (auth.uid() = user_id);
create policy saved_businesses_delete_own on public.saved_businesses for delete using (auth.uid() = user_id);

-- =====================================================
-- 6. RATINGS
-- =====================================================

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  score integer not null check (score between 1 and 5),
  comment text,
  criteria jsonb default '{}',
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id, job_id)
);

-- =====================================================
-- 7. MESSAGING
-- =====================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references auth.users(id) on delete cascade,
  participant_2 uuid not null references auth.users(id) on delete cascade,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(participant_1, participant_2)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- 8. SITE SETTINGS
-- =====================================================

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(100) unique not null,
  value text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- =====================================================
-- 9. SUBSCRIPTIONS & PAYMENTS
-- =====================================================

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text,
  description text,
  price_monthly numeric default 0,
  price_yearly numeric,
  currency text default 'EUR',
  features jsonb default '[]',
  max_jobs integer,
  max_flash integer,
  max_candidates integer,
  video_upload boolean default false,
  priority_support boolean default false,
  highlighted_profile boolean default false,
  is_active boolean default true,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  plan_type varchar(100),
  status varchar(50) default 'active',
  payment_method varchar(50),
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  provider text unique,
  display_name text,
  description text,
  is_active boolean default true,
  sort_order integer default 0,
  config jsonb default '{}',
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id varchar(50) unique not null,
  plan_id varchar(100),
  amount integer not null,
  currency varchar(10) default 'EUR',
  status varchar(50) default 'pending', -- pending | completed | failed
  payment_method varchar(50) default 'redsys',
  response_code varchar(10),
  authorization_code varchar(50),
  card_type varchar(20),
  card_brand varchar(50),
  response_message text,
  processed_at timestamptz,
  raw_response jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.micropayments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature_type text not null, -- highlight_profile | view_matches | boost_visibility
  amount_cents integer not null default 99,
  currency text not null default 'eur',
  status text not null default 'pending', -- pending | completed | failed | refunded
  stripe_payment_intent_id text,
  valid_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.highlighted_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  micropayment_id uuid references public.micropayments(id) on delete set null,
  start_date timestamptz default now(),
  end_date timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.profile_interactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  interaction_type text not null, -- like | save | view | contact
  created_at timestamptz default now(),
  unique(business_id, candidate_id, interaction_type)
);

-- =====================================================
-- 10. MODERATION
-- =====================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  content_type text not null, -- video | profile | message | job
  content_id uuid,
  reason text not null,
  description text,
  status text default 'pending', -- pending | reviewed | resolved | dismissed
  admin_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_profiles_user_type on public.profiles(user_type);
create index if not exists idx_profiles_is_active on public.profiles(is_active);
create index if not exists idx_profiles_category_id on public.profiles(category_id);
create index if not exists idx_profiles_location on public.profiles(location);

create index if not exists idx_business_profiles_city on public.business_profiles(city);
create index if not exists idx_business_profiles_type on public.business_profiles(business_type);

create index if not exists idx_jobs_business_id on public.jobs(business_id);
create index if not exists idx_jobs_is_active on public.jobs(is_active);
create index if not exists idx_jobs_city on public.jobs(city);
create index if not exists idx_jobs_is_flash on public.jobs(is_flash);
create index if not exists idx_jobs_category on public.jobs(category);

create index if not exists idx_applications_job_id on public.applications(job_id);
create index if not exists idx_applications_worker_id on public.applications(worker_id);
create index if not exists idx_applications_status on public.applications(status);

create index if not exists idx_saved_jobs_user_id on public.saved_jobs(user_id);
create index if not exists idx_saved_profiles_business_id on public.saved_profiles(business_id);

create index if not exists idx_ratings_to_user_id on public.ratings(to_user_id);
create index if not exists idx_ratings_from_user_id on public.ratings(from_user_id);

create index if not exists idx_conversations_p1 on public.conversations(participant_1);
create index if not exists idx_conversations_p2 on public.conversations(participant_2);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_micropayments_user_id on public.micropayments(user_id);
create index if not exists idx_reports_status on public.reports(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create a profiles row (and business_profiles row if applicable) on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, user_type, phone, location, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'worker'),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'location', null),
    new.email
  )
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'user_type', 'worker') = 'business' then
    insert into public.business_profiles (id, company_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', ''))
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Generic updated_at maintenance
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists business_profiles_updated_at on public.business_profiles;
create trigger business_profiles_updated_at before update on public.business_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.handle_updated_at();

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at before update on public.applications
  for each row execute function public.handle_updated_at();

drop trigger if exists subscription_plans_updated_at on public.subscription_plans;
create trigger subscription_plans_updated_at before update on public.subscription_plans
  for each row execute function public.handle_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

drop trigger if exists payment_methods_updated_at on public.payment_methods;
create trigger payment_methods_updated_at before update on public.payment_methods
  for each row execute function public.handle_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.handle_updated_at();

drop trigger if exists micropayments_updated_at on public.micropayments;
create trigger micropayments_updated_at before update on public.micropayments
  for each row execute function public.handle_updated_at();

-- Keep profiles.rating / total_ratings in sync with the ratings table
create or replace function public.handle_new_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    rating = (select coalesce(avg(score), 0) from public.ratings where to_user_id = new.to_user_id),
    total_ratings = (select count(*) from public.ratings where to_user_id = new.to_user_id)
  where id = new.to_user_id;
  return new;
end;
$$;

drop trigger if exists on_new_rating on public.ratings;
create trigger on_new_rating
  after insert or update on public.ratings
  for each row
  execute function public.handle_new_rating();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.languages enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.saved_profiles enable row level security;
alter table public.ratings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payments enable row level security;
alter table public.micropayments enable row level security;
alter table public.highlighted_profiles enable row level security;
alter table public.profile_interactions enable row level security;
alter table public.reports enable row level security;

-- PROFILES: public directory read, owner-only write.
-- Admin panel routes go through the service-role client (lib/admin-auth.ts)
-- and bypass RLS entirely, so no explicit admin policy is needed here.
drop policy if exists "profiles_public_view" on public.profiles;
create policy "profiles_public_view" on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- BUSINESS_PROFILES: public read, owner-only write
drop policy if exists "bp_public_view" on public.business_profiles;
create policy "bp_public_view" on public.business_profiles for select using (true);
drop policy if exists "bp_insert_own" on public.business_profiles;
create policy "bp_insert_own" on public.business_profiles for insert with check (auth.uid() = id);
drop policy if exists "bp_update_own" on public.business_profiles;
create policy "bp_update_own" on public.business_profiles for update using (auth.uid() = id);
drop policy if exists "bp_delete_own" on public.business_profiles;
create policy "bp_delete_own" on public.business_profiles for delete using (auth.uid() = id);

-- REFERENCE DATA: public read-only (writes happen only via the admin
-- service-role client, so no insert/update/delete policy is defined)
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);
drop policy if exists "subcategories_public_read" on public.subcategories;
create policy "subcategories_public_read" on public.subcategories for select using (true);
drop policy if exists "countries_public_read" on public.countries;
create policy "countries_public_read" on public.countries for select using (true);
drop policy if exists "cities_public_read" on public.cities;
create policy "cities_public_read" on public.cities for select using (true);
drop policy if exists "languages_public_read" on public.languages;
create policy "languages_public_read" on public.languages for select using (true);
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select using (true);
drop policy if exists "subscription_plans_public_read" on public.subscription_plans;
create policy "subscription_plans_public_read" on public.subscription_plans for select using (true);
drop policy if exists "payment_methods_public_read" on public.payment_methods;
create policy "payment_methods_public_read" on public.payment_methods for select using (true);

-- JOBS: public read of active postings, owner (business) manages own (incl. drafts)
drop policy if exists "jobs_select" on public.jobs;
create policy "jobs_select" on public.jobs for select using (is_active = true or business_id = auth.uid());
drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs for insert with check (auth.uid() = business_id);
drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs for update using (auth.uid() = business_id);
drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs for delete using (auth.uid() = business_id);

-- APPLICATIONS: visible to the applicant and to the job owner
drop policy if exists "applications_select_worker" on public.applications;
create policy "applications_select_worker" on public.applications for select using (auth.uid() = worker_id);
drop policy if exists "applications_select_business" on public.applications;
create policy "applications_select_business" on public.applications for select using (
  auth.uid() in (select business_id from public.jobs where id = job_id)
);
drop policy if exists "applications_insert_worker" on public.applications;
create policy "applications_insert_worker" on public.applications for insert with check (auth.uid() = worker_id);
drop policy if exists "applications_update_worker" on public.applications;
create policy "applications_update_worker" on public.applications for update using (auth.uid() = worker_id);
drop policy if exists "applications_update_business" on public.applications;
create policy "applications_update_business" on public.applications for update using (
  auth.uid() in (select business_id from public.jobs where id = job_id)
);
drop policy if exists "applications_delete_worker" on public.applications;
create policy "applications_delete_worker" on public.applications for delete using (auth.uid() = worker_id);

-- SAVED_JOBS: owner only
drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own" on public.saved_jobs for select using (auth.uid() = user_id);
drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own" on public.saved_jobs for insert with check (auth.uid() = user_id);
drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own" on public.saved_jobs for delete using (auth.uid() = user_id);

-- SAVED_PROFILES: owner (business) only
drop policy if exists "saved_profiles_select_own" on public.saved_profiles;
create policy "saved_profiles_select_own" on public.saved_profiles for select using (auth.uid() = business_id);
drop policy if exists "saved_profiles_insert_own" on public.saved_profiles;
create policy "saved_profiles_insert_own" on public.saved_profiles for insert with check (auth.uid() = business_id);
drop policy if exists "saved_profiles_delete_own" on public.saved_profiles;
create policy "saved_profiles_delete_own" on public.saved_profiles for delete using (auth.uid() = business_id);

-- RATINGS: public read (shown on profiles), only the author can write
drop policy if exists "ratings_select_all" on public.ratings;
create policy "ratings_select_all" on public.ratings for select using (true);
drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own" on public.ratings for insert with check (auth.uid() = from_user_id);
drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own" on public.ratings for update using (auth.uid() = from_user_id);
drop policy if exists "ratings_delete_own" on public.ratings;
create policy "ratings_delete_own" on public.ratings for delete using (auth.uid() = from_user_id);

-- CONVERSATIONS: only the two participants
drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations for select using (
  auth.uid() = participant_1 or auth.uid() = participant_2
);
drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations for insert with check (
  auth.uid() = participant_1 or auth.uid() = participant_2
);
drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own" on public.conversations for update using (
  auth.uid() = participant_1 or auth.uid() = participant_2
);

-- MESSAGES: only sender/receiver
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_update_receiver" on public.messages;
create policy "messages_update_receiver" on public.messages for update using (auth.uid() = receiver_id);

-- SUBSCRIPTIONS / PAYMENTS / MICROPAYMENTS: owner reads own record;
-- writes happen from server routes using the service-role client (Stripe/Redsys webhooks)
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments for select using (auth.uid() = user_id);
drop policy if exists "micropayments_select_own" on public.micropayments;
create policy "micropayments_select_own" on public.micropayments for select using (auth.uid() = user_id);
drop policy if exists "micropayments_insert_own" on public.micropayments;
create policy "micropayments_insert_own" on public.micropayments for insert with check (auth.uid() = user_id);

-- HIGHLIGHTED_PROFILES: public read (drives homepage ordering)
drop policy if exists "highlighted_profiles_select_all" on public.highlighted_profiles;
create policy "highlighted_profiles_select_all" on public.highlighted_profiles for select using (true);

-- PROFILE_INTERACTIONS: owner (business) only
drop policy if exists "profile_interactions_select_own" on public.profile_interactions;
create policy "profile_interactions_select_own" on public.profile_interactions for select using (auth.uid() = business_id);
drop policy if exists "profile_interactions_insert_own" on public.profile_interactions;
create policy "profile_interactions_insert_own" on public.profile_interactions for insert with check (auth.uid() = business_id);

-- REPORTS: reporter can read/create own reports; moderation happens via service role
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports for select using (auth.uid() = reporter_id);
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert with check (auth.uid() = reporter_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('icons', 'icons', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('flash-offers', 'flash-offers', true) on conflict (id) do nothing;

do $$
declare
  b text;
begin
  foreach b in array array['avatars','cvs','logos','portfolio','photos','videos','icons'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_public_read');
    execute format('create policy %I on storage.objects for select using (bucket_id = %L)', b || '_public_read', b);

    execute format('drop policy if exists %I on storage.objects', b || '_auth_upload');
    execute format('create policy %I on storage.objects for insert with check (bucket_id = %L and auth.role() = %L)', b || '_auth_upload', b, 'authenticated');

    execute format('drop policy if exists %I on storage.objects', b || '_auth_update');
    execute format('create policy %I on storage.objects for update using (bucket_id = %L and auth.role() = %L)', b || '_auth_update', b, 'authenticated');

    execute format('drop policy if exists %I on storage.objects', b || '_auth_delete');
    execute format('create policy %I on storage.objects for delete using (bucket_id = %L and auth.role() = %L)', b || '_auth_delete', b, 'authenticated');
  end loop;
end $$;

-- =====================================================
-- SEED: reference data the app expects to find populated
-- =====================================================

insert into public.payment_methods (provider, display_name, description, is_active, sort_order, config)
values
  ('redsys', 'Redsys', 'Pago con tarjeta (TPV Virtual Redsys)', true, 1, '{}'::jsonb),
  ('stripe', 'Stripe', 'Pago con tarjeta (Stripe)', true, 2, '{}'::jsonb)
on conflict (provider) do nothing;

-- Professional categories (candidate side)
insert into public.categories (name, slug, sort_order) values
  ('Camarero', 'camarero', 1),
  ('Coctelero', 'coctelero', 2),
  ('Sommelier', 'sommelier', 3),
  ('Maitre', 'maitre', 4),
  ('Chef/Jefe de cocina', 'chef-jefe-cocina', 5),
  ('Cocinero', 'cocinero', 6),
  ('Cortador de jamon', 'cortador-de-jamon', 7),
  ('Office', 'office', 8),
  ('Recepcionista/Host', 'recepcionista-host', 9),
  ('Platero', 'platero', 10),
  ('Repartidor', 'repartidor', 11),
  ('Encargado', 'encargado', 12),
  ('Jefe de Sala', 'jefe-de-sala', 13)
on conflict (slug) do nothing;

insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, s.name, s.slug, s.sort_order
from public.categories c
join (values
  ('camarero', 'Sala', 'sala', 1),
  ('camarero', 'Barra', 'barra', 2),
  ('recepcionista-host', 'Hotel', 'hotel', 1),
  ('recepcionista-host', 'Restaurante', 'restaurante', 2)
) as s(cat_slug, name, slug, sort_order) on c.slug = s.cat_slug
on conflict (category_id, slug) do nothing;

-- Establishment (business) categories - same `categories` table, role_type = 'business'
insert into public.categories (name, slug, sort_order, role_type) values
  ('Bar', 'bar', 1, 'business'),
  ('Bar de copas/Pub', 'pub', 2, 'business'),
  ('Discoteca/Club nocturno', 'discoteca', 3, 'business'),
  ('Restaurante', 'restaurante-negocio', 4, 'business'),
  ('Chiringuito/Beach club', 'chiringuito', 5, 'business'),
  ('Terraza-bar', 'terraza-bar', 6, 'business'),
  ('Hotel/Hostal/Resort', 'hotel-hostal-resort', 7, 'business'),
  ('Catering', 'catering', 8, 'business'),
  ('Eventos privados', 'eventos-privados', 9, 'business'),
  ('Cafeteria', 'cafeteria', 10, 'business')
on conflict (slug) do nothing;

insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, s.name, s.slug, s.sort_order
from public.categories c
join (values
  ('restaurante-negocio', 'Lujo', 'lujo', 1),
  ('restaurante-negocio', 'Comida rapida', 'comida-rapida', 2)
) as s(cat_slug, name, slug, sort_order) on c.slug = s.cat_slug
on conflict (category_id, slug) do nothing;

insert into public.countries (code, name, name_en, flag, phone_prefix, currency, sort_order) values
  ('ES', 'España', 'Spain', '🇪🇸', '+34', 'EUR', 1)
on conflict do nothing;

insert into public.languages (code, name, native_name, flag, sort_order) values
  ('es', 'Español', 'Español', '🇪🇸', 1),
  ('en', 'Inglés', 'English', '🇬🇧', 2),
  ('fr', 'Francés', 'Français', '🇫🇷', 3),
  ('de', 'Alemán', 'Deutsch', '🇩🇪', 4),
  ('it', 'Italiano', 'Italiano', '🇮🇹', 5),
  ('pt', 'Portugués', 'Português', '🇵🇹', 6)
on conflict do nothing;

-- =====================================================
-- COMPLETED
-- =====================================================
