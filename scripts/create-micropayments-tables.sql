-- Tabla para micropagos (destacar perfil, ver matches, etc.)
CREATE TABLE IF NOT EXISTS micropayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type text NOT NULL, -- 'highlight_profile', 'view_matches', 'boost_visibility'
  amount_cents integer NOT NULL DEFAULT 99, -- 0.99€ = 99 cents
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_payment_intent_id text,
  valid_until timestamptz, -- For time-limited features like profile highlight
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla para guardar qué empresas han dado like/match a un candidato
CREATE TABLE IF NOT EXISTS profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  interaction_type text NOT NULL, -- 'like', 'save', 'view', 'contact'
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, candidate_id, interaction_type)
);

-- Tabla para perfiles destacados
CREATE TABLE IF NOT EXISTS highlighted_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  micropayment_id uuid REFERENCES micropayments(id),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL, -- Typically 7 days from start
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_micropayments_user ON micropayments(user_id);
CREATE INDEX IF NOT EXISTS idx_micropayments_status ON micropayments(status);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_candidate ON profile_interactions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_business ON profile_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_highlighted_profiles_active ON highlighted_profiles(is_active, end_date);

-- RLS policies
ALTER TABLE micropayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlighted_profiles ENABLE ROW LEVEL SECURITY;

-- Users can see their own micropayments
CREATE POLICY "Users can view own micropayments" ON micropayments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own micropayments
CREATE POLICY "Users can create own micropayments" ON micropayments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Businesses can create interactions
CREATE POLICY "Businesses can create interactions" ON profile_interactions
  FOR INSERT WITH CHECK (auth.uid() = business_id);

-- Candidates can view interactions about them (if they paid)
CREATE POLICY "Candidates can view their interactions" ON profile_interactions
  FOR SELECT USING (auth.uid() = candidate_id);

-- Businesses can view their own interactions
CREATE POLICY "Businesses can view own interactions" ON profile_interactions
  FOR SELECT USING (auth.uid() = business_id);

-- Anyone can see highlighted profiles
CREATE POLICY "Anyone can view highlighted profiles" ON highlighted_profiles
  FOR SELECT USING (true);

-- Users can create their own highlighted profile
CREATE POLICY "Users can highlight own profile" ON highlighted_profiles
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
