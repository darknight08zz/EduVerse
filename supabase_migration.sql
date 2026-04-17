-- Users (handled by NextAuth + Supabase Auth)
-- Extended profile
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  current_degree TEXT,
  graduation_year INTEGER,
  gpa DECIMAL(3,2),
  gre_score INTEGER,
  ielts_score DECIMAL(3,1),
  target_countries TEXT[],
  target_programs TEXT[],
  budget_usd INTEGER,
  xp_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module TEXT NOT NULL,  -- 'mentor', 'career', 'roi', 'admission', 'loan'
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tool usage (for gamification)
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_name TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0
);

-- University Shortlist (Goal tracking)
CREATE TABLE university_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  program TEXT NOT NULL,
  country TEXT NOT NULL,
  tuition_usd INTEGER,
  ranking TEXT,
  fit_score INTEGER,
  application_deadline DATE,
  status TEXT DEFAULT 'researching'
    CHECK (status IN ('researching', 'preparing', 'applied', 'waitlisted', 'accepted', 'rejected')),
  notes TEXT,
  admission_probability INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON university_shortlist(user_id);
CREATE INDEX ON university_shortlist(user_id, status);

-- API Rate Limiter (Internal Protection)
CREATE TABLE api_rate_limits (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, endpoint)
);

-- SECURITY: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shortlist" ON university_shortlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tool usage" ON tool_usage FOR ALL USING (auth.uid() = user_id);

-- AI SOP Drafts
CREATE TABLE IF NOT EXISTS sop_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  university TEXT,
  program TEXT,
  content TEXT,
  feedback_score INTEGER,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sop_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own SOPs" ON sop_drafts FOR ALL USING (auth.uid() = user_id);
