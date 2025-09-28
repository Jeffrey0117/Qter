<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, type ComponentPublicInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { buildAndApplyMarkdown, sanitizeHTMLFragment } from '@/services/markdown'
import { api } from '@/services/api'

// 題目類型定義（與 FillView.vue 對齊）
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
  // displayMode 由呼叫端決定是否載入此頁，此處不強制需要
  displayMode?: 'step-by-step' | 'all-at-once'
}

const router = useRouter()
const route = useRoute()

// 狀態
const form = ref<Form | null>(null)
const responses = reactive<Map<string, string | string[]>>(new Map())
const errors = reactive<Map<string, string>>(new Map())
const isSubmitting = ref(false)
const isSubmitted = ref(false)

// 題目 DOM 參考，便於滾動定位
const questionRefs = reactive(new Map<string, HTMLElement | null>())

// 進度：以「已填題數 / 可作答題數(排除 divider)」計算
const totalAnswerable = computed(() => {
  if (!form.value) return 0
  return form.value.questions.filter(q => q.type !== 'divider').length
})
const answeredCount = computed(() => {
  if (!form.value) return 0
  let count = 0
  for (const q of form.value.questions) {
    if (q.type === 'divider') continue
    const v = responses.get(q.id)
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      if (v.length > 0) count++
    } else if (String(v).trim().length > 0) {
      count++
    }
  }
  return count
})
const progressPercent = computed(() => {
  if (totalAnswerable.value === 0) return 0
  return Math.round((answeredCount.value / totalAnswerable.value) * 100)
})

// 載入表單與草稿
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

      // 載入暫存
      const savedResponses = localStorage.getItem(`qter_response_${savedForm.id}`)
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

// 暫存
const saveProgress = () => {
  if (!form.value) return
  const responseObj: Record<string, string | string[]> = {}
  responses.forEach((value, key) => {
    responseObj[key] = value
  })
  localStorage.setItem(`qter_response_${form.value.id}`, JSON.stringify(responseObj))
}

// 驗證所有題目（提交時）
const validateAll = () => {
  errors.clear()
  if (!form.value) return true
  for (const q of form.value.questions) {
    if (q.type === 'divider') continue
    const v = responses.get(q.id)
    if (q.required) {
      if (q.type === 'checkbox') {
        const arr = Array.isArray(v) ? v : []
        if (arr.length === 0) {
          errors.set(q.id, '請至少選擇一個選項')
        }
      } else {
        const s = Array.isArray(v) ? v.join(',') : (v ?? '')
        if (!s || String(s).trim().length === 0) {
          errors.set(q.id, '此題為必填')
        }
      }
    }
  }
  return errors.size === 0
}

