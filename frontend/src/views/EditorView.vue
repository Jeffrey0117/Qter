<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 題目類型定義
type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'divider'

interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: Option[]
}

interface Form {
  id: string
  title: string
  description: string
  questions: Question[]
  displayMode?: 'step-by-step' | 'all-at-once'
}

// 編輯器模式
type EditorMode = 'visual' | 'markdown'

const editorMode = ref<EditorMode>('visual')

const router = useRouter()
const route = useRoute()

// 表單資料
const form = reactive<Form>({
  id: route.params.id as string || 'new',
  title: '未命名問卷',
  description: '',
  questions: [],
  displayMode: 'all-at-once'
})

// Markdown 內容
const markdownContent = ref(`---
title: 2025 數位生活型態調查 🔮
description: 「你的每一次滑動，都在定義明天的數位生活。」💫 請花 3 分鐘完成，讓我們用數據打造更貼近你的數位體驗！
---

## 🎯 基本資訊

### 您的稱呼是？
type: text
required: true
placeholder: 請輸入暱稱或稱呼（將用於統計顯示）

---

### 您目前的年齡範圍是？
type: radio
required: true
options:
  - 18-24 🌱
  - 25-34 🚀
  - 35-44 💼
  - 45-54 🧭
  - 55+ 🌟

---

## 📱 使用行為

### 平均每日使用智慧型手機的時間
type: radio
required: true
options:
  - ⏱️ 0-2 小時
  - ⏱️ 2-4 小時
  - ⏱️ 4-6 小時
  - ⏱️ 6-8 小時
  - ⏱️ 8 小時以上

---

### 你最常使用的社群/內容平台（可複選）
type: checkbox
required: true
options:
  - YouTube ▶️
  - Instagram 🟣
  - TikTok 🎵
  - Facebook 🔵
  - X（Twitter）⚫
  - Threads 🧵
  - Reddit 👽
  - Dcard 💬

---

## 🌟 體驗與偏好

### 對「行動支付」的整體滿意度（星級）
type: radio
required: true
options:
  - ⭐
  - ⭐⭐
  - ⭐⭐⭐
  - ⭐⭐⭐⭐
  - ⭐⭐⭐⭐⭐

---

### 你偏好的工作/學習模式
type: radio
required: true
options:
  - 完全遠距 🌐
  - 混合（部分遠距）⚖️
  - 完全實體 🏢

---

### 一週內遠距（或線上）工作的頻率
type: radio
required: false
options:
  - 幾乎沒有
  - 1-2 天
  - 3-4 天
  - 幾乎每天

---

### 你最關注的資安議題（可複選）
type: checkbox
required: false
options:
  - 隱私外洩 🛡️
  - 釣魚詐騙 🎣
  - 帳號被盜 🔐
  - 裝置惡意軟體 🦠
  - 公開 Wi-Fi 安全性 📶

---

## 🤖 AI 使用

### 你最常在哪些情境使用 AI（可複選）
type: checkbox
required: false
options:
  - 撰寫/修飾文字 ✍️
  - 寫程式/除錯 🧑‍💻
  - 圖片/設計 🎨
  - 學習/查資料 📚
  - 規劃/決策 🧠
  - 幾乎不使用 🙅

---

### 對通知的容忍度（1=少打擾，5=多提醒）
type: radio
required: true
options:
  - 🔔 1
  - 🔔 2
  - 🔔 3
  - 🔔 4
  - 🔔 5

---

## 💡 想法與回饋

### 如果可許願，你希望 2025 的「數位生活」更多什麼？
type: textarea
required: false
placeholder: 舉例：更智慧的提醒、更懂我的推薦、更安全的登入體驗…

---

### 聯絡信箱（選填，用於抽獎與結果通知）
type: text
required: false
placeholder: 填寫 email（我們將妥善保護你的資料）
`)

// 編輯狀態
const editingQuestionId = ref<string | null>(null)
const isDragging = ref(false)
const draggedQuestion = ref<Question | null>(null)

