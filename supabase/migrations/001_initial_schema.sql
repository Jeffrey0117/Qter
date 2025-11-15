-- QTER 問卷系統 - Supabase PostgreSQL Schema
-- 從 D1 SQLite migrations 轉換而來
-- 包含 RLS (Row Level Security) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  markdown_content TEXT,
  questions JSONB, -- 儲存問卷問題結構

  -- Display settings
  display_mode TEXT DEFAULT 'step-by-step' CHECK (display_mode IN ('step-by-step', 'all-in-one')),
  show_progress_bar BOOLEAN DEFAULT TRUE,
  enable_auto_advance BOOLEAN DEFAULT FALSE,
  advance_delay INTEGER DEFAULT 3,
  allow_back_navigation BOOLEAN DEFAULT TRUE,

  -- Additional settings from migration 0002
  auto_advance BOOLEAN DEFAULT TRUE,
  auto_advance_delay INTEGER DEFAULT 300,
  show_progress BOOLEAN DEFAULT TRUE,
  allow_go_back BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'closed')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Share links table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  hash TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  allow_anonymous BOOLEAN DEFAULT TRUE,
  expire_at TIMESTAMP WITH TIME ZONE,
  max_responses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  share_link_id UUID REFERENCES share_links(id) ON DELETE SET NULL,
  respondent_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  respondent_hash TEXT, -- 用於匿名填答者的識別
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta_json JSONB -- 儲存額外的 metadata
);

-- Response items table
CREATE TABLE IF NOT EXISTS response_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- 問題的 ID (從 questions JSONB 中來)
  value_text TEXT,
  value_number NUMERIC,
  value_json JSONB -- 用於複雜問題類型的答案
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_links_hash ON share_links(hash);
CREATE INDEX IF NOT EXISTS idx_share_links_form_id ON share_links(form_id);
CREATE INDEX IF NOT EXISTS idx_share_links_enabled ON share_links(is_enabled) WHERE is_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_share_link_id ON responses(share_link_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_response_items_response_id ON response_items(response_id);
CREATE INDEX IF NOT EXISTS idx_response_items_question_id ON response_items(question_id);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_forms_questions_gin ON forms USING GIN (questions);
CREATE INDEX IF NOT EXISTS idx_responses_meta_gin ON responses USING GIN (meta_json);
CREATE INDEX IF NOT EXISTS idx_response_items_value_gin ON response_items USING GIN (value_json);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for forms table
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Users Policies
-- ============================================================================

-- Users can read their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- Forms Policies
-- ============================================================================

-- Users can view their own forms
CREATE POLICY "Users can view own forms"
  ON forms
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create forms
CREATE POLICY "Users can create forms"
  ON forms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own forms
CREATE POLICY "Users can update own forms"
  ON forms
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own forms
CREATE POLICY "Users can delete own forms"
  ON forms
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Share Links Policies
-- ============================================================================

-- Users can view share links for their own forms
CREATE POLICY "Users can view own form share links"
  ON share_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = share_links.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Users can create share links for their own forms
CREATE POLICY "Users can create share links for own forms"
  ON share_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = share_links.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Users can update share links for their own forms
CREATE POLICY "Users can update own form share links"
  ON share_links
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = share_links.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Users can delete share links for their own forms
CREATE POLICY "Users can delete own form share links"
  ON share_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = share_links.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Anyone can view enabled share links (for public access)
CREATE POLICY "Anyone can view enabled share links"
  ON share_links
  FOR SELECT
  USING (is_enabled = TRUE AND (expire_at IS NULL OR expire_at > NOW()));

-- ============================================================================
-- Responses Policies
-- ============================================================================

-- Form owners can view all responses to their forms
CREATE POLICY "Form owners can view responses"
  ON responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- Authenticated users can create responses
CREATE POLICY "Authenticated users can create responses"
  ON responses
  FOR INSERT
  WITH CHECK (
    -- Must be through a valid share link
    EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.id = responses.share_link_id
      AND share_links.is_enabled = TRUE
      AND (share_links.expire_at IS NULL OR share_links.expire_at > NOW())
    )
  );

-- Anonymous users can create responses (if share link allows)
CREATE POLICY "Anonymous users can create responses"
  ON responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.id = responses.share_link_id
      AND share_links.is_enabled = TRUE
      AND share_links.allow_anonymous = TRUE
      AND (share_links.expire_at IS NULL OR share_links.expire_at > NOW())
    )
  );

-- ============================================================================
-- Response Items Policies
-- ============================================================================

-- Form owners can view response items for their forms
CREATE POLICY "Form owners can view response items"
  ON response_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM responses
      JOIN forms ON forms.id = responses.form_id
      WHERE responses.id = response_items.response_id
      AND forms.user_id = auth.uid()
    )
  );

-- Users can create response items when creating a response
CREATE POLICY "Users can create response items"
  ON response_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses
      WHERE responses.id = response_items.response_id
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a share link is valid
CREATE OR REPLACE FUNCTION is_share_link_valid(link_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM share_links
    WHERE hash = link_hash
    AND is_enabled = TRUE
    AND (expire_at IS NULL OR expire_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get form by share link hash
CREATE OR REPLACE FUNCTION get_form_by_share_link(link_hash TEXT)
RETURNS TABLE (
  form_id UUID,
  form_title TEXT,
  form_description TEXT,
  form_questions JSONB,
  form_display_mode TEXT,
  form_show_progress_bar BOOLEAN,
  form_allow_back_navigation BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.title,
    f.description,
    f.questions,
    f.display_mode,
    f.show_progress_bar,
    f.allow_back_navigation
  FROM forms f
  JOIN share_links sl ON sl.form_id = f.id
  WHERE sl.hash = link_hash
  AND sl.is_enabled = TRUE
  AND (sl.expire_at IS NULL OR sl.expire_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get response statistics for a form
CREATE OR REPLACE FUNCTION get_form_response_stats(form_uuid UUID)
RETURNS TABLE (
  total_responses BIGINT,
  latest_response TIMESTAMP WITH TIME ZONE,
  unique_respondents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_responses,
    MAX(submitted_at) AS latest_response,
    COUNT(DISTINCT COALESCE(respondent_user_id::TEXT, respondent_hash)) AS unique_respondents
  FROM responses
  WHERE form_id = form_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS '用戶表 - 儲存系統用戶資訊';
COMMENT ON TABLE forms IS '問卷表 - 儲存問卷基本資訊和設定';
COMMENT ON TABLE share_links IS '分享連結表 - 管理問卷的公開分享連結';
COMMENT ON TABLE responses IS '回應表 - 儲存問卷的填答記錄';
COMMENT ON TABLE response_items IS '回應項目表 - 儲存每個問題的具體答案';

COMMENT ON COLUMN forms.questions IS 'JSONB 格式儲存問卷問題結構';
COMMENT ON COLUMN forms.display_mode IS '顯示模式: step-by-step 或 all-in-one';
COMMENT ON COLUMN forms.status IS '問卷狀態: active, draft, archived, closed';
COMMENT ON COLUMN share_links.hash IS '公開分享用的唯一 hash 值';
COMMENT ON COLUMN responses.respondent_hash IS '匿名填答者的唯一識別碼';
COMMENT ON COLUMN response_items.question_id IS '對應到 forms.questions JSONB 中的問題 ID';
