# 從 Cloudflare 遷移到 Supabase 指南

本文檔說明如何將 QTER 專案從 Cloudflare Workers + D1 遷移到 Supabase。

## 為什麼要遷移？

### Supabase 的優勢

1. **開發體驗更好**
   - 視覺化資料庫管理介面
   - 內建 SQL Editor
   - 自動生成 RESTful API
   - 即時資料訂閱功能

2. **功能更豐富**
   - 完整的使用者認證系統
   - 檔案儲存服務
   - PostgreSQL 完整功能
   - Row Level Security (RLS)

3. **成本更低**
   - 免費方案更慷慨
   - 沒有隱藏費用
   - 社群版開源可自架

4. **生態系更好**
   - 豐富的 SDK 和工具
   - 活躍的社群支援
   - 大量教學資源

## 遷移步驟

### 第一步：備份現有資料（如有需要）

如果你的 Cloudflare D1 資料庫中有重要資料，先備份：

```bash
# 匯出所有資料表資料
wrangler d1 execute qter-db --remote --command "SELECT * FROM users" > backup_users.sql
wrangler d1 execute qter-db --remote --command "SELECT * FROM forms" > backup_forms.sql
wrangler d1 execute qter-db --remote --command "SELECT * FROM responses" > backup_responses.sql
```

或使用 JSON 格式：

```bash
wrangler d1 execute qter-db --remote --json --command "SELECT * FROM users" > backup_users.json
wrangler d1 execute qter-db --remote --json --command "SELECT * FROM forms" > backup_forms.json
wrangler d1 execute qter-db --remote --json --command "SELECT * FROM responses" > backup_responses.json
```

### 第二步：設定 Supabase

詳細步驟請參考 [SUPABASE_DEPLOY.md](./SUPABASE_DEPLOY.md)

快速摘要：

1. 建立 Supabase 專案
2. 執行 migration 腳本
3. 設定 RLS 政策
4. 取得 API 金鑰

### 第三步：匯入備份資料到 Supabase（可選）

如果你有備份資料需要匯入：

#### 使用 SQL Editor

在 Supabase Dashboard 的 SQL Editor 中：

```sql
-- 匯入用戶資料
INSERT INTO users (id, email, password_hash, created_at)
VALUES
  ('user1', 'user1@example.com', 'hash1', '2024-01-01 00:00:00'),
  ('user2', 'user2@example.com', 'hash2', '2024-01-02 00:00:00');

-- 匯入問卷資料
INSERT INTO forms (id, user_id, title, description, markdown_content, ...)
VALUES (...);

-- 以此類推
```

#### 使用 CSV 匯入

1. 將 JSON 備份轉換為 CSV
2. 在 Supabase Dashboard > Table Editor
3. 選擇資料表 > Insert > Import from CSV

### 第四步：更新前端環境變數

#### 本地開發

編輯或創建 `frontend/.env.local`：

```env
# 舊的 Cloudflare 設定（移除）
# VITE_API_BASE_URL=https://qter-api.your-account.workers.dev/api

# 新的 Supabase 設定
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
VITE_APP_NAME=QTER 輕巧問卷系統
```

#### Vercel 生產環境

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇你的專案
3. Settings > Environment Variables
4. **刪除舊變數**：
   - `VITE_API_BASE_URL`
5. **新增新變數**：
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...your-anon-key`
6. 重新部署

### 第五步：更新前端程式碼

如果你的前端程式碼有直接呼叫 Cloudflare API，需要更新為 Supabase SDK。

#### 安裝 Supabase SDK

```bash
cd frontend
npm install @supabase/supabase-js
```

#### 初始化 Supabase 客戶端

創建 `frontend/src/services/supabase.ts`：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 更新 API 呼叫

**舊的 API 呼叫方式 (Cloudflare)**：

```typescript
// 取得問卷
const response = await fetch(`${API_BASE_URL}/public/s/${hash}`)
const form = await response.json()

// 提交回應
await fetch(`${API_BASE_URL}/responses`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(responseData)
})
```

**新的 API 呼叫方式 (Supabase)**：

```typescript
import { supabase } from '@/services/supabase'

// 取得問卷
const { data: shareLink } = await supabase
  .from('share_links')
  .select('*, forms(*)')
  .eq('hash', hash)
  .single()

