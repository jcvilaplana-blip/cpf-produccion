-- Fase A: eliminar sistema de video-reels/MUX, portfolio de video simple (sin MUX)
-- Ejecutar en el SQL Editor de Supabase (proyecto CPF-PRODUCCION).
--
-- No borra columnas de MUX (mux_asset_id, mux_playback_id, mux_upload_id,
-- video_status, additional_videos, video_reel_url) por seguridad: se dejan
-- sin uso, se pueden eliminar en una pasada futura una vez verificado que
-- ningun codigo las lee ya.

alter table public.profiles
  add column if not exists portfolio_videos text[] default '{}';
