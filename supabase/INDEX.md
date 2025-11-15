# QTER Supabase 文件索引

本目錄包含 QTER 問卷系統從 Cloudflare D1 (SQLite) 遷移到 Supabase (PostgreSQL) 的所有資源。

## 📁 文件結構

```
supabase/
├── migrations/                     # 資料庫遷移文件
│   └── 001_initial_schema.sql     # 初始 schema (388 行)
├── seed.sql                        # 測試數據腳本 (406 行)
├── setup.sh                        # Linux/macOS 快速設定腳本
├── setup.ps1                       # Windows PowerShell 快速設定腳本
├── .env.example                    # 環境變數範例
├── README.md                       # 主要文檔
├── MIGRATION_SUMMARY.md            # 遷移摘要（技術細節）
├── MIGRATION_CHECKLIST.md          # 遷移檢查清單
├── types-preview.ts                # TypeScript 類型預覽
└── INDEX.md                        # 本文件
```

---

## 📖 快速導航

### 🚀 快速開始
**如果你想立即開始，請按順序閱讀：**

1. **[README.md](./README.md)** - 從這裡開始
   - Supabase 介紹
   - 安裝步驟
   - 本地開發指南

2. **執行設定腳本**
   - Windows: `.\setup.ps1`
   - Linux/macOS: `./setup.sh`

3. **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - 完整遷移流程
   - 35+ 項檢查清單
   - 按階段組織
   - 包含驗收標準

### 📚 深入學習

4. **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - 技術細節
   - 資料表結構對照
   - SQL 語法變更
   - RLS policies 說明
   - 效能優化建議

5. **[types-preview.ts](./types-preview.ts)** - TypeScript 類型
   - 資料庫類型定義
   - 自訂業務邏輯類型
   - 使用範例

---

## 📄 文件詳細說明

### 1️⃣ 核心 SQL 文件

#### `migrations/001_initial_schema.sql` (388 行)
完整的 PostgreSQL schema，包含：

**資料表（5 個）:**
- ✅ `users` - 用戶表
- ✅ `forms` - 問卷表
- ✅ `share_links` - 分享連結表
- ✅ `responses` - 回應表
- ✅ `response_items` - 回應項目表

**索引（18 個）:**
- 12 個 B-tree 索引（常規查詢）
- 3 個 GIN 索引（JSONB 查詢）
- 3 個條件索引（效能優化）

**Triggers（1 個）:**
- `update_forms_updated_at` - 自動更新時間戳

**RLS Policies（15 個）:**
- Users: 2 policies
- Forms: 4 policies
- Share Links: 5 policies
- Responses: 3 policies
- Response Items: 2 policies

**Helper Functions（3 個）:**
- `is_share_link_valid()` - 驗證分享連結
- `get_form_by_share_link()` - 獲取問卷
- `get_form_response_stats()` - 統計數據

#### `seed.sql` (406 行)
測試數據腳本，包含：

- 3 個測試用戶
- 4 個問卷（active: 3, draft: 1）
- 5 個分享連結（有效: 3, 過期: 1, 停用: 1）
- 5 個回應（認證用戶: 2, 匿名: 3）
- 25+ 個回應項目
- 數據驗證查詢
- 測試查詢範例

---

### 2️⃣ 設定腳本

#### `setup.sh` (Linux/macOS)
自動化設定腳本，執行：
- 檢查 Supabase CLI
- 初始化專案
- 啟動本地 Supabase
- 執行遷移
- 生成 TypeScript 類型
- 顯示連接資訊

#### `setup.ps1` (Windows PowerShell)
Windows 版本的設定腳本，功能相同。

**使用方法：**
```bash
# Linux/macOS
chmod +x setup.sh
./setup.sh

# Windows
.\setup.ps1
```

---

### 3️⃣ 文檔文件

#### `README.md` (主要文檔)
**包含：**
- Schema 概覽
- 主要特性說明
- 安裝步驟（詳細）
- 本地開發指南
- 從 D1 遷移的變更
- 安全性考量
- 常用查詢範例
- 效能優化建議
- 監控和維護
- 下一步指示

**適合：** 所有開發者，從新手到資深

#### `MIGRATION_SUMMARY.md` (技術摘要)
**包含：**
- 資料表結構詳細對照
- 索引完整列表
- RLS policies 說明
- Helper functions 文檔
- 資料類型對照表
- 遷移後代碼變更
- SQL 查詢範例
- 效能優化技巧
- 監控查詢

**適合：** 資深開發者和 DBA

#### `MIGRATION_CHECKLIST.md` (檢查清單)
**包含：**
- 35+ 項檢查項目
- 按階段組織：
  1. 準備階段（5 項）
  2. 資料庫遷移（2 項）
  3. TypeScript 類型（1 項）
  4. 前端更新（5 項）
  5. 後端更新（4 項）
  6. 測試（4 項）
  7. 數據遷移（3 項，可選）
  8. 部署準備（5 項）
  9. 監控和維護（3 項）
  10. 文檔更新（2 項）
  11. 驗收檢查（3 項）
  12. 完成後（2 項）
- 回滾計畫
- 預估時間：3-5 天

**適合：** 專案經理和執行遷移的開發者

---

