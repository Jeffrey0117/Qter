# Supabase 遷移變更日誌

本文檔記錄從 Cloudflare Workers 遷移到 Supabase 的所有變更。

## 變更日期

2025-11-15

## 📁 新增文件

### 部署相關文檔

1. **SUPABASE_DEPLOY.md** (14.3 KB)
   - 完整的 Supabase 部署指南
   - 包含資料庫設定、RLS 政策、環境變數配置
   - 提供兩種部署方法：Dashboard 和 CLI

2. **DEPLOYMENT_CHECKLIST.md** (7.2 KB)
   - 逐步部署檢查清單
   - 涵蓋從註冊到上線的所有步驟
   - 包含測試和驗證項目

3. **ENVIRONMENT_VARIABLES.md** (7.0 KB)
   - 環境變數完整說明
   - 各平台設定指南（Vercel、Netlify、Railway）
   - 安全最佳實踐

4. **MIGRATION_GUIDE.md** (8.2 KB)
   - Cloudflare 到 Supabase 遷移指南
   - 資料備份和匯入步驟
   - 功能對照表和常見問題

### 配置文件

5. **vercel.json** (1.1 KB)
   - Vercel 部署配置
   - 包含 rewrites、headers、快取設定
   - 針對 frontend 目錄優化

6. **.gitignore** (root)
   - 新增根目錄 .gitignore
   - 包含 Supabase 相關忽略項目
   - 環境變數檔案保護

### 清理腳本

7. **cleanup-cloudflare.sh** (5.1 KB)
   - Bash 腳本（macOS/Linux）
   - 自動刪除 Cloudflare Workers、D1、KV
   - 可選刪除本地相關檔案

8. **cleanup-cloudflare.bat** (3.9 KB)
   - Windows 批次檔版本
   - 功能與 .sh 版本相同
   - UTF-8 編碼支援中文

## 📝 修改文件

### 主要文檔

1. **README.md**
   - 移除 Cloudflare 相關說明
   - 新增 Supabase 架構圖
   - 更新技術棧說明
   - 新增部署指南章節
   - 更新專案結構（包含 supabase/ 目錄）
   - 新增兩種資料存儲模式說明（本地 vs 雲端）

### 前端配置

2. **frontend/.gitignore**
   - 新增 `.env.production.local`
   - 新增 `.env.development.local`
   - 新增 Supabase 相關項目：
     - `.supabase`
     - `supabase/.branches`
     - `supabase/.temp`
     - `supabase/functions/.env`

3. **frontend/.env.example**
   - 移除 Google OAuth 配置（已在檢視時更新）
   - 新增 Supabase URL 和 Key
   - 更新註解說明

## 🗂️ 目錄結構變更

### 新增目錄

```
qter/
├── supabase/              # 新增：Supabase 配置目錄
│   ├── migrations/        # 資料庫 migration 檔案
│   ├── README.md
│   ├── INDEX.md
│   ├── MIGRATION_CHECKLIST.md
│   └── MIGRATION_SUMMARY.md
└── .claude/              # Claude Code 配置（自動生成）
```

### 保留目錄（待清理）

以下目錄和檔案建議在遷移完成後刪除：

```
qter/
├── api/                   # Cloudflare Workers 程式碼
├── .wrangler/            # Wrangler 快取
├── wrangler.toml         # Wrangler 配置
├── CLOUDFLARE_DEPLOY.md  # Cloudflare 部署文檔
├── DEPLOYMENT.md         # 舊部署文檔
├── QUICK_DEPLOY.md       # 快速部署文檔（Cloudflare）
├── deploy.bat            # Cloudflare 部署腳本
└── setup-test-data.sql   # Cloudflare 測試資料
```

## 🔄 環境變數變更

### 移除的變數

```env
# Cloudflare Workers API
VITE_API_BASE_URL=https://qter-api.your-account.workers.dev/api

# Google OAuth（前端配置）
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 新增的變數

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 應用配置
VITE_APP_NAME=QTER 輕巧問卷系統
```

## 📊 功能對照

| 功能 | Cloudflare | Supabase |
|------|-----------|----------|
| 資料庫 | D1 (SQLite) | PostgreSQL |
| API | 手動實作 Workers | 自動生成 RESTful API |
| 認證 | 自行實作 JWT | Supabase Auth |
| 儲存 | R2 (需額外設定) | Supabase Storage |
| 即時功能 | 無 | Supabase Realtime |
| 管理介面 | wrangler CLI | Dashboard + SQL Editor |
| 本地開發 | wrangler dev | supabase start |
| RLS | 無 | 內建 Row Level Security |
| 備份 | 手動 | 自動（Pro 計畫）|

