-- =============================================================================
-- Tokens de dispositivo para notificaciones push (Firebase Cloud Messaging)
--
-- Una tabla en lugar de una columna `profiles.fcm_token`: un mismo usuario
-- puede tener la app en el móvil, en una tablet y abierta en el navegador, y
-- todos deben recibir el aviso. Con una sola columna, el último inicio de
-- sesión dejaría mudos a los demás dispositivos.
--
-- Ejecutar en Supabase: SQL Editor -> New query -> pegar -> Run.
-- Es idempotente: se puede lanzar más de una vez sin romper nada.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  -- "android" | "ios" | "web"
  platform    TEXT NOT NULL DEFAULT 'android',
  -- Para poder mostrar al usuario dónde tiene sesión y depurar envíos.
  device_info TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FCM reasigna un token a otra instalación cuando se reinstala la app, así que
-- el token es único globalmente, no por usuario: si reaparece bajo otra cuenta
-- tiene que cambiar de dueño, no duplicarse.
CREATE UNIQUE INDEX IF NOT EXISTS device_tokens_token_key
  ON public.device_tokens (token);

-- El envío siempre consulta "dame los tokens de este usuario".
CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx
  ON public.device_tokens (user_id);

-- --- Seguridad -------------------------------------------------------------
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona solo sus propios tokens. El envío lo hace el servidor
-- con la clave de servicio, que se salta RLS.
DROP POLICY IF EXISTS "device_tokens_select_own" ON public.device_tokens;
CREATE POLICY "device_tokens_select_own" ON public.device_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_tokens_insert_own" ON public.device_tokens;
CREATE POLICY "device_tokens_insert_own" ON public.device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_tokens_update_own" ON public.device_tokens;
CREATE POLICY "device_tokens_update_own" ON public.device_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "device_tokens_delete_own" ON public.device_tokens;
CREATE POLICY "device_tokens_delete_own" ON public.device_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- --- Comprobación ----------------------------------------------------------
-- Debe devolver una fila con la tabla creada.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'device_tokens'
ORDER BY ordinal_position;
