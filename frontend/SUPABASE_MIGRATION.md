# Supabase 遷移指南

## 概述

前端已從 Cloudflare Workers API 遷移至直接使用 Supabase Client SDK。這樣可以直接與 Supabase 資料庫和認證系統交互，簡化架構並提高效能。

## 已修改的文件

### 新增文件

1. **`frontend/src/lib/supabase.ts`**
   - Supabase 客戶端單例配置
   - 處理 Auth 自動刷新和 Session 持久化

2. **`frontend/src/types/database.ts`**
   - Supabase 資料庫類型定義
   - 包含 forms 和 responses 表的完整類型

### 修改文件

1. **`frontend/src/services/api.ts`**
   - 完全重寫所有 API 函數以使用 Supabase Client
   - 保持相同的函數簽名以維持向後兼容性
   - 新增資料格式轉換（資料庫 snake_case ↔ 前端 camelCase）

2. **`frontend/.env.example`**
   - 更新環境變數範例以使用 Supabase 配置

## 環境變數設定

創建或更新 `frontend/.env.local` 文件：

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
VITE_APP_NAME=QTER 輕巧問卷系統
```

### 如何獲取 Supabase 憑證

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇您的專案
3. 前往 Settings > API
4. 複製以下值：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## API 變更說明

### Form API (formApi)

所有函數保持相同的簽名，但內部實作改用 Supabase：

- `getForms()` - 使用 `supabase.from('forms').select()`
- `getForm(id)` - 使用 `.eq('id', id).single()`
- `createForm(data)` - 使用 `.insert()`
- `updateForm(id, data)` - 使用 `.update().eq('id', id)`
- `deleteForm(id)` - 使用 `.delete().eq('id', id)`
- `submitResponse(formId, responses)` - 插入到 responses 表
- `getResponses(formId)` - 查詢 responses 表

### Auth API (authApi)

改用 Supabase Auth：

- `loginWithGoogle()` - 新增！使用 OAuth 登入
- `login(email, password)` - 使用 `signInWithPassword()`
- `register(email, password, metadata)` - 使用 `signUp()`
- `logout()` - 使用 `signOut()`
- `getCurrentUser()` - 使用 `getUser()`
- `getSession()` - 使用 `getSession()`

### Public API (publicApi)

公開表單分享功能：

- `getFormByHash(hash)` - 通過 share_hash 查詢表單
- `submitByHash(hash, payload)` - 公開提交回覆（不需認證）

### File API (fileApi)

改用 Supabase Storage：

- `uploadFile(file, bucket)` - 上傳檔案到 Storage
- `deleteFile(path, bucket)` - 刪除檔案

## 資料格式轉換

由於資料庫使用 snake_case，前端使用 camelCase，API 層會自動進行轉換：

**資料庫欄位** → **前端欄位**
- `user_id` → `userId`
- `display_mode` → `displayMode`
- `markdown_content` → `markdownContent`
- `auto_advance` → `autoAdvance`
- `auto_advance_delay` → `autoAdvanceDelay`
- `show_progress` → `showProgress`
- `allow_go_back` → `allowGoBack`
- `share_hash` → `shareHash`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`

## Supabase 資料庫設定

### 必要的資料表

確保您的 Supabase 專案有以下資料表：

#### 1. forms 表

```sql
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  display_mode TEXT DEFAULT 'classic',
  markdown_content TEXT,
  auto_advance BOOLEAN DEFAULT false,
  auto_advance_delay INTEGER DEFAULT 3,
  show_progress BOOLEAN DEFAULT true,
  allow_go_back BOOLEAN DEFAULT true,
  share_hash TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. responses 表

```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES auth.users(id),
  responses JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) 政策

建議設定以下 RLS 政策：

#### forms 表政策

