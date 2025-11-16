-- 將 forms.id 從 UUID 改為 TEXT 以支援短 HASH ID
-- 此 migration 需要先備份資料，因為會重建外鍵關聯

-- ============================================================================
-- Step 1: 修改 forms 表的 ID 類型
-- ============================================================================

-- 先刪除所有依賴 forms.id 的外鍵約束
ALTER TABLE share_links DROP CONSTRAINT IF EXISTS share_links_form_id_fkey;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_form_id_fkey;

-- 修改 forms.id 的類型從 UUID 到 TEXT
ALTER TABLE forms ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE forms ALTER COLUMN id SET DEFAULT NULL;
ALTER TABLE forms ALTER COLUMN id DROP DEFAULT;

-- 修改相關表的 form_id 欄位類型
ALTER TABLE share_links ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;
ALTER TABLE responses ALTER COLUMN form_id TYPE TEXT USING form_id::TEXT;

-- 重新建立外鍵約束
ALTER TABLE share_links
  ADD CONSTRAINT share_links_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

ALTER TABLE responses
  ADD CONSTRAINT responses_form_id_fkey
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;

-- ============================================================================
-- Step 2: 更新 RLS policies（不受影響，因為只比較 TEXT）
-- ============================================================================

-- RLS policies 不需要修改，因為已經使用 user_id 作為條件
-- forms.id 的類型變更不影響現有的 RLS policies

-- ============================================================================
-- Step 3: 更新索引（如果需要）
-- ============================================================================

-- 索引會自動重建，不需要手動處理

-- ============================================================================
-- 完成！現在 forms.id 可以接受任何文字格式的 ID
-- 包括：UUID、短 HASH（8 字符）、或其他自訂格式
-- ============================================================================
