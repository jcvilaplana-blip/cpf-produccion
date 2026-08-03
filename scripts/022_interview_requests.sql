-- Fase B: sistema de solicitud de entrevista (booking) entre empresa y candidato.
-- Ejecutar en el SQL Editor de Supabase (proyecto CPF-PRODUCCION), despues de
-- scripts/021_remove_mux_add_portfolio_videos.sql

create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  business_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  interview_type text not null check (interview_type in ('call', 'in_person', 'video_call', 'other')),
  other_type_detail text,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'approved')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.interview_requests enable row level security;

drop policy if exists "interview_requests_select_own" on public.interview_requests;
create policy "interview_requests_select_own" on public.interview_requests for select using (
  auth.uid() = business_id or auth.uid() = worker_id
);

drop policy if exists "interview_requests_insert_business" on public.interview_requests;
create policy "interview_requests_insert_business" on public.interview_requests for insert with check (
  auth.uid() = business_id
);

-- Both sides can update (worker: pending -> confirmed/cancelled; business: confirmed -> approved/cancelled).
-- Enforced in application code (server actions), not by column-level policy, matching
-- how applications.status transitions are already handled in this project.
drop policy if exists "interview_requests_update_own" on public.interview_requests;
create policy "interview_requests_update_own" on public.interview_requests for update using (
  auth.uid() = business_id or auth.uid() = worker_id
);

create index if not exists interview_requests_application_id_idx on public.interview_requests(application_id);
create index if not exists interview_requests_business_id_idx on public.interview_requests(business_id);
create index if not exists interview_requests_worker_id_idx on public.interview_requests(worker_id);
