-- Gamification engine + supporting fields for the remaining "Parcial" audit
-- items (age, skills taxonomy, structured work experience, referrals,
-- profile-view tracking, interview reminders).

-- ---- profiles ----
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists skills text[] default '{}',
  add column if not exists work_experience jsonb default '[]',
  add column if not exists profile_completed_at timestamptz,
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists availability_updated_at timestamptz,
  add column if not exists profile_theme text;

-- Backfill: split existing certificates jsonb (which mixed work history and
-- education) into the new work_experience column. Entries with company or
-- position are work history; everything else (institution/title) stays in
-- certificates untouched.
update public.profiles
set work_experience = (
  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  from jsonb_array_elements(coalesce(certificates, '[]'::jsonb)) as entry
  where entry ? 'company' or entry ? 'position'
)
where certificates is not null and jsonb_typeof(certificates) = 'array';

update public.profiles
set certificates = (
  select coalesce(jsonb_agg(entry), '[]'::jsonb)
  from jsonb_array_elements(certificates) as entry
  where not (entry ? 'company' or entry ? 'position')
)
where certificates is not null and jsonb_typeof(certificates) = 'array';

-- One-time backfill of referral codes for existing rows (new rows get one at
-- signup time from application code).
update public.profiles set referral_code = substr(md5(id::text || random()::text), 1, 8)
where referral_code is null;

-- ---- business_profiles ----
alter table public.business_profiles
  add column if not exists profile_completed_at timestamptz,
  add column if not exists flash_credits integer not null default 0,
  add column if not exists highlight_credits integer not null default 0,
  add column if not exists profile_theme text;

-- ---- interview_requests ----
alter table public.interview_requests
  add column if not exists reminder_sent_at timestamptz;

-- ---- profile_views ----
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idx_profile_views_viewer_day on public.profile_views(viewer_id, created_at);

alter table public.profile_views enable row level security;
drop policy if exists "profile_views_insert_own" on public.profile_views;
create policy "profile_views_insert_own" on public.profile_views for insert with check (auth.uid() = viewer_id);
drop policy if exists "profile_views_select_own" on public.profile_views;
create policy "profile_views_select_own" on public.profile_views for select using (auth.uid() = viewer_id);

-- ---- points_ledger ----
-- Audit log AND idempotency mechanism: before awarding points for something
-- capped (e.g. "one portfolio-photo bonus per month"), callers check for an
-- existing row with that reason in the relevant time window.
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null,
  related_id uuid,
  created_at timestamptz default now()
);
create index if not exists idx_points_ledger_user_reason on public.points_ledger(user_id, reason, created_at);

alter table public.points_ledger enable row level security;
drop policy if exists "points_ledger_select_own" on public.points_ledger;
create policy "points_ledger_select_own" on public.points_ledger for select using (auth.uid() = user_id);
