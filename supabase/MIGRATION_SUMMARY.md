# QTER Supabase 遷移摘要

## 從 D1 SQLite 到 Supabase PostgreSQL

### 遷移概覽

本次遷移將 QTER 問卷系統從 Cloudflare D1 (SQLite) 遷移到 Supabase (PostgreSQL)。

---

## 資料表結構

### 1. users (用戶表)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**變更說明：**
- ID: `TEXT` → `UUID`
- created_at: `DATETIME` → `TIMESTAMP WITH TIME ZONE`
- 時間函數: `CURRENT_TIMESTAMP` → `NOW()`

---

### 2. forms (問卷表)

```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  markdown_content TEXT,
  questions JSONB,  -- 新增：使用 JSONB 儲存問題結構

  -- Display settings
  display_mode TEXT DEFAULT 'step-by-step',
  show_progress_bar BOOLEAN DEFAULT TRUE,  -- INTEGER → BOOLEAN
  enable_auto_advance BOOLEAN DEFAULT FALSE,
  advance_delay INTEGER DEFAULT 3,
  allow_back_navigation BOOLEAN DEFAULT TRUE,

  -- Additional settings
  auto_advance BOOLEAN DEFAULT TRUE,
  auto_advance_delay INTEGER DEFAULT 300,
  show_progress BOOLEAN DEFAULT TRUE,
  allow_go_back BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'closed')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**變更說明：**
- ID: `TEXT` → `UUID`
- questions: `TEXT` (JSON string) → `JSONB` (native JSON)
- 布林值: `INTEGER` (0/1) → `BOOLEAN` (true/false)
- 新增 CHECK constraint 限制 status 值
- 新增 `updated_at` 自動更新機制
- 外鍵新增 `ON DELETE CASCADE`

**合併的欄位：**
來自 `0002_add_form_fields.sql` 的欄位已整合進主 schema：
- questions
- auto_advance
- auto_advance_delay
- show_progress
- allow_go_back
- status

---

### 3. share_links (分享連結表)

```sql
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  hash TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  allow_anonymous BOOLEAN DEFAULT TRUE,
  expire_at TIMESTAMP WITH TIME ZONE,
  max_responses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**變更說明：**
- ID: `TEXT` → `UUID`
- 布林值: `INTEGER` → `BOOLEAN`
- 時間戳: `DATETIME` → `TIMESTAMP WITH TIME ZONE`

---

### 4. responses (回應表)

```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  share_link_id UUID REFERENCES share_links(id) ON DELETE SET NULL,
  respondent_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  respondent_hash TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta_json JSONB  -- TEXT → JSONB
);
```

**變更說明：**
- ID: `TEXT` → `UUID`
- meta_json: `TEXT` → `JSONB`
- 外鍵新增 `ON DELETE SET NULL` (保留歷史記錄)

---

### 5. response_items (回應項目表)

```sql
CREATE TABLE response_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  value_text TEXT,
  value_number NUMERIC,  -- REAL → NUMERIC
  value_json JSONB       -- TEXT → JSONB
);
```

**變更說明：**
- ID: `TEXT` → `UUID`
- value_number: `REAL` → `NUMERIC` (更精確的數字類型)
- value_json: `TEXT` → `JSONB`

---

## 索引

### B-tree 索引（標準查詢）

```sql
-- Forms
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_created_at ON forms(created_at DESC);

-- Share Links
CREATE INDEX idx_share_links_hash ON share_links(hash);
CREATE INDEX idx_share_links_form_id ON share_links(form_id);
CREATE INDEX idx_share_links_enabled ON share_links(is_enabled) WHERE is_enabled = TRUE;

-- Responses
CREATE INDEX idx_responses_form_id ON responses(form_id);
CREATE INDEX idx_responses_share_link_id ON responses(share_link_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at DESC);

-- Response Items
CREATE INDEX idx_response_items_response_id ON response_items(response_id);
CREATE INDEX idx_response_items_question_id ON response_items(question_id);
```

### GIN 索引（JSONB 查詢）

```sql
-- 用於 JSONB 欄位的全文搜尋和包含查詢
CREATE INDEX idx_forms_questions_gin ON forms USING GIN (questions);
CREATE INDEX idx_responses_meta_gin ON responses USING GIN (meta_json);
CREATE INDEX idx_response_items_value_gin ON response_items USING GIN (value_json);
```

**新增的索引：**
- `idx_forms_status` - 按狀態過濾問卷
- `idx_forms_created_at` - 按建立時間排序
- `idx_share_links_enabled` - 部分索引，只索引啟用的連結
- `idx_responses_submitted_at` - 按提交時間排序
- 所有 GIN 索引 - 用於 JSONB 查詢

---

## Triggers（自動更新）

### updated_at 自動更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security (RLS) Policies

### Users 表

- ✅ 用戶可以查看自己的數據
- ✅ 用戶可以更新自己的數據

### Forms 表

- ✅ 用戶可以查看自己的問卷
- ✅ 用戶可以創建問卷
- ✅ 用戶可以更新自己的問卷
- ✅ 用戶可以刪除自己的問卷

### Share Links 表

- ✅ 用戶可以管理自己問卷的分享連結
- ✅ 任何人可以查看啟用且未過期的分享連結（公開訪問）

### Responses 表

- ✅ 問卷擁有者可以查看所有回應
- ✅ 認證用戶可以透過有效分享連結提交回應
- ✅ 匿名用戶可以透過允許匿名的分享連結提交回應

### Response Items 表

- ✅ 問卷擁有者可以查看回應項目
- ✅ 填答者可以創建回應項目

---

## Helper Functions（輔助函數）

### 1. 檢查分享連結是否有效

