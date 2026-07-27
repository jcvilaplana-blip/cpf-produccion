-- Tabla para reportes de contenido inapropiado (videos, perfiles, etc.)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('video', 'profile', 'message', 'job')),
  content_id uuid,
  reason text NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'fake', 'violence', 'nudity', 'hate_speech', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Indices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);

-- RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden crear reportes
CREATE POLICY reports_insert_auth ON reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Usuarios pueden ver sus propios reportes
CREATE POLICY reports_select_own ON reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Admins tienen acceso completo
CREATE POLICY reports_admin_all ON reports
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR rol IN (1, 2))));

-- Comentario
COMMENT ON TABLE reports IS 'Reportes de contenido inapropiado enviados por usuarios';