### 4️⃣ 開發者資源

#### `types-preview.ts` (TypeScript 類型)
**包含：**
- Supabase 生成的資料庫類型
- 自訂業務邏輯類型：
  - `QuestionType` - 問題類型
  - `Question` - 問題定義
  - `FormStatus` - 問卷狀態
  - `DisplayMode` - 顯示模式
  - `FormWithQuestions` - 含問題的問卷
  - `ResponseMeta` - 回應 metadata
  - 更多...
- 類型輔助工具
- API 請求/回應類型
- 完整使用範例

**適合：** 前端和全端開發者

#### `.env.example` (環境變數範例)
**包含：**
- 前端環境變數
- 後端環境變數
- 生產環境設定
- 如何獲取憑證的說明

**使用方法：**
```bash
# 複製並填入實際值
cp .env.example ..frontend/.env
cp .env.example ../api/.dev.vars
```

---

## 🎯 使用場景指南

### 場景 1: 我是新加入的開發者
**建議閱讀順序：**
1. `README.md` - 了解整體架構
2. 執行 `setup.sh` 或 `setup.ps1` - 啟動本地環境
3. `types-preview.ts` - 了解資料結構
4. 開始開發！

### 場景 2: 我要執行遷移
**建議閱讀順序：**
1. `README.md` - 了解變更
2. `MIGRATION_SUMMARY.md` - 了解技術細節
3. `MIGRATION_CHECKLIST.md` - 按清單執行
4. 逐項完成並打勾

### 場景 3: 我要優化效能
**建議閱讀順序：**
1. `MIGRATION_SUMMARY.md` - 查看「效能優化」章節
2. `001_initial_schema.sql` - 檢查索引定義
3. `README.md` - 查看「監控和維護」章節
4. 執行監控查詢

### 場景 4: 我要了解安全性
**建議閱讀順序：**
1. `README.md` - 查看「安全性考量」章節
2. `001_initial_schema.sql` - 查看 RLS policies
3. `MIGRATION_SUMMARY.md` - 查看「安全性提升」章節
4. 測試 RLS 是否正常運作

### 場景 5: 我要寫前端代碼
**建議閱讀順序：**
1. `types-preview.ts` - 了解所有類型
2. `README.md` - 查看「常用查詢範例」
3. 參考範例代碼開發

---

## 📊 統計資料

### 代碼行數
- SQL (schema): 388 行
- SQL (seed): 406 行
- TypeScript (types): 400+ 行
- 總計: 1200+ 行

### 資料庫對象
- 表格: 5 個
- 索引: 18 個
- Triggers: 1 個
- Functions: 3 個
- RLS Policies: 15 個

### 文檔
- Markdown 文件: 5 個
- 總字數: 15000+ 字
- 代碼範例: 50+ 個

---

## 🔗 相關資源

### Supabase 官方文檔
- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB Functions](https://supabase.com/docs/guides/database/json)

### PostgreSQL 文檔
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Triggers](https://www.postgresql.org/docs/current/triggers.html)

### 開發工具
- [Supabase Studio](http://localhost:54323) - 本地管理介面
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL 管理工具
- [TablePlus](https://tableplus.com/) - 資料庫客戶端

---

## ❓ 常見問題

### Q: 我應該從哪個文件開始？
**A:** 從 `README.md` 開始，然後執行設定腳本。

### Q: 如何快速啟動本地環境？
**A:** 執行 `./setup.sh`（Linux/macOS）或 `.\setup.ps1`（Windows）。

### Q: 如何生成 TypeScript 類型？
**A:** 執行 `supabase gen types typescript --local > path/to/types.ts`

### Q: RLS policies 是什麼？
**A:** 閱讀 `README.md` 的「安全性考量」章節。

### Q: 如何優化查詢效能？
**A:** 閱讀 `MIGRATION_SUMMARY.md` 的「效能優化」章節。

### Q: 如何處理 JSONB 資料？
**A:** 查看 `types-preview.ts` 的範例，以及 `README.md` 的查詢範例。

### Q: 遷移需要多久時間？
**A:** 預估 3-5 天，詳見 `MIGRATION_CHECKLIST.md`。

### Q: 如果遇到問題怎麼辦？
**A:** 檢查 `MIGRATION_CHECKLIST.md` 的「回滾計畫」章節。

---

## 🆘 獲得幫助

### 社群資源
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### 專案資源
- GitHub Issues: [Your Repo]
- 團隊 Slack/Discord
- 技術文檔: 本目錄

---

## 📝 更新日誌

### Version 1.0 (2025-11-15)
- ✅ 完整的 PostgreSQL schema
- ✅ 測試數據腳本
- ✅ 自動化設定腳本（Windows + Linux/macOS）
- ✅ 完整的文檔（README + 摘要 + 檢查清單）
- ✅ TypeScript 類型定義預覽
- ✅ 環境變數範例

---

## 🎉 開始使用

準備好了嗎？執行以下命令開始：

```bash
# 1. 進入 supabase 目錄
cd supabase

# 2. 執行設定腳本
# Windows:
.\setup.ps1

# Linux/macOS:
chmod +x setup.sh
./setup.sh

# 3. 開始開發！
```

祝你使用愉快！ 🚀