```sql
CREATE FUNCTION is_share_link_valid(link_hash TEXT)
RETURNS BOOLEAN
```

**用途：** 驗證分享連結是否啟用且未過期

### 2. 透過分享連結獲取問卷

```sql
CREATE FUNCTION get_form_by_share_link(link_hash TEXT)
RETURNS TABLE (...)
```

**用途：** 公開 API，用於填答頁面獲取問卷資訊

### 3. 獲取問卷統計

```sql
CREATE FUNCTION get_form_response_stats(form_uuid UUID)
RETURNS TABLE (
  total_responses BIGINT,
  latest_response TIMESTAMP WITH TIME ZONE,
  unique_respondents BIGINT
)
```

**用途：** 儀表板顯示問卷的回應統計

---

## 資料類型對照表

| SQLite (D1) | PostgreSQL | 說明 |
|-------------|------------|------|
| `TEXT` (ID) | `UUID` | 更安全，分散式友好 |
| `INTEGER` (boolean) | `BOOLEAN` | 原生布林類型 |
| `REAL` | `NUMERIC` | 更精確的數字 |
| `DATETIME` | `TIMESTAMP WITH TIME ZONE` | 正確處理時區 |
| `TEXT` (JSON) | `JSONB` | 原生 JSON，支援查詢 |
| `CURRENT_TIMESTAMP` | `NOW()` | PostgreSQL 函數 |

---

## 測試數據概覽

seed.sql 包含：

### 用戶 (3 個)
- admin@qter.dev
- user@qter.dev
- test@qter.dev

**測試密碼：** `password123`

### 問卷 (4 個)
1. **產品使用者體驗調查** (active)
   - 5 個問題（text, email, radio, checkbox, textarea）
   - 3 個回應

2. **員工滿意度調查 2025** (active)
   - 4 個問題（radio, range, range, textarea）
   - 1 個回應

3. **活動報名表** (active)
   - 5 個問題（text, email, tel, radio, checkbox）
   - 1 個回應

4. **草稿問卷** (draft)
   - 空問卷

### 分享連結 (5 個)
- 3 個有效連結
- 1 個過期連結
- 1 個停用連結

### 回應 (5 個)
- 2 個認證用戶回應
- 3 個匿名回應
- 完整的答案數據

---

## 遷移後需要更新的程式碼

### 1. API 查詢

**之前 (D1 SQLite):**
```javascript
const form = await db.prepare(
  'SELECT * FROM forms WHERE id = ?'
).bind(formId).first();
```

**之後 (Supabase):**
```javascript
const { data: form } = await supabase
  .from('forms')
  .select('*')
  .eq('id', formId)
  .single();
```

### 2. 布林值處理

**之前:**
```javascript
show_progress_bar: 1  // 0 或 1
```

**之後:**
```javascript
show_progress_bar: true  // true 或 false
```

### 3. JSON 資料

**之前:**
```javascript
questions: JSON.stringify(questionsArray)
```

**之後:**
```javascript
questions: questionsArray  // 直接儲存，無需序列化
```

### 4. UUID 處理

**之前:**
```javascript
id: crypto.randomUUID()  // 生成 UUID 字串
```

**之後:**
```javascript
// PostgreSQL 自動生成 UUID
// 或使用 Supabase 客戶端的 UUID 生成
```

---

## 效能優化

### JSONB 查詢範例

```sql
-- 搜尋包含特定問題類型的問卷
SELECT * FROM forms
WHERE questions @> '[{"type": "radio"}]'::jsonb;

-- 搜尋特定欄位值
SELECT * FROM forms
WHERE questions @> '[{"id": "q1"}]'::jsonb;

-- 使用 JSON 路徑查詢
SELECT
  id,
  title,
  jsonb_array_length(questions) as question_count
FROM forms;
```

### 批次插入

```sql
-- 使用 CTE 進行批次操作
WITH new_response AS (
  INSERT INTO responses (form_id, share_link_id, respondent_hash)
  VALUES ($1, $2, $3)
  RETURNING id
)
INSERT INTO response_items (response_id, question_id, value_text)
SELECT
  new_response.id,
  unnest($4::text[]),
  unnest($5::text[])
FROM new_response;
```

---

## 安全性提升

### 1. RLS 啟用
所有表都啟用 Row Level Security，確保數據隔離

### 2. 函數安全性
Helper functions 使用 `SECURITY DEFINER` 安全執行

### 3. 類型檢查
使用 CHECK constraints 限制欄位值範圍

### 4. 外鍵級聯
正確設定 `ON DELETE CASCADE` 和 `ON DELETE SET NULL`

---

## 監控建議

### 查詢效能

```sql
-- 查看慢查詢
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
```

### 索引使用

```sql
-- 查看索引效率
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 資料庫大小

```sql
-- 查看各表大小
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 下一步行動

1. ✅ **執行遷移**
   ```bash
   cd supabase
   ./setup.ps1  # Windows
   # 或
   ./setup.sh   # macOS/Linux
   ```

2. ✅ **生成 TypeScript 類型**
   ```bash
   supabase gen types typescript --local > src/types/database.types.ts
   ```

3. ✅ **更新前端代碼**
   - 安裝 @supabase/supabase-js
   - 更新 API 調用
   - 處理 UUID 類型
   - 處理布林值

4. ✅ **更新後端代碼**
   - 替換 D1 bindings 為 Supabase client
   - 更新查詢語法
   - 實作 RLS policies

5. ✅ **測試**
   - 單元測試
   - 整合測試
   - RLS policies 測試

6. ✅ **部署**
   - 設定生產環境 Supabase
   - 執行遷移
   - 更新環境變數
   - 逐步遷移數據（如果有舊數據）

---

## 參考資源

- [Supabase 文檔](https://supabase.com/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
