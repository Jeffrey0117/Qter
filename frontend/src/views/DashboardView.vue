<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Toast 通知 -->
    <div
      v-if="showToast"
      class="fixed top-4 right-4 z-50 animate-slide-in"
    >
      <div class="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </div>

    <!-- 頂部導航欄 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- 左側 Logo -->
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-indigo-600">Qter</h1>
          </div>

          <!-- 右側用戶資訊 -->
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">{{ authStore.user?.name }}</span>

            <!-- 用戶頭像下拉選單 -->
            <div class="relative">
              <button
                @click="showDropdown = !showDropdown"
                class="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <img
                  v-if="authStore.user?.picture"
                  :src="authStore.user.picture"
                  :alt="authStore.user.name"
                  class="h-8 w-8 rounded-full"
                >
                <div v-else class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {{ authStore.userInitials }}
                </div>
              </button>

              <!-- 下拉選單 -->
              <div
                v-if="showDropdown"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
              >
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容區 -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- 歡迎訊息 -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">
          歡迎回來，{{ authStore.user?.name }}！
        </h2>
        <p class="mt-2 text-gray-600">管理您的問卷並查看數據分析</p>
      </div>

      <!-- 快速操作按鈕 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          @click="createNewForm"
          class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-6 transition-colors"
        >
          <svg class="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <h3 class="text-lg font-semibold">建立新問卷</h3>
          <p class="mt-1 text-sm opacity-90">開始設計您的問卷</p>
        </button>

        <div class="bg-white rounded-lg p-6 border border-gray-200">
          <svg class="w-8 h-8 mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-800">{{ forms.length }}</h3>
          <p class="mt-1 text-sm text-gray-600">已建立問卷</p>
        </div>

        <div class="bg-white rounded-lg p-6 border border-gray-200">
          <svg class="w-8 h-8 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-800">{{ totalResponses }}</h3>
          <p class="mt-1 text-sm text-gray-600">總回覆數</p>
        </div>
      </div>

      <!-- 問卷列表 -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">我的問卷</h3>
        </div>

        <!-- 問卷項目 -->
        <div v-if="forms.length > 0" class="divide-y divide-gray-200">
          <div
            v-for="form in forms"
            :key="form.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h4 class="text-base font-medium text-gray-900">{{ form.title }}</h4>
                <p class="mt-1 text-sm text-gray-500">{{ form.description || '無描述' }}</p>
                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>建立於 {{ formatDate(form.createdAt) }}</span>
                  <span>{{ form.responseCount || 0 }} 個回覆</span>
                </div>
              </div>

              <!-- 操作按鈕 -->
              <div class="flex items-center space-x-2">
                <button
                  @click="editForm(form.id)"
                  class="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  編輯
                </button>
                <button
                  @click="viewResponses(form.id)"
                  class="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                >
                  查看回覆
                </button>
                <button
                  @click="shareForm(form.id)"
                  class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  分享
                </button>
                <button
                  @click="deleteForm(form.id)"
                  class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="px-6 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">尚無問卷</h3>
          <p class="mt-1 text-sm text-gray-500">開始建立您的第一份問卷</p>
          <div class="mt-6">
            <button
              @click="createNewForm"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              建立新問卷
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { formApi } from '@/services/api'
import { generateHash } from '@/utils/hash'

const authStore = useAuthStore()
const router = useRouter()

const showDropdown = ref(false)
const forms = ref<any[]>([])
const showToast = ref(false)
const toastMessage = ref('')
const totalResponses = computed(() => {
  return forms.value.reduce((sum, form) => sum + (form.responseCount || 0), 0)
})

onMounted(() => {
  loadForms()
})

const loadForms = async () => {
  // 🔥 臨時改為只從 localStorage 載入，避免資料庫 UUID 問題
  console.log('🔍 [Dashboard] Loading forms from localStorage (DB sync disabled)')

  const storedData = localStorage.getItem('qter_forms')
  if (storedData) {
    try {
      const localForms = JSON.parse(storedData)
      if (Array.isArray(localForms)) {
        const filtered = localForms.filter(f => {
          const isDemoForm = ['featured-2025', '1', '2', '3'].includes(f.id)
          return !isDemoForm
        })
        forms.value = filtered
        console.log(`✅ [Dashboard] Loaded ${filtered.length} forms from localStorage`)
      }
    } catch (e) {
      console.error('載入本地問卷失敗', e)
      forms.value = []
    }
  } else {
    console.log('⚠️ [Dashboard] No forms found in localStorage')
    forms.value = []
  }

  /* 暫時註解掉資料庫載入
  try {
    const response = await formApi.getForms()
    if (response.success && Array.isArray(response.forms)) {
      forms.value = response.forms
    }
  } catch (error) {
    console.error('從資料庫載入問卷失敗:', error)
  }

  const storedData = localStorage.getItem('qter_forms')
  if (storedData) {
    try {
      const localForms = JSON.parse(storedData)
      if (Array.isArray(localForms)) {
        const filtered = localForms.filter(f => {
          const isDemoForm = ['featured-2025', '1', '2', '3'].includes(f.id)
          const alreadyInDB = forms.value.some(dbForm => dbForm.id === f.id)
          return !isDemoForm && !alreadyInDB
        })
        forms.value = [...forms.value, ...filtered]
      }
    } catch (e) {
      console.error('載入本地問卷失敗', e)
    }
  }
  */
}

const createNewForm = () => {
  // 建立新問卷並導向編輯器
  const newFormId = generateHash()
  router.push(`/editor/${newFormId}`)
}

const editForm = (id: string) => {
  router.push(`/editor/${id}`)
}

const viewResponses = (id: string) => {
  router.push(`/responses/${id}`)
}

const shareForm = (id: string) => {
  // TODO: 實作分享功能
  const shareUrl = `${window.location.origin}/fill/${id}`
  navigator.clipboard.writeText(shareUrl)
  alert('分享連結已複製到剪貼簿！')
}

const deleteForm = async (id: string) => {
  if (confirm('確定要刪除這份問卷嗎？')) {
    try {
      await formApi.deleteForm(id)
    } catch (error) {
      console.error('從資料庫刪除問卷失敗:', error)
    }
    
    forms.value = forms.value.filter(f => f.id !== id)
    
    const allForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const updatedForms = allForms.filter((f: any) => f.id !== id)
    localStorage.setItem('qter_forms', JSON.stringify(updatedForms))
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-TW')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 點擊外部關閉下拉選單
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showDropdown.value = false
  }
})
</script>