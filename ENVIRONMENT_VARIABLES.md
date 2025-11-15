# 環境變數設定指南

本文檔說明 QTER 專案所需的所有環境變數。

## 前端環境變數

### Supabase 配置（必需）

```env
# Supabase 專案 URL
# 位置：Supabase Dashboard > Settings > API > Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase 匿名金鑰（公開金鑰）
# 位置：Supabase Dashboard > Settings > API > Project API keys > anon/public
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 應用程式配置（可選）

```env
# 應用程式名稱
VITE_APP_NAME=QTER 輕巧問卷系統

# 應用程式環境
VITE_ENV=production  # 或 development

# Google OAuth Client ID（如啟用 Google 登入）
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

## 環境變數檔案

### 本地開發

創建 `frontend/.env.local`（不會被 git 追蹤）：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=QTER 輕巧問卷系統
```

### 測試環境

創建 `frontend/.env.test`（可選）：

```env
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=QTER 測試環境
VITE_ENV=test
```

### 生產環境

在 Vercel Dashboard 設定：

| 變數名稱 | 值 | 環境 |
|---------|-------|------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `VITE_APP_NAME` | `QTER 輕巧問卷系統` | Production |

## 取得環境變數值

### 1. Supabase URL 和 API Key

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 點擊左側 **Settings**（齒輪圖示）
4. 選擇 **API**
5. 複製以下資訊：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

> **注意**：不要使用 `service_role` key 在前端！它有完整權限，僅供後端使用。

### 2. Google OAuth Client ID（可選）

如果需要 Google 登入功能：

#### 方法一：使用 Supabase Auth（推薦）

1. 在 Supabase Dashboard > Authentication > Providers
2. 啟用 Google provider
3. 設定 Google OAuth Client ID 和 Secret
4. 前端不需要 `VITE_GOOGLE_CLIENT_ID`

#### 方法二：直接使用 Google OAuth

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立專案
3. 啟用 Google+ API
4. 建立 OAuth 2.0 Client ID
5. 將 Client ID 設定為 `VITE_GOOGLE_CLIENT_ID`

## 在不同平台設定環境變數

### Vercel

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇專案
3. **Settings** → **Environment Variables**
4. 點擊 **Add**
5. 輸入：
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co`
   - **Environments**: 勾選 Production, Preview, Development
6. 點擊 **Save**
7. 重複步驟 4-6 新增其他變數

### Netlify

1. 登入 Netlify Dashboard
2. 選擇專案
3. **Site settings** → **Environment variables**
4. 點擊 **Add a variable**
5. 輸入變數名稱和值
6. 選擇 **All deploys**
7. 儲存並重新部署

### Railway

1. 選擇專案
2. **Variables** 頁籤
3. 點擊 **+ New Variable**
4. 輸入變數名稱和值
5. 儲存

## 檢查環境變數

### 在本地檢查

在前端程式碼中：

```typescript
// 檢查環境變數是否載入
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ 已設定' : '✗ 未設定')
console.log('App Name:', import.meta.env.VITE_APP_NAME)
```

或在瀏覽器 Console：

```javascript
// 查看所有 VITE_ 開頭的環境變數
console.table(import.meta.env)
```

### 在 Vercel 檢查

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 查看環境變數
vercel env ls

# 拉取環境變數到本地
vercel env pull
```

## 常見問題

### Q1: 為什麼環境變數必須以 `VITE_` 開頭？

**A**: Vite 只會將以 `VITE_` 開頭的環境變數暴露給客戶端程式碼，這是安全機制，防止意外洩漏敏感資訊。

### Q2: 修改環境變數後為什麼沒有生效？

**A**: 需要重新啟動開發伺服器或重新部署：

```bash
# 本地開發
npm run dev  # 重新啟動

# Vercel
vercel --prod  # 重新部署
```

### Q3: 可以在程式碼中硬編碼環境變數嗎？

**A**: 不建議！這會造成：
- 安全風險（金鑰暴露在 Git）
- 部署困難（每個環境都要改程式碼）
- 維護困難（更新金鑰需要重新部署）

### Q4: `.env` 和 `.env.local` 的差別？

**A**:
- `.env`: 預設值，通常會提交到 Git
- `.env.local`: 本地覆寫，不會提交到 Git（優先權更高）
- `.env.production`: 生產環境專用
- `.env.development`: 開發環境專用

優先權：`.env.local` > `.env.[mode]` > `.env`

### Q5: 忘記 Supabase 金鑰怎麼辦？

**A**: 可以隨時在 Supabase Dashboard 重新查看或重新生成。

重新生成金鑰：
1. Supabase Dashboard > Settings > API
2. 點擊金鑰旁的 **Regenerate**
3. 更新所有使用該金鑰的地方

### Q6: 環境變數可以包含特殊字元嗎？

**A**: 可以，但建議用引號包起來：

```env
# 正確
VITE_API_KEY="abc-123-def!@#"

# 避免
VITE_API_KEY=abc-123-def!@#
```

## 環境變數範本

### 最小配置（僅 Supabase）

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 完整配置（所有功能）

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 應用程式
VITE_APP_NAME=QTER 輕巧問卷系統
VITE_ENV=production

# 功能開關
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_GOOGLE_AUTH=false

# 其他服務
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 安全最佳實踐

### ✅ 應該做的

- 使用 `.env.local` 存放敏感資訊
- 將 `.env.local` 加入 `.gitignore`
- 在 CI/CD 平台安全地設定環境變數
- 定期更換 API 金鑰
- 使用不同的金鑰給不同環境

### ❌ 不應該做的

- 將 `.env.local` 提交到 Git
- 在程式碼中硬編碼金鑰
- 在前端使用 `service_role` key
- 在公開地方分享環境變數值
- 在前端儲存使用者密碼

## 相關文檔

- [Vite 環境變數文檔](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API 設定](https://supabase.com/docs/guides/api)
- [Vercel 環境變數](https://vercel.com/docs/concepts/projects/environment-variables)

---

如有任何問題，歡迎查看專案文檔或開 issue 詢問。
