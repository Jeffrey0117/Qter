# QTER Supabase Database Schema

這個目錄包含 QTER 問卷系統的 Supabase PostgreSQL 資料庫 schema 和遷移文件。

## 目錄結構

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql    # 初始資料庫 schema
├── seed.sql                       # 測試數據腳本
└── README.md                      # 本文件
```

## Schema 概覽

### 資料表

1. **users** - 用戶表
   - 儲存系統用戶資訊
   - 使用 UUID 作為主鍵
   - 包含 email 和密碼 hash

2. **forms** - 問卷表
   - 儲存問卷基本資訊和設定
   - 使用 JSONB 儲存問卷問題結構
   - 支援多種顯示模式和設定選項

3. **share_links** - 分享連結表
   - 管理問卷的公開分享連結
   - 支援過期時間和回應數量限制
   - 可控制匿名填答權限

4. **responses** - 回應表
   - 儲存問卷的填答記錄
   - 支援匿名和登入用戶填答
   - 儲存 metadata (IP、User Agent 等)

5. **response_items** - 回應項目表
   - 儲存每個問題的具體答案
   - 支援文字、數字、JSON 三種數據類型

### 主要特性

#### 1. UUID 主鍵
所有表都使用 UUID (`gen_random_uuid()`) 作為主鍵，提供更好的安全性和分散式友好性。

#### 2. JSONB 儲存
- `forms.questions` - 儲存問卷的問題結構
- `responses.meta_json` - 儲存填答的 metadata
- `response_items.value_json` - 儲存複雜問題類型的答案

#### 3. 時間戳
所有時間欄位使用 `TIMESTAMP WITH TIME ZONE`，確保時區正確處理。

#### 4. 自動更新時間戳
`forms` 表有 trigger 自動更新 `updated_at` 欄位。

#### 5. Row Level Security (RLS)
完整的 RLS policies 確保數據安全：
- 用戶只能查看和修改自己的問卷
- 表單擁有者可以查看所有回應
- 公開分享連結允許匿名填答（如果設定允許）

#### 6. 索引優化
- B-tree 索引用於常見查詢
- GIN 索引用於 JSONB 欄位的全文搜尋

#### 7. Helper Functions
- `is_share_link_valid(link_hash)` - 檢查分享連結是否有效
- `get_form_by_share_link(link_hash)` - 透過分享連結獲取問卷
- `get_form_response_stats(form_uuid)` - 獲取問卷的回應統計

## 安裝步驟

### 1. 初始化 Supabase 專案

如果還沒有 Supabase 專案：

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 登入 Supabase
supabase login

# 初始化專案
supabase init
```

### 2. 連接到 Supabase 專案

```bash
# 連接到遠端專案
supabase link --project-ref <your-project-ref>
```

### 3. 執行遷移

```bash
# 執行所有遷移
supabase db push

# 或者手動執行 SQL 文件
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
```

### 4. 插入測試數據（開發環境）

```bash
# 使用 Supabase CLI
supabase db reset

# 或者手動執行
psql -h <your-db-host> -U postgres -d postgres -f supabase/seed.sql
```

## 本地開發

### 啟動本地 Supabase

```bash
# 啟動本地 Supabase（包含 PostgreSQL、Auth、Storage 等）
supabase start

# 查看本地服務狀態
supabase status
```

### 應用遷移到本地資料庫

```bash
# 重置並應用所有遷移
supabase db reset

# 僅應用新的遷移
supabase db push
```

### 生成 TypeScript 類型

```bash
# 從資料庫 schema 生成 TypeScript 類型定義
supabase gen types typescript --local > src/types/database.types.ts
```

## 從 D1 SQLite 遷移的變更

### 數據類型轉換

| SQLite (D1) | PostgreSQL |
|-------------|------------|
| `TEXT` | `TEXT` 或 `UUID` (對於 ID) |
| `INTEGER` | `INTEGER` 或 `BOOLEAN` |
| `REAL` | `NUMERIC` |
| `DATETIME` | `TIMESTAMP WITH TIME ZONE` |
| `TEXT` (JSON) | `JSONB` |

### 語法變更

