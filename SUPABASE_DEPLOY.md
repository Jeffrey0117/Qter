# Supabase 部署指南

QTER 問卷系統使用 Supabase 作為後端服務，提供資料庫、認證和 API 功能。

## 架構概覽

```
前端 (Vercel) ←→ Supabase (PostgreSQL + Auth + Storage + Edge Functions)
```

## 第一部分：建立 Supabase 專案

### 步驟 1：註冊 Supabase 帳號

1. 前往 [https://supabase.com](https://supabase.com)
2. 點擊 "Start your project" 註冊帳號
3. 可使用 GitHub 帳號快速登入

### 步驟 2：建立新專案

1. 登入後點擊 "New Project"
2. 填寫專案資訊：
   - **Name**: `qter-production` (或你喜歡的名稱)
   - **Database Password**: 設定一個強密碼（請記下來）
   - **Region**: 選擇離用戶最近的區域（例如：Northeast Asia (Tokyo)）
   - **Pricing Plan**: 選擇 Free tier（足夠測試使用）
3. 點擊 "Create new project"
4. 等待 1-2 分鐘讓 Supabase 建立專案

### 步驟 3：取得 API 金鑰

專案建立完成後：

1. 進入專案 Dashboard
2. 點擊左側選單的 **Settings** (齒輪圖示)
3. 選擇 **API**
4. 記下以下資訊：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGc...` (公開金鑰，可用於前端)
   - **service_role key**: `eyJhbGc...` (服務金鑰，僅用於後端，不要洩漏！)

## 第二部分：執行資料庫 Migrations

### 方法一：使用 Supabase Dashboard（推薦給初學者）

1. 在 Supabase Dashboard 中，點擊左側的 **SQL Editor**
2. 點擊 "New query"
3. 複製貼上以下 SQL 內容並執行

#### Migration 0001: 初始化資料表

```sql
-- 用戶表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 問卷表
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  markdown_content TEXT,
  display_mode TEXT DEFAULT 'step-by-step',
  show_progress_bar INTEGER DEFAULT 1,
  enable_auto_advance INTEGER DEFAULT 0,
  advance_delay INTEGER DEFAULT 3,
  allow_back_navigation INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 分享連結表
CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  allow_anonymous INTEGER DEFAULT 1,
  expire_at TIMESTAMP WITH TIME ZONE,
  max_responses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id)
);

-- 回應表
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  share_link_id TEXT,
  respondent_user_id TEXT,
  respondent_hash TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  meta_json TEXT,
  FOREIGN KEY (form_id) REFERENCES forms(id),
  FOREIGN KEY (share_link_id) REFERENCES share_links(id),
  FOREIGN KEY (respondent_user_id) REFERENCES users(id)
);

