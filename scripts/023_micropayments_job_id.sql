-- Links a micropayment to the job it paid for (flash_job / highlight_job
-- feature types). on delete set null (not cascade) so deleting a job never
-- destroys its payment history, needed for the admin payments ledger.
alter table public.micropayments
  add column if not exists job_id uuid references public.jobs(id) on delete set null;

create index if not exists idx_micropayments_job_id on public.micropayments(job_id);
