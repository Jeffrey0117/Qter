# 問卷資料同步至 D1 資料庫規劃

## 目的
解決問卷資料只存在 localStorage 無法跨裝置/瀏覽器訪問的問題，實作問卷自動同步至 Workers D1 資料庫。

---

## 1. 現況問題

### 1.1 問題描述
- 使用者建立的問卷只存在**瀏覽器 localStorage**
- 換裝置、無痕模式、分享給他人時，**無法讀取問卷資料**
- 只有透過「公開分享」產生的 hash 連結，問卷才會存到 D1

### 1.2 影響範圍
- 無法分享問卷填寫連結給他人（除非用公開分享功能）
- 使用者無法跨裝置管理問卷
- 問卷資料容易遺失（清除瀏覽器資料即消失）

### 1.3 檔案位置
- 前端編輯器：[frontend/src/views/EditorView.vue](frontend/src/views/EditorView.vue)
- 前端填寫頁：[frontend/src/views/FillView.vue](frontend/src/views/FillView.vue)
- 儀表板：[frontend/src/views/DashboardView.vue](frontend/src/views/DashboardView.vue)
- API 服務：[frontend/src/services/api.ts](frontend/src/services/api.ts)
- Workers API：[api/worker/src/index.ts](api/worker/src/index.ts)

---

## 2. 目標架構

### 2.1 資料儲存策略
- **主要來源**：Workers D1 資料庫（遠端）
- **快取層**：localStorage（本地，用於離線編輯與快速載入）
- **同步時機**：儲存問卷時自動上傳至 D1

### 2.2 資料流向
```
編輯器 (EditorView)
    ↓ 儲存
localStorage (本地快取) + Workers D1 (遠端資料庫)
    ↓ 讀取
填寫頁 (FillView) / 儀表板 (DashboardView)
```

### 2.3 降級策略（Fallback）
1. 優先從 D1 讀取問卷
2. D1 讀取失敗時，從 localStorage 讀取
3. 允許離線編輯，有網路時自動同步

---

## 3. 資料庫結構

### 3.1 現有 D1 表單（需確認）
- `surveys` 表：儲存問卷基本資訊
- `responses` 表：儲存問卷回覆

### 3.2 需新增/修改欄位
```sql
-- surveys 表結構（待確認現有結構）
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Google OAuth user ID
  title TEXT NOT NULL,
  description TEXT,
  questions TEXT NOT NULL,          -- JSON 格式儲存題目
  display_mode TEXT DEFAULT 'step-by-step',
  markdown_content TEXT,            -- Markdown 原始內容
  auto_advance INTEGER DEFAULT 1,
  auto_advance_delay INTEGER DEFAULT 300,
  show_progress INTEGER DEFAULT 1,
  allow_go_back INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_surveys_user_id ON surveys(user_id);
```

---

## 4. API 端點設計

### 4.1 新增 API 端點（Workers）

#### POST `/api/surveys`
建立問卷
- **Request Body**: `{ id, title, description, questions, displayMode, markdownContent, ... }`
- **Response**: `{ success: true, survey: {...} }`
- **權限**: 需登入（JWT token）

#### PUT `/api/surveys/:id`
更新問卷
- **Request Body**: `{ title, description, questions, ... }`
- **Response**: `{ success: true, survey: {...} }`
- **權限**: 需登入且為問卷擁有者

#### GET `/api/surveys/:id`
取得問卷
- **Response**: `{ success: true, survey: {...} }`
- **權限**: 公開問卷不需登入，私密問卷需登入且為擁有者

#### GET `/api/surveys`
取得使用者所有問卷
- **Query**: `?user_id={user_id}`
- **Response**: `{ success: true, surveys: [...] }`
- **權限**: 需登入

#### DELETE `/api/surveys/:id`
刪除問卷
- **Response**: `{ success: true }`
- **權限**: 需登入且為問卷擁有者

### 4.2 前端 API 服務封裝（api.ts）
```typescript
// frontend/src/services/api.ts 新增
export const surveys = {
  create: (data: SurveyData) => POST('/api/surveys', data),
  update: (id: string, data: Partial<SurveyData>) => PUT(`/api/surveys/${id}`, data),
  get: (id: string) => GET(`/api/surveys/${id}`),
  list: () => GET('/api/surveys'),
  delete: (id: string) => DELETE(`/api/surveys/${id}`)
}
```

---

## 5. 實作階段

