<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { buildAndApplyMarkdown, sanitizeHTMLFragment } from '@/services/markdown'
import { formApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { generateHash } from '@/utils/hash'

// 題目類型定義
type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'range' | 'date' | 'file' | 'divider'

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
  className?: string
}

interface Form {
  id: string
  title: string
  description: string
  questions: Question[]
  displayMode?: 'step-by-step' | 'all-at-once'
  // 新增設定
  autoAdvance?: boolean
  autoAdvanceDelay?: number
  showProgress?: boolean
  allowGoBack?: boolean
}

// 編輯器模式
type EditorMode = 'visual' | 'markdown'

const editorMode = ref<EditorMode>('visual')

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const syncStatus = ref<'synced' | 'syncing' | 'local' | 'error'>('local')

// 🔥 新增：資料載入狀態標記，防止 watch 在載入前觸發自動保存
const isDataLoaded = ref(false)

// 🔥 新增：記錄初始題目數量，用於檢測資料丟失
let initialQuestionsCount = 0
let isFirstSaveAfterLoad = true // 標記是否為載入後的第一次保存

// 🔥 防止快速連續保存導致資料覆蓋
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let isSaving = false // 保存鎖，防止並發保存

const debouncedSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    // 🔥 新增：跳過載入後的第一次保存
    if (isFirstSaveAfterLoad) {
      console.log('⏸️ [Save] Skipping first save after load (no real changes)')
      isFirstSaveAfterLoad = false
      return
    }

    if (!isSaving) {
      persistFormToLocalStorage()
    } else {
      console.log('⏸️ [Save] Another save in progress, skipping')
    }
  }, 1000) // 1 秒內的多次變更只保存一次
}

// 表單資料
const form = reactive<Form>({
  id: route.params.id as string || 'new',
  title: '未命名問卷',
  description: '',
  questions: [],
  displayMode: 'step-by-step',
  // 預設值處理
  autoAdvance: true,
  autoAdvanceDelay: 300,
  showProgress: true,
  allowGoBack: true,
})

// 設定變更即時儲存 - 🔥 只在資料載入完成後才觸發，使用 debounce
watch(
  () => [form.autoAdvance, form.autoAdvanceDelay, form.showProgress, form.allowGoBack, form.displayMode],
  () => {
    if (!isDataLoaded.value) {
      console.log('⏸️ [Watch] Skipping auto-save: data not loaded yet')
      return
    }
    console.log('💾 [Watch] Settings changed, debouncing save...')
    debouncedSave()
  },
  { deep: false }
)

// 表單內容變更自動儲存 - 🔥 只在資料載入完成後才觸發，使用 debounce
watch(
  () => [form.title, form.description, form.questions],
  () => {
    if (!isDataLoaded.value) {
      console.log('⏸️ [Watch] Skipping auto-save: data not loaded yet')
      return
    }
    console.log('💾 [Watch] Content changed, debouncing save...')
    debouncedSave()
  },
  { deep: true }
)

 // Markdown 內容（示範含 style、Google Fonts、自訂卡片樣式與 HTML 標題）