const scrollToFirstError = async () => {
  await nextTick()
  if (errors.size === 0) return
  const firstErrorId = Array.from(errors.keys())[0]
  const el = questionRefs.get(firstErrorId)
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 事件處理
const handleRadioChange = (qid: string, optionId: string) => {
  responses.set(qid, optionId)
  errors.delete(qid)
  saveProgress()
}
const handleCheckboxChange = (qid: string, optionId: string, checked: boolean) => {
  const current = (responses.get(qid) as string[]) || []
  if (checked) {
    responses.set(qid, Array.from(new Set([...current, optionId])))
  } else {
    responses.set(qid, current.filter(id => id !== optionId))
  }
  errors.delete(qid)
  saveProgress()
}
const handleTextInput = (qid: string, value: string) => {
  responses.set(qid, value)
  if (value) errors.delete(qid)
  saveProgress()
}
const handleRatingChange = (qid: string, rating: number) => {
  responses.set(qid, rating.toString())
  errors.delete(qid)
  saveProgress()
}
const handleDateInput = (qid: string, value: string) => {
  responses.set(qid, value)
  if (value) errors.delete(qid)
  saveProgress()
}
const handleFileUpload = (qid: string, file: File) => {
  // 簡化示例：只存檔名
  responses.set(qid, file.name)
  errors.delete(qid)
  saveProgress()
}

// 提交
const submitForm = async () => {
  if (!form.value) return
  isSubmitting.value = true

  const ok = validateAll()
  if (!ok) {
    isSubmitting.value = false
    await scrollToFirstError()
    return
  }

  // 若為公開分享鏈路填寫，提交到 Workers API
  try {
    const shareHash = (route.query?.s as string) || ''
    if (shareHash) {
      await api.public.submitByHash(shareHash, {
        responses: Object.fromEntries(responses),
      })
      // 清除暫存
      localStorage.removeItem(`qter_response_${form.value.id}`)
      setTimeout(() => {
        isSubmitting.value = false
        isSubmitted.value = true
      }, 400)
      return
    }
  } catch (e) {
    console.error(e)
    alert('提交失敗，請稍後再試')
    isSubmitting.value = false
    return
  }
  
  // 寫入回應
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

  // 清除暫存
  localStorage.removeItem(`qter_response_${form.value.id}`)

  setTimeout(() => {
    isSubmitting.value = false
    isSubmitted.value = true
  }, 400)
}

// 返回
const goHome = () => router.push('/')

// 工具：設定題目容器 ref
const setQuestionRef = (qid: string) => (el: Element | ComponentPublicInstance | null) => {
  if (el && 'nodeType' in el && el instanceof HTMLElement) {
    questionRefs.set(qid, el)
  } else {
    questionRefs.set(qid, null)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div v-if="isSubmitted" class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">感謝您的回應！</h2>
        <p class="text-gray-600 mb-6">您的答案已成功提交</p>
        <div class="space-y-3">
          <button @click="goHome" class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            返回首頁
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="form" class="min-h-screen flex flex-col">
      <div class="bg-white shadow-sm">
        <div class="max-w-4xl mx-auto px-4 py-4">
          <div class="flex items-center justify-between mb-2">
            <button @click="goHome" class="text-gray-600 hover:text-gray-900">← 返回</button>
            <span class="text-sm text-gray-600">完成度：{{ progressPercent }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" :style="`width: ${progressPercent}%`" />
          </div>
        </div>
      </div>

      <main class="flex-1 p-4">
        <div class="w-full max-w-4xl mx-auto">
          <div class="mb-6 text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-2" v-html="sanitizeHTMLFragment(form.title)"></h1>
            <p v-if="form.description" class="text-gray-600" v-html="sanitizeHTMLFragment(form.description)"></p>
          </div>

          <div class="space-y-6">
            <div
              v-for="q in form.questions"
              :key="q.id"
              v-show="q.type !== 'divider'"
              class="bg-white rounded-2xl shadow-lg p-6"
              :class="q.className"
              :ref="setQuestionRef(q.id)"
            >
              <h2 class="text-lg font-semibold text-gray-900 mb-2">
                <span v-html="sanitizeHTMLFragment(q.title)"></span>
                <span v-if="q.required" class="text-red-500 ml-1">*</span>
              </h2>
              <p v-if="q.description" class="text-gray-600 mb-4" v-html="sanitizeHTMLFragment(q.description)"></p>

              <!-- 單行文字 -->
              <div v-if="q.type === 'text'" class="space-y-2">
                <input
                  :value="responses.get(q.id) || ''"
                  @input="handleTextInput(q.id, ($event.target as HTMLInputElement).value)"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="您的答案"
                />
              </div>

              <!-- 多行文字 -->
              <div v-else-if="q.type === 'textarea'" class="space-y-2">
                <textarea
                  :value="responses.get(q.id) || ''"
                  @input="handleTextInput(q.id, ($event.target as HTMLTextAreaElement).value)"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="您的答案"
                />
              </div>

              <!-- 單選 -->
              <div v-else-if="q.type === 'radio'" class="space-y-3">
                <label
                  v-for="opt in q.options"
                  :key="opt.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{ 'border-blue-500 bg-blue-50': responses.get(q.id) === opt.id }"
                >
                  <input
                    type="radio"
                    :name="`question_${q.id}`"
                    :checked="responses.get(q.id) === opt.id"
                    @change="handleRadioChange(q.id, opt.id)"
                    class="mr-3 text-blue-500"
                  />
                  <span class="text-gray-700">{{ opt.text }}</span>
                </label>
              </div>

              <!-- 多選 -->
              <div v-else-if="q.type === 'checkbox'" class="space-y-3">
                <label
                  v-for="opt in q.options"
                  :key="opt.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{ 'border-blue-500 bg-blue-50': (responses.get(q.id) as string[] || []).includes(opt.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="(responses.get(q.id) as string[] || []).includes(opt.id)"
                    @change="handleCheckboxChange(q.id, opt.id, ($event.target as HTMLInputElement).checked)"
                    class="mr-3 text-blue-500"
                  />
                  <span class="text-gray-700">{{ opt.text }}</span>
                </label>
              </div>

              <!-- 評分 -->
              <div v-else-if="q.type === 'rating'" class="space-y-2">
                <div class="flex gap-2">
                  <button
                    v-for="i in 5"
                    :key="i"
                    @click="handleRatingChange(q.id, i)"
                    class="text-3xl transition-colors"
                    :class="{
                      'text-yellow-400': (parseInt(responses.get(q.id) as string || '0') >= i),
                      'text-gray-300': (parseInt(responses.get(q.id) as string || '0') < i)
                    }"
                  >
                    ⭐
                  </button>
                </div>
                <p v-if="responses.get(q.id)" class="text-sm text-gray-600">
                  您的評分：{{ responses.get(q.id) }} 星
                </p>
              </div>

              <!-- 日期 -->
              <div v-else-if="q.type === 'date'" class="space-y-2">
                <input
                  :value="responses.get(q.id) || ''"
                  @input="handleDateInput(q.id, ($event.target as HTMLInputElement).value)"
                  type="date"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- 滑動條 -->
              <div v-else-if="q.type === 'range'" class="space-y-2">
                <div class="flex items-center justify-between text-sm text-gray-600">
                  <span>0</span>
                  <span>{{ responses.get(q.id) || 50 }}</span>
                  <span>100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  :value="(responses.get(q.id) as string) || '50'"
                  @input="handleTextInput(q.id, ($event.target as HTMLInputElement).value)"
                  class="w-full accent-blue-500"
                />
              </div>

              <!-- 檔案 -->
              <div v-else-if="q.type === 'file'" class="space-y-2">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    :id="`file_${q.id}`"
                    @change="(e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files && files[0]) handleFileUpload(q.id, files[0])
                    }"
                    class="hidden"
                  />
                  <label :for="`file_${q.id}`" class="cursor-pointer">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-gray-600 mb-2">
                      {{ responses.get(q.id) ? `已選擇：${responses.get(q.id)}` : '點擊上傳檔案' }}
                    </p>
                    <p class="text-sm text-gray-500">支援常見檔案格式</p>
                  </label>
                </div>
              </div>

              <div v-if="errors.has(q.id)" class="mt-3 text-red-500 text-sm">
                {{ errors.get(q.id) }}
              </div>
            </div>

            <!-- 分隔線型題目 -->
            <div
              v-for="q in form.questions"
              v-show="q.type === 'divider'"
              :key="q.id + '_divider'"
              class="py-2"
            >
              <hr class="border-t-2 border-gray-300" />
            </div>
          </div>

          <div class="mt-8 flex items-center justify-end gap-3">
            <button
              @click="submitForm"
              :disabled="isSubmitting"
              class="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 shadow-md transition-all disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '提交' }}
            </button>
          </div>
        </div>
      </main>
    </div>

    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">載入問卷中...</p>
      </div>
    </div>
  </div>
</template>