### Phase 1: Workers API 端點實作
- [ ] 確認現有 D1 資料庫結構
- [ ] 新增/修改 `surveys` 表結構（執行 migration）
- [ ] 實作 POST `/api/surveys`（建立問卷）
- [ ] 實作 PUT `/api/surveys/:id`（更新問卷）
- [ ] 實作 GET `/api/surveys/:id`（取得問卷）
- [ ] 實作 GET `/api/surveys`（列出使用者問卷）
- [ ] 實作 DELETE `/api/surveys/:id`（刪除問卷）
- [ ] 新增 JWT 驗證中介層（確認使用者身分）

### Phase 2: 前端 API 服務封裝
- [ ] 在 `api.ts` 新增 `surveys` 命名空間
- [ ] 實作 create, update, get, list, delete 方法
- [ ] 處理錯誤與 token 過期重新整理

### Phase 3: EditorView 同步邏輯
- [ ] `saveForm()` 時同步上傳至 D1
- [ ] `persistFormToLocalStorage()` 同時呼叫 `api.surveys.create/update`
- [ ] 處理網路錯誤（顯示「已儲存至本地，待網路恢復後同步」）
- [ ] 新增「同步狀態」指示器（已同步/同步中/僅本地）

### Phase 4: FillView 讀取邏輯
- [ ] 優先從 D1 讀取問卷（`api.surveys.get(id)`）
- [ ] D1 失敗時 fallback 至 localStorage
- [ ] Demo 問卷保持從 `qter_demo_{id}` 讀取

### Phase 5: DashboardView 讀取邏輯
- [ ] 從 D1 讀取使用者問卷列表（`api.surveys.list()`）
- [ ] 合併 localStorage 中未同步的問卷（顯示「待同步」標籤）
- [ ] 刪除問卷時同步刪除 D1 與 localStorage

### Phase 6: 離線編輯與自動同步
- [ ] 偵測網路狀態（online/offline）
- [ ] 離線時僅存 localStorage，標記「待同步」
- [ ] 網路恢復時自動同步至 D1
- [ ] 顯示同步進度與錯誤提示

---

## 6. 降級與錯誤處理

### 6.1 網路錯誤
- 儲存時若 D1 失敗，仍保存至 localStorage
- 顯示「已儲存至本地，網路恢復後將自動同步」

### 6.2 讀取錯誤
- FillView 讀取 D1 失敗時，嘗試 localStorage
- 都失敗時顯示「找不到問卷」

### 6.3 衝突處理
- 若本地與遠端版本衝突（updated_at 不一致）
- 選項 A：遠端優先（預設）
- 選項 B：提示使用者選擇保留哪個版本

---

## 7. 測試與驗收

### 7.1 單元測試
- [ ] Workers API 端點測試（CRUD 操作）
- [ ] JWT 驗證測試
- [ ] 資料庫查詢測試

### 7.2 整合測試
- [ ] 建立問卷 → 儲存至 D1 → 換裝置讀取成功
- [ ] 編輯問卷 → 同步至 D1 → 儀表板更新
- [ ] 刪除問卷 → D1 與 localStorage 同步刪除
- [ ] 離線編輯 → 網路恢復 → 自動同步

### 7.3 使用者測試
- [ ] 無痕模式填寫問卷（D1 讀取成功）
- [ ] 分享填寫連結給他人（他人可正常填寫）
- [ ] 換裝置/瀏覽器管理問卷（儀表板正確顯示）

---

## 8. 部署流程

1. 執行 D1 migration（新增/修改資料表）
2. 部署 Workers API 更新（新增 surveys 端點）
3. 部署前端更新（EditorView, FillView, DashboardView）
4. 資料遷移（選配）：將現有 localStorage 問卷批次上傳至 D1

---

## 9. 風險與注意事項

### 9.1 風險
- **資料遷移**：現有 localStorage 問卷需手動同步至 D1
- **效能**：D1 讀取速度可能比 localStorage 慢，需快取策略
- **配額**：Cloudflare D1 免費版有讀寫限制，需監控用量

### 9.2 注意事項
- 保留 localStorage 作為快取，避免每次都讀取 D1
- Demo 問卷（featured-2025 等）不需存 D1，保持在首頁程式碼中
- 公開分享的問卷（hash）繼續使用現有邏輯

---

## 10. 未來擴充

- **協作編輯**：多人同時編輯同一問卷
- **版本控制**：問卷歷史版本與還原
- **權限管理**：問卷公開/私密/協作者權限
- **資料分析**：問卷填寫統計與視覺化
- **匯出功能**：問卷與回覆資料匯出（CSV/JSON）

---

## 11. 參考資源

- Cloudflare D1 文件：https://developers.cloudflare.com/d1/
- Cloudflare Workers 文件：https://developers.cloudflare.com/workers/
- JWT 驗證實作參考：現有 `/api/public/submit/:hash` 端點