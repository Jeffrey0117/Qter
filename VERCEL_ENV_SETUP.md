# Vercel 環境變數設定指南

## 🚀 立即設定（1 分鐘）

### 方法 1：使用 Vercel Dashboard（最簡單）

1. 打開 https://vercel.com/dashboard
2. 選擇您的專案（qter）
3. 點選 **Settings** → **Environment Variables**
4. 新增以下變數：

```
Name: VITE_SUPABASE_URL
Value: https://ihhucjcbhyakrenmpryh.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg

Name: VITE_APP_NAME
Value: QTER 輕巧問卷系統
```

5. 每個變數都選擇 **All Environments** (Production, Preview, Development)
6. 點選 **Save**
7. 前往 **Deployments** → 點最新的部署 → **Redeploy**

### 方法 2：使用命令列（進階）

```bash
cd C:\Users\jeffb\Desktop\code\Qter

# 設定生產環境變數
vercel env add VITE_SUPABASE_URL production
# 貼上: https://ihhucjcbhyakrenmpryh.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# 貼上: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaHVjamNiaHlha3Jlbm1wcnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk5MjksImV4cCI6MjA3ODc5NTkyOX0.lLn455Jg5iiW9JhfWS-nr__Np-z6H8lVHn4eI95rVUg

# 重新部署
vercel --prod
```

## ✅ 驗證設定

設定完成後，訪問您的 Vercel 網址（例如 https://qter.vercel.app），應該能夠：
- ✅ 正常載入首頁
- ✅ 使用 Google 登入
- ✅ 建立和填寫問卷
- ✅ 查看儀表板

## 🔍 檢查環境變數是否生效

在瀏覽器開啟您的 Vercel 網站，按 F12 開啟開發者工具，Console 輸入：

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```

應該會顯示：`https://ihhucjcbhyakrenmpryh.supabase.co`

## ⚠️ 注意事項

1. **更改環境變數後必須重新部署**才會生效
2. 環境變數在 build time 注入，不是 runtime
3. 確保所有環境變數都以 `VITE_` 開頭才能在前端使用
4. **絕對不要**提交 `.env.local` 到 Git（已在 .gitignore）

## 🐛 常見問題

### Q: 設定後還是看到「找不到問卷」
A: 確認已重新部署，並清除瀏覽器快取

### Q: Google 登入失敗
A: 需要在 Supabase 啟用 Google Provider：
   Settings → Authentication → Providers → Google

### Q: 環境變數沒有生效
A: 確認變數名稱正確（包含 `VITE_` 前綴）並重新部署