-- 回應項目表
CREATE TABLE IF NOT EXISTS response_items (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_json TEXT,
  FOREIGN KEY (response_id) REFERENCES responses(id)
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_hash ON share_links(hash);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_response_items_response_id ON response_items(response_id);
```

4. 點擊 "Run" 執行

#### Migration 0002: 新增表單欄位

```sql
-- 新增問卷額外欄位
ALTER TABLE forms ADD COLUMN IF NOT EXISTS questions TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS auto_advance INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS auto_advance_delay INTEGER DEFAULT 300;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS show_progress INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_go_back INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

5. 點擊 "Run" 執行

### 方法二：使用 Supabase CLI（推薦給進階用戶）

1. **安裝 Supabase CLI**

```bash
# Windows (使用 npm)
npm install -g supabase

# macOS (使用 Homebrew)
brew install supabase/tap/supabase
```

2. **初始化本地設定**

```bash
cd C:\Users\jeffb\Desktop\code\Qter
supabase init
```

3. **連結到遠端專案**

```bash
supabase link --project-ref your-project-id
# 輸入資料庫密碼
```

4. **建立並執行 migrations**

將現有的 migration 檔案複製到 `supabase/migrations/` 目錄：

```bash
# 創建 migrations 目錄
mkdir -p supabase/migrations

# 複製 migration 檔案
copy api\worker\migrations\0001_init.sql supabase\migrations\20240101000000_init.sql
copy api\worker\migrations\0002_add_form_fields.sql supabase\migrations\20240101000001_add_form_fields.sql
```

5. **推送 migrations 到 Supabase**

```bash
supabase db push
```

## 第三部分：設定 Row Level Security (RLS)

Supabase 使用 RLS 來保護資料安全。在 SQL Editor 執行以下指令：

### 啟用 RLS

```sql
-- 啟用所有資料表的 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;
```

### 設定 RLS 政策

```sql
-- 用戶只能查看自己的資料
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- 用戶可以查看和管理自己的問卷
CREATE POLICY "Users can view own forms"
  ON forms FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own forms"
  ON forms FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  USING (auth.uid()::text = user_id);

-- 公開分享連結可供任何人查看
CREATE POLICY "Anyone can view enabled share links"
  ON share_links FOR SELECT
  USING (is_enabled = 1);

-- 用戶可以管理自己問卷的分享連結
CREATE POLICY "Users can manage own share links"
  ON share_links FOR ALL
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()::text
    )
  );

-- 任何人可以提交回應（匿名填寫問卷）
CREATE POLICY "Anyone can submit responses"
  ON responses FOR INSERT
  WITH CHECK (true);

-- 用戶可以查看自己問卷的回應
CREATE POLICY "Users can view responses to own forms"
  ON responses FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()::text
    )
  );

-- 回應項目政策（與回應表相同）
CREATE POLICY "Anyone can insert response items"
  ON response_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view response items of own forms"
  ON response_items FOR SELECT
  USING (
    response_id IN (
      SELECT r.id FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE f.user_id = auth.uid()::text
    )
  );
```

## 第四部分：建立測試資料

在 SQL Editor 執行以下指令建立測試資料：

```sql
-- 建立測試用戶
INSERT INTO users (id, email, password_hash)
VALUES ('demo-user', 'demo@example.com', '$2a$10$dummyhash')
ON CONFLICT (id) DO NOTHING;

-- 建立測試問卷
INSERT INTO forms (
  id, user_id, title, description, markdown_content,
  display_mode, show_progress_bar, enable_auto_advance,
  advance_delay, allow_back_navigation
)
VALUES (
  'featured-2025',
  'demo-user',
  '科技趨勢調查 2025',
  '探索您對未來科技的看法',
  E'---\ntitle: 科技趨勢調查 2025\n---\n\n## 您最期待的技術是？\n\n- [ ] AI 人工智慧\n- [ ] 量子電腦\n- [ ] 虛擬實境\n\n## 您認為 AI 會取代多少工作？\n\n- ( ) 10% 以下\n- ( ) 10-30%\n- ( ) 30-50%\n- ( ) 50% 以上',
  'step-by-step',
  1, 1, 3, 1
)
ON CONFLICT (id) DO NOTHING;

-- 建立測試分享連結
INSERT INTO share_links (id, form_id, hash, is_enabled, allow_anonymous)
VALUES ('sl1', 'featured-2025', 'demo12345678', 1, 1)
ON CONFLICT (id) DO NOTHING;
```

## 第五部分：設定前端環境變數

### 本地開發

建立 `frontend/.env.local`（此檔案不會被 git 追蹤）：

```env
# Supabase 設定
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key

# 應用程式設定
VITE_APP_NAME=QTER 輕巧問卷系統
```

### Vercel 生產環境

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇你的專案
3. 進入 **Settings** → **Environment Variables**
4. 新增以下變數：

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...your-anon-key` | Production, Preview, Development |
| `VITE_APP_NAME` | `QTER 輕巧問卷系統` | Production, Preview, Development |

5. 點擊 "Save"
6. 重新部署專案以套用環境變數

## 第六部分：部署前端到 Vercel

### 方法一：使用 Vercel Dashboard（推薦）

1. 前往 [https://vercel.com](https://vercel.com)
2. 點擊 "Import Project"
3. 連結 GitHub repository
4. 設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 在 "Environment Variables" 區塊新增上述的環境變數
6. 點擊 "Deploy"

### 方法二：使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 進入前端目錄
cd frontend

# 部署
vercel

# 生產部署
vercel --prod
```

## 第七部分：驗證部署

### 測試 API 連線

1. 打開瀏覽器開發者工具 (F12)
2. 訪問你的 Vercel 網址
3. 檢查 Console 是否有錯誤
4. 檢查 Network 標籤，確認請求發送到正確的 Supabase URL

### 測試問卷功能

1. **訪問測試問卷**: `https://your-app.vercel.app/s/demo12345678`
2. **填寫並提交問卷**
3. **在 Supabase Dashboard 查看資料**:
   - 進入 **Table Editor**
   - 選擇 `responses` 表
   - 確認有新的回應記錄

## 資料庫查詢範例

在 Supabase SQL Editor 執行：

```sql
-- 查看所有問卷
SELECT * FROM forms;

-- 查看最新的 5 筆回應
SELECT * FROM responses
ORDER BY submitted_at DESC
LIMIT 5;

-- 查看特定問卷的回應統計
SELECT
  f.title,
  COUNT(r.id) as response_count
FROM forms f
LEFT JOIN responses r ON f.id = r.form_id
GROUP BY f.id, f.title;

-- 查看回應詳細內容
SELECT
  r.id,
  r.submitted_at,
  ri.question_id,
  ri.value_text
FROM responses r
JOIN response_items ri ON r.id = ri.response_id
WHERE r.form_id = 'featured-2025'
ORDER BY r.submitted_at DESC;
```

## 進階功能

### 啟用 Realtime（即時資料訂閱）

如果需要即時更新功能：

1. 在 Supabase Dashboard，進入 **Database** → **Replication**
2. 選擇要啟用 Realtime 的資料表（例如 `responses`）
3. 在前端使用 Supabase Realtime API：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 訂閱新回應
supabase
  .channel('responses')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'responses'
  }, (payload) => {
    console.log('新回應！', payload)
  })
  .subscribe()
