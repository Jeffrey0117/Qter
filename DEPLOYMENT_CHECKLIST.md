# QTER 部署檢查清單

快速參考指南，協助你完成 Supabase + Vercel 部署。

## 📋 部署前準備

### 帳號註冊

- [ ] 註冊 [Supabase](https://supabase.com) 帳號
- [ ] 註冊 [Vercel](https://vercel.com) 帳號
- [ ] 準備 GitHub 帳號（可選，用於 CI/CD）

### 本地環境

- [ ] 安裝 Node.js >= 18.0.0
- [ ] 安裝 Git
- [ ] Clone 專案到本地
- [ ] 執行 `cd frontend && npm install`

## 🗄️ Supabase 設定

### 1. 建立專案

- [ ] 登入 Supabase Dashboard
- [ ] 點擊 "New Project"
- [ ] 填寫專案資訊：
  - [ ] 專案名稱：`qter-production`
  - [ ] 資料庫密碼：（記下來！）
  - [ ] 區域：選擇 Tokyo 或最近區域
- [ ] 等待專案建立完成（約 2 分鐘）

### 2. 執行資料庫 Migrations

- [ ] 進入 SQL Editor
- [ ] 執行 Migration 0001（初始化資料表）
  - 複製 `SUPABASE_DEPLOY.md` 中的 SQL
  - 貼上並執行
- [ ] 執行 Migration 0002（新增欄位）
  - 複製 `SUPABASE_DEPLOY.md` 中的 SQL
  - 貼上並執行

### 3. 設定 Row Level Security (RLS)

- [ ] 執行啟用 RLS 的 SQL
- [ ] 執行設定 RLS 政策的 SQL
- [ ] 驗證政策已正確建立

### 4. 建立測試資料

- [ ] 執行測試資料 SQL
- [ ] 在 Table Editor 確認資料已建立：
  - [ ] users 表有測試用戶
  - [ ] forms 表有測試問卷
  - [ ] share_links 表有分享連結

### 5. 取得 API 金鑰

- [ ] Settings → API
- [ ] 複製 **Project URL**
- [ ] 複製 **anon/public key**
- [ ] 儲存到安全的地方

## 🌐 Vercel 部署

### 1. 本地測試

- [ ] 建立 `frontend/.env.local`
- [ ] 填入 Supabase URL 和 Key
- [ ] 執行 `npm run dev`
- [ ] 訪問 `http://localhost:5173`
- [ ] 測試問卷功能

### 2. 部署到 Vercel

#### 方法一：Dashboard 部署（推薦）

- [ ] 登入 Vercel Dashboard
- [ ] 點擊 "Import Project"
- [ ] 選擇 GitHub repository
- [ ] 設定：
  - [ ] Framework: Vite
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] 新增環境變數：
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_APP_NAME`
- [ ] 點擊 "Deploy"

#### 方法二：CLI 部署

- [ ] 安裝 Vercel CLI: `npm install -g vercel`
- [ ] 執行 `cd frontend && vercel`
- [ ] 設定環境變數: `vercel env add`
- [ ] 生產部署: `vercel --prod`

### 3. 驗證部署

- [ ] 訪問 Vercel 提供的網址
- [ ] 測試以下功能：
  - [ ] 首頁載入
  - [ ] 問卷列表
  - [ ] 測試問卷：`/s/demo12345678`
  - [ ] 填寫並提交問卷
  - [ ] 在 Supabase 確認回應已儲存

## 🧪 功能測試清單

### 基本功能

- [ ] 首頁正常顯示
- [ ] 問卷編輯器運作
- [ ] 問卷預覽正確
- [ ] 可以儲存問卷

### 問卷填寫

- [ ] 分享連結可訪問
- [ ] 所有題型正常顯示
- [ ] 必填驗證有效
- [ ] 可以提交回應
- [ ] 提交成功訊息顯示

### 資料儲存

- [ ] 回應儲存到 Supabase
- [ ] 在 Table Editor 可看到回應
- [ ] 資料完整性正確

### 效能測試

- [ ] 首次載入時間 < 3 秒
- [ ] 頁面切換流暢
- [ ] 沒有明顯延遲

## 🔒 安全檢查

- [ ] `.env.local` 已加入 `.gitignore`
- [ ] 沒有將 `service_role` key 用於前端
- [ ] RLS 政策已正確設定
- [ ] 環境變數沒有硬編碼在程式碼中
- [ ] HTTPS 已啟用（Vercel 自動）

## 📊 監控設定（可選）

### Supabase

- [ ] 啟用 Realtime（如需即時功能）
- [ ] 設定資料庫備份
- [ ] 查看 Logs 確認無錯誤

### Vercel

- [ ] 查看 Analytics
- [ ] 設定 Custom Domain（可選）
- [ ] 啟用 Preview Deployments

## 🧹 清理舊資源

如果你之前使用 Cloudflare：

- [ ] 備份 Cloudflare D1 資料（如需要）
- [ ] 執行清理腳本：
  - Windows: `cleanup-cloudflare.bat`
  - macOS/Linux: `./cleanup-cloudflare.sh`
- [ ] 確認以下已刪除：
  - [ ] Cloudflare Workers
  - [ ] D1 資料庫
  - [ ] KV 命名空間
- [ ] 刪除本地檔案（可選）：
  - [ ] `wrangler.toml`
  - [ ] `.wrangler/`
  - [ ] `api/worker/`
  - [ ] `CLOUDFLARE_DEPLOY.md`
  - [ ] `DEPLOYMENT.md`
  - [ ] `QUICK_DEPLOY.md`

## 📝 文檔更新

- [ ] 更新 README.md（已完成）
- [ ] 閱讀 SUPABASE_DEPLOY.md
- [ ] 閱讀 ENVIRONMENT_VARIABLES.md
- [ ] 如從 Cloudflare 遷移，參考 MIGRATION_GUIDE.md

## 🎯 部署後任務

### 立即執行

- [ ] 測試所有核心功能
- [ ] 確認環境變數正確
- [ ] 檢查 Console 沒有錯誤
- [ ] 測試手機版本響應式

### 第一週

- [ ] 監控錯誤日誌
- [ ] 收集使用者回饋
- [ ] 優化載入速度
- [ ] 設定 Custom Domain（可選）

### 持續優化

- [ ] 定期檢查 Supabase 使用量
- [ ] 優化資料庫查詢
- [ ] 新增資料庫索引（如需要）
- [ ] 設定監控告警

## 📞 需要幫助？

### 文檔資源

- [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md) - 完整部署指南
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境變數說明
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Cloudflare 遷移指南
- [README.md](./README.md) - 專案總覽

### 外部資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Vercel 文檔](https://vercel.com/docs)
- [Vue 3 文檔](https://vuejs.org/)

### 問題回報

如遇到問題：

1. 檢查瀏覽器 Console 錯誤訊息
2. 查看 Supabase Logs
3. 查看 Vercel Logs
4. 參考文檔 FAQ 區塊
5. 開 GitHub Issue

## ✅ 部署完成確認

全部完成後，你應該有：

- [ ] ✅ Supabase 專案運行中
- [ ] ✅ 資料庫表單已建立
- [ ] ✅ RLS 政策已設定
- [ ] ✅ Vercel 專案已部署
- [ ] ✅ 環境變數已配置
- [ ] ✅ 測試問卷可正常使用
- [ ] ✅ 所有功能測試通過
- [ ] ✅ 沒有 Console 錯誤

## 🎉 恭喜！

你已成功部署 QTER 問卷系統！

**下一步可以做什麼？**

1. 創建你的第一個問卷
2. 分享給使用者測試
3. 查看回應資料
4. 探索進階功能：
   - 啟用使用者認證
   - 新增檔案上傳
   - 設定即時通知
   - 自訂品牌樣式

---

**提示**：建議將此檢查清單列印或儲存為書籤，方便日後參考。