const markdownContent = ref(`---
title: <span class="custom-title">客製化問卷標題</span>
description: 使用自訂字體、顏色與卡片樣式的進階示範
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
  .custom-title { font-family: 'Noto Sans TC'; font-size: 2.2rem; color: #6B46C1; }
  .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 8px; }
  .note { color: #FF6B6B; font-size: 1.1rem; }
</style>

## 🎯 基本資訊

### 您的稱呼是？
type: text
required: true
placeholder: 請輸入暱稱或稱呼（將用於統計顯示）

---

### 您目前的年齡範圍是？ {.card}
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
placeholder: <span class="note">舉例：更智慧的提醒、更懂我的推薦、更安全的登入體驗…</span>

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
   // 先移除 <style>...</style> 區塊，避免干擾題目解析
   const mdNoStyle = markdown.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
   const lines = mdNoStyle.split('\n')
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

    // Question title (starts with ###) + 可選 class 標記：### 標題 {.class1 class2}
    if (line.startsWith('### ')) {
      if (currentQuestion) {
        currentForm.questions!.push(currentQuestion as Question)
      }
      // 萃取可選的 {.class}
      const m = /^###\s+(.*?)(?:\s+\{\.([A-Za-z0-9\-\s_]+)\})?$/.exec(line)
      const title = m ? m[1] : line.substring(4)
      const className = m && m[2] ? m[2].trim() : undefined

      currentQuestion = {
        id: generateHash(),
        title,
        className,
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
              id: generateHash(),
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
    const cls = question.className ? ` {.${question.className}}` : ''
    markdown += `### ${question.title}${cls}\n`
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
  console.log('🔄 [Sync MD->Visual] Starting sync from Markdown to Visual')
  console.log('🔄 [Sync MD->Visual] Current questions count:', form.questions.length)

  const parsedForm = parseMarkdownToForm(markdownContent.value)

  console.log('🔄 [Sync MD->Visual] Parsed questions count:', parsedForm.questions.length)

  // 🔥 檢查是否會丟失題目
  if (initialQuestionsCount > 0 && parsedForm.questions.length < initialQuestionsCount) {
    console.warn('⚠️ [Sync MD->Visual] WARNING: Parsed questions count is less than initial count')
    console.warn('⚠️ [Sync MD->Visual] Initial:', initialQuestionsCount, 'Parsed:', parsedForm.questions.length)
  }

  form.title = parsedForm.title
  form.description = parsedForm.description
  form.questions = parsedForm.questions

  console.log('🔄 [Sync MD->Visual] After sync, questions count:', form.questions.length)

  // 🔥 同步後更新初始題目數量
  if (isDataLoaded.value) {
    initialQuestionsCount = form.questions.length
    console.log('📊 [Sync MD->Visual] Updated initial questions count:', initialQuestionsCount)
  }
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
  console.log('➕ [Add Question] Adding question of type:', type)
  console.log('➕ [Add Question] Current questions count:', form.questions.length)

  const newQuestion: Question = {
    id: generateHash(),
    type,
    title: type === 'divider' ? '' : '新問題',
    required: false,
    options: type === 'radio' || type === 'checkbox'
      ? [
          { id: generateHash(), text: '選項 1' },
          { id: generateHash(), text: '選項 2' }
        ]
      : undefined
  }
  form.questions.push(newQuestion)
  editingQuestionId.value = newQuestion.id

  console.log('➕ [Add Question] After adding, questions count:', form.questions.length)

  // 🔥 更新初始題目數量（這是正常的操作）
  if (isDataLoaded.value) {
    initialQuestionsCount = form.questions.length
    console.log('📊 [Add Question] Updated initial questions count:', initialQuestionsCount)
  }

  // 如果在 Markdown 模式，同步更新
  if (editorMode.value === 'markdown') {
    syncVisualToMarkdown()
  }
}

// 刪除題目
const deleteQuestion = (id: string) => {
  console.log('🗑️ [Delete Question] Deleting question:', id)
  console.log('🗑️ [Delete Question] Current questions count:', form.questions.length)

  const index = form.questions.findIndex(q => q.id === id)
  if (index !== -1) {
    const deletedQuestion = form.questions[index]
    console.log('🗑️ [Delete Question] Deleting question:', deletedQuestion.title)
    form.questions.splice(index, 1)
    console.log('🗑️ [Delete Question] After deletion, questions count:', form.questions.length)

    // 🔥 更新初始題目數量（這是正常的操作）
    if (isDataLoaded.value) {
      initialQuestionsCount = form.questions.length
      console.log('📊 [Delete Question] Updated initial questions count:', initialQuestionsCount)
    }

    // 如果在 Markdown 模式，同步更新
    if (editorMode.value === 'markdown') {
      syncVisualToMarkdown()
    }
  } else {
    console.warn('⚠️ [Delete Question] Question not found:', id)
  }
}

// 複製題目
const duplicateQuestion = (question: Question) => {
  console.log('📋 [Duplicate Question] Duplicating question:', question.title)
  console.log('📋 [Duplicate Question] Current questions count:', form.questions.length)

  const newQuestion: Question = {
    ...question,
    id: generateHash(),
    options: question.options?.map(opt => ({
      ...opt,
      id: generateHash()
    }))
  }
  const index = form.questions.findIndex(q => q.id === question.id)
  form.questions.splice(index + 1, 0, newQuestion)

  console.log('📋 [Duplicate Question] After duplication, questions count:', form.questions.length)

  // 🔥 更新初始題目數量（這是正常的操作）
  if (isDataLoaded.value) {
    initialQuestionsCount = form.questions.length
    console.log('📊 [Duplicate Question] Updated initial questions count:', initialQuestionsCount)
  }

  // 如果在 Markdown 模式，同步更新
  if (editorMode.value === 'markdown') {
    syncVisualToMarkdown()
  }
}

