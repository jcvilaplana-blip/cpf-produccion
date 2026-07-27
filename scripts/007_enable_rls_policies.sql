-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.ratings enable row level security;
alter table public.messages enable row level security;

-- PROFILES policies (id = auth.uid())
create policy "profiles_public_view" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- BUSINESS_PROFILES policies (id = profile id = auth.uid())
create policy "bp_public_view" on public.business_profiles for select using (true);
create policy "bp_insert_own" on public.business_profiles for insert with check (auth.uid() = id);
create policy "bp_update_own" on public.business_profiles for update using (auth.uid() = id);
create policy "bp_delete_own" on public.business_profiles for delete using (auth.uid() = id);

-- JOBS policies (business_id references profiles.id)
create policy "jobs_select_all" on public.jobs for select using (true);
create policy "jobs_insert_own" on public.jobs for insert with check (auth.uid() = business_id);
create policy "jobs_update_own" on public.jobs for update using (auth.uid() = business_id);
create policy "jobs_delete_own" on public.jobs for delete using (auth.uid() = business_id);

-- APPLICATIONS policies (worker_id references profiles.id)
create policy "applications_select_worker" on public.applications for select using (auth.uid() = worker_id);
create policy "applications_select_business" on public.applications for select using (
  auth.uid() in (select business_id from public.jobs where id = job_id)
);
create policy "applications_insert_worker" on public.applications for insert with check (auth.uid() = worker_id);
create policy "applications_update_worker" on public.applications for update using (auth.uid() = worker_id);
create policy "applications_update_business" on public.applications for update using (
  auth.uid() in (select business_id from public.jobs where id = job_id)
);

-- SAVED_JOBS policies (user_id references profiles.id)
create policy "saved_select_own" on public.saved_jobs for select using (auth.uid() = user_id);
create policy "saved_insert_own" on public.saved_jobs for insert with check (auth.uid() = user_id);
create policy "saved_delete_own" on public.saved_jobs for delete using (auth.uid() = user_id);

-- RATINGS policies
create policy "ratings_select_all" on public.ratings for select using (true);
create policy "ratings_insert_auth" on public.ratings for insert with check (auth.uid() = from_user_id);
create policy "ratings_update_own" on public.ratings for update using (auth.uid() = from_user_id);

-- MESSAGES policies
create policy "messages_select_own" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id);
create policy "messages_update_receiver" on public.messages for update using (auth.uid() = receiver_id);
