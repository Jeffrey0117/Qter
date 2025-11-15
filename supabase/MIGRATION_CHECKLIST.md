# QTER Supabase 遷移檢查清單

## 準備階段

### 1. 環境設置
- [ ] 安裝 Supabase CLI: `npm install -g supabase`
- [ ] 安裝 Docker Desktop (用於本地 Supabase)
- [ ] 驗證 Docker 正在運行: `docker --version`
- [ ] 註冊 Supabase 帳號（如果需要生產環境）

### 2. 專案初始化
- [ ] 執行設定腳本:
  - Windows: `.\supabase\setup.ps1`
  - macOS/Linux: `./supabase/setup.sh`
- [ ] 驗證本地 Supabase 啟動: `supabase status`
- [ ] 記錄 API URL 和 Keys

---

## 資料庫遷移

### 3. Schema 遷移
- [ ] 檢查 `supabase/migrations/001_initial_schema.sql`
- [ ] 執行遷移: `supabase db reset`
- [ ] 驗證所有表已創建:
  ```sql
  \dt public.*
  ```
- [ ] 驗證所有索引已創建:
  ```sql
  \di public.*
  ```
- [ ] 驗證 RLS policies 已啟用:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```

### 4. 測試數據
- [ ] 插入測試數據: `supabase db reset` (包含 seed)
- [ ] 驗證數據插入成功:
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM forms;
  SELECT COUNT(*) FROM share_links;
  SELECT COUNT(*) FROM responses;
  SELECT COUNT(*) FROM response_items;
  ```

---

## TypeScript 類型

### 5. 生成類型定義
- [ ] 生成 TypeScript 類型:
  ```bash
  supabase gen types typescript --local > frontend/src/types/database.types.ts
  ```
- [ ] 檢查生成的類型文件
- [ ] 在專案中導入並使用類型

---

## 前端更新

### 6. 安裝依賴
- [ ] 安裝 Supabase 客戶端:
  ```bash
  cd frontend
  npm install @supabase/supabase-js
  ```

### 7. 環境變數
- [ ] 複製 `supabase/.env.example` 到 `frontend/.env`
- [ ] 填入 Supabase URL 和 anon key
- [ ] 更新 `.gitignore` 確保 `.env` 不被提交

### 8. 初始化 Supabase 客戶端
- [ ] 創建 `frontend/src/lib/supabase.ts`:
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  import type { Database } from '@/types/database.types'

  export const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  ```

### 9. 更新 API 服務
- [ ] 更新 `frontend/src/services/api.ts`
- [ ] 替換所有 D1 查詢為 Supabase 查詢
- [ ] 更新數據類型:
  - `INTEGER` → `BOOLEAN`
  - `TEXT` (JSON) → 直接使用 object
  - `TEXT` (ID) → `UUID` string
  - `DATETIME` → `ISO 8601` string

### 10. 更新組件
- [ ] 更新所有使用 API 的組件
- [ ] 處理 UUID 格式的 ID
- [ ] 處理布林值 (true/false vs 1/0)
- [ ] 處理 JSONB 欄位（無需 JSON.parse）
- [ ] 測試所有 CRUD 操作

---

## 後端更新

### 11. 環境變數
- [ ] 更新 `api/.dev.vars`:
  ```
  SUPABASE_URL=http://localhost:54321
  SUPABASE_SERVICE_KEY=your-service-role-key
  ```

### 12. 安裝依賴
- [ ] 安裝 Supabase 客戶端:
  ```bash
  cd api
  npm install @supabase/supabase-js
  ```

### 13. 更新 API 路由
- [ ] 替換 D1 binding 為 Supabase client
- [ ] 更新所有查詢語法
- [ ] 實作 RLS policies 邏輯
- [ ] 更新錯誤處理

### 14. 認證系統
- [ ] 決定使用 Supabase Auth 或自訂 JWT
- [ ] 如果使用 Supabase Auth:
  - [ ] 移除自訂 JWT 邏輯
  - [ ] 使用 Supabase Auth API
  - [ ] 更新前端登入/註冊流程
- [ ] 如果使用自訂 JWT:
  - [ ] 在 middleware 中驗證 JWT
  - [ ] 設定 `auth.uid()` context

---

## 測試

### 15. 單元測試
- [ ] 測試所有 API endpoints
- [ ] 測試數據驗證
- [ ] 測試錯誤處理

### 16. 整合測試
- [ ] 測試用戶註冊/登入
- [ ] 測試問卷 CRUD 操作
- [ ] 測試分享連結生成
- [ ] 測試問卷填答流程
- [ ] 測試回應數據查詢

### 17. RLS 測試
- [ ] 測試用戶只能看到自己的問卷
- [ ] 測試匿名用戶可以填寫公開問卷
- [ ] 測試過期/停用的分享連結被拒絕
- [ ] 測試刪除問卷時級聯刪除相關數據

### 18. 效能測試
- [ ] 測試大量問卷的查詢速度
- [ ] 測試 JSONB 查詢效能
- [ ] 測試分頁功能
- [ ] 檢查索引使用情況

---

## 數據遷移（如果有現有數據）

### 19. 匯出舊數據
- [ ] 從 D1 匯出所有用戶
- [ ] 從 D1 匯出所有問卷
- [ ] 從 D1 匯出所有分享連結
- [ ] 從 D1 匯出所有回應

### 20. 轉換數據格式
- [ ] 將 TEXT ID 轉換為 UUID
- [ ] 將 INTEGER boolean 轉換為 BOOLEAN
- [ ] 將 JSON string 轉換為 JSONB object
- [ ] 將 DATETIME 轉換為 TIMESTAMP WITH TIME ZONE

### 21. 匯入新數據
- [ ] 匯入用戶（保留密碼 hash）
- [ ] 匯入問卷
- [ ] 匯入分享連結
- [ ] 匯入回應
- [ ] 驗證數據完整性

---

## 部署準備

### 22. 生產環境 Supabase
- [ ] 在 Supabase Dashboard 創建新專案
- [ ] 記錄生產環境 URL 和 Keys
- [ ] 設定自訂域名（如果需要）

### 23. 執行生產遷移
- [ ] 連接到生產專案: `supabase link`
- [ ] 推送 schema: `supabase db push`
- [ ] 驗證 schema 正確

### 24. 環境變數設定
- [ ] 在 Cloudflare Pages 設定前端環境變數:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] 在 Cloudflare Workers 設定後端環境變數:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`