// 新增選項
const addOption = (question: Question) => {
  if (!question.options) question.options = []
  question.options.push({
    id: generateHash(),
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

async function syncFormToDB() {
  console.log('🔍 syncFormToDB called')
  console.log('🔍 [Sync] Current questions count before sync:', form.questions.length)

  try {
    syncStatus.value = 'syncing'

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      questions: form.questions,
      displayMode: form.displayMode,
      markdownContent: editorMode.value === 'markdown'
        ? markdownContent.value
        : generateMarkdownFromForm(form),
      autoAdvance: form.autoAdvance,
      autoAdvanceDelay: form.autoAdvanceDelay,
      showProgress: form.showProgress,
      allowGoBack: form.allowGoBack,
    }

    console.log('📝 Form data to sync:', {
      id: formData.id,
      title: formData.title,
      questionsCount: formData.questions.length,
      questions: formData.questions.map(q => ({ id: q.id, title: q.title }))
    })

    // 總是先嘗試創建（使用 upsert），如果已存在則自動更新
    try {
      console.log('➕ Attempting to create/upsert form in DB:', form.id)
      const result = await formApi.createForm(formData)
      console.log('➕ Create/upsert result:', result)
    } catch (createError: any) {
      // 如果創建失敗（可能是已存在），嘗試更新
      if (createError?.code === '23505' || createError?.message?.includes('duplicate')) {
        console.log('🔄 Form exists, updating instead:', form.id)
        const result = await formApi.updateForm(form.id, formData)
        console.log('🔄 Update result:', result)
      } else {
        throw createError
      }
    }

    syncStatus.value = 'synced'
    console.log('✅ Sync successful:', form.id)
    return true
  } catch (error) {
    console.error('❌ Sync failed:', error)
    console.error('❌ Error details:', error)
    syncStatus.value = 'error'
    // 不拋出錯誤，允許繼續使用 localStorage
    return false
  }
}

function persistFormToLocalStorage() {
  if (isSaving) {
    console.log('⏸️ [Save] Already saving, skipping this call')
    return
  }

  isSaving = true
  console.log('💾 persistFormToLocalStorage called for form:', form.id)
  console.log('💾 Current questions count:', form.questions.length, 'Initial count:', initialQuestionsCount)

  try {
    // 🔥 新增：檢查題目數量是否減少
    if (initialQuestionsCount > 0 && form.questions.length < initialQuestionsCount) {
      console.warn('⚠️ [Save] WARNING: Questions count decreased from', initialQuestionsCount, 'to', form.questions.length)
      console.warn('⚠️ [Save] This might indicate data loss. Please check the data flow.')
      // 記錄詳細資訊以便除錯
      console.warn('⚠️ [Save] Current questions:', JSON.stringify(form.questions.map(q => ({ id: q.id, title: q.title }))))
    }

    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)

    // 🔥 確保正確序列化 reactive 對象，明確列出所有屬性
    const now = new Date().toISOString()
    const existingForm = existingIndex !== -1 ? savedForms[existingIndex] : null

    const toSave = {
      id: form.id,
      title: form.title,
      description: form.description,
      questions: JSON.parse(JSON.stringify(form.questions)), // 深拷貝避免 reactive 問題
      displayMode: form.displayMode,
      autoAdvance: form.autoAdvance,
      autoAdvanceDelay: form.autoAdvanceDelay,
      showProgress: form.showProgress,
      allowGoBack: form.allowGoBack,
      markdownContent: editorMode.value === 'markdown'
        ? markdownContent.value
        : generateMarkdownFromForm(form),
      createdAt: existingForm?.createdAt || now, // 保留原始創建時間
      updatedAt: now // 更新修改時間
    }

    console.log('💾 Saving form with', toSave.questions.length, 'questions')

    if (existingIndex !== -1) {
      savedForms[existingIndex] = toSave
      console.log('💾 Updated existing form at index', existingIndex)
    } else {
      savedForms.push(toSave)
      console.log('💾 Added new form to localStorage')
    }

    localStorage.setItem('qter_forms', JSON.stringify(savedForms))
    console.log('✅ Saved to localStorage:', form.id, 'Total forms:', savedForms.length)

    // 自動同步到資料庫 - 不要靜默吞掉錯誤
    syncFormToDB().catch((error) => {
      console.error('❌ Auto-sync failed:', error)
      // 錯誤已經被 syncFormToDB 內部處理，這裡只是確保不會中斷執行
    }).finally(() => {
      isSaving = false
    })
  } catch (error) {
    console.error('❌ [Save] Failed to save:', error)
    isSaving = false
  }
}

const saveForm = async () => {
  console.log('💾 saveForm called')

  if (editorMode.value === 'markdown') {
    const parsed = parseMarkdownToForm(markdownContent.value)
    parsed.id = form.id
    parsed.displayMode = form.displayMode
    if (parsed.title && parsed.title !== '未命名問卷') {
      form.title = parsed.title
    }
    if (typeof parsed.description === 'string' && parsed.description.trim().length > 0) {
      form.description = parsed.description
    }
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      form.questions = parsed.questions
    }
  }

  // 先儲存到 localStorage（不觸發自動同步）
  const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
  const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)

  const toSave = {
    ...form,
    markdownContent: editorMode.value === 'markdown'
      ? markdownContent.value
      : generateMarkdownFromForm(form)
  }

  if (existingIndex !== -1) {
    savedForms[existingIndex] = toSave
  } else {
    savedForms.push(toSave)
  }

  localStorage.setItem('qter_forms', JSON.stringify(savedForms))
  console.log('💾 Saved to localStorage:', form.id)

  // 然後強制同步到資料庫
  try {
    await syncFormToDB()
    alert('✅ 問卷已儲存並同步至雲端！')
  } catch (error) {
    console.error('❌ Save form failed:', error)
    alert('⚠️ 問卷已儲存至本地，但雲端同步失敗。請檢查控制台錯誤訊息。')
  }
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

  // 由內建 Markdown 載入，沿用目前展示模式（預設 step-by-step）
  const parsed = parseMarkdownToForm(markdownContent.value)
  parsed.id = form.id
  parsed.displayMode = form.displayMode ?? 'step-by-step'
  form.title = parsed.title
  form.description = parsed.description
  form.questions = parsed.questions
  form.displayMode = form.displayMode ?? 'step-by-step'

  // 立即持久化到 localStorage，確保 FillView/AllAtOnceView 能讀到
  const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
  const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)
  const toSave = {
    ...form,
    // 重置為預設問卷時，保留目前 markdownContent（內建示範含 <style>）
    markdownContent: markdownContent.value,
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
const previewForm = async () => {
  console.log('📋 [Preview] Starting preview process')

  // 預覽前確保資料同步（特別是 Markdown 模式）
  if (editorMode.value === 'markdown') {
    const parsed = parseMarkdownToForm(markdownContent.value)
    parsed.id = form.id
    parsed.displayMode = form.displayMode
    // 僅在 Markdown 有提供內容時才覆蓋
    if (parsed.title && parsed.title !== '未命名問卷') {
      form.title = parsed.title
    }
    if (typeof parsed.description === 'string' && parsed.description.trim().length > 0) {
      form.description = parsed.description
    }
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      form.questions = parsed.questions
    }
  }

  // 確保資料已同步到資料庫再導航
  persistFormToLocalStorage()

  try {
    console.log('📋 [Preview] Syncing to database before navigation...')
    await syncFormToDB()
    console.log('✅ [Preview] Sync complete, navigating to preview')
  } catch (error) {
    console.error('❌ [Preview] Sync failed, but continuing to preview:', error)
    // 即使同步失敗也繼續導航，因為 localStorage 有資料
  }

  if ((form.displayMode ?? 'step-by-step') === 'all-at-once') {
    router.push(`/fill/${form.id}/all`)
  } else {
    router.push(`/fill/${form.id}`)
  }
}

