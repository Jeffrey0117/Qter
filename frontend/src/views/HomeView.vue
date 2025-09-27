<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 範例問卷資料
const forms = ref([
  {
    id: '1',
    title: '客戶滿意度調查',
    description: '感謝您抽出寶貴時間填寫這份問卷，您的意見對我們非常重要',
    responseCount: 0,
    createdAt: new Date('2025-09-26'),
    status: 'active',
    questions: [
      {
        id: 'name',
        type: 'text',
        title: '請問您的姓名是？',
        description: '請提供您的真實姓名以便我們後續聯繫',
        required: true
      },
      {
        id: 'satisfaction-overall',
        type: 'radio',
        title: '整體來說，您對我們的服務滿意嗎？',
        description: '請根據您的整體體驗進行評分',
        required: true,
        options: [
          { id: 'very-satisfied', text: '非常滿意' },
          { id: 'satisfied', text: '滿意' },
          { id: 'neutral', text: '普通' },
          { id: 'dissatisfied', text: '不滿意' },
          { id: 'very-dissatisfied', text: '非常不滿意' }
        ]
      },
      {
        id: 'service-quality',
        type: 'checkbox',
        title: '您認為我們在以下哪些方面表現良好？',
        description: '可複選多項',
        required: true,
        options: [
          { id: 'attitude', text: '服務態度佳' },
          { id: 'speed', text: '回應速度快' },
          { id: 'professional', text: '專業能力強' },
          { id: 'price', text: '價格合理' },
          { id: 'other', text: '其他' }
        ]
      },
      {
        id: 'recommendation',
        type: 'radio',
        title: '您會推薦我們的服務給其他人嗎？',
        description: '請選擇您的推薦意願',
        required: true,
        options: [
          { id: 'yes', text: '會推薦' },
          { id: 'no', text: '不會推薦' }
        ]
      },
      {
        id: 'suggestions',
        type: 'textarea',
        title: '請提供您的改善建議',
        description: '我們很重視您的意見，請告訴我們可以如何改善',
        required: false
      },
      {
        id: 'contact',
        type: 'text',
        title: '聯絡方式（選填）',
        description: '如您願意，請留下電話或email，我們可能會進一步聯繫',
        required: false
      }
    ]
  },
  {
    id: '2',
    title: '年度員工調查問卷',
    description: '收集員工對公司文化與福利的意見',
    responseCount: 128,
    createdAt: new Date('2025-09-15'),
    status: 'active',
    questions: [
      {
        id: 'department',
        type: 'text',
        title: '您所屬的部門',
        required: true
      },
      {
        id: 'satisfaction',
        type: 'rating',
        title: '對公司整體滿意度',
        required: true
      }
    ]
  },
  {
    id: '3',
    title: '產品回饋表單',
    description: '收集用戶對新產品的使用體驗',
    responseCount: 15,
    createdAt: new Date('2025-09-10'),
    status: 'draft',
    questions: [
      {
        id: 'product-usage',
        type: 'radio',
        title: '您使用此產品多久了？',
        required: true,
        options: [
          { id: '1week', text: '少於一週' },
          { id: '1month', text: '1個月' },
          { id: '3months', text: '3個月以上' }
        ]
      }
    ]
  }
])

const searchQuery = ref('')

const filteredForms = computed(() => {
  if (!searchQuery.value) return forms.value
  return forms.value.filter(form =>
    form.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    form.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(date)
}

const createNewForm = () => {
  router.push('/editor/new')
}

// 儲存問卷資料到 localStorage
const saveFormsToStorage = () => {
  localStorage.setItem('qter_forms', JSON.stringify(forms.value))
}

// 頁面載入時儲存問卷資料
onMounted(() => {
  saveFormsToStorage()
})

const openForm = (id: string) => {
  router.push(`/editor/${id}`)
}

const viewResponses = (id: string) => {
  router.push(`/responses/${id}`)
}

const fillForm = (id: string) => {
  saveFormsToStorage() // 確保資料已儲存
  router.push(`/fill/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部導航 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-800">📝 QTER 輕巧問卷系統</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">歡迎回來</span>
            <button class="text-sm text-gray-600 hover:text-gray-900">登出</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容 -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 操作區 -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">我的問卷</h2>
            <p class="mt-1 text-sm text-gray-600">管理和查看您的所有問卷表單</p>
          </div>
          <button
            @click="createNewForm"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>建立新問卷</span>
          </button>
        </div>

        <!-- 搜尋欄 -->
        <div class="mt-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋問卷..."
            class="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- 問卷列表 -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="form in filteredForms"
          :key="form.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
        >
          <!-- 問卷狀態標籤 -->
          <div class="flex justify-between items-start mb-3">
            <span
              :class="[
                'px-2 py-1 text-xs rounded-full',
                form.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ form.status === 'active' ? '進行中' : '草稿' }}
            </span>
            <button class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>

          <!-- 問卷標題和描述 -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ form.title }}</h3>
          <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ form.description }}</p>

          <!-- 統計資訊 -->
          <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>📊 {{ form.responseCount }} 份回應</span>
            <span>{{ formatDate(form.createdAt) }}</span>
          </div>

          <!-- 操作按鈕 -->
          <div class="flex gap-2">
            <button
              @click="openForm(form.id)"
              class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              編輯
            </button>
            <button
              @click="fillForm(form.id)"
              class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              填寫
            </button>
            <button
              @click="viewResponses(form.id)"
              class="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              查看
            </button>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-if="filteredForms.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery ? '找不到符合的問卷' : '還沒有問卷' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ searchQuery ? '試試其他關鍵字' : '建立您的第一份問卷開始收集回應' }}
        </p>
        <button
          v-if="!searchQuery"
          @click="createNewForm"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          建立新問卷
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>