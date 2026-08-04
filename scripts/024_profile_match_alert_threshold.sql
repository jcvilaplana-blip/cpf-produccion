-- 7.2: per-candidate adjustable match-alert threshold (premium only).
-- Only 4 distinct percentages are actually produced by the matching engine
-- (0/25/50/75/100, or 0/33/67/100 when a job has no subcategory), so this is
-- a constrained set of steps rather than a free 0-100 slider.
alter table public.profiles
  add column if not exists match_alert_threshold integer not null default 100
  check (match_alert_threshold in (0, 25, 50, 75, 100));
