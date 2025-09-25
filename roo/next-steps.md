# QTER 下一步開發計劃

## 🎯 立即優先開發項目（1-2天）

### 1. FormEditor 表單編輯器完善
**檔案**：`frontend/src/pages/forms/FormEditor.tsx`
**依賴**：`frontend/src/components/QuestionEditor.tsx`

需要實作：
- [ ] 題型選擇器（短答、長答、單選、多選、圖片上傳）
- [ ] 題目屬性編輯（標題、說明、必填、選項）
- [ ] 新增/刪除題目功能
- [ ] 題目排序（拖拉或上下移動按鈕）
- [ ] 表單基本設定（標題、描述）
- [ ] 儲存表單到後端 API
- [ ] 載入現有表單編輯

### 2. FormFill 表單填寫頁面
**檔案**：`frontend/src/pages/fill/FormFill.tsx`

需要實作：
- [ ] 根據表單 ID 載入表單結構
- [ ] 動態渲染各題型元件
  - [ ] ShortTextQuestion 短答題元件
  - [ ] LongTextQuestion 長答題元件  
  - [ ] SingleChoiceQuestion 單選題元件
  - [ ] MultipleChoiceQuestion 多選題元件
  - [ ] FileUploadQuestion 圖片上傳元件
- [ ] 表單驗證（必填檢查）
- [ ] 提交表單到後端 API
- [ ] 提交成功頁面

### 3. 表單列表與管理
**檔案**：`frontend/src/pages/Dashboard.tsx`

需要完善：
- [ ] 連接真實 API 載入表單列表
- [ ] 新建表單按鈕導向編輯器
- [ ] 編輯/刪除表單功能
- [ ] 複製表單功能
- [ ] 查看表單連結/QR Code
- [ ] 分頁功能

## 📋 第二優先開發項目（2-3天）

### 4. FormResponses 回應管理
**檔案**：`frontend/src/pages/forms/FormResponses.tsx`

需要實作：
- [ ] 載入表單回應列表
- [ ] 回應詳情檢視
- [ ] 搜尋與篩選功能
- [ ] 匯出 CSV/Excel 功能
- [ ] 分頁處理

### 5. FormAnalytics 統計分析
**檔案**：`frontend/src/pages/forms/FormAnalytics.tsx`

需要實作：
- [ ] 各題統計圖表（圓餅圖、長條圖）
- [ ] 回應時間趨勢圖
- [ ] 填答完成率
- [ ] 平均填答時間

### 6. 圖片上傳元件
**新建檔案**：`frontend/src/components/FileUpload.tsx`

需要實作：
- [ ] 拖拉上傳介面
- [ ] 點擊選擇檔案
- [ ] 圖片預覽
- [ ] 上傳進度顯示
- [ ] 檔案大小與格式驗證
- [ ] 與 MinIO 後端整合

## 🎨 響應式設計優化（1天）

### 7. 手機版優化
- [ ] 表單填寫頁面全寬顯示
- [ ] 按鈕尺寸適合觸控
- [ ] 字體大小調整
- [ ] 導航列響應式選單

### 8. 桌面版優化  
- [ ] 最大寬度 800px 置中
- [ ] 適當的 padding 與間距
- [ ] 側邊導航優化

## 🧪 測試與部署（2-3天）

### 9. 測試
- [ ] 表單建立流程測試
- [ ] 表單填寫流程測試
- [ ] API 整合測試
- [ ] 跨瀏覽器測試

### 10. 部署準備
- [ ] 環境變數設定
- [ ] 建置優化
- [ ] Docker 容器化
- [ ] CI/CD 設置

## 📝 API 整合檢查清單

### 需要連接的 API Endpoints
- [x] POST /api/auth/register - 註冊
- [x] POST /api/auth/login - 登入  
- [x] POST /api/auth/refresh - 刷新 Token
- [x] POST /api/auth/logout - 登出
- [ ] GET /api/forms - 取得表單列表
- [ ] POST /api/forms - 建立表單
- [ ] GET /api/forms/:id - 取得單一表單
- [ ] PUT /api/forms/:id - 更新表單
- [ ] DELETE /api/forms/:id - 刪除表單
- [ ] POST /api/forms/:id/questions - 新增題目
- [ ] PUT /api/forms/:id/questions/:qid - 更新題目
- [ ] DELETE /api/forms/:id/questions/:qid - 刪除題目
- [ ] POST /api/forms/:id/responses - 提交回應
- [ ] GET /api/forms/:id/responses - 取得回應列表
- [ ] GET /api/forms/:id/statistics - 取得統計資料
- [ ] POST /api/files/upload - 上傳檔案
- [ ] GET /api/files/:id - 取得檔案

## 🚀 開發順序建議

1. **Day 1**: FormEditor 完成（可建立和儲存表單）
2. **Day 2**: FormFill 完成（可填寫和提交表單）  
3. **Day 3**: Dashboard 優化 + FormResponses
4. **Day 4**: FormAnalytics + 檔案上傳
5. **Day 5**: 響應式設計 + 測試
6. **Day 6**: 部署準備

## 💡 技術提醒

1. 使用 TanStack Query 管理 API 狀態
2. 使用 React Hook Form 處理表單驗證
3. 使用 Tailwind CSS 進行樣式設計
4. 保持 TypeScript 類型安全
5. 錯誤處理要完善
6. Loading 狀態要清楚

## 🔄 切換到 Code 模式

準備好開始實作了！建議從 FormEditor 開始，因為這是整個系統的核心功能。