1. **主鍵生成**
   - D1: `id TEXT PRIMARY KEY`
   - Supabase: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`

2. **時間戳**
   - D1: `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
   - Supabase: `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

3. **布林值**
   - D1: `is_enabled INTEGER DEFAULT 1`
   - Supabase: `is_enabled BOOLEAN DEFAULT TRUE`

4. **JSON 儲存**
   - D1: `questions TEXT` (JSON string)
   - Supabase: `questions JSONB` (native JSON type)

5. **外鍵約束**
   - 新增 `ON DELETE CASCADE` 和 `ON DELETE SET NULL`

## 安全性考量

### RLS Policies

所有表都啟用了 Row Level Security，並配置了適當的 policies：

1. **用戶數據** - 只能存取自己的數據
2. **問卷數據** - 只有擁有者可以修改
3. **回應數據** - 擁有者可以查看，填答者可以創建
4. **公開存取** - 透過有效的分享連結允許匿名填答

### 密碼處理

- 密碼必須使用 bcrypt 加密（建議 10+ rounds）
- seed.sql 中的測試密碼：`password123`

### API 安全

建議使用 Supabase Auth 而非自訂 JWT：
- 更安全的 token 管理
- 自動處理 refresh tokens
- 整合 RLS policies

## 測試數據

seed.sql 包含以下測試數據：

- **3 個用戶**
  - admin@qter.dev
  - user@qter.dev
  - test@qter.dev

- **4 個問卷**
  - 產品使用者體驗調查（active）
  - 員工滿意度調查 2025（active）
  - 活動報名表（active）
  - 草稿問卷（draft）

- **5 個分享連結**
  - 包含有效、過期、停用的連結

- **5 個回應**
  - 包含匿名和登入用戶的填答

## 常用查詢範例

### 查詢用戶的所有問卷

```sql
SELECT * FROM forms
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
ORDER BY created_at DESC;
```

### 查詢問卷的回應統計

```sql
SELECT * FROM get_form_response_stats('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid);
```

### 透過分享連結獲取問卷

```sql
SELECT * FROM get_form_by_share_link('ux-survey-2025');
```

### 查詢問卷的所有回應和答案

```sql
SELECT
  r.id AS response_id,
  r.submitted_at,
  r.respondent_hash,
  u.email AS respondent_email,
  ri.question_id,
  ri.value_text,
  ri.value_number,
  ri.value_json
FROM responses r
LEFT JOIN users u ON r.respondent_user_id = u.id
JOIN response_items ri ON ri.response_id = r.id
WHERE r.form_id = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'::uuid
ORDER BY r.submitted_at DESC, ri.question_id;
```

### 搜尋問卷問題內容（使用 JSONB）

```sql
SELECT id, title, questions
FROM forms
WHERE questions @> '[{"type": "radio"}]'::jsonb;
```

## 效能優化建議

1. **使用索引** - 已經為常見查詢創建了索引
2. **JSONB 查詢** - 使用 GIN 索引加速 JSONB 搜尋
3. **分頁** - 對大量數據使用 LIMIT 和 OFFSET
4. **連線池** - 使用 Supabase 的內建連線池
5. **批次操作** - 使用 transaction 進行批次插入

## 監控和維護

### 查看資料庫大小

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 查看索引使用情況

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Vacuum 和 Analyze

```sql
-- 定期執行以優化效能
VACUUM ANALYZE;
```

## 下一步

1. **設定 Supabase 專案**
   - 在 Supabase 控制台創建新專案
   - 獲取 API keys 和連接資訊

2. **執行遷移**
   - 使用上述指令執行 schema 遷移
   - 在開發環境插入測試數據

3. **更新應用程式**
   - 將 API 從 D1 SQLite 改為 Supabase
   - 更新資料庫查詢以使用 UUID
   - 整合 Supabase Auth（推薦）

4. **生成 TypeScript 類型**
   - 使用 Supabase CLI 生成類型定義
   - 在前端使用型別安全的查詢

5. **測試**
   - 測試所有 CRUD 操作
   - 驗證 RLS policies 運作正常
   - 測試公開分享連結功能

## 參考資源

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)

## 支援

如有問題或需要協助，請參考：
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: [Your Repo]
