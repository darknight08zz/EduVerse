
-- 1. Create tool_history table
CREATE TABLE IF NOT EXISTS tool_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON tool_history(user_id);
CREATE INDEX ON tool_history(tool_name);

-- 2. Create user_notifications table (referenced in dashboard)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  module TEXT, -- optional module reference
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON user_notifications(user_id, read);

-- 3. Update user_profiles with additional metadata
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Enable RLS
ALTER TABLE tool_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage own tool history" ON tool_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON user_notifications FOR ALL USING (auth.uid() = user_id);
