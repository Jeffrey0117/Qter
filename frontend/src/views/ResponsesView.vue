<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 類型定義
interface Form {
  id: string
  title: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  type: string
  title: string
  description?: string
  required: boolean
  options?: Option[]
}

interface Option {
  id: string
  text: string
}

interface Response {
  id: string
  formId: string
  responses: Record<string, string | string[]>
  submittedAt: string
}

// 資料
const form = ref<Form | null>(null)
const responses = ref<Response[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const selectedResponse = ref<Response | null>(null)
const showDetailModal = ref(false)

// 計算屬性
const filteredResponses = computed(() => {
  if (!searchQuery.value) return responses.value
  
  return responses.value.filter(response => {
    const searchLower = searchQuery.value.toLowerCase()
    // 搜尋回應內容
    return Object.values(response.responses).some(answer => {
      if (typeof answer === 'string') {
        return answer.toLowerCase().includes(searchLower)
      }
      if (Array.isArray(answer)) {
        return answer.some(a => a.toLowerCase().includes(searchLower))
      }
      return false
    })
  })
})

const paginatedResponses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredResponses.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredResponses.value.length / itemsPerPage)
})

const statistics = computed(() => {
  if (!form.value || responses.value.length === 0) return null
  
  const stats: Record<string, any> = {}
  
  form.value.questions.forEach(question => {
    if (question.type === 'divider') return
    
    stats[question.id] = {
      title: question.title,
      type: question.type,
      answers: {}
    }
    
    if (question.type === 'radio' || question.type === 'checkbox') {
      // 統計選項
      question.options?.forEach(option => {
        stats[question.id].answers[option.id] = {
          text: option.text,
          count: 0,
          percentage: 0
        }
      })
      
      responses.value.forEach(response => {
        const answer = response.responses[question.id]
        if (question.type === 'radio' && typeof answer === 'string') {
          if (stats[question.id].answers[answer]) {
            stats[question.id].answers[answer].count++
          }
        } else if (question.type === 'checkbox' && Array.isArray(answer)) {
          answer.forEach(optionId => {
            if (stats[question.id].answers[optionId]) {
              stats[question.id].answers[optionId].count++
            }
          })
        }
      })
      
      // 計算百分比
      Object.keys(stats[question.id].answers).forEach(optionId => {
        const count = stats[question.id].answers[optionId].count
        stats[question.id].answers[optionId].percentage = 
          Math.round((count / responses.value.length) * 100)
      })
    } else {
      // 文字類題目，收集所有回答
      stats[question.id].answers = responses.value
        .map(r => r.responses[question.id])
        .filter(Boolean)
    }
  })
  
  return stats
})

// 載入資料
onMounted(() => {
  const formId = route.params.id
  if (formId) {
    // 載入表單
    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const savedForm = savedForms.find((f: any) => f.id === formId)
    if (savedForm) {
      form.value = savedForm
      
      // 載入回應
      const allResponses = JSON.parse(localStorage.getItem('qter_all_responses') || '{}')
      if (allResponses[formId as string]) {
        responses.value = allResponses[formId as string]
      }
    } else {
      alert('找不到問卷')
      router.push('/')
    }
  }
})

// 查看詳情
const viewDetail = (response: Response) => {
  selectedResponse.value = response
  showDetailModal.value = true
}

// 關閉詳情
const closeDetail = () => {
  selectedResponse.value = null
  showDetailModal.value = false
}

