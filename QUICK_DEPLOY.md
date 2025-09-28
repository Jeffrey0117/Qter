# QTER 問卷系統 - 快速部署指南

## 🚀 5分鐘部署到雲端

### 前置準備
1. 註冊帳號：
   - [Cloudflare](https://dash.cloudflare.com) (後端)
   - [Vercel](https://vercel.com) (前端)
   
2. 安裝工具：
```bash
npm install -g wrangler vercel
```

---

## 第一步：部署後端 (Cloudflare Workers)

### 1. 登入 Cloudflare
```bash
wrangler login
```

### 2. 建立資料庫和存儲
```bash
# 建立 D1 資料庫
wrangler d1 create qter-db

# 建立 KV 存儲空間
wrangler kv:namespace create RATE_LIMIT
```

**重要**：複製上面指令輸出的 ID！

### 3. 更新設定檔
編輯 `wrangler.toml`，替換這兩行：
```toml
database_id = "YOUR_DATABASE_ID_HERE"  # 替換成剛才的 database_id
id = "YOUR_KV_NAMESPACE_ID_HERE"       # 替換成剛才的 namespace id
```

### 4. 初始化資料庫
```bash
# 建立資料表
wrangler d1 migrations apply qter-db --remote

# 建立測試問卷
wrangler d1 execute qter-db --remote --command "INSERT INTO users (id, email, password_hash) VALUES ('demo', 'demo@test.com', 'x')"

wrangler d1 execute qter-db --remote --command "INSERT INTO forms (id, user_id, title, description, markdown_content, display_mode) VALUES ('test-2025', 'demo', '產品滿意度調查', '協助我們改進產品', '## 您對我們的產品滿意嗎？\n\n- ( ) 非常滿意\n- ( ) 滿意\n- ( ) 普通\n- ( ) 不滿意\n\n## 您最喜歡哪個功能？\n\n- [ ] 自動儲存\n- [ ] 即時預覽\n- [ ] 多種題型\n- [ ] 資料分析\n\n## 有什麼建議嗎？\n\n[________]\n\n感謝您的回饋！', 'step-by-step')"

wrangler d1 execute qter-db --remote --command "INSERT INTO share_links (id, form_id, hash, is_enabled, allow_anonymous) VALUES ('sl1', 'test-2025', 'demo12345678', 1, 1)"
```

### 5. 部署 Workers
```bash
wrangler deploy
```

**記下輸出的網址**，例如：`https://qter-api.你的帳號.workers.dev`

---

## 第二步：部署前端 (Vercel)

### 1. 設定 API 網址
建立檔案 `frontend/.env.production`：
```
VITE_API_BASE_URL=https://qter-api.你的帳號.workers.dev/api
```
（替換成你的 Workers 網址）

### 2. 部署到 Vercel
```bash
cd frontend
vercel --prod
```

按照提示操作：
- Set up and deploy? **Y**
- Which scope? **選你的帳號**
- Link to existing project? **N**
- Project name? **qter-survey**
- Directory? **./（直接按 Enter）**
- Override settings? **N**

---

## ✅ 測試你的問卷系統

部署完成！你會得到一個網址，例如：`https://qter-survey.vercel.app`

### 測試連結：
1. **首頁**：https://你的網址.vercel.app
2. **Demo 問卷**：https://你的網址.vercel.app/demo (純前端測試)
3. **公開問卷**：https://你的網址.vercel.app/s/demo12345678 (完整功能)

### 查看回應資料
```bash
wrangler d1 execute qter-db --remote --command "SELECT * FROM responses ORDER BY submitted_at DESC LIMIT 5"
```

---

## 📝 常見問題

### Q: 如何更新？
- 更新後端：`wrangler deploy`
- 更新前端：`cd frontend && vercel --prod`

### Q: CORS 錯誤？
確認 `frontend/.env.production` 的 API 網址正確（要加 `/api`）

### Q: 資料庫錯誤？
確認 `wrangler.toml` 的 ID 都已正確替換

### Q: 想用自訂網域？
- Vercel：在 Dashboard 設定 Domain
- Cloudflare：在 Workers 設定 Custom Domain

---

## Windows 用戶專屬

直接執行：
```cmd
deploy.bat
```
選擇「3」完整部署，跟著提示操作即可！