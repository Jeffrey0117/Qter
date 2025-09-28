# QTER 新官網首頁與 Markdown Storybook 規劃

狀態：提案草案（待核可）
範圍：新增 QTER 介紹首頁＋Markdown 問卷語法 Storybook（教學/範例）
目標：
- 對外：清楚傳達 QTER 能力與賣點，提高轉換
- 對內：提供問卷建立者可查的 Markdown 語法手冊與大量範例
- 導流：從首頁導向「建立範例問卷」「開啟編輯器」「Docs/Storybook」

關聯程式檔參考：
- 首頁問卷清單 [HomeView.vue](frontend/src/views/HomeView.vue:1)
- 填寫（逐題） [FillView.vue](frontend/src/views/FillView.vue:1)
- 填寫（全頁） AllAtOnceView.vue（未開檔案，路由同 fill/:id/all）
- 編輯器 [EditorView.vue](frontend/src/views/EditorView.vue:1)
- 進階 Markdown 解析 [markdown.ts](frontend/src/services/markdown.ts:1)
- 前端路由 [router/index.ts](frontend/src/router/index.ts:1)

------------------------------------------------------------

資訊架構與路由

新增路由
- /: 現有「我的問卷」列表維持不變（內部工作首頁）
- /site: 對外官網首頁（產品介紹/動態展示/CTA）
- /docs: 文檔總覽（快速開始、概念）
- /docs/markdown: Markdown 語法 Storybook（大量範例）
- /docs/markdown/:slug: 單一範例詳頁（可選）

導覽
- Navbar：QTER（Logo）｜ 產品｜文件｜範例｜開始使用
- CTA：進入編輯器新建問卷（跳 /editor/new）

------------------------------------------------------------

官網首頁 /site 內容模組

- Hero（產品定位＋CTA）
  - 標題：輕量、可客製、可擴展的問卷系統
  - CTA：建立範例問卷｜查看語法手冊
  - 動態背景與小動畫（展示字體/漸層/卡片）

- 功能特點區（Icon + Copy）
  - 進階 Markdown（HTML/CSS/Google Fonts）
  - 安全渲染（DOMPurify + CSS 白名單）
  - 雙展示模式（逐題/全頁）
  - 視覺模板（卡片、徽章、進度條等）

- 互動展示區（Live Demo）
  - 用現有 featured-2025 的片段做動態展示（純前端切片）
  - 按下載/建立範例，寫入 localStorage，導到 /editor/featured-2025

- 使用流程（Step-by-step）
  - 選模板 → 編輯（視覺/Markdown）→ 預覽 → 分享/收集 → 分析

- 信任/技術區
  - 技術棧徽章、CSP、安全性說明的連結到 Docs

- Footer
  - Docs、GitHub、範例、聯絡

------------------------------------------------------------

Markdown 語法 Storybook /docs/markdown

章節結構
- 基礎
  - Front matter：title、description
  - 問題區塊：### 標題、type、required、options
- 樣式
  - 內嵌 <style>、@import Google Fonts
  - 題卡 className 樣式（.qcard-*）
  - 進度條、徽章、動畫、翻轉卡
- 元素與安全
  - 允許的 HTML 標籤與屬性白名單
  - 允許的 CSS 屬性清單
  - 潛在風險與最佳實務
- 進階技巧
  - 嵌入圖片題目
  - Emoji 視覺選項
  - Range、Rating 題型語法
  - 自訂佈局（grid、flex）注意事項
- 範例集
  - 商務、學術、活動、科技主題各 1 範例
  - 每個範例：可一鍵寫入 localStorage → /editor/:id

每個章節的展示方式
- 左：Markdown 原始碼（可複製）
- 右：解析後預覽（透過 [buildAndApplyMarkdown()](frontend/src/services/markdown.ts:254)）
- 一鍵「載入到編輯器」按鈕：寫入 qter_forms → router.push(/editor/:id)

------------------------------------------------------------

技術設計

- 重用現有解析
  - 使用 [renderAdvancedMarkdown()](frontend/src/services/markdown.ts:142) 與 [buildAndApplyMarkdown()](frontend/src/services/markdown.ts:254)
  - Docs 頁面以 sandbox 容器 id 注入 style，避免干擾其他頁

- 路由與頁面
  - 新增 SiteHome.vue（/site）
  - 新增 DocsLayout.vue（/docs）
  - 新增 DocsMarkdown.vue（/docs/markdown）
  - 可選：DocsExample.vue（/docs/markdown/:slug）

- 範例資料來源
  - 新增 docs/examples.ts，集中管理 Markdown 範例字串
  - 提供 loadToEditor(exampleId) 將選擇的範例寫入 localStorage

- UI 組件
  - CodeBlock（帶複製按鈕）
  - PreviewPane（內部呼叫 buildAndApplyMarkdown）
  - ExampleCard（標題、描述、載入/預覽按鈕）

- 安全
  - 沿用 DOMPurify + CSS 白名單
  - 在 Docs 頁面也統一用 sanitizeHTMLFragment()

------------------------------------------------------------

里程碑

M1 基礎設置（0.5 週）
- 新增路由與空白頁：/site、/docs、/docs/markdown
- 建立 DocsLayout 與基礎側邊欄

M2 首頁（1 週）
- 完成 Hero、功能特點、展示區、流程與 Footer
- CTA 串接到 /editor/new 與 /docs/markdown

M3 Storybook（1.5 週）
- 條列語法章節與 Code + Preview 雙欄範本
- 內建 6-8 個高品質範例，可一鍵載入編輯器

M4 文檔收尾與驗收（0.5 週）
- 補圖文、最佳實務與安全章節
- 基礎 E2E：章節可載入、預覽可渲染、載入到編輯器成功

------------------------------------------------------------

TODO（僅保留未完成項目）

- [ ] 路由新增與頁面骨架：/site、/docs、/docs/markdown
- [ ] SiteHome.vue：Hero/功能/展示/流程/CTA/Footer
- [ ] DocsLayout.vue：側邊欄與頂部導覽
- [ ] DocsMarkdown.vue：章節大綱＋Code/Preview 雙欄
- [ ] docs/examples.ts：集中管理 Markdown 範例字串與中繼資料
- [ ] ExampleCard/CodeBlock/PreviewPane 組件
- [ ] 一鍵「載入到編輯器」流程：寫入 qter_forms → /editor/:id
- [ ] 語法手冊章節內容撰寫（基礎/樣式/安全/進階/範例集）
- [ ] featured-2025 精簡切片展示在 /site
- [ ] SEO/Meta：/site 的基本 SEO（title/description/open graph）
- [ ] i18n 規劃（至少保留 zh-TW 為主）
- [ ] 最佳實務與安全頁：連結到白名單與注意事項
- [ ] 基本驗收測試：能載入、能預覽、能寫入編輯器
- [ ] README 加上 /site 與 /docs 導覽入口

（已完成或不再追蹤的舊內容已移除，避免噪音）

------------------------------------------------------------

驗收標準

- /site：在 3 秒內載入，CTA 可導向，展示動畫不卡頓
- /docs/markdown：每個章節有可複製的 Markdown + 預覽效果
- 一鍵載入：點擊任一範例「載入到編輯器」，自動寫入 localStorage 並打開 /editor/:id，標題/題目/樣式一致
- 安全：所有預覽與載入均使用 DOMPurify，無 console error

------------------------------------------------------------

後續延伸（非本波）

- /templates：可瀏覽所有模板並一鍵套用
- 線上分享：問卷公開分享短連結頁
- 部署文檔：CSP/反代/資產快取建議
