-- =============================================================================
-- FASE 1 — Cortar la exposición pública de datos personales de candidatos
-- =============================================================================
--
-- QUÉ ARREGLA
-- La política `profiles_public_view` es `using (true)`, así que cualquiera con
-- la clave anónima —que viaja dentro del JavaScript de la aplicación y se
-- extrae en dos minutos— puede leer TODAS las columnas de TODOS los perfiles.
-- Comprobado el 2026-08-06 contra producción: se obtuvo el teléfono de un
-- candidato real sin iniciar sesión.
--
-- CÓMO
-- RLS decide QUÉ FILAS se ven, no qué columnas. El control por columna son los
-- privilegios de Postgres: se retira el SELECT global al rol `anon` y se le
-- devuelve sólo sobre las columnas que las páginas públicas necesitan pintar.
--
-- POR QUÉ NO ROMPE NADA
-- Se revisó el código antes de escribir esto: ni la ficha pública del candidato
-- ni el navegador de candidatos piden `phone` o `email`. Los dos únicos sitios
-- que leen el teléfono de un candidato son la página de entrevistas y la ficha
-- de establecimiento, y ambos van con sesión iniciada (rol `authenticated`),
-- que este script no toca.
--
-- ALCANCE
-- Sólo `profiles` (candidatos). `business_profiles` se deja como está: el
-- teléfono de un local es información de contacto pública a propósito, y se
-- muestra en su ficha.
--
-- ESTO NO SEPARA TODAVÍA A LOS ROLES ENTRE SÍ. Un candidato con sesión sigue
-- pudiendo leer a otros candidatos: eso es la fase 2, que además exige mover
-- el escaparate público a rutas de servidor.
-- =============================================================================

begin;

-- 1) Se retira el acceso global del rol anónimo.
revoke select on public.profiles from anon;

-- 2) Se devuelve columna a columna. Todo lo que NO está en esta lista queda
--    fuera del alcance público: email, phone, phone_verified, date_of_birth,
--    latitude, longitude, cv_url, cv_filename, is_admin, rol, referral_code,
--    referred_by, match_alert_threshold, mux_asset_id y mux_upload_id.
grant select (
  id,
  user_type,
  display_name,
  avatar_url,
  bio,
  location,
  job_category,
  job_subcategory,
  category_id,
  subcategory_id,
  custom_subcategory,
  specialties,
  skills,
  work_experience,
  experience_years,
  languages,
  contract_type_sought,
  availability_status,
  availability_updated_at,
  certificates,
  badges,
  points,
  level,
  rating,
  total_ratings,
  is_active,
  is_premium,
  premium_expires_at,
  subscription_tier,
  portfolio_images,
  portfolio_videos,
  additional_videos,
  video_reel_url,
  mux_playback_id,
  video_status,
  profile_completed,
  profile_completed_at,
  created_at,
  updated_at
) on public.profiles to anon;

commit;

-- =============================================================================
-- COMPROBACIÓN (con la clave anónima, sin sesión)
--
--   GET /rest/v1/profiles?select=display_name&limit=1   -> debe seguir dando datos
--   GET /rest/v1/profiles?select=phone&limit=1          -> debe dar error de permiso
--   GET /rest/v1/profiles?select=date_of_birth&limit=1  -> debe dar error de permiso
--
-- DESHACER (si algo se rompiera)
--   grant select on public.profiles to anon;
-- =============================================================================
