-- EDUVERSE AI GROWTH LOOP MIGRATION
-- Run this in your Supabase SQL Editor

-- 1. BLOG POSTS (AI Content Agent Acquisition)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  generated_by_ai BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- 2. USER NOTIFICATIONS (Nudge & Conversion Hub)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'nudge', 'loan_conversion', 'system'
  module TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users see own notifications" 
ON user_notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" 
ON user_notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_blog_published ON blog_posts(published_at DESC);
CREATE INDEX idx_notifications_user ON user_notifications(user_id, read);