```sql
-- 允許用戶查看自己的表單
CREATE POLICY "Users can view own forms"
  ON forms FOR SELECT
  USING (auth.uid() = user_id);

-- 允許用戶創建表單
CREATE POLICY "Users can create forms"
  ON forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允許用戶更新自己的表單
CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  USING (auth.uid() = user_id);

-- 允許用戶刪除自己的表單
CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  USING (auth.uid() = user_id);

-- 允許任何人通過 share_hash 查看公開表單
CREATE POLICY "Anyone can view forms by share_hash"
  ON forms FOR SELECT
  USING (share_hash IS NOT NULL);
```

#### responses 表政策

```sql
-- 允許表單擁有者查看回覆
CREATE POLICY "Form owners can view responses"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

-- 允許任何人提交回覆
CREATE POLICY "Anyone can submit responses"
  ON responses FOR INSERT
  WITH CHECK (true);
```

### Storage 設定（可選）

如果需要檔案上傳功能，創建一個 Storage bucket：

1. 前往 Supabase Dashboard > Storage
2. 創建新 bucket：`uploads`
3. 設定 bucket 為 public 或 private（根據需求）
4. 設定 Storage 政策允許認證用戶上傳

## Google OAuth 設定

1. 前往 Supabase Dashboard > Authentication > Providers
2. 啟用 Google Provider
3. 輸入 Google OAuth Client ID 和 Secret
4. 設定 Redirect URL：`https://your-project.supabase.co/auth/v1/callback`
5. 在 Google Cloud Console 中將此 URL 加入授權的重定向 URI

## 測試建議

### 1. 認證測試

- [ ] Google OAuth 登入
- [ ] Email/Password 登入
- [ ] 註冊新用戶
- [ ] 登出功能
- [ ] Session 持久化（刷新頁面後仍保持登入）

### 2. 表單 CRUD 測試

- [ ] 創建新表單
- [ ] 查看表單列表
- [ ] 查看單個表單
- [ ] 更新表單
- [ ] 刪除表單
- [ ] 驗證只能看到/編輯自己的表單

### 3. 公開分享測試

- [ ] 通過 share_hash 訪問公開表單
- [ ] 公開提交回覆（無需登入）
- [ ] 驗證表單擁有者可以查看所有回覆

### 4. 檔案上傳測試（如啟用）

- [ ] 上傳檔案到 Supabase Storage
- [ ] 取得檔案 URL
- [ ] 刪除檔案

### 5. 錯誤處理測試

- [ ] 未認證時訪問需要認證的 API
- [ ] 訪問不存在的表單
- [ ] 網路錯誤處理
- [ ] 驗證錯誤訊息正確顯示

## 常見問題

### Q: 為什麼從 Cloudflare Workers 改用 Supabase Client？

A:
- 減少一層 API 中介，提高效能
- 利用 Supabase Client 的自動類型推斷
- 簡化認證流程（自動處理 token 刷新）
- 減少伺服器維護成本

### Q: 舊的 Cloudflare Workers 還需要嗎？

A:
- 如果只是簡單的 CRUD 操作，不需要
- 如果有複雜的商業邏輯或需要隱藏敏感操作，可以保留
- 公開表單提交現在可以直接從前端進行（通過 RLS 保護）

### Q: 如何處理資料遷移？

A:
如果您已有資料在 Cloudflare Workers 的資料庫中，需要：
1. 導出舊資料
2. 轉換格式以匹配新的 schema
3. 導入到 Supabase
4. 驗證資料完整性

### Q: 安全性如何？

A:
- Supabase RLS 提供資料列級別的安全控制
- ANON_KEY 是安全的（只能執行 RLS 允許的操作）
- 敏感操作應該在後端執行或通過 RLS 保護
- 永遠不要在前端暴露 SERVICE_ROLE_KEY

## 下一步

1. 複製 `.env.example` 到 `.env.local` 並填入 Supabase 憑證
2. 在 Supabase Dashboard 中設定資料表和 RLS 政策
3. 配置 Google OAuth（如需要）
4. 執行測試確保一切正常
5. 部署到生產環境

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
