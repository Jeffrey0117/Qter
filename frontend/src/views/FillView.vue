<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { buildAndApplyMarkdown, sanitizeHTMLFragment } from '@/services/markdown'

const router = useRouter()
const route = useRoute()

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
  featured?: boolean
  theme?: {
    background?: string
    titleColor?: string
  }
}

interface Response {
  questionId: string
  answer: string | string[]
}

// 表單資料
const form = ref<Form | null>(null)
const responses = reactive<Map<string, string | string[]>>(new Map())
const currentQuestionIndex = ref(0)
const errors = reactive<Map<string, string>>(new Map())
const isSubmitting = ref(false)
const isSubmitted = ref(false)

// 計算屬性
const currentQuestion = computed(() => {
  if (!form.value) return null
  return form.value.questions[currentQuestionIndex.value]
})

const progress = computed(() => {
  if (!form.value || form.value.questions.length === 0) return 0
  return Math.round(((currentQuestionIndex.value + 1) / form.value.questions.length) * 100)
})

const isFirstQuestion = computed(() => currentQuestionIndex.value === 0)
const isLastQuestion = computed(() => {
  if (!form.value) return false
  return currentQuestionIndex.value === form.value.questions.length - 1
})

// 載入表單
onMounted(() => {
  const formId = route.params.id
  if (formId) {
    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const savedForm = savedForms.find((f: any) => f.id === formId)
    if (savedForm) {
      form.value = savedForm

      // 套用 Markdown 內宣告的樣式與字體（若有）
      if (typeof savedForm.markdownContent === 'string') {
        buildAndApplyMarkdown(savedForm.markdownContent, `qter-style-${savedForm.id}`, `form-${savedForm.id}`)
      }

      // 若為全頁模式，導向全頁填答路由
      if (savedForm.displayMode === 'all-at-once') {
        router.replace(`/fill/${savedForm.id}/all`)
        return
      }

      // 載入暫存的答案
      const savedResponses = localStorage.getItem(`qter_response_${formId}`)
      if (savedResponses) {
        const parsed = JSON.parse(savedResponses)
        Object.entries(parsed).forEach(([key, value]) => {
          responses.set(key, value as string | string[])
        })
      }
    } else {
      alert('找不到問卷')
      router.push('/')
    }
  }
})

// 驗證當前問題
const validateCurrentQuestion = () => {
  if (!currentQuestion.value) return true
  
  errors.clear()
  
  if (currentQuestion.value.type === 'divider') return true
  
  const response = responses.get(currentQuestion.value.id)
  
  if (currentQuestion.value.required && !response) {
    errors.set(currentQuestion.value.id, '此題為必填')
    return false
  }
  
  if (currentQuestion.value.type === 'checkbox' && currentQuestion.value.required) {
    if (!response || (Array.isArray(response) && response.length === 0)) {
      errors.set(currentQuestion.value.id, '請至少選擇一個選項')
      return false
    }
  }
  
  return true
}

// 儲存暫存答案
const saveProgress = () => {
  if (!form.value) return
  
  const responseObj: Record<string, string | string[]> = {}
  responses.forEach((value, key) => {
    responseObj[key] = value
  })
  
  localStorage.setItem(`qter_response_${form.value.id}`, JSON.stringify(responseObj))
}

// 下一題
const nextQuestion = () => {
  if (!validateCurrentQuestion()) return
  
  saveProgress()
  
  if (!isLastQuestion.value) {
    currentQuestionIndex.value++
  }
}

// 上一題
const previousQuestion = () => {
  if (!isFirstQuestion.value) {
    errors.clear()
    currentQuestionIndex.value--
  }
}