```

### 設定 Storage（檔案上傳）

如果問卷需要檔案上傳功能：

1. 在 Supabase Dashboard，進入 **Storage**
2. 點擊 "Create a new bucket"
3. 名稱: `form-uploads`
4. 設定為 Public 或 Private
5. 設定 Storage Policies 控制存取權限

### 啟用 Authentication

如果需要使用者登入功能：

1. 在 Supabase Dashboard，進入 **Authentication** → **Providers**
2. 啟用需要的登入方式（Email, Google, GitHub 等）
3. 在前端使用 Supabase Auth API

## 成本說明

### Supabase Free Tier 限制

- 500 MB 資料庫空間
- 1 GB 檔案儲存
- 50,000 每月 active users
- 2 GB 頻寬
- 500 MB Edge Function invocations

對於測試和小型專案，免費方案已經足夠使用。

### Vercel Free Tier 限制

- 100 GB 頻寬
- 無限靜態請求
- 6,000 分鐘建置時間/月
- Serverless Functions: 100 GB-hours

## 疑難排解

### CORS 錯誤

確認 Supabase 專案設定中的 "Site URL" 包含你的 Vercel 網址。

### RLS 政策錯誤

如果查詢失敗，檢查：
1. RLS 是否已啟用
2. 政策是否正確設定
3. 使用正確的 API 金鑰（anon key vs service_role key）

### 環境變數未生效

1. 確認變數名稱以 `VITE_` 開頭
2. 在 Vercel 重新部署
3. 檢查瀏覽器 Console 中的 `import.meta.env`

### Migration 執行失敗

1. 檢查 SQL 語法是否正確（PostgreSQL vs SQLite 差異）
2. 確認資料表不存在重複建立的問題
3. 使用 `IF NOT EXISTS` 避免錯誤

## 後續優化建議

1. **設定備份**: Supabase Pro 計畫提供自動備份
2. **監控效能**: 使用 Supabase Dashboard 的 Performance 功能
3. **設定 CDN**: Vercel 自動提供全球 CDN
4. **啟用快取**: 使用 Supabase Cache 加速查詢
5. **資料庫索引**: 根據查詢模式新增索引優化效能

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase CLI 參考](https://supabase.com/docs/reference/cli)
- [Vercel 部署指南](https://vercel.com/docs)
- [PostgreSQL RLS 教學](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

完成這些步驟後，你的 QTER 問卷系統就已經成功部署到 Supabase + Vercel 了！
