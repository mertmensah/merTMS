-- User Activity Tracking
-- Run this in Supabase SQL Editor

-- Activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'page_view', 'feature_use', 'action')),
  page_name TEXT,
  feature_name TEXT,
  action_details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(session_id)
);

-- Add last_activity to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_time_seconds INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity logs
CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET 
    last_activity_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
  WHERE session_id = p_session_id AND is_active = true;
  
  -- Update profile last activity
  UPDATE profiles
  SET last_activity_at = NOW()
  WHERE id = (SELECT user_id FROM user_sessions WHERE session_id = p_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id TEXT)
RETURNS void AS $$
DECLARE
  v_duration INTEGER;
  v_user_id UUID;
BEGIN
  -- Calculate final duration
  SELECT 
    EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    user_id
  INTO v_duration, v_user_id
  FROM user_sessions
  WHERE session_id = p_session_id AND is_active = true;
  
  -- Update session
  UPDATE user_sessions
  SET 
    is_active = false,
    ended_at = NOW(),
    duration_seconds = v_duration
  WHERE session_id = p_session_id;
  
  -- Update profile totals
  UPDATE profiles
  SET 
    total_time_seconds = COALESCE(total_time_seconds, 0) + COALESCE(v_duration, 0)
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- Grant permissions
GRANT ALL ON user_activity_logs TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT SELECT ON user_activity_logs TO anon;
GRANT SELECT ON user_sessions TO anon;

COMMENT ON TABLE user_activity_logs IS 'Detailed logs of all user activities';
COMMENT ON TABLE user_sessions IS 'Active and historical user session data';
COMMENT ON COLUMN user_sessions.duration_seconds IS 'Total session duration in seconds';