// 提交表單
const submitForm = async () => {
  if (!validateCurrentQuestion()) return
  if (!form.value) return
  
  isSubmitting.value = true
  saveProgress()
  
  // 驗證所有必填題目
  let hasError = false
  for (const question of form.value.questions) {
    if (question.type !== 'divider' && question.required) {
      const response = responses.get(question.id)
      if (!response || (Array.isArray(response) && response.length === 0)) {
        hasError = true
        break
      }
    }
  }
  
  if (hasError) {
    alert('請填寫所有必填題目')
    isSubmitting.value = false
    return
  }
  
  // 儲存回應到 localStorage
  const allResponses = JSON.parse(localStorage.getItem('qter_all_responses') || '{}')
  if (!allResponses[form.value.id]) {
    allResponses[form.value.id] = []
  }
  
  const responseData = {
    id: `res_${Date.now()}`,
    formId: form.value.id,
    responses: Object.fromEntries(responses),
    submittedAt: new Date().toISOString()
  }
  
  allResponses[form.value.id].push(responseData)
  localStorage.setItem('qter_all_responses', JSON.stringify(allResponses))
  
  // 清除暫存答案
  localStorage.removeItem(`qter_response_${form.value.id}`)
  
  setTimeout(() => {
    isSubmitting.value = false
    isSubmitted.value = true
  }, 500)
}

// 重新填寫
const resetForm = () => {
  responses.clear()
  errors.clear()
  currentQuestionIndex.value = 0
  isSubmitted.value = false
  if (form.value) {
    localStorage.removeItem(`qter_response_${form.value.id}`)
  }
}

// 返回首頁
const goHome = () => {
  router.push('/')
}

// 處理單選題
const handleRadioChange = (questionId: string, optionId: string) => {
  responses.set(questionId, optionId)
  errors.delete(questionId)
  // 單選題選擇後自動跳下一題
  setTimeout(() => {
    nextQuestion()
  }, 300)
}

// 處理多選題
const handleCheckboxChange = (questionId: string, optionId: string, checked: boolean) => {
  const current = responses.get(questionId) as string[] || []
  if (checked) {
    responses.set(questionId, [...current, optionId])
  } else {
    responses.set(questionId, current.filter(id => id !== optionId))
  }
  errors.delete(questionId)
}

// 處理文字輸入
const handleTextInput = (questionId: string, value: string) => {
  responses.set(questionId, value)
  if (value) {
    errors.delete(questionId)
  }
}

// 處理 Enter 鍵事件
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // 對於 textarea，Shift+Enter 換行，Enter 下一題
    if (currentQuestion.value?.type === 'textarea') {
      event.preventDefault()
      nextQuestion()
    } else if (currentQuestion.value?.type === 'text') {
      // 對於 text 輸入框，Enter 直接下一題
      event.preventDefault()
      nextQuestion()
    }
  }
}

// 處理評分
const handleRatingChange = (questionId: string, rating: number) => {
  responses.set(questionId, rating.toString())
  errors.delete(questionId)
  // 評分題選擇後自動跳下一題
  setTimeout(() => {
    nextQuestion()
  }, 300)
}

// 處理日期輸入
const handleDateInput = (questionId: string, value: string) => {
  responses.set(questionId, value)
  if (value) {
    errors.delete(questionId)
  }
}

// 處理檔案上傳
const handleFileUpload = (questionId: string, file: File) => {
  // 這裡先簡化處理，實際上應該上傳到服務器
  responses.set(questionId, file.name)
  errors.delete(questionId)
}
</script>

