# QTER 問卷系統完整部署指南

## 架構概覽

```
前端 (Vercel) ←→ 後端 API (Cloudflare Workers) ←→ 資料庫 (D1) + 快取 (KV)
```

## 第一部分：部署後端到 Cloudflare Workers

### 步驟 1：註冊與安裝

1. **註冊 Cloudflare 帳號**
   - 前往 https://dash.cloudflare.com
   - 註冊免費帳號並驗證 email

2. **安裝 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

3. **登入 Cloudflare**
   ```bash
   wrangler login
   ```
   瀏覽器會開啟，請授權登入

### 步驟 2：建立 Cloudflare 資源

在專案根目錄執行：

```bash
# 建立 D1 資料庫
wrangler d1 create qter-db

# 建立 KV 命名空間
wrangler kv:namespace create "RATE_LIMIT"

# 記下輸出的 database_id 和 namespace_id
```

### 步驟 3：更新 wrangler.toml

將步驟 2 得到的 ID 填入 `wrangler.toml`：

```toml
# 找到這兩行，替換成你的實際 ID
[[d1_databases]]
binding = "DB"
database_name = "qter-db"
database_id = "你的-database-id"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "你的-namespace-id"
```

### 步驟 4：初始化資料庫

```bash
# 套用資料庫 schema
wrangler d1 migrations apply qter-db --remote

# 建立測試資料
wrangler d1 execute qter-db --remote --command "INSERT INTO users (id, email, password_hash) VALUES ('demo-user', 'demo@example.com', 'hashed');"

wrangler d1 execute qter-db --remote --command "INSERT INTO forms (id, user_id, title, description, markdown_content, display_mode, show_progress_bar, enable_auto_advance, advance_delay, allow_back_navigation) VALUES ('featured-2025', 'demo-user', '科技趨勢調查 2025', '探索您對未來科技的看法', '---\ntitle: 科技趨勢調查 2025\n---\n\n## 您最期待的技術是？\n\n- [ ] AI 人工智慧\n- [ ] 量子電腦\n- [ ] 虛擬實境\n\n## 您認為 AI 會取代多少工作？\n\n- ( ) 10% 以下\n- ( ) 10-30%\n- ( ) 30-50%\n- ( ) 50% 以上', 'step-by-step', 1, 1, 3, 1);"

wrangler d1 execute qter-db --remote --command "INSERT INTO share_links (id, form_id, hash, is_enabled, allow_anonymous) VALUES ('sl1', 'featured-2025', 'demo12345678', 1, 1);"
```

### 步驟 5：設定 Turnstile（選用）

如果要啟用驗證碼：

1. 前往 https://dash.cloudflare.com/?to=/:account/turnstile
2. 建立新站台，取得 Site Key 和 Secret Key
3. 設定 Secret Key：
   ```bash
   wrangler secret put TURNSTILE_SECRET_KEY
   # 貼上你的 Secret Key
   ```
4. 更新 `wrangler.toml` 的 vars 區塊：
   ```toml
   [vars]
   TURNSTILE_SITE_KEY = "你的-site-key"
   ```

### 步驟 6：部署後端

```bash
# 部署到 Cloudflare Workers
wrangler deploy

# 記下輸出的 URL，例如：https://qter-api.你的帳號.workers.dev
```

## 第二部分：部署前端到 Vercel

### 步驟 1：設定環境變數

建立 `frontend/.env.production`：

```env
VITE_API_BASE_URL=https://qter-api.你的帳號.workers.dev/api
```

### 步驟 2：建立 Vercel 專案

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **進入前端目錄**
   ```bash
   cd frontend
   ```

3. **部署到 Vercel**
   ```bash
   vercel
   ```
   
   按照提示操作：
   - Set up and deploy? `Y`
   - Which scope? 選擇你的帳號
   - Link to existing project? `N`
   - What's your project's name? `qter-frontend`
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

4. **設定生產環境變數**
   ```bash
   vercel env add VITE_API_BASE_URL production
   # 輸入你的 Workers URL：https://qter-api.你的帳號.workers.dev/api
   ```

5. **重新部署以套用環境變數**
   ```bash
   vercel --prod
   ```

## 測試部署

### 測試前端（純 localStorage 版）
訪問：https://你的專案.vercel.app/demo
- 會自動建立測試問卷
- 資料存在瀏覽器 localStorage

### 測試完整流程（前端 + 後端）
訪問：https://你的專案.vercel.app/s/demo12345678
- 會從 Cloudflare Workers 載入問卷
- 提交的回應會存到 D1 資料庫

## 查看回應資料

```bash
# 查看最新 5 筆回應
wrangler d1 execute qter-db --remote --command "SELECT * FROM responses ORDER BY submitted_at DESC LIMIT 5;"

# 查看回應項目
wrangler d1 execute qter-db --remote --command "SELECT * FROM response_items WHERE response_id IN (SELECT id FROM responses ORDER BY submitted_at DESC LIMIT 1);"
```

## 疑難排解

### CORS 錯誤
確認 `api/worker/src/index.ts` 有正確的 CORS 設定

### 資料庫連線錯誤
1. 確認 `wrangler.toml` 的 database_id 正確
2. 確認已執行 migrations

### API 404 錯誤
1. 確認環境變數 `VITE_API_BASE_URL` 設定正確
2. 確認 Workers 已部署成功

## 更新部署

### 更新後端
```bash
wrangler deploy
```

### 更新前端
```bash
cd frontend
vercel --prod
```

## 成本說明

- **Cloudflare Workers Free Plan**
  - 100,000 requests/day
  - 10ms CPU time per request
  - D1: 5GB storage
  - KV: 1GB storage

- **Vercel Free Plan**
  - 100GB bandwidth
  - Unlimited static requests
  - 自動 HTTPS

對於測試和小型專案，兩者的免費方案都足夠使用。