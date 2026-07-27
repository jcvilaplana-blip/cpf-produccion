-- Trigger: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, user_type, phone, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'worker'),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'location', null)
  )
  on conflict (id) do nothing;

  -- If user_type is business, also create business_profiles row
  if coalesce(new.raw_user_meta_data ->> 'user_type', 'worker') = 'business' then
    insert into public.business_profiles (id, company_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'company_name', '')
    )
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

-- Trigger: auto-update updated_at
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
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists business_profiles_updated_at on public.business_profiles;
create trigger business_profiles_updated_at
  before update on public.business_profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

-- Trigger: auto-update rating averages
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
