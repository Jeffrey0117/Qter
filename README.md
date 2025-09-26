# QTER 問卷表單管理系統

一個現代化的、所見即所得的輕量化問卷工具，讓編輯界面就是用戶看到的問卷界面。

## 🌟 專案特色

- **所見即所得**：編輯時看到的就是最終效果
- **極簡設計**：清爽、現代、舒適的視覺體驗
- **手機優先**：響應式設計，完美適配所有設備
- **即時互動**：拖拽排序、即時預覽、無需保存
- **輕量化**：前端驅動、無需複雜後端架構
- **雙模式編輯**：視覺編輯 + Markdown 代碼編輯

## 🚀 快速開始

### 環境需求

- Node.js >= 18.0.0
- npm 或 yarn

### 安裝步驟

1. **複製專案**
```bash
git clone <repository-url>
cd qter
```

2. **安裝前端依賴**
```bash
cd frontend
npm install
```

3. **啟動開發服務器**
```bash
npm run dev
```

4. **開啟瀏覽器**

訪問 `http://localhost:5173` 開始使用！

## 📋 功能特性

### 🎨 問卷編輯器

#### 支持的題型
- 📝 **單行文字** - 短答案輸入
- 📄 **多行文字** - 長答案輸入
- ⭕ **單選題** - 單一選擇
- ☑️ **多選題** - 多重選擇
- ⭐ **評分題** - 星級評分
- 📅 **日期題** - 日期選擇
- 📎 **檔案上傳** - 文件上傳
- ➖ **分隔線** - 視覺分隔

#### 編輯功能
- 🔄 **雙向編輯**：視覺界面 ↔ Markdown 代碼
- 🎯 **即時預覽**：編輯時同步預覽效果
- 🖱️ **拖拽排序**：自由調整題目順序
- 📋 **複製題目**：快速複製現有題目
- 🗑️ **刪除題目**：靈活管理題目結構
- ⚙️ **題目設定**：必填、描述等屬性

### 📝 問卷填寫體驗

#### 用戶界面
- 📊 **進度追蹤**：清晰顯示填寫進度
- 📱 **響應式設計**：完美適配各種設備
- ✅ **即時驗證**：輸入時立即驗證
- 💾 **自動儲存**：防止資料遺失
- 🎨 **美觀界面**：現代化的設計風格

#### 互動體驗
- ⚡ **流暢動畫**：平滑的過渡效果
- 🎯 **直觀操作**：無需學習成本
- 🔒 **資料安全**：本地儲存保護隱私
- 📤 **輕鬆提交**：一鍵完成填寫

## 🛠️ 技術架構

### 前端技術棧

- **框架**: Vue 3 + Composition API
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **建構**: Vite
- **路由**: Vue Router 4
- **狀態管理**: Pinia (可選)

### 專案結構

```
qter/
├── frontend/                 # 前端應用
│   ├── src/
│   │   ├── views/           # 頁面組件
│   │   │   ├── EditorView.vue    # 編輯器頁面
│   │   │   ├── FillView.vue      # 填寫頁面
│   │   │   └── HomeView.vue      # 首頁
│   │   ├── components/      # 可重用組件
│   │   ├── services/        # API 服務層
│   │   ├── types/           # TypeScript 類型定義
│   │   └── router/          # 路由配置
│   ├── public/              # 靜態資源
│   └── package.json         # 依賴配置
├── roo/                     # 專案文檔
│   ├── idea.md             # 專案理念
│   ├── sdd.md              # 系統設計
│   ├── prd.md              # 產品需求
│   └── progress.md         # 開發進度
└── README.md               # 專案說明
```

## 🎯 使用指南

### 創建問卷

1. **啟動應用**：訪問首頁
2. **新增題目**：點擊"新增題目"按鈕
3. **選擇題型**：從8種題型中選擇
4. **編輯內容**：輸入題目文字、選項等
5. **調整設定**：設定必填、描述等屬性
6. **儲存問卷**：點擊儲存按鈕

### 填寫問卷

1. **取得連結**：從編輯器複製問卷連結
2. **開始填寫**：逐題回答問題
3. **查看進度**：關注頂部進度條
4. **提交答案**：完成後點擊提交

### Markdown 編輯

```markdown
---
title: 客戶滿意度調查
description: 請花幾分鐘時間填寫這份問卷
---

## 基本資訊

### 您的姓名是？
type: text
required: true
placeholder: 請輸入您的姓名

---

### 您的年齡範圍？
type: radio
required: true
options:
  - 18-25
  - 26-35
  - 36-45
  - 46+

---

## 滿意度評分

### 您對我們的服務滿意嗎？
type: rating
required: false
```

## 🔧 開發指令

### 常用指令

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 建構生產版本
npm run build

# 預覽生產版本
npm run preview

# 執行測試
npm run test

# 程式碼格式化
npm run format

# ESLint 檢查
npm run lint
```

### 專案指令

```bash
# 檢查 TypeScript 類型
npm run type-check

# 執行 E2E 測試
npm run test:e2e

# 生成程式碼覆蓋率
npm run coverage
```

## 📚 API 說明

### 資料存儲

目前使用 **本地儲存 (LocalStorage)** 作為資料存儲方案：

- **優點**: 無需後端、無網路依賴
- **限制**: 資料僅存於瀏覽器本地
- **容量**: 通常 5-10MB

### 未來擴展

專案已預留 API 介面，可輕鬆升級到：

- RESTful API
- GraphQL
- 雲端資料庫
- 檔案上傳服務

## 🤝 貢獻指南

歡迎參與專案貢獻！

### 開發流程

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 程式碼規範

- 使用 TypeScript 進行開發
- 遵循 Vue 3 Composition API 最佳實踐
- 使用 ESLint + Prettier 確保程式碼品質
- 提交前請執行測試

## 📄 授權條款

本專案採用 MIT 授權條款，詳見 [LICENSE](LICENSE) 文件。

## 📞 聯絡資訊

如有問題或建議，請透過以下方式聯絡：

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/username/qter/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/username/qter/discussions)

## 🙏 致謝

感謝所有參與開發和測試的貢獻者！

特別感謝：
- Vue.js 團隊提供的優秀框架
- Tailwind CSS 提供的實用工具
- Vite 團隊提供的快速建構工具

---

**QTER** - 讓問卷製作變得簡單而有趣！🎉