-- =============================================================================
-- Cierre de entrevistas: contratado / no contratado, y cancelación con motivo
--
-- Hasta ahora "no le he contratado" se guardaba como 'cancelled', el mismo
-- estado que "la entrevista se anuló". Son cosas distintas: en la primera la
-- entrevista SÍ ocurrió (cuenta para el historial de ambos), en la segunda no.
-- Sin separarlas no se puede contar cuántas entrevistas se han hecho de verdad,
-- ni decidir quién tiene derecho a valorar.
--
-- Ejecutar en Supabase: SQL Editor -> New query -> pegar -> Run.
-- Es idempotente: se puede lanzar más de una vez.
-- =============================================================================

-- 1. Nuevo estado 'not_hired' -------------------------------------------------
-- Estados: pending    -> propuesta, esperando al candidato
--          confirmed  -> aceptada, pendiente de celebrarse
--          approved   -> se hizo y hubo contratación
--          not_hired  -> se hizo y NO hubo contratación   (nuevo)
--          cancelled  -> se anuló, no llegó a celebrarse
ALTER TABLE public.interview_requests DROP CONSTRAINT IF EXISTS interview_requests_status_check;
ALTER TABLE public.interview_requests
  ADD CONSTRAINT interview_requests_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'approved', 'not_hired'));

-- 2. Cancelación: quién y por qué --------------------------------------------
-- Ambos roles pueden cancelar, así que hay que saber cuál de los dos fue y con
-- qué motivo; si no, el otro recibe una cancelación sin explicación.
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 3. Reprogramación -----------------------------------------------------------
-- Al reprogramar se reutiliza la misma fila (vuelve a 'pending' para que la
-- otra parte confirme), así que se guarda la fecha anterior y cuántas veces se
-- ha movido: una entrevista reprogramada cinco veces es una señal en sí misma.
ALTER TABLE public.interview_requests
  ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
  -- Quién propuso la fecha vigente. Necesario porque ahora reprograma
  -- cualquiera de los dos: confirma SIEMPRE el otro, no quien propuso.
  ADD COLUMN IF NOT EXISTS last_proposed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Las filas existentes las propuso el establecimiento, que era el único que
-- podía crear entrevistas hasta ahora.
UPDATE public.interview_requests
SET last_proposed_by = business_id
WHERE last_proposed_by IS NULL;

-- 4. Consultas del contador ---------------------------------------------------
-- "Entrevistas realizadas" = approved + not_hired, filtrando por cada parte.
CREATE INDEX IF NOT EXISTS interview_requests_status_idx
  ON public.interview_requests (status);

-- --- Comprobación ------------------------------------------------------------
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'interview_requests'
ORDER BY ordinal_position;
