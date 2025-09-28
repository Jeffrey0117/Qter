# Cloudflare Workers API 部署指南

## 🌐 部署後端 API 到 Cloudflare

### 選擇一：使用 Cloudflare Dashboard（網頁介面）

如果不想用命令列，可以直接在網頁操作：

#### 1. 註冊/登入 Cloudflare
- 前往 [dash.cloudflare.com](https://dash.cloudflare.com)
- 註冊免費帳號或登入

#### 2. 建立 Workers 專案
- 點擊左側 **Workers & Pages**
- 點擊 **Create Application**
- 選擇 **Create Worker**
- 給個名字，例如 `qter-api`
- 點擊 **Deploy**

#### 3. 建立 D1 資料庫
- 左側選單找到 **D1**
- 點擊 **Create Database**
- 名稱輸入 `qter-db`
- 建立後記下 Database ID

#### 4. 建立 KV 存儲
- 左側選單找到 **KV**
- 點擊 **Create a namespace**
- 名稱輸入 `RATE_LIMIT`
- 建立後記下 Namespace ID

---

### 選擇二：使用命令列（推薦）

這個方法更快速，讓我幫您簡化步驟：

## 📦 快速命令列部署

### 步驟 1：安裝工具
開啟新的終端機（Terminal/命令提示字元）：

```bash
# 安裝 wrangler（Cloudflare 的命令列工具）
npm install -g wrangler
```

### 步驟 2：登入 Cloudflare
```bash
wrangler login
```
（會開瀏覽器讓您授權）

### 步驟 3：建立資源
在專案根目錄執行（不是在 frontend 資料夾）：

```bash
# 建立 D1 資料庫
wrangler d1 create qter-db

# 建立 KV 存儲空間
wrangler kv:namespace create RATE_LIMIT
```

**重要**：執行後會顯示類似這樣的訊息：
```
✅ Successfully created DB 'qter-db' in account 'xxx'
Created your database using D1's new storage backend. 
database_id = "xxxx-xxxx-xxxx-xxxx"
```

複製這個 `database_id`！

### 步驟 4：更新設定檔
編輯專案根目錄的 `wrangler.toml` 檔案：

找到這兩行並替換 ID：
```toml
database_id = "YOUR_DATABASE_ID_HERE"  # 換成剛才的 database_id
id = "YOUR_KV_NAMESPACE_ID_HERE"       # 換成剛才的 namespace id
```

### 步驟 5：初始化資料庫
```bash
# 建立資料表結構
wrangler d1 migrations apply qter-db --remote

# 建立測試用戶
wrangler d1 execute qter-db --remote --command "INSERT INTO users (id, email, password_hash) VALUES ('demo', 'demo@test.com', 'demo')"

# 建立測試問卷
wrangler d1 execute qter-db --remote --command "INSERT INTO forms (id, user_id, title, markdown_content, display_mode, show_progress_bar, enable_auto_advance, advance_delay, allow_back_navigation) VALUES ('test-survey', 'demo', '產品滿意度調查', '## 您滿意我們的服務嗎？\ntype: rating\nscale: 5', 'step-by-step', 1, 1, 2, 1)"

# 建立分享連結
wrangler d1 execute qter-db --remote --command "INSERT INTO share_links (id, form_id, hash, is_enabled, allow_anonymous) VALUES ('sl1', 'test-survey', 'demo12345678', 1, 1)"
```

### 步驟 6：部署 Workers
```bash
wrangler deploy
```

成功後會顯示：
```
Uploaded qter-api (X sec)
Published qter-api (X sec)
  https://qter-api.您的帳號.workers.dev
```

**記下這個網址！**

---

## ✅ 測試 API

部署完成後，測試您的 API：

1. **健康檢查**：
   ```
   https://qter-api.您的帳號.workers.dev/api/health
   ```
   
2. **取得問卷**：
   ```
   https://qter-api.您的帳號.workers.dev/api/public/s/demo12345678
   ```

---

## 🔗 連接前端與後端

### 在 Vercel 設定環境變數

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 進入 **Settings** → **Environment Variables**
4. 新增：
   - Name: `VITE_API_BASE_URL`
   - Value: `https://qter-api.您的帳號.workers.dev/api`
5. 重新部署（Redeploy）

### 或本地測試時
建立 `frontend/.env` 檔案：
```
VITE_API_BASE_URL=https://qter-api.您的帳號.workers.dev/api
```

---

## 💡 快速檢查清單

- [ ] Cloudflare 帳號已註冊
- [ ] wrangler 已安裝 (`npm install -g wrangler`)
- [ ] wrangler 已登入 (`wrangler login`)
- [ ] D1 資料庫已建立
- [ ] KV 存儲已建立
- [ ] wrangler.toml 已更新 ID
- [ ] 資料庫已初始化
- [ ] Workers 已部署
- [ ] API 網址已記下

---

## 🚨 常見問題

### Q: wrangler: command not found
```bash
npm install -g wrangler
```

### Q: Authentication required
```bash
wrangler login
```

### Q: Database not found
確認 `wrangler.toml` 的 `database_id` 正確

### Q: CORS 錯誤
API 已設定允許所有來源，檢查 URL 是否正確

---

## 📝 完整流程總結

1. **前端** → Vercel（已完成）
2. **後端** → Cloudflare Workers（現在要做）
3. **連接** → 設定環境變數

您現在在第 2 步！按照上面的步驟操作即可。