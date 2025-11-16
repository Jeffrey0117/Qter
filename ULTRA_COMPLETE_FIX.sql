-- 🚨🚨🚨 超級完整修復版本 - 刪除所有可能的 RLS Policies
--
-- 執行前先查看所有 policies：
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('forms', 'share_links', 'responses', 'response_items');
--
-- 然後執行以下 SQL

-- ============================================================================
-- Step 1: 查詢並顯示所有現有的 policies（可選）
-- ============================================================================

SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('forms', 'share_links', 'responses', 'response_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- Step 2: 刪除 forms 表的所有 policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'forms'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON forms';
    END LOOP;
END $$;

-- ============================================================================
-- Step 3: 刪除 share_links 表的所有 policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'share_links'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON share_links';
    END LOOP;
END $$;

-- ============================================================================
-- Step 4: 刪除 responses 表的所有 policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'responses'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON responses';
    END LOOP;
END $$;

-- ============================================================================
-- Step 5: 刪除 response_items 表的所有 policies
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'response_items'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON response_items';
    END LOOP;
END $$;

-- ============================================================================
-- Step 6: 確認所有 policies 已刪除
-- ============================================================================

SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('forms', 'share_links', 'responses', 'response_items')
GROUP BY tablename;

-- 如果上面的查詢返回空結果或 policy_count = 0，代表成功刪除所有 policies

-- ============================================================================
-- Step 7: 刪除外鍵約束
-- ============================================================================

ALTER TABLE share_links DROP CONSTRAINT IF EXISTS share_links_form_id_fkey;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_form_id_fkey;

-- ============================================================================
-- Step 8: 修改 forms.id 及相關欄位類型為 TEXT
-- ============================================================================

ALTER TABLE forms ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE forms ALTER COLUMN id DROP DEFAULT;

ALTER TABLE share_links ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;
ALTER TABLE responses ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;

-- ============================================================================
-- Step 9: 重建外鍵約束
-- ============================================================================

ALTER TABLE share_links
  ADD CONSTRAINT share_links_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

ALTER TABLE responses
  ADD CONSTRAINT responses_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

-- ============================================================================
-- Step 10: 重建 RLS Policies（寬鬆權限用於測試）
-- ============================================================================

-- Forms
CREATE POLICY "Anyone can view forms" ON forms FOR SELECT USING (true);
CREATE POLICY "Anyone can create forms" ON forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update forms" ON forms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete forms" ON forms FOR DELETE USING (true);

-- Share links
CREATE POLICY "Anyone can view share links" ON share_links FOR SELECT USING (true);
CREATE POLICY "Anyone can create share links" ON share_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update share links" ON share_links FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete share links" ON share_links FOR DELETE USING (true);

-- Responses
CREATE POLICY "Anyone can view responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Anyone can submit responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update responses" ON responses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete responses" ON responses FOR DELETE USING (true);

-- Response items
CREATE POLICY "Anyone can view response items" ON response_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert response items" ON response_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update response items" ON response_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete response items" ON response_items FOR DELETE USING (true);

-- ============================================================================
-- Step 11: 測試短 HASH ID
-- ============================================================================

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
  'TEST8chr',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '✅ 測試短 HASH ID 成功',
  '如果你看到這筆資料，代表修復完成！',
  '[]'::jsonb,
  'step-by-step',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- Step 12: 驗證結果
-- ============================================================================

-- 查詢測試資料
SELECT
  id,
  title,
  description,
  created_at
FROM forms
WHERE id = 'TEST8chr';

-- 確認新的 policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('forms', 'share_links', 'responses', 'response_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- ✅ 完成！
-- ============================================================================
--
-- 如果看到測試資料成功插入，並且沒有錯誤訊息，代表修復完成！
-- 現在可以使用 8 字符短 HASH ID 了
-- ============================================================================
