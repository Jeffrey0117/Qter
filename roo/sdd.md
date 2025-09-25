# 軟體設計文件 (Software Design Document)
## QTER 問卷表單管理系統

### 文件資訊
- **版本**: 1.0.0
- **日期**: 2025-01-26
- **作者**: 開發團隊
- **狀態**: 開發中

---

## 1. 執行摘要

### 1.1 專案概述
QTER 是一個現代化的問卷表單管理系統，旨在提供直覺的使用者介面和強大的後端功能，支援多種問題類型、即時預覽、響應式設計，以及完整的資料分析功能。

### 1.2 核心價值主張
- **簡化流程**: 將複雜的表單建立過程簡化為拖放式操作
- **即時協作**: 支援多人同時編輯和查看表單
- **智慧分析**: 自動化的資料收集和分析功能
- **高度客製化**: 靈活的問題類型和樣式設定

### 1.3 目標使用者
- 企業 HR 部門（員工調查、績效評估）
- 教育機構（課程評鑑、學生回饋）
- 市場研究人員（消費者調查）
- 活動組織者（報名表單、意見收集）

---

## 2. 系統架構設計

### 2.1 整體架構
```
┌─────────────────────────────────────────────────┐
│                   使用者介面層                    │
│         Vue 3 + TypeScript + Tailwind CSS        │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│                    API 閘道層                     │
│              RESTful API + WebSocket             │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│                   業務邏輯層                      │
│         Node.js + Express + TypeScript           │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│                   資料存取層                      │
│           PostgreSQL + Redis + MinIO             │
└─────────────────────────────────────────────────┘
```

### 2.2 技術棧詳細說明

#### 前端技術
- **框架**: Vue 3.5+ (Composition API)
- **語言**: TypeScript 5.x
- **狀態管理**: Pinia 2.x
- **路由**: Vue Router 4.x
- **UI 框架**: Tailwind CSS 3.x + Headless UI
- **表單處理**: VeeValidate 4.x + Yup
- **HTTP 客戶端**: Axios 1.x
- **即時通訊**: Socket.io-client 4.x
- **圖表**: Chart.js 4.x + vue-chartjs
- **建構工具**: Vite 5.x
- **Markdown 編輯器**: Monaco Editor + markdown-it
- **手勢處理**: Hammer.js / Vue-touch
- **動畫**: Vue Transition + GSAP

#### 後端技術
- **執行環境**: Node.js 20.x LTS
- **框架**: Express 4.x
- **語言**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **認證**: JWT + Passport.js
- **驗證**: Joi / Zod
- **檔案處理**: Multer + Sharp
- **任務佇列**: Bull (Redis-based)
- **即時通訊**: Socket.io 4.x
- **API 文件**: Swagger/OpenAPI 3.0

#### 資料庫與儲存
- **主資料庫**: PostgreSQL 16.x
- **快取**: Redis 7.x
- **物件儲存**: MinIO (S3 相容)
- **搜尋引擎**: Elasticsearch 8.x (選用)

#### DevOps 與工具
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions / GitLab CI
- **監控**: Prometheus + Grafana
- **日誌**: Winston + ELK Stack
- **測試**: Jest + Vitest + Playwright

---

## 3. 核心功能特色

### 3.1 創新功能亮點

#### Markdown 編輯模式（類似 Slidev）
- **雙模式切換**: 視覺化編輯器與 Markdown 編輯器自由切換
- **即時預覽**: 編寫 Markdown 時即時顯示表單效果
- **語法高亮**: 支援程式碼高亮和自動完成
- **快速建立**: 使用簡潔的 Markdown 語法快速建立複雜表單

#### 題目顯示模式
- **全部顯示**: 傳統的捲動式表單，一次顯示所有問題
- **逐題顯示**: 一次只顯示一個問題，類似問卷精靈
- **分段顯示**: 將問題分組，按段落顯示
- **自適應切換**: 使用者可隨時切換顯示模式

#### 手機優化體驗
- **滑動手勢**: 左右滑動切換題目（逐題模式）
- **觸控優化**: 所有元件都針對觸控操作優化
- **響應式設計**: 即使在桌面版也保持手機般的簡潔體驗
- **離線支援**: PWA 技術支援離線填寫