<template>
  <div
    :class="[
      'min-h-screen',
      form?.theme?.background ? '' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    ]"
    :style="form?.theme?.background ? { background: form.theme.background } : undefined"
  >
    <!-- 成功提交畫面 -->
    <div v-if="isSubmitted" class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">感謝您的回應！</h2>
        <p class="text-gray-600 mb-6">您的答案已成功提交</p>
        <div class="space-y-3">
          <button
            @click="resetForm"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新填寫
          </button>
          <button
            @click="goHome"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>

    <!-- 表單填寫界面 -->
    <div v-else-if="form" class="min-h-screen flex flex-col">
      <!-- 頂部進度條 -->
      <div class="bg-white shadow-sm">
        <div class="max-w-2xl mx-auto px-4 py-4 progress-boost">
          <div class="flex items-center justify-between mb-2">
            <button
              @click="goHome"
              class="text-gray-600 hover:text-gray-900"
            >
              ← 返回
            </button>
            <span class="text-sm text-gray-600">
              {{ currentQuestionIndex + 1 }} / {{ form.questions.length }}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="`width: ${progress}%`"
            />
          </div>
        </div>
      </div>

      <!-- 表單內容 -->
      <main class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-2xl">
          <!-- 表單標題（只在第一題顯示） -->
          <div v-if="currentQuestionIndex === 0" class="mb-8 text-center">
            <h1
              class="text-3xl font-bold mb-2 qtitle"
              :style="form?.theme?.titleColor ? { color: form.theme.titleColor } : undefined"
              :class="form?.theme?.titleColor ? '' : 'text-gray-900'"
              v-html="sanitizeHTMLFragment(form.title)"
            />
            <p v-if="form.description" class="text-gray-600" v-html="sanitizeHTMLFragment(form.description)"></p>
            <!-- 特色徽章（僅針對精選 2025 問卷展示） -->
            <div v-if="form?.id === 'featured-2025' || form?.featured" class="qter-badges">
              <span class="qter-badge">🚀 趨勢</span>
              <span class="qter-badge">🤖 GenAI</span>
              <span class="qter-badge">🧩 Low-code</span>
              <span class="qter-badge">🛡️ Security</span>
            </div>
          </div>

          <!-- 當前題目 -->
          <div v-if="currentQuestion" class="bg-white rounded-2xl shadow-lg p-8" :class="currentQuestion.className">
            <!-- 分隔線 -->
            <div v-if="currentQuestion.type === 'divider'" class="py-4">
              <hr class="border-t-2 border-gray-300" />
            </div>

            <!-- 一般題目 -->
            <div v-else>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">
                <span v-html="sanitizeHTMLFragment(currentQuestion.title)"></span>
                <span v-if="currentQuestion.required" class="text-red-500 ml-1">*</span>
              </h2>
              <p v-if="currentQuestion.description" class="text-gray-600 mb-6" v-html="sanitizeHTMLFragment(currentQuestion.description)"></p>

              <!-- 單行文字 -->
              <div v-if="currentQuestion.type === 'text'" class="space-y-2">
                <input
                  :value="responses.get(currentQuestion.id) || ''"
                  @input="handleTextInput(currentQuestion.id, ($event.target as HTMLInputElement).value)"
                  @keypress="handleKeyPress"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="您的答案（按 Enter 下一題）"
                />
              </div>

              <!-- 多行文字 -->
              <div v-else-if="currentQuestion.type === 'textarea'" class="space-y-2">
                <textarea
                  :value="responses.get(currentQuestion.id) || ''"
                  @input="handleTextInput(currentQuestion.id, ($event.target as HTMLTextAreaElement).value)"
                  @keypress="handleKeyPress"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="您的答案（Shift+Enter 換行，Enter 下一題）"
                />
              </div>

              <!-- 單選題 -->
              <div v-else-if="currentQuestion.type === 'radio'" class="space-y-3">
                <label
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'border-blue-500 bg-blue-50': responses.get(currentQuestion.id) === option.id
                  }"
                >
                  <input
                    type="radio"
                    :name="`question_${currentQuestion.id}`"
                    :checked="responses.get(currentQuestion.id) === option.id"
                    @change="handleRadioChange(currentQuestion.id, option.id)"
                    class="mr-3 text-blue-500"
                  />
                  <span class="text-gray-700">{{ option.text }}</span>
                </label>
              </div>

              <!-- 多選題 -->
              <div v-else-if="currentQuestion.type === 'checkbox'" class="space-y-3">
                <label
                  v-for="option in currentQuestion.options"
                  :key="option.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'border-blue-500 bg-blue-50': (responses.get(currentQuestion.id) as string[] || []).includes(option.id)
                  }"
                >
                  <input
                    type="checkbox"
                    :checked="(responses.get(currentQuestion.id) as string[] || []).includes(option.id)"
                    @change="handleCheckboxChange(currentQuestion.id, option.id, ($event.target as HTMLInputElement).checked)"
                    class="mr-3 text-blue-500"
                  />
                  <span class="text-gray-700">{{ option.text }}</span>
                </label>
              </div>

              <!-- 評分題 -->
              <div v-else-if="currentQuestion.type === 'rating'" class="space-y-2">
                <div class="flex gap-2 justify-center">
                  <button
                    v-for="i in 5"
                    :key="i"
                    @click="handleRatingChange(currentQuestion.id, i)"
                    class="text-3xl transition-colors"
                    :class="{
                      'text-yellow-400': (parseInt(responses.get(currentQuestion.id) || '0') >= i),
                      'text-gray-300': (parseInt(responses.get(currentQuestion.id) || '0') < i)
                    }"
                  >
                    ⭐
                  </button>
                </div>
                <p v-if="responses.get(currentQuestion.id)" class="text-center text-sm text-gray-600">
                  您的評分：{{ responses.get(currentQuestion.id) }} 星
                </p>
              </div>

              <!-- 日期題 -->
              <div v-else-if="currentQuestion.type === 'date'" class="space-y-2">
                <input
                  :value="responses.get(currentQuestion.id) || ''"
                  @input="handleDateInput(currentQuestion.id, ($event.target as HTMLInputElement).value)"
                  type="date"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- 滑動條題 -->
              <div v-else-if="currentQuestion.type === 'range'" class="space-y-2">
                <div class="flex items-center justify-between text-sm text-gray-600">
                  <span>0</span>
                  <span>{{ responses.get(currentQuestion.id) || 50 }}</span>
                  <span>100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  :value="(responses.get(currentQuestion.id) as string) || '50'"
                  @input="handleTextInput(currentQuestion.id, ($event.target as HTMLInputElement).value)"
                  class="w-full accent-blue-500"
                />
              </div>

              <!-- 檔案上傳 -->
              <div v-else-if="currentQuestion.type === 'file'" class="space-y-2">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    :id="`file_${currentQuestion.id}`"
                    @change="(e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files && files[0]) {
                        handleFileUpload(currentQuestion.id, files[0])
                      }
                    }"
                    class="hidden"
                  />
                  <label :for="`file_${currentQuestion.id}`" class="cursor-pointer">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-gray-600 mb-2">
                      {{ responses.get(currentQuestion.id) ? `已選擇：${responses.get(currentQuestion.id)}` : '點擊上傳檔案' }}
                    </p>
                    <p class="text-sm text-gray-500">支援常見檔案格式</p>
                  </label>
                </div>
              </div>

              <!-- 錯誤訊息 -->
              <div v-if="errors.has(currentQuestion.id)" class="mt-3 text-red-500 text-sm">
                {{ errors.get(currentQuestion.id) }}
              </div>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex justify-between mt-6">
            <button
              @click="previousQuestion"
              :disabled="isFirstQuestion"
              :class="[
                'px-6 py-3 rounded-lg font-medium transition-all',
                isFirstQuestion
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              ]"
            >
              上一題
            </button>

            <button
              v-if="!isLastQuestion"
              @click="nextQuestion"
              class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 shadow-md transition-all"
            >
              下一題
            </button>
            
            <button
              v-else
              @click="submitForm"
              :disabled="isSubmitting"
              class="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 shadow-md transition-all disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '提交' }}
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- 載入中 -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">載入問卷中...</p>
      </div>
    </div>
  </div>
</template>