// 提交回應
const { data, error } = await supabase
  .from('responses')
  .insert({
    form_id: formId,
    share_link_id: shareLinkId,
    submitted_at: new Date().toISOString(),
    // ...其他欄位
  })
```

### 第六步：測試功能

部署前先在本地測試所有功能：

- [ ] 問卷列表載入
- [ ] 問卷填寫
- [ ] 回應提交
- [ ] 資料儲存
- [ ] 分享連結
- [ ] 使用者認證（如有）

### 第七步：部署到 Vercel

```bash
cd frontend
vercel --prod
```

### 第八步：清理 Cloudflare 資源

確認新系統運作正常後，清理舊的 Cloudflare 資源：

#### Windows 用戶

```bash
cleanup-cloudflare.bat
```

#### macOS/Linux 用戶

```bash
chmod +x cleanup-cloudflare.sh
./cleanup-cloudflare.sh
```

或手動執行：

```bash
# 刪除 Workers
wrangler delete qter-api --force

# 刪除 D1 資料庫
wrangler d1 list
wrangler d1 delete [database-id]

# 刪除 KV 命名空間
wrangler kv:namespace list
wrangler kv:namespace delete --namespace-id=[id]
```

#### 刪除本地檔案

清理腳本會詢問是否刪除以下檔案：

- `wrangler.toml`
- `.wrangler/` 目錄
- `api/worker/` 目錄
- `CLOUDFLARE_DEPLOY.md`
- `DEPLOYMENT.md`
- `QUICK_DEPLOY.md`
- `deploy.bat`
- `setup-test-data.sql`

## 功能對照表

| 功能 | Cloudflare | Supabase |
|------|-----------|----------|
| 資料庫 | D1 (SQLite) | PostgreSQL |
| 即時查詢 | HTTP API | RESTful API + Realtime |
| 認證 | 自行實作 | Supabase Auth |
| 檔案儲存 | R2 (需額外設定) | Supabase Storage |
| 管理介面 | wrangler CLI | Dashboard + SQL Editor |
| 本地開發 | wrangler dev | supabase start |
| 成本 | 免費 100k req/day | 免費 50k MAU |

## 常見問題

### Q1: 遷移後資料會遺失嗎？

A: 不會，只要正確執行備份和匯入步驟。建議先在測試專案中驗證遷移流程。

### Q2: 可以同時保留兩個後端嗎？

A: 技術上可行，但不建議。維護兩套系統會增加複雜度和成本。

### Q3: 遷移需要多久？

A: 對於沒有大量資料的專案，整個遷移過程約 1-2 小時。

### Q4: Supabase 免費方案夠用嗎？

A: 對於小型到中型專案足夠：
- 500 MB 資料庫空間
- 1 GB 檔案儲存
- 50,000 月活躍用戶
- 2 GB 頻寬

### Q5: 可以從 Supabase 遷移回 Cloudflare 嗎？

A: 可以，但需要：
1. 匯出 PostgreSQL 資料
2. 轉換 SQL 語法 (PostgreSQL → SQLite)
3. 重新部署 Workers
4. 更新前端程式碼

建議備份好舊的 Cloudflare 配置以防萬一。

### Q6: RLS 政策會影響效能嗎？

A: 輕微影響，但 Supabase 已優化。正確設計的 RLS 政策不會明顯影響效能。

## 回滾計畫

如果遷移後發現問題，可以快速回滾：

1. **保留 Cloudflare 資源**（至少 1 週）
2. **在 Vercel 切換環境變數** 回到舊的 `VITE_API_BASE_URL`
3. **重新部署** Vercel 專案
4. **恢復前端程式碼** 如有修改

建議時程：

- Day 1-3: 完成遷移和測試
- Day 4-7: 監控運行狀態
- Day 8+: 確認無誤後清理 Cloudflare 資源

## 下一步

遷移完成後，你可以：

1. **啟用 Supabase Auth** - 實作使用者登入
2. **使用 Supabase Storage** - 新增檔案上傳功能
3. **啟用 Realtime** - 即時更新問卷回應
4. **設定備份** - 使用 Supabase Pro 自動備份
5. **優化查詢** - 使用 PostgreSQL 進階功能

## 需要幫助？

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase Discord 社群](https://discord.supabase.com)
- [專案 Issues](https://github.com/username/qter/issues)

---

祝遷移順利！如有任何問題歡迎開 issue 討論。