### 3.2 Markdown 語法規範

```markdown
---
title: 客戶滿意度調查
description: 請提供您的寶貴意見
theme: modern
settings:
  displayMode: one-by-one
  swipeEnabled: true
  showProgress: true
---

## 基本資訊

### 您的姓名是？
type: text
required: true
placeholder: 請輸入您的姓名
validation:
  min: 2
  max: 50
  
---

### 您的年齡範圍？
type: radio
required: true
options:
  - 18-25
  - 26-35
  - 36-45
  - 46-55
  - 56+

---

## 滿意度評分

### 您對我們服務的整體滿意度如何？
type: linear_scale
required: true
min: 1
max: 10
minLabel: 非常不滿意
maxLabel: 非常滿意

---

### 您願意推薦我們給朋友嗎？
type: nps
required: true

---

## 開放式回饋

### 請分享您的建議
type: textarea
required: false
maxLength: 500
rows: 5
placeholder: 您的意見對我們很重要...
```

---

## 4. 資料庫設計

### 4.1 核心資料表結構

```sql
-- 使用者表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'creator', 'viewer') DEFAULT 'creator',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 表單表
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    markdown_content TEXT, -- 儲存 Markdown 原始碼
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    display_mode ENUM('all', 'one-by-one', 'sections') DEFAULT 'all',
    enable_swipe BOOLEAN DEFAULT true,
    theme JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    response_count INTEGER DEFAULT 0
);

-- 問題表
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    options JSONB DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    conditional_logic JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 回應表
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    display_mode VARCHAR(20), -- 紀錄使用者選擇的顯示模式
    device_type VARCHAR(20), -- mobile, tablet, desktop
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    is_complete BOOLEAN DEFAULT false
);

-- 答案表
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. UI/UX 設計規範

### 5.1 視覺設計理念

#### 手機優先的容器設計
```scss
// 主容器樣式 - 即使在桌面也保持窄版設計
.main-container {
  width: 100%;
  max-width: 640px; // 最大寬度限制
  margin: 0 auto;
  
  // 手機 (< 768px)
  @media (max-width: 767px) {
    padding: 16px;
  }
  
  // 平板 (768px - 1023px)
  @media (min-width: 768px) and (max-width: 1023px) {
    padding: 32px;
  }
  
  // 桌面 (>= 1024px) - 大邊距設計
  @media (min-width: 1024px) {
    padding: 48px 24px;
    margin: 48px auto;
    
    // 卡片式外觀
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  // 大螢幕 (>= 1440px)
  @media (min-width: 1440px) {
    max-width: 720px;
    padding: 64px 32px;
    margin: 64px auto;
  }
}

// 問題卡片樣式
.question-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  
  // 逐題模式下的全螢幕顯示
  &.one-by-one-mode {
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
```

### 5.2 手勢操作實作

```typescript
// Vue 3 Composition API 手勢處理
import { ref, onMounted, onUnmounted } from 'vue'
import Hammer from 'hammerjs'

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const elementRef = ref<HTMLElement>()
  let hammer: HammerManager | null = null
  
  onMounted(() => {
    if (!elementRef.value) return
    
    hammer = new Hammer(elementRef.value)
    hammer.get('swipe').set({
      direction: Hammer.DIRECTION_HORIZONTAL,
      threshold: 50,
      velocity: 0.3
    })
    
    hammer.on('swipeleft', () => {
      onSwipeLeft?.()
    })
    
    hammer.on('swiperight', () => {
      onSwipeRight?.()
    })
  })
  
  onUnmounted(() => {
    hammer?.destroy()
  })
  
  return { elementRef }
}
```

### 5.3 題目顯示模式元件

```vue
<template>
  <div class="form-viewer">
    <!-- 模式選擇器 -->
    <div class="mode-selector">
      <button
        v-for="mode in displayModes"
        :key="mode.value"
        @click="currentMode = mode.value"
        :class="{ active: currentMode === mode.value }"
        class="mode-btn"
      >
        <Icon :name="mode.icon" />
        <span>{{ mode.label }}</span>
      </button>
    </div>
    
    <!-- 全部顯示模式 -->
    <TransitionGroup
      v-if="currentMode === 'all'"
      name="list"
      tag="div"
      class="questions-list"
    >
      <QuestionCard
        v-for="question in questions"
        :key="question.id"
        :question="question"
        @answer="handleAnswer"
      />
    </TransitionGroup>
    
    <!-- 逐題顯示模式 -->
    <div
      v-else-if="currentMode === 'one-by-one'"
      ref="swipeContainer"
      class="single-question-container"
    >
      <Transition :name="slideDirection" mode="out-in">
        <QuestionCard
          :key="currentQuestionIndex"
          :question="currentQuestion"
          @answer="handleAnswer"
          class="question-card one-by-one-mode"
        />
      </Transition>
      
      <!-- 導航控制 -->
      <div class="navigation">
        <button
          @click="previousQuestion"
          :disabled="!canGoPrevious"
          class="nav-btn"
        >
          <Icon name="arrow-left" />
        </button>
        
        <div class="progress-indicator">
          <span>{{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            />
          </div>
        </div>
        
        <button
          @click="nextQuestion"
          :disabled="!canGoNext"
          class="nav-btn"
        >
          <Icon name="arrow-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSwipeGesture } from '@/composables/useSwipeGesture'
import { useFormStore } from '@/stores/form'
import QuestionCard from '@/components/QuestionCard.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  questions: Question[]
}>()

const formStore = useFormStore()

// 顯示模式
const displayModes = [
  { value: 'all', label: '全部顯示', icon: 'list' },
  { value: 'one-by-one', label: '逐題顯示', icon: 'card' }
]

const currentMode = ref(formStore.preferredDisplayMode || 'all')
const currentQuestionIndex = ref(0)
const slideDirection = ref<'slide-left' | 'slide-right'>('slide-left')

// 計算屬性
const currentQuestion = computed(() => 
  props.questions[currentQuestionIndex.value]
)

const progressPercentage = computed(() => 
  ((currentQuestionIndex.value + 1) / props.questions.length) * 100
)

const canGoPrevious = computed(() => 
  currentQuestionIndex.value > 0
)

const canGoNext = computed(() => 
  currentQuestionIndex.value < props.questions.length - 1
)

// 手勢支援
const { elementRef: swipeContainer } = useSwipeGesture(
  nextQuestion,
  previousQuestion
)

// 方法
function nextQuestion() {
  if (canGoNext.value) {
    slideDirection.value = 'slide-left'
    currentQuestionIndex.value++
  }
}

function previousQuestion() {
  if (canGoPrevious.value) {
    slideDirection.value = 'slide-right'
    currentQuestionIndex.value--
  }
}

function handleAnswer(questionId: string, answer: any) {
  formStore.saveAnswer(questionId, answer)
  
  // 自動前進到下一題（逐題模式）
  if (currentMode.value === 'one-by-one' && canGoNext.value) {
    setTimeout(nextQuestion, 300)
  }
}

// 監聽模式變更
watch(currentMode, (newMode) => {
  formStore.setPreferredDisplayMode(newMode)
})
</script>

<style lang="scss" scoped>
.form-viewer {
  @apply w-full max-w-2xl mx-auto;
}

.mode-selector {
  @apply flex justify-end gap-2 mb-6;
  
  .mode-btn {
    @apply flex items-center gap-2 px-4 py-2 rounded-lg;
    @apply text-gray-600 bg-white border border-gray-300;
    @apply transition-all duration-200;
    
    &.active {
      @apply bg-indigo-600 text-white border-indigo-600;
    }
    
    &:hover:not(.active) {
      @apply bg-gray-50 border-gray-400;
    }
  }
}

.questions-list {
  @apply space-y-4;
}

.single-question-container {
  @apply relative min-h-[60vh];
}

.navigation {
  @apply flex items-center justify-between mt-8;
  
  .nav-btn {
    @apply p-3 rounded-full bg-indigo-600 text-white;
    @apply transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    
    &:not(:disabled):hover {
      @apply bg-indigo-700 scale-110;
    }
  }
  
  .progress-indicator {
    @apply flex-1 mx-6;
    
    span {
      @apply block text-center text-sm text-gray-600 mb-2;
    }
    
    .progress-bar {
      @apply h-2 bg-gray-200 rounded-full overflow-hidden;
      
      .progress-fill {
        @apply h-full bg-indigo-600 transition-all duration-300;
      }
    }
  }
}

// 動畫效果
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// 響應式設計
@media (max-width: 640px) {
  .mode-selector {
    @apply justify-center;
    
    .mode-btn {
      @apply px-3 py-1.5 text-sm;
      
      span {
        @apply hidden;
      }
    }
  }
  
  .navigation {
    @apply fixed bottom-0 left-0 right-0;
    @apply bg-white border-t border-gray-200 p-4;
  }
}
</style>
```

---

## 6. 測試計劃

### 6.1 單元測試

```typescript
// 表單編輯器測試
describe('FormEditor', () => {
  describe('Markdown 模式', () => {
    it('應該正確解析 Markdown 語法', () => {
      const markdown = `
        ### 您的姓名？
        type: text
        required: true
      `
      
      const questions = parseMarkdown(markdown)
      
      expect(questions).toHaveLength(1)
      expect(questions[0].title).toBe('您的姓名？')
      expect(questions[0].type).toBe('text')
      expect(questions[0].required).toBe(true)
    })
    
    it('應該支援雙向轉換', () => {
      const questions = [
        {
          title: '測試問題',
          type: 'radio',
          options: ['選項1', '選項2']
        }
      ]
      
      const markdown = serializeToMarkdown(questions)
      const parsed = parseMarkdown(markdown)
      
      expect(parsed).toEqual(questions)
    })
  })
  
  describe('顯示模式', () => {
    it('應該支援模式切換', async () => {
      const wrapper = mount(FormViewer, {
        props: { questions: mockQuestions }
      })
      
      // 初始為全部顯示
      expect(wrapper.find('.questions-list').exists()).toBe(true)
      
      // 切換到逐題模式
      await wrapper.find('[data-mode="one-by-one"]').trigger('click')
      expect(wrapper.find('.single-question-container').exists()).toBe(true)
    })
    
    it('應該響應滑動手勢', async () => {
      const wrapper = mount(FormViewer, {
        props: { 
          questions: mockQuestions,
          displayMode: 'one-by-one'
        }
      })
      
      const container = wrapper.find('.single-question-container')
      
      // 模擬向左滑動
      await container.trigger('touchstart', { touches: [{ clientX: 100 }] })
      await container.trigger('touchend', { changedTouches: [{ clientX: 20 }] })
      
      // 驗證前進到下一題
      expect(wrapper.vm.currentQuestionIndex).toBe(1)
    })
  })
})
```

### 6.2 E2E 測試

```typescript
import { test, expect } from '@playwright/test'

test.describe('表單填寫流程', () => {
  test('手機使用者體驗', async ({ page, browserName }) => {
    // 設定手機視窗
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/forms/survey-123')
    
    // 檢查預設顯示模式
    await expect(page.locator('.form-viewer')).toBeVisible()
    
    // 切換到逐題模式
    await page.click('[data-mode="one-by-one"]')
    
    // 填寫第一題
    await page.fill('input[name="name"]', '測試使用者')
    
    // 使用滑動手勢前進（模擬）
    await page.locator('.single-question-container').evaluate(el => {
      const touch = new Touch({
        identifier: 0,
        target: el,
        clientX: 300,
        clientY: 400
      })
      
      el.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch]
      }))
      
      const endTouch = new Touch({
        identifier: 0,
        target: el,
        clientX: 50,
        clientY: 400
      })
      
      el.dispatchEvent(new TouchEvent('touchend', {
        touches: [],
        targetTouches: [],
        changedTouches: [endTouch]
      }))
    })
    
    // 驗證切換到下一題
    await expect(page.locator('.progress-indicator')).toContainText('2 / 10')
  })
  
  test('桌面使用者體驗', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    
    await page.goto('/forms/survey-123')
    
    // 驗證窄版容器設計
    const container = page.locator('.main-container')
    const box = await container.boundingBox()
    
    expect(box?.width).toBeLessThanOrEqual(720)
    
    // 驗證大邊距
    const styles = await container.evaluate(el => 
      window.getComputedStyle(el)
    )
    
    expect(parseInt(styles.marginLeft)).toBeGreaterThan(100)
    expect(parseInt(styles.marginRight)).toBeGreaterThan(100)
  })
})
```

---

## 7. 開發 TODO 清單

### Phase 1: 基礎建設 (第 1-2 週)
- [ ] 專案環境設定
  - [ ] Vue 3 專案初始化
  - [ ] TypeScript 配置
  - [ ] Tailwind CSS 設定
  - [ ] ESLint/Prettier 配置
- [ ] 基礎元件開發
  - [ ] Layout 元件
  - [ ] Button/Input 等基礎元件
  - [ ] Icon 系統
  - [ ] 響應式容器元件

### Phase 2: 核心功能 (第 3-6 週)
- [ ] **Markdown 編輯器**
  - [ ] Monaco Editor 整合
  - [ ] Markdown 解析器實作
  - [ ] 語法高亮設定
  - [ ] 即時預覽功能
  - [ ] 雙向轉換邏輯
- [ ] **顯示模式系統**
  - [ ] 模式切換元件
  - [ ] 全部顯示模式
  - [ ] 逐題顯示模式
  - [ ] 分段顯示模式
- [ ] **手勢支援**
  - [ ] Hammer.js 整合
  - [ ] 滑動切換實作
  - [ ] 觸控優化
  - [ ] 手勢設定介面
- [ ] **響應式設計**
  - [ ] 手機版面配置
  - [ ] 平板版面配置
  - [ ] 桌面窄版設計
  - [ ] 大邊距容器樣式

### Phase 3: 進階功能 (第 7-9 週)
- [ ] 問題類型實作
  - [ ] 文字輸入類 (6 種)
  - [ ] 選擇類 (4 種)
  - [ ] 評分類 (4 種)
  - [ ] 日期時間類 (4 種)
  - [ ] 進階類 (5 種)
- [ ] 條件邏輯引擎
- [ ] 驗證規則系統
- [ ] 檔案上傳處理

### Phase 4: 測試與優化 (第 10-11 週)
- [ ] 單元測試撰寫
  - [ ] Markdown 解析器測試
  - [ ] 顯示模式測試
  - [ ] 手勢處理測試
  - [ ] 元件測試
- [ ] E2E 測試
  - [ ] 手機體驗測試
  - [ ] 桌面體驗測試
  - [ ] 跨瀏覽器測試
- [ ] 效能優化
  - [ ] 程式碼分割
  - [ ] 懶載入
  - [ ] 快取策略

### Phase 5: 部署上線 (第 12 週)
- [ ] 生產環境配置
- [ ] CI/CD 設定
- [ ] 監控系統
- [ ] 文件撰寫

---

## 8. 風險評估

| 風險項目 | 可能性 | 影響 | 緩解措施 |
|---------|-------|------|---------|
| Markdown 解析複雜度 | 中 | 高 | 提供視覺化編輯器作為備選 |
| 手勢衝突問題 | 中 | 中 | 提供設定選項讓使用者自訂 |
| 跨裝置相容性 | 低 | 高 | 完整的測試覆蓋 |
| 效能問題 | 中 | 中 | 虛擬滾動、懶載入 |

---

## 9. 成功指標

- **技術指標**
  - 頁面載入時間 < 2 秒
  - 手勢響應時間 < 100ms
  - Markdown 解析時間 < 500ms
  
- **使用者體驗指標**
  - 表單完成率 > 80%
  - 手機使用者佔比 > 60%
  - 平均填寫時間減少 30%

---

## 附錄

### A. Markdown 語法參考

完整的 Markdown 語法文件請參考專案 Wiki

### B. API 文件

詳細的 API 規格請參考 Swagger 文件

### C. 設計系統

完整的設計系統和元件庫請參考 Storybook

---

**文件結束**