// 匯出 CSV
const exportToCSV = () => {
  if (!form.value || responses.value.length === 0) {
    alert('沒有資料可匯出')
    return
  }
  
  // 建立 CSV 標頭
  const headers = ['提交時間']
  form.value.questions.forEach(question => {
    if (question.type !== 'divider') {
      headers.push(question.title)
    }
  })
  
  // 建立 CSV 內容
  const rows = responses.value.map(response => {
    const row = [new Date(response.submittedAt).toLocaleString('zh-TW')]
    form.value!.questions.forEach(question => {
      if (question.type !== 'divider') {
        const answer = response.responses[question.id]
        if (Array.isArray(answer)) {
          row.push(answer.join(', '))
        } else {
          row.push(answer || '')
        }
      }
    })
    return row
  })
  
  // 轉換為 CSV 格式
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  // 下載檔案
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${form.value.title}_回應_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// 格式化答案
const formatAnswer = (questionId: string, answer: string | string[]) => {
  if (!form.value) return ''
  const question = form.value.questions.find(q => q.id === questionId)
  if (!question) return ''
  
  if (question.type === 'radio' && question.options) {
    const option = question.options.find(o => o.id === answer)
    return option?.text || answer
  }
  
  if (question.type === 'checkbox' && Array.isArray(answer) && question.options) {
    return answer.map(optId => {
      const option = question.options?.find(o => o.id === optId)
      return option?.text || optId
    }).join(', ')
  }
  
  return answer
}

// 返回
const goBack = () => {
  router.push('/')
}

// 分頁
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部導航 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <button
              @click="goBack"
              class="text-gray-600 hover:text-gray-900"
            >
              ← 返回
            </button>
            <div v-if="form">
              <h1 class="text-lg font-semibold text-gray-800">{{ form.title }} - 回應</h1>
              <p class="text-sm text-gray-600">共 {{ responses.length }} 份回應</p>
            </div>
          </div>
          <button
            @click="exportToCSV"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <span>📥</span>
            <span>匯出 CSV</span>
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 統計概覽 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">統計概覽</h2>
        
        <div v-if="statistics && form" class="space-y-6">
          <div v-for="(stat, questionId) in statistics" :key="questionId as string">
            <h3 class="font-medium text-gray-900 mb-2">{{ stat.title }}</h3>
            
            <!-- 選擇題統計 -->
            <div v-if="stat.type === 'radio' || stat.type === 'checkbox'" class="space-y-2">
              <div v-for="(answer, optionId) in (stat.answers as Record<string, any>)" :key="optionId as string">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ answer.text }}</span>
                  <span class="text-sm font-medium">{{ answer.count }} ({{ answer.percentage }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all"
                    :style="`width: ${answer.percentage}%`"
                  />
                </div>
              </div>
            </div>
            
            <!-- 文字題預覽 -->
            <div v-else class="text-sm text-gray-600">
              共 {{ stat.answers.length }} 個回應
            </div>
          </div>
        </div>
        
        <div v-else class="text-center text-gray-500 py-8">
          暫無回應資料
        </div>
      </div>

      <!-- 回應列表 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="p-4 border-b">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋回應內容..."
            class="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <!-- 回應表格 -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交時間
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  回應摘要
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="response in paginatedResponses" :key="response.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ new Date(response.submittedAt).toLocaleString('zh-TW') }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div class="max-w-md truncate">
                    {{ Object.values(response.responses).slice(0, 2).join(', ') || '無內容' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    @click="viewDetail(response)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    查看詳情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              顯示第 {{ (currentPage - 1) * itemsPerPage + 1 }} 到 
              {{ Math.min(currentPage * itemsPerPage, filteredResponses.length) }} 筆，
              共 {{ filteredResponses.length }} 筆
            </div>
            <div class="flex gap-2">
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              <button
                v-for="page in Math.min(5, totalPages)"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 text-sm border rounded',
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 詳情彈窗 -->
    <div
      v-if="showDetailModal && selectedResponse && form"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 class="text-lg font-semibold">回應詳情</h2>
          <button
            @click="closeDetail"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div class="px-6 py-4">
          <div class="mb-4">
            <span class="text-sm text-gray-500">提交時間：</span>
            <span class="text-sm text-gray-900">
              {{ new Date(selectedResponse.submittedAt).toLocaleString('zh-TW') }}
            </span>
          </div>
          
          <div class="space-y-4">
            <div v-for="question in form.questions" :key="question.id">
              <div v-if="question.type !== 'divider'">
                <div class="font-medium text-gray-900 mb-1">{{ question.title }}</div>
                <div class="text-gray-600">
                  {{ formatAnswer(question.id, selectedResponse.responses[question.id]) || '(未填寫)' }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t">
          <button
            @click="closeDetail"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>