### 25. 更新 CI/CD
- [ ] 更新部署腳本
- [ ] 移除 D1 相關設定
- [ ] 測試自動部署流程

---

## 監控和維護

### 26. 設定監控
- [ ] 在 Supabase Dashboard 啟用 logging
- [ ] 設定 API usage alerts
- [ ] 設定 database size alerts
- [ ] 設定錯誤通知

### 27. 效能優化
- [ ] 檢查慢查詢日誌
- [ ] 優化未使用的索引
- [ ] 設定 connection pooling
- [ ] 定期執行 VACUUM ANALYZE

### 28. 備份策略
- [ ] 啟用自動備份（Supabase Pro）
- [ ] 或設定自訂備份腳本
- [ ] 測試備份恢復流程

---

## 文檔更新

### 29. 技術文檔
- [ ] 更新 README.md
- [ ] 更新 API 文檔
- [ ] 更新環境設定指南
- [ ] 更新部署指南

### 30. 團隊培訓
- [ ] 分享 Supabase 使用指南
- [ ] 說明 RLS policies 運作方式
- [ ] 教導 TypeScript 類型使用
- [ ] 分享最佳實踐

---

## 驗收檢查

### 31. 功能驗收
- [ ] 用戶可以註冊/登入
- [ ] 用戶可以創建/編輯/刪除問卷
- [ ] 用戶可以生成分享連結
- [ ] 匿名用戶可以填寫問卷
- [ ] 用戶可以查看回應數據
- [ ] 所有統計數據正確顯示

### 32. 安全性驗收
- [ ] RLS policies 正常運作
- [ ] 用戶無法訪問他人的問卷
- [ ] Service key 未暴露在前端
- [ ] CORS 設定正確
- [ ] SQL injection 防護測試

### 33. 效能驗收
- [ ] 頁面載入時間 < 3 秒
- [ ] API 回應時間 < 500ms
- [ ] 大量數據查詢不會超時
- [ ] 並發請求處理正常

---

## 完成後

### 34. 清理
- [ ] 移除 D1 相關代碼
- [ ] 移除舊的 migrations 檔案（保留備份）
- [ ] 清理未使用的依賴
- [ ] 更新 .gitignore

### 35. 慶祝 🎉
- [ ] 團隊分享成功經驗
- [ ] 記錄遇到的問題和解決方案
- [ ] 持續監控系統運作

---

## 回滾計畫（如果需要）

### 緊急回滾步驟
1. [ ] 保留 D1 資料庫作為備份
2. [ ] 準備回滾腳本恢復舊代碼
3. [ ] 測試回滾流程
4. [ ] 文檔化回滾步驟

---

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [Supabase CLI 文檔](https://supabase.com/docs/guides/cli)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)

---

**注意事項：**
- 逐項完成檢查清單
- 在每個階段都要測試
- 遇到問題立即記錄
- 保持舊系統運作直到新系統完全穩定
- 逐步遷移用戶而非一次性切換

**預估時間：** 3-5 天（取決於數據量和團隊規模）