// 返回儀表板
const goBack = () => {
  router.push('/dashboard')
}

// 複製分享網址相關
const showCopySuccess = ref(false)
let copySuccessTimer: number | null = null

const copyShareUrl = async () => {
  const shareUrl = `https://qter.vercel.app/fill/${form.id}`

  try {
    await navigator.clipboard.writeText(shareUrl)
    showCopySuccess.value = true

    // 清除之前的計時器
    if (copySuccessTimer) {
      clearTimeout(copySuccessTimer)
    }

    // 3 秒後隱藏提示
    copySuccessTimer = setTimeout(() => {
      showCopySuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('複製失敗:', err)
    // 降級方案：使用傳統方式複製
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl
    textarea.style.position = 'fixed'
    textarea.style.left = '-999999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      showCopySuccess.value = true

      if (copySuccessTimer) {
        clearTimeout(copySuccessTimer)
      }

      copySuccessTimer = setTimeout(() => {
        showCopySuccess.value = false
      }, 3000)
    } catch (err) {
      console.error('複製失敗:', err)
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

 // 載入表單資料
onMounted(async () => {
  // 預覽樣式：載入與後續監看
  buildAndApplyMarkdown(markdownContent.value, 'qter-style-editor-preview', 'editor-preview')
  watch(markdownContent, (v) => {
    buildAndApplyMarkdown(v, 'qter-style-editor-preview', 'editor-preview')
  }, { immediate: false })

  // 支援以網址參數 ?reset=1 或 ?force=1 強制載入預設問卷並清除本地快取
  const shouldReset =
    (route.query && (route.query as any).reset === '1') ||
    (route.query && (route.query as any).force === '1')

  if (shouldReset) {
    resetToDefaultSurvey()
    return
  }

  if (route.params.id && route.params.id !== 'new') {
    let savedForm = null

    // 🔥 優先從資料庫載入表單（與 FillView 一致）
    console.log('🔍 [Editor] Loading form from database first:', route.params.id)
    try {
      const response = await formApi.getForm(route.params.id as string)
      if (response.success && response.form) {
        savedForm = response.form
        console.log('✅ [Editor] Loaded from database:', {
          id: savedForm.id,
          title: savedForm.title,
          questionsCount: savedForm.questions?.length || 0,
          questions: savedForm.questions?.map((q: any) => ({ id: q.id, title: q.title })) || []
        })
      }
    } catch (error) {
      console.error('⚠️ [Editor] DB fetch failed, fallback to localStorage:', error)
    }

    // 如果資料庫載入失敗，才從 localStorage 載入
    if (!savedForm) {
      console.log('🔍 [Editor] Trying localStorage fallback...')
      const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      savedForm = savedForms.find((f: any) => f.id === route.params.id)
      if (savedForm) {
        console.log('✅ [Editor] Loaded from localStorage:', {
          id: savedForm.id,
          title: savedForm.title,
          questionsCount: savedForm.questions?.length || 0,
          questions: savedForm.questions?.map((q: any) => ({ id: q.id, title: q.title })) || []
        })
      }
    }

    if (savedForm) {
      Object.assign(form, savedForm)

      // 向後相容與預設值
      if (typeof form.autoAdvance === 'undefined') form.autoAdvance = true
      if (typeof form.autoAdvanceDelay === 'undefined') form.autoAdvanceDelay = 300
      if (typeof form.showProgress === 'undefined') form.showProgress = true
      if (typeof form.allowGoBack === 'undefined') form.allowGoBack = true

      // 🔥 修復：信任資料庫的 questions 欄位作為真實資料來源
      // markdown 只用於編輯器顯示，不應該覆蓋資料庫的正確資料
      if (savedForm.markdownContent && typeof savedForm.markdownContent === 'string') {
        markdownContent.value = savedForm.markdownContent

        // 驗證 markdown 是否與 questions 一致
        const parsed = parseMarkdownToForm(markdownContent.value)
        if (parsed.questions.length !== form.questions.length) {
          console.warn('⚠️ [Editor] Markdown and questions mismatch!')
          console.warn('⚠️ [Editor] DB questions:', form.questions.length, 'Markdown parsed:', parsed.questions.length)
          console.warn('⚠️ [Editor] Regenerating markdown from database questions...')
          // 從資料庫的 questions 重新生成 markdown
          markdownContent.value = generateMarkdownFromForm(form)
        }

        // 只更新 title 和 description（如果 markdown 有提供且有效）
        if (parsed.title && parsed.title !== '未命名問卷') {
          form.title = parsed.title
        }
        if (typeof parsed.description === 'string' && parsed.description.trim().length > 0) {
          form.description = parsed.description
        }

        console.log('✅ [Editor] Keeping database questions (', form.questions.length, 'questions) as source of truth')
      } else {
        // 若沒有存 markdownContent，則用現有表單生成一次，並填入 markdownContent
        console.log('📝 [Editor] No markdown found, generating from questions...')
        markdownContent.value = generateMarkdownFromForm(form)
      }

      // 🔥 記錄初始題目數量
      initialQuestionsCount = form.questions.length
      console.log('📊 [Editor] Initial questions count:', initialQuestionsCount)

      // 🔥 立即同步到 localStorage 確保一致性
      console.log('🔄 [Editor] Syncing loaded data to localStorage for consistency')
      const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      const existingIndex = savedForms.findIndex((f: any) => f.id === form.id)
      const now = new Date().toISOString()

      const toSync = {
        id: form.id,
        title: form.title,
        description: form.description,
        questions: JSON.parse(JSON.stringify(form.questions)),
        displayMode: form.displayMode,
        autoAdvance: form.autoAdvance,
        autoAdvanceDelay: form.autoAdvanceDelay,
        showProgress: form.showProgress,
        allowGoBack: form.allowGoBack,
        markdownContent: markdownContent.value,
        createdAt: savedForm.createdAt || now,
        updatedAt: savedForm.updatedAt || now
      }

      if (existingIndex !== -1) {
        savedForms[existingIndex] = toSync
      } else {
        savedForms.push(toSync)
      }

      localStorage.setItem('qter_forms', JSON.stringify(savedForms))
      console.log('✅ [Editor] Data synced to localStorage with', toSync.questions.length, 'questions')

      // 標記為已同步（因為剛從 DB 載入）
      syncStatus.value = 'synced'

      // 🔥 資料載入完成，啟用自動保存
      console.log('✅ [Editor] Data loaded, enabling auto-save')
      isDataLoaded.value = true
      isFirstSaveAfterLoad = true // 重置第一次保存標記
    } else {
      console.error('❌ [Editor] Form not found in localStorage:', route.params.id)
      console.log('🆕 [Editor] Creating new form with ID:', route.params.id)

      // 🔥 創建新問卷並立即保存到 localStorage
      form.id = route.params.id as string
      form.title = '未命名問卷'
      form.description = ''
      form.questions = []

      // 立即保存到 localStorage
      const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      const now = new Date().toISOString()
      savedForms.push({
        id: form.id,
        title: form.title,
        description: form.description,
        questions: form.questions,
        displayMode: form.displayMode,
        autoAdvance: form.autoAdvance,
        autoAdvanceDelay: form.autoAdvanceDelay,
        showProgress: form.showProgress,
        allowGoBack: form.allowGoBack,
        markdownContent: markdownContent.value,
        createdAt: now,
        updatedAt: now,
      })
      localStorage.setItem('qter_forms', JSON.stringify(savedForms))
      console.log('✅ [Editor] New form saved to localStorage with timestamps')

      syncStatus.value = 'local'
      isDataLoaded.value = true
    }
  } else {
    // 新問卷（ID 是 'new'），創建並保存
    console.log('🆕 [Editor] Creating new form (ID=new)')
    const newId = generateHash()
    form.id = newId
    router.replace(`/editor/${newId}`)

    // 保存到 localStorage
    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const now = new Date().toISOString()
    savedForms.push({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: form.questions,
      displayMode: form.displayMode,
      autoAdvance: form.autoAdvance,
      autoAdvanceDelay: form.autoAdvanceDelay,
      showProgress: form.showProgress,
      allowGoBack: form.allowGoBack,
      markdownContent: markdownContent.value,
      createdAt: now,
      updatedAt: now,
    })
    localStorage.setItem('qter_forms', JSON.stringify(savedForms))
    console.log('✅ [Editor] New form created and saved with timestamps:', form.id)

    syncStatus.value = 'local'
    isDataLoaded.value = true
  }
})

// 題目類型圖示
const getQuestionIcon = (type: QuestionType) => {
  switch (type) {
    case 'text': return '📝'
    case 'textarea': return '📄'
    case 'radio': return '⭕'
    case 'checkbox': return '☑️'
    case 'rating': return '⭐'
    case 'range': return '🎚️'
    case 'date': return '📅'
    case 'file': return '📎'
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
    case 'rating': return '星等評分'
    case 'range': return '滑動條'
    case 'date': return '日期'
    case 'file': return '檔案上傳'
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
            <!-- 同步狀態指示器 -->
            <div class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" :class="{
              'bg-green-100 text-green-700': syncStatus === 'synced',
              'bg-blue-100 text-blue-700': syncStatus === 'syncing',
              'bg-yellow-100 text-yellow-700': syncStatus === 'local',
              'bg-red-100 text-red-700': syncStatus === 'error'
            }">
              <svg v-if="syncStatus === 'synced'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="syncStatus === 'syncing'" class="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
              </svg>
              <svg v-else-if="syncStatus === 'local'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
              <span>{{
                syncStatus === 'synced' ? '已同步' :
                syncStatus === 'syncing' ? '同步中' :
                syncStatus === 'local' ? '本地模式' :
                '同步失敗'
              }}</span>
            </div>

            <!-- 編輯器模式切換 -->
            <button
              @click="toggleEditorMode"
              :class="[
                'px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
                editorMode === 'visual'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              ]"
            >
              <svg v-if="editorMode === 'visual'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              {{ editorMode === 'visual' ? 'Markdown' : '視覺編輯' }}
            </button>

            <button
              @click="saveForm"
              class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              儲存
            </button>
            <!-- 重置快取：從頂部工具列移除，避免誤觸。若需使用可在程式內呼叫 resetToDefaultSurvey()。 -->
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
              <div
                v-for="question in parseMarkdownToForm(markdownContent).questions"
                :key="question.id"
                class="border border-gray-200 rounded-lg p-4"
                :class="question.className"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span>{{ getQuestionIcon(question.type) }}</span>
                  <span class="font-medium" v-html="sanitizeHTMLFragment(question.title)"></span>
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

      <!-- 問卷設定 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚙️</span>
          <span>問卷設定</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 自動跳到下一題 -->
          <div>
            <label class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>⏩</span>
                <span class="text-sm font-medium text-gray-700">自動跳到下一題</span>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                :checked="form.autoAdvance !== false"
                @change="form.autoAdvance = ($event.target as HTMLInputElement).checked"
              />
            </label>
            <p class="text-xs text-gray-500 mt-1">選擇單選/評分後是否自動前往下一題</p>
          </div>

          <!-- 顯示進度條 -->
          <div>
            <label class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>📊</span>
                <span class="text-sm font-medium text-gray-700">顯示進度條</span>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                :checked="form.showProgress !== false"
                @change="form.showProgress = ($event.target as HTMLInputElement).checked"
              />
            </label>
            <p class="text-xs text-gray-500 mt-1">在填寫頁面頂部顯示進度</p>
          </div>

          <!-- 延遲時間（僅在自動跳題開啟時顯示） -->
          <div class="md:col-span-2" v-if="form.autoAdvance !== false">
            <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>⏱️</span>
              <span>自動跳題延遲（毫秒）</span>
              <span class="ml-2 text-xs text-gray-500">{{ form.autoAdvanceDelay ?? 300 }} ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              :value="form.autoAdvanceDelay ?? 300"
              @input="form.autoAdvanceDelay = parseInt(($event.target as HTMLInputElement).value)"
              class="w-full accent-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">設定自動跳題前的延遲時間（100-1000ms）</p>
          </div>

          <!-- 允許回到上一題 -->
          <div>
            <label class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span>↩️</span>
                <span class="text-sm font-medium text-gray-700">允許回到上一題</span>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                :checked="form.allowGoBack !== false"
                @change="form.allowGoBack = ($event.target as HTMLInputElement).checked"
              />
            </label>
            <p class="text-xs text-gray-500 mt-1">是否允許填寫者返回上一題</p>
          </div>
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