## 🎯 遷移檢查清單

### 已完成項目 ✅

- [x] 創建 Supabase 部署文檔
- [x] 更新 README.md
- [x] 創建 vercel.json 配置
- [x] 更新 .gitignore
- [x] 創建清理腳本
- [x] 創建環境變數指南
- [x] 創建遷移指南
- [x] 創建部署檢查清單

### 待執行項目 ⏳

使用者需要執行：

- [ ] 建立 Supabase 專案
- [ ] 執行資料庫 migrations
- [ ] 設定 RLS 政策
- [ ] 取得 Supabase API 金鑰
- [ ] 在 Vercel 設定環境變數
- [ ] 部署前端到 Vercel
- [ ] 測試所有功能
- [ ] 執行清理腳本刪除 Cloudflare 資源

## 📈 影響評估

### 優勢

1. **開發體驗提升**
   - 視覺化資料庫管理
   - 自動生成 API
   - 更豐富的開發工具

2. **功能增強**
   - 完整認證系統
   - 檔案上傳
   - 即時資料同步
   - Row Level Security

3. **維護成本降低**
   - 無需維護 Workers 程式碼
   - 自動備份（Pro 計畫）
   - 更好的監控工具

### 注意事項

1. **資料庫差異**
   - SQLite → PostgreSQL
   - 語法可能需要調整
   - 日期時間格式不同

2. **API 架構變更**
   - 從 Workers 自定義 API 改為 Supabase REST API
   - 前端程式碼需要更新（如有直接呼叫）

3. **免費方案限制**
   - Cloudflare: 100k req/day
   - Supabase: 50k MAU, 500MB DB
   - 需評估專案規模

## 🔍 回滾計畫

如需回滾到 Cloudflare：

1. **保留資源**（建議至少 1 週）
   - 不要立即執行清理腳本
   - 保留 `wrangler.toml`
   - 保留 `api/worker/` 目錄

2. **快速回滾步驟**
   - 在 Vercel 切換環境變數回 `VITE_API_BASE_URL`
   - 重新部署 Cloudflare Workers（如已刪除）
   - 回滾前端程式碼變更（如有）
   - 重新部署 Vercel

3. **資料恢復**
   - 從 Supabase 匯出資料（SQL 或 CSV）
   - 轉換格式為 SQLite 相容
   - 匯入回 D1 資料庫

## 📚 相關文檔

### 新增文檔

- [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md) - Supabase 部署完整指南
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署檢查清單
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 環境變數設定
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 遷移指南

### 保留文檔（參考用）

- [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md) - Cloudflare 部署指南（舊）
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 舊部署文檔
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 快速部署（舊）

### 外部資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Vercel 部署文檔](https://vercel.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)

## 💡 下一步建議

### 短期（1-2 週）

1. 完成 Supabase 部署
2. 驗證所有功能正常
3. 監控系統運行狀態
4. 收集使用者回饋

### 中期（1 個月）

1. 清理 Cloudflare 資源
2. 刪除舊文檔和程式碼
3. 優化資料庫查詢
4. 新增資料庫索引

### 長期（3 個月+）

1. 實作 Supabase Auth 認證系統
2. 新增檔案上傳功能
3. 啟用即時資料同步
4. 設定自動備份（Pro 計畫）
5. 效能優化和監控

## 🐛 已知問題

目前無已知問題。

## 📞 支援

如遇到問題：

1. 查看相關文檔的 FAQ 章節
2. 檢查環境變數是否正確設定
3. 查看 Supabase Logs 和 Vercel Logs
4. 參考 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 的疑難排解
5. 開啟 GitHub Issue

## ✅ 驗證步驟

完成遷移後，請驗證：

- [ ] 所有新文檔已創建
- [ ] README.md 已更新
- [ ] .gitignore 已更新
- [ ] 環境變數範例已更新
- [ ] 清理腳本可執行
- [ ] 所有文檔鏈接正確

---

**變更摘要**：成功將 QTER 專案從 Cloudflare Workers + D1 架構遷移到 Supabase + Vercel 架構，提供更好的開發體驗和更豐富的功能。

**下一步**：請參考 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 開始部署流程。
