-- 🚨 緊急修復：將 forms.id 從 UUID 改為 TEXT 以支援短 HASH ID
--
-- 問題：前端使用 8 字符短 HASH (例如 "ypbvfR8S")，但資料庫 forms.id 是 UUID 類型
-- 錯誤：invalid input syntax for type uuid: "ypbvfR8S"
--
-- 解決方案：將 forms.id 及相關外鍵全部改為 TEXT 類型
--
-- 📋 在 Supabase Dashboard 的 SQL Editor 執行以下 SQL：
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================================================
-- Step 1: 刪除外鍵約束
-- ============================================================================

ALTER TABLE share_links DROP CONSTRAINT IF EXISTS share_links_form_id_fkey;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_form_id_fkey;

-- ============================================================================
-- Step 2: 修改 forms.id 類型為 TEXT
-- ============================================================================

ALTER TABLE forms ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE forms ALTER COLUMN id DROP DEFAULT;

-- ============================================================================
-- Step 3: 修改相關外鍵欄位類型為 TEXT
-- ============================================================================

ALTER TABLE share_links ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;
ALTER TABLE responses ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;

-- ============================================================================
-- Step 4: 重新建立外鍵約束
-- ============================================================================

ALTER TABLE share_links
  ADD CONSTRAINT share_links_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

ALTER TABLE responses
  ADD CONSTRAINT responses_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

-- ============================================================================
-- ✅ 完成！現在可以使用短 HASH ID 了
-- ============================================================================

-- 測試：插入一個使用短 HASH ID 的問卷
INSERT INTO forms (
  id,
  user_id,
  title,
  description,
  questions,
  display_mode,
  status
)
VALUES (
  'testHash',  -- 8 字符短 HASH
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',  -- 測試用戶
  '測試短 HASH ID',
  '驗證 forms.id 已改為 TEXT 類型',
  '[]'::jsonb,
  'step-by-step',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 驗證：查詢剛插入的問卷
SELECT id, title, created_at FROM forms WHERE id = 'testHash';
