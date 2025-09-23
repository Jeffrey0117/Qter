# 互動式客製化表單系統

一個支援多種題型（短答、長答、單選、多選、圖片上傳）的客製化表單系統，具備響應式設計和完整的管理介面。

## 功能特色

- **多種題型支援**：短答題、長答題、單選題、多選題、圖片上傳
- **響應式設計**：手機全寬、桌面置中 800px 佈局
- **表單管理**：建立、編輯、發布、複製表單
- **回應管理**：收集、查看、統計和匯出回應資料
- **圖片上傳**：支援圖片上傳和儲存（MinIO）
- **認證系統**：JWT 認證和角色權限管理

## 技術棧

- **前端**：React + Vite
- **後端**：Node.js + Express
- **資料庫**：PostgreSQL
- **儲存**：MinIO
- **認證**：JWT
- **建置工具**：Vite

## 專案結構

```
/
├── frontend/          # React 前端應用
├── backend/           # Node.js/Express 後端 API
├── database/          # 資料庫 migration 和種子資料
├── docs/              # 專案文檔
│   ├── database-er-diagram.md    # 資料庫 ER 圖
│   └── form-management-api.md    # 表單管理 API 文檔
├── .gitignore        # Git 忽略檔案
└── README.md         # 專案說明
```

## API 文檔

- [表單管理 API 文檔](docs/form-management-api.md)
- [資料庫 ER 圖](docs/database-er-diagram.md)

## 開發環境設置

### 系統需求

- Node.js 18+
- PostgreSQL 13+
- MinIO (或其他 S3 相容儲存)

### 安裝步驟

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd interactive-form-system
   ```

2. **安裝依賴**
   ```bash
   # 前端
   cd frontend
   npm install

   # 後端
   cd ../backend
   npm install
   ```

3. **環境設定**
   - 複製 `.env.example` 為 `.env`
   - 配置資料庫和 MinIO 連線資訊

4. **啟動開發伺服器**
   ```bash
   # 後端
   cd backend
   npm run dev

   # 前端
   cd frontend
   npm run dev
   ```

## 開發週期

- **第1週**：專案初始化和資料庫設計
- **第2-3週**：後端 API 開發
- **第2-4週**：前端功能開發
- **第3-4週**：響應式設計實現
- **第4-5週**：測試實施
- **第5週**：部署和優化

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

此專案採用 MIT 授權條款。

## 聯絡資訊

如有問題或建議，請聯絡開發團隊。