// 從 Markdown 解析表單
const parseMarkdownToForm = (markdown: string): Form => {
  const lines = markdown.split('\n')
  let currentForm: Partial<Form> = {
    title: '未命名問卷',
    description: '',
    questions: []
  }
  let currentQuestion: Partial<Question> | null = null
  let inFrontMatter = false
  let frontMatterContent = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Front matter
    if (line === '---' && !inFrontMatter) {
      inFrontMatter = true
      continue
    }
    
    if (line === '---' && inFrontMatter) {
      inFrontMatter = false
      // Parse front matter (simplified)
      const frontMatterLines = frontMatterContent.split('\n')
      frontMatterLines.forEach(frontLine => {
        const [key, ...valueParts] = frontLine.split(':').map(s => s.trim())
        const value = valueParts.join(':')
        if (key === 'title') currentForm.title = value.replace(/"/g, '')
        if (key === 'description') currentForm.description = value.replace(/"/g, '')
      })
      continue
    }
    
    if (inFrontMatter) {
      frontMatterContent += line + '\n'
      continue
    }
    
    // Question separator
    if (line === '---') {
      if (currentQuestion) {
        currentForm.questions!.push(currentQuestion as Question)
      }
      currentQuestion = null
      continue
    }
    
    // Question title (starts with ###)
    if (line.startsWith('### ')) {
      if (currentQuestion) {
        currentForm.questions!.push(currentQuestion as Question)
      }
      currentQuestion = {
        id: `q_${Date.now()}_${Math.random()}`,
        title: line.substring(4),
        type: 'text',
        required: false
      }
      continue
    }
    
    // Question properties
    if (currentQuestion && line.includes(':')) {
      const [key, ...valueParts] = line.split(':').map(s => s.trim())
      const value = valueParts.join(':')
      
      switch (key) {
        case 'type':
          currentQuestion.type = value as QuestionType
          break
        case 'required':
          currentQuestion.required = value === 'true'
          break
        case 'placeholder':
          currentQuestion.description = value.replace(/"/g, '')
          break
        case 'options':
          currentQuestion.options = []
          // Parse options in next lines
          let optionIndex = i + 1
          while (optionIndex < lines.length && lines[optionIndex].trim().startsWith('- ')) {
            const optionText = lines[optionIndex].trim().substring(2)
            currentQuestion.options!.push({
              id: `opt_${Date.now()}_${Math.random()}`,
              text: optionText.replace(/"/g, '')
            })
            optionIndex++
          }
          i = optionIndex - 1
          break
      }
    }
  }
  
  // Add last question
  if (currentQuestion) {
    currentForm.questions!.push(currentQuestion as Question)
  }
  
  return currentForm as Form
}

// 從表單生成 Markdown
const generateMarkdownFromForm = (form: Form): string => {
  let markdown = `---
title: ${form.title}
description: ${form.description}
---

`
  
  form.questions.forEach((question, index) => {
    markdown += `### ${question.title}\n`
    markdown += `type: ${question.type}\n`
    markdown += `required: ${question.required}\n`
    
    if (question.description) {
      markdown += `placeholder: "${question.description}"\n`
    }
    
    if (question.options && question.options.length > 0) {
      markdown += `options:\n`
      question.options.forEach(option => {
        markdown += `  - "${option.text}"\n`
      })
    }
    
    if (index < form.questions.length - 1) {
      markdown += `---\n\n`
    }
  })
  
  return markdown
}

// 同步 Markdown 和視覺編輯器
const syncMarkdownToVisual = () => {
  const parsedForm = parseMarkdownToForm(markdownContent.value)
  form.title = parsedForm.title
  form.description = parsedForm.description
  form.questions = parsedForm.questions
}

const syncVisualToMarkdown = () => {
  markdownContent.value = generateMarkdownFromForm(form)
}

// 切換編輯器模式
const toggleEditorMode = () => {
  if (editorMode.value === 'markdown') {
    // 切換到視覺編輯器時，同步 Markdown 到視覺
    syncMarkdownToVisual()
    editorMode.value = 'visual'
  } else {
    // 切換到 Markdown 編輯器時，同步視覺到 Markdown
    syncVisualToMarkdown()
    editorMode.value = 'markdown'
  }
}

// 新增題目
const addQuestion = (type: QuestionType) => {
  const newQuestion: Question = {
    id: `q_${Date.now()}`,
    type,
    title: type === 'divider' ? '' : '新問題',
    required: false,
    options: type === 'radio' || type === 'checkbox' 
      ? [
          { id: `opt_${Date.now()}_1`, text: '選項 1' },
          { id: `opt_${Date.now()}_2`, text: '選項 2' }
        ]
      : undefined
  }
  form.questions.push(newQuestion)
  editingQuestionId.value = newQuestion.id
  
  // 如果在 Markdown 模式，同步更新
  if (editorMode.value === 'markdown') {
    syncVisualToMarkdown()
  }
}

// 刪除題目
const deleteQuestion = (id: string) => {
  const index = form.questions.findIndex(q => q.id === id)
  if (index !== -1) {
    form.questions.splice(index, 1)
    
    // 如果在 Markdown 模式，同步更新
    if (editorMode.value === 'markdown') {
      syncVisualToMarkdown()
    }
  }
}

// 複製題目
const duplicateQuestion = (question: Question) => {
  const newQuestion: Question = {
    ...question,
    id: `q_${Date.now()}`,
    options: question.options?.map(opt => ({
      ...opt,
      id: `opt_${Date.now()}_${Math.random()}`
    }))
  }
  const index = form.questions.findIndex(q => q.id === question.id)
  form.questions.splice(index + 1, 0, newQuestion)
  
  // 如果在 Markdown 模式，同步更新
  if (editorMode.value === 'markdown') {
    syncVisualToMarkdown()
  }
}

// 新增選項
const addOption = (question: Question) => {
  if (!question.options) question.options = []
  question.options.push({
    id: `opt_${Date.now()}`,
    text: `選項 ${question.options.length + 1}`
  })
  
  // 如果在 Markdown 模式，同步更新
  if (editorMode.value === 'markdown') {
    syncVisualToMarkdown()
  }
}

// 刪除選項
const deleteOption = (question: Question, optionId: string) => {
  if (!question.options) return
  const index = question.options.findIndex(o => o.id === optionId)
  if (index !== -1 && question.options.length > 1) {
    question.options.splice(index, 1)
    
    // 如果在 Markdown 模式，同步更新
    if (editorMode.value === 'markdown') {
      syncVisualToMarkdown()
    }
  }
}

// 拖拽處理
const handleDragStart = (e: DragEvent, question: Question) => {
  isDragging.value = true
  draggedQuestion.value = question
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (e: DragEvent, targetQuestion: Question) => {
  e.preventDefault()
  if (!draggedQuestion.value) return

  const draggedIndex = form.questions.findIndex(q => q.id === draggedQuestion.value?.id)
  const targetIndex = form.questions.findIndex(q => q.id === targetQuestion.id)

  if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
    const [removed] = form.questions.splice(draggedIndex, 1)
    form.questions.splice(targetIndex, 0, removed)
    
    // 如果在 Markdown 模式，同步更新
    if (editorMode.value === 'markdown') {
      syncVisualToMarkdown()
    }
  }

  isDragging.value = false
  draggedQuestion.value = null
}

const handleDragEnd = () => {
  isDragging.value = false
  draggedQuestion.value = null
}

// 儲存表單
const saveForm = () => {
  // 若在 Markdown 模式，先解析 Markdown 並同步至視覺資料，確保儲存與預覽一致
  if (editorMode.value === 'markdown') {
    const parsed = parseMarkdownToForm(markdownContent.value)
    // 保留 id 與 displayMode
    parsed.id = form.id
    parsed.displayMode = form.displayMode
    // 同步到視覺模型
    form.title = parsed.title
    form.description = parsed.description
    form.questions = parsed.questions
  }

  // 儲存到 localStorage
  const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
  const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)

  const toSave = {
    ...form,
    // 總是一起儲存對應的 Markdown 序列化內容，方便雙向同步與回溯
    markdownContent: generateMarkdownFromForm(form)
  }

  if (existingIndex !== -1) {
    savedForms[existingIndex] = toSave
  } else {
    savedForms.push(toSave)
  }

  localStorage.setItem('qter_forms', JSON.stringify(savedForms))
  alert('問卷已儲存！')
}

/**
 * 重置本地快取並載入預設「2025 數位生活型態調查」
 * - 清除 qter_forms 中當前表單
 * - 清除暫存作答與回應
 * - 以內建 Markdown 重新解析載入（全頁模式）
 */
const resetLocalCacheForCurrentForm = () => {
  const currentId = (route.params.id as string) || form.id
  // 清除問卷列表中的同 id
  const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
  const filtered = savedForms.filter((f: any) => f.id !== currentId)
  localStorage.setItem('qter_forms', JSON.stringify(filtered))
  // 清除暫存作答
  localStorage.removeItem(`qter_response_${currentId}`)
  // 清除已提交回應中的此表單
  const allResponses = JSON.parse(localStorage.getItem('qter_all_responses') || '{}')
  if (allResponses[currentId]) {
    delete allResponses[currentId]
    localStorage.setItem('qter_all_responses', JSON.stringify(allResponses))
  }
}

const resetToDefaultSurvey = () => {
  resetLocalCacheForCurrentForm()

  // 若當前是 /editor/new 或無 id，指定一個穩定 id，避免預覽時找不到表單
  const stableId = 'digital-2025'
  if (!route.params.id || (route.params.id as string) === 'new') {
    form.id = stableId
    // 立即更新網址，避免後續預覽/填寫讀不到
    router.replace(`/editor/${stableId}`)
  }

  // 由內建 Markdown 載入，並強制為全頁模式
  const parsed = parseMarkdownToForm(markdownContent.value)
  parsed.id = form.id
  parsed.displayMode = 'all-at-once'
  form.title = parsed.title
  form.description = parsed.description
  form.questions = parsed.questions
  form.displayMode = 'all-at-once'

  // 立即持久化到 localStorage，確保 FillView/AllAtOnceView 能讀到
  const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
  const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)
  const toSave = {
    ...form,
    markdownContent: generateMarkdownFromForm(form),
  }
  if (existingIndex !== -1) {
    savedForms[existingIndex] = toSave
  } else {
    savedForms.push(toSave)
  }
  localStorage.setItem('qter_forms', JSON.stringify(savedForms))

  alert('已重置並寫入預設的「2025 數位生活型態調查」，且設定為全頁模式。您可以直接點「預覽」。')
}

// 預覽表單
const previewForm = () => {
  // 預覽前確保資料同步（特別是 Markdown 模式）
  if (editorMode.value === 'markdown') {
    const parsed = parseMarkdownToForm(markdownContent.value)
    parsed.id = form.id
    parsed.displayMode = form.displayMode
    form.title = parsed.title
    form.description = parsed.description
    form.questions = parsed.questions
  }

  if ((form.displayMode ?? 'step-by-step') === 'all-at-once') {
    router.push(`/fill/${form.id}/all`)
  } else {
    router.push(`/fill/${form.id}`)
  }
}

// 返回首頁
const goBack = () => {
  router.push('/')
}

// 載入表單資料
onMounted(() => {
  // 支援以網址參數 ?reset=1 或 ?force=1 強制載入預設問卷並清除本地快取
  const shouldReset =
    (route.query && (route.query as any).reset === '1') ||
    (route.query && (route.query as any).force === '1')

  if (shouldReset) {
    resetToDefaultSurvey()
    return
  }

  if (route.params.id && route.params.id !== 'new') {
    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const savedForm = savedForms.find((f: any) => f.id === route.params.id)
    if (savedForm) {
      Object.assign(form, savedForm)

      if (savedForm.markdownContent && typeof savedForm.markdownContent === 'string') {
        markdownContent.value = savedForm.markdownContent
        // 以 markdownContent 作為真實來源解析，同步到視覺資料
        const parsed = parseMarkdownToForm(markdownContent.value)
        parsed.id = form.id
        parsed.displayMode = form.displayMode
        form.title = parsed.title
        form.description = parsed.description
        form.questions = parsed.questions
      } else {
        // 若沒有存 markdownContent，則用現有表單生成一次，並填入 markdownContent
        markdownContent.value = generateMarkdownFromForm(form)
      }
    }
  }
})

// 題目類型圖示
const getQuestionIcon = (type: QuestionType) => {
  switch (type) {
    case 'text': return '📝'
    case 'textarea': return '📄'
    case 'radio': return '⭕'
    case 'checkbox': return '☑️'
    case 'divider': return '➖'
    default: return '❓'
  }
}

const getQuestionTypeName = (type: QuestionType) => {
  switch (type) {
    case 'text': return '單行文字'
    case 'textarea': return '多行文字'
    case 'radio': return '單選題'
    case 'checkbox': return '多選題'
    case 'divider': return '分隔線'
    default: return '未知'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部工具列 -->
    <nav class="bg-white shadow-sm border-b sticky top-0 z-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="text-gray-600 hover:text-gray-900"
            >
              ← 返回
            </button>
            <div>
              <input
                v-if="editorMode === 'visual'"
                v-model="form.title"
                class="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                placeholder="輸入問卷標題"
              />
              <span v-else class="text-lg font-semibold">{{ form.title }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- 編輯器模式切換 -->
            <button
              @click="toggleEditorMode"
              :class="[
                'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                editorMode === 'visual' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              ]"
            >
              <svg v-if="editorMode === 'visual'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              {{ editorMode === 'visual' ? '視覺編輯' : 'Markdown' }}
            </button>
            
            <button
              @click="saveForm"
              class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              儲存
            </button>
            <button
              @click="resetToDefaultSurvey"
              class="px-4 py-2 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
              title="清除本地快取並載入預設的 2025 問卷"
            >
              重置快取
            </button>
            <button
              @click="previewForm"
              class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              預覽
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Markdown 編輯器模式 -->
    <div v-if="editorMode === 'markdown'" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Markdown 編輯器 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Markdown 編輯器</h3>
            <p class="text-sm text-gray-600">參考 Slidev 語法編寫問卷</p>
          </div>
          <div class="p-4">
            <textarea
              v-model="markdownContent"
              class="w-full h-96 font-mono text-sm border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="輸入 Markdown 內容..."
            />
          </div>
        </div>

        <!-- 即時預覽 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">即時預覽</h3>
            <p class="text-sm text-gray-600">編輯時自動預覽效果</p>
          </div>
          <div class="p-4">
            <div class="space-y-4 max-h-96 overflow-y-auto">
              <div v-for="question in parseMarkdownToForm(markdownContent).questions" :key="question.id" class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span>{{ getQuestionIcon(question.type) }}</span>
                  <span class="font-medium">{{ question.title }}</span>
                  <span v-if="question.required" class="text-red-500">*</span>
                </div>
                <div v-if="question.options" class="ml-6 space-y-1">
                  <div v-for="option in question.options" :key="option.id" class="text-sm text-gray-600">
                    • {{ option.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 視覺編輯器模式 -->
    <main v-else class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 表單描述 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <textarea
          v-model="form.description"
          class="w-full resize-none border-0 focus:ring-0 text-gray-600"
          rows="2"
          placeholder="新增表單描述（選填）"
        />
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">展示模式</label>
          <div class="flex items-center gap-4">
            <label class="inline-flex items-center gap-2">
              <input
                type="radio"
                class="text-blue-600"
                :checked="(form.displayMode ?? 'step-by-step') === 'step-by-step'"
                @change="form.displayMode = 'step-by-step'"
              />
              <span class="text-sm text-gray-700">單題模式</span>
            </label>
            <label class="inline-flex items-center gap-2">
              <input
                type="radio"
                class="text-blue-600"
                :checked="form.displayMode === 'all-at-once'"
                @change="form.displayMode = 'all-at-once'"
              />
              <span class="text-sm text-gray-700">全頁模式</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            單題模式：一次顯示一題；全頁模式：所有題目一次展開，提交時整體驗證。
          </p>
        </div>
      </div>

      <!-- 題目列表 -->
      <div class="space-y-4">
        <div
          v-for="(question, index) in form.questions"
          :key="question.id"
          :class="[
            'bg-white rounded-lg shadow-sm border transition-all',
            isDragging && draggedQuestion?.id === question.id ? 'opacity-50' : '',
            editingQuestionId === question.id ? 'border-blue-500' : 'border-gray-200'
          ]"
          draggable="true"
          @dragstart="handleDragStart($event, question)"
          @dragover="handleDragOver"
          @drop="handleDrop($event, question)"
          @dragend="handleDragEnd"
        >
          <div class="p-6">
            <!-- 題目標頭 -->
            <div class="flex items-start gap-3 mb-4">
              <div class="flex-shrink-0 mt-1 cursor-move">
                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">{{ getQuestionIcon(question.type) }}</span>
                  <span class="text-sm text-gray-500">{{ getQuestionTypeName(question.type) }}</span>
                  <span class="text-sm text-gray-400">問題 {{ index + 1 }}</span>
                </div>
                <input
                  v-if="question.type !== 'divider'"
                  v-model="question.title"
                  class="w-full text-lg font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="輸入問題"
                  @focus="editingQuestionId = question.id"
                />
                <hr v-else class="border-t-2 border-gray-300" />
              </div>
              <div class="flex items-center gap-1">
                <button
                  @click="duplicateQuestion(question)"
                  class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="複製"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                  </svg>
                </button>
                <button
                  @click="deleteQuestion(question.id)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="刪除"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 題目描述 -->
            <div v-if="question.type !== 'divider'" class="mb-4">
              <input
                v-model="question.description"
                class="w-full text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="新增描述（選填）"
                @focus="editingQuestionId = question.id"
              />
            </div>

            <!-- 選項列表（單選/多選題） -->
            <div v-if="question.type === 'radio' || question.type === 'checkbox'" class="space-y-2">
              <div
                v-for="option in question.options"
                :key="option.id"
                class="flex items-center gap-2"
              >
                <span v-if="question.type === 'radio'" class="text-gray-400">○</span>
                <span v-else class="text-gray-400">☐</span>
                <input
                  v-model="option.text"
                  class="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  @focus="editingQuestionId = question.id"
                />
                <button
                  @click="deleteOption(question, option.id)"
                  class="p-1 text-gray-400 hover:text-red-600"
                  :disabled="question.options?.length === 1"
                >
                  ×
                </button>
              </div>
              <button
                @click="addOption(question)"
                class="text-sm text-blue-500 hover:text-blue-600"
              >
                + 新增選項
              </button>
            </div>

            <!-- 文字輸入預覽 -->
            <div v-if="question.type === 'text'" class="mt-4">
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="短答案文字"
                disabled
              />
            </div>

            <!-- 多行文字預覽 -->
            <div v-if="question.type === 'textarea'" class="mt-4">
              <textarea
                class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows="3"
                placeholder="長答案文字"
                disabled
              />
            </div>

            <!-- 必填設定 -->
            <div v-if="question.type !== 'divider'" class="mt-4 flex items-center gap-2">
              <input
                v-model="question.required"
                type="checkbox"
                :id="`required_${question.id}`"
                class="rounded text-blue-500"
              />
              <label :for="`required_${question.id}`" class="text-sm text-gray-600">
                必填
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增題目按鈕 -->
      <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="text-center mb-3 text-sm text-gray-600">新增題目</div>
        <div class="flex justify-center gap-2 flex-wrap">
          <button
            @click="addQuestion('text')"
            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>📝</span>
            <span>單行文字</span>
          </button>
          <button
            @click="addQuestion('textarea')"
            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>📄</span>
            <span>多行文字</span>
          </button>
          <button
            @click="addQuestion('radio')"
            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>⭕</span>
            <span>單選題</span>
          </button>
          <button
            @click="addQuestion('checkbox')"
            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>☑️</span>
            <span>多選題</span>
          </button>
          <button
            @click="addQuestion('divider')"
            class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>➖</span>
            <span>分隔線</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>