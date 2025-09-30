<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 範例問卷資料
const forms = ref([
  // 精選問卷卡片（首頁以卡片呈現，填寫頁面提供客製化樣式）
  {
    id: 'featured-2025',
    title: '科技趨勢調查 2025',
    description: '探索生成式 AI、邊緣運算、低程式碼工具等最新趨勢，協助我們了解業界脈動！',
    responseCount: 342,
    createdAt: new Date('2025-09-20'),
    status: 'active',
    featured: true,
    displayMode: 'step-by-step',
    // 進階 Markdown 與自訂樣式（只在填寫頁面使用）
    markdownContent: `
---
title: 科技趨勢調查 2025
description: 探索生成式 AI、邊緣運算、低程式碼工具等最新趨勢
---

<style>
  /* 字體 */
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');

  /* 全域字型 */
  body { font-family: Inter, system-ui, -apple-system, sans-serif; }

  /* 超大標題 */
  .qtitle {
    font-family: 'Space Grotesk', Inter, sans-serif;
    letter-spacing: .3px;
    color: #0f172a;
    font-size: 4.5rem;
    line-height: 1.05;
    text-shadow: 0 6px 30px rgba(99,102,241,.25);
  }

  /* 徽章 */
  .qter-badges { display:flex; justify-content:center; align-items:center; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .qter-badge {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 10px; border-radius:9999px;
    background: linear-gradient(90deg, rgba(236,72,153,.15), rgba(59,130,246,.15));
    color:#334155; border:1px solid rgba(99,102,241,.35);
  }

  /* 進度條微客製 */
  .progress-boost .bg-blue-500 { box-shadow: 0 0 0 2px rgba(191,219,254,1) inset; }

  /* 題目卡片主題 */
  .qcard-ai { background: linear-gradient(180deg, #f0f9ff, #eef2ff); border: 1px solid rgba(99,102,241,.35); box-shadow: 0 8px 24px rgba(99,102,241,.25); }
  .qcard-ai:hover { box-shadow: 0 12px 28px rgba(99,102,241,.35); }
  .qcard-edge { background: linear-gradient(180deg, #f0fdf4, #ecfdf5); border: 1px solid rgba(16,185,129,.35); box-shadow: 0 8px 24px rgba(16,185,129,.20); }
  .qcard-edge:hover { box-shadow: 0 12px 28px rgba(16,185,129,.30); }
  .qcard-lowcode { background: linear-gradient(180deg, #fef2f2, #fff7ed); border: 1px solid rgba(249,115,22,.35); box-shadow: 0 8px 24px rgba(249,115,22,.25); }
  .qcard-lowcode:hover { box-shadow: 0 12px 28px rgba(249,115,22,.35); }
  .qcard-security { background: linear-gradient(180deg, #f3f4f6, #f8fafc); border: 1px solid rgba(15,23,42,.25); box-shadow: 0 8px 24px rgba(15,23,42,.20); }
  .qcard-security:hover { box-shadow: 0 12px 28px rgba(15,23,42,.30); }

  /* 色塊選擇用標籤 */
  .color-label { display:inline-flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,.06); }
  .color-dot { width:18px; height:18px; border-radius:50%; box-shadow:0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,.08) }

  /* 動畫 */
  .animate-fade { animation: fadein .6s ease-out both; }
  .animate-slide { animation: slideup .6s ease-out both; }
  @keyframes fadein { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }
  @keyframes slideup { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform:none } }

  /* 卡片翻轉 */
  .flip-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:14px; margin:14px 0; }
  .flip-card { perspective: 1000px; }
  .flip-inner { position:relative; transform-style:preserve-3d; transition: transform .6s; }
  .flip-card:hover .flip-inner { transform: rotateY(180deg); }
  .flip-face { position:relative; backface-visibility:hidden; border-radius:16px; padding:16px; border:1px solid rgba(99,102,241,.3); background: linear-gradient(180deg,#eef2ff,#faf5ff) }
  .flip-back { position:absolute; inset:0; transform: rotateY(180deg); background: linear-gradient(180deg,#ecfeff,#f0f9ff) }

  /* 小徽章（內文） */
  .qtag { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:9999px; background: rgba(59,130,246,.08); color:#1d4ed8; border:1px solid rgba(59,130,246,.25); }
</style>

<section class="animate-fade" style="text-align:center;margin: 10px 0 16px 0;">
  <div style="font-size:14px;color:#64748b;letter-spacing:.1em;">2025 TECH OUTLOOK</div>
  <div class="qtitle">🚀 科技趨勢調查 2025</div>
  <div class="qter-badges">
    <span class="qter-badge">🤖 GenAI</span>
    <span class="qter-badge">🛰️ Edge</span>
    <span class="qter-badge">🧩 Low-code</span>
    <span class="qter-badge">🛡️ Security</span>
  </div>

  <div style="margin-top:10px;color:#475569">
    <span class="qtag">全新互動體驗 ✨</span>
    <span class="qtag">客製化視覺 🎨</span>
    <span class="qtag">更直覺的題型 🧠</span>
  </div>

  <!-- 卡片翻轉展示 -->
  <div class="flip-grid animate-slide" aria-label="趨勢卡片展示">
    <div class="flip-card">
      <div class="flip-inner">
        <div class="flip-face">🤖 生成式 AI<br/><small>內容生產、協作開發</small></div>
        <div class="flip-face flip-back">✨ Prompt 工程、RAG、Agent</div>
      </div>
    </div>
    <div class="flip-card">
      <div class="flip-inner">
        <div class="flip-face">🛰️ 邊緣運算<br/><small>低延遲、隱私優化</small></div>
        <div class="flip-face flip-back">📶 5G/IoT + on-device AI</div>
      </div>
    </div>
    <div class="flip-card">
      <div class="flip-inner">
        <div class="flip-face">🧩 低程式碼<br/><small>業務敏捷、快速落地</small></div>
        <div class="flip-face flip-back">⚡ 表單/流程/報表自動化</div>
      </div>
    </div>
  </div>
</section>
`,
    // 客製化樣式（僅在填寫頁面使用）
    theme: {
      background: "linear-gradient(135deg, rgba(14,165,233,.35), rgba(99,102,241,.35)) , url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop') center / cover no-repeat fixed",
      titleColor: '#0f172a'
    },
    questions: [
      {
        id: 'name',
        type: 'text',
        title: '👤 請留下您的稱呼',
        description: '方便我們在必要時與您聯繫',
        required: true,
        className: 'qcard-ai animate-fade'
      },
      {
        id: 'aiInterest',
        type: 'radio',
        title: '🤖 對生成式 AI 的關注程度',
        required: true,
        className: 'qcard-edge animate-fade',
        options: [
          { id: 'high', text: '🔥 高度關注' },
          { id: 'medium', text: '⚖️ 中度關注' },
          { id: 'low', text: '🌱 低度關注' }
        ]
      },
      {
        id: 'trends',
        type: 'checkbox',
        title: '📈 最感興趣的科技趨勢（可複選）',
        required: false,
        className: 'qcard-lowcode animate-fade',
        options: [
          { id: 'genai', text: '🤖 生成式 AI' },
          { id: 'edge', text: '🛰️ 邊緣運算' },
          { id: 'lowcode', text: '🧩 低程式碼/無程式碼' },
          { id: 'security', text: '🛡️ 零信任資安' }
        ]
      },

      /* 圖片型題目（在題目中嵌入圖片） */
      {
        id: 'vision-image',
        type: 'text',
        title: '🖼️ 請觀察下圖並描述你最關注的科技應用<br/><img src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop" alt="AI Art" style="width:100%;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.12);margin-top:8px;" />',
        description: '可舉例：內容生成、智慧客服、資料分析、個人助理等',
        required: false,
        className: 'qcard-ai animate-slide'
      },

      /* 星星評分（emoji） */
      {
        id: 'aiStar',
        type: 'rating',
        title: '🌟 你對「AI 生產力工具」的滿意度',
        description: '請以 1~5 顆星評分',
        required: true,
        className: 'qcard-edge animate-fade'
      },

      /* 顏色選擇（色塊） */
      {
        id: 'colorChoice',
        type: 'radio',
        title: '🎨 你偏好的介面主題色調',
        description: '以下選項以顏色呈現（純裝飾，實際以 emoji 文字為值）',
        required: false,
        className: 'qcard-lowcode animate-fade',
        options: [
          { id: 'red', text: '🔴 紅' },
          { id: 'green', text: '🟢 綠' },
          { id: 'blue', text: '🔵 藍' },
          { id: 'yellow', text: '🟡 黃' },
          { id: 'purple', text: '🟣 紫' }
        ]
      },

      /* 圖標選擇（emoji） */
      {
        id: 'iconChoice',
        type: 'radio',
        title: '🧩 為你的 2025 科技形象選一個代表圖標',
        required: false,
        className: 'qcard-ai animate-fade',
        options: [
          { id: 'robot', text: '🤖' },
          { id: 'cloud', text: '☁️' },
          { id: 'brain', text: '🧠' },
          { id: 'satellite', text: '🛰️' },
          { id: 'shield', text: '🛡️' }
        ]
      },

      /* 滑動條（range） */
      {
        id: 'adoptionRange',
        type: 'range',
        title: '📊 你所在團隊對新技術的採用程度（0~100）',
        description: '向右表示更積極採用',
        required: false,
        className: 'qcard-security animate-fade'
      },

      /* 其他建議 */
      {
        id: 'suggestion',
        type: 'textarea',
        title: '💡 其他建議或想法（選填）',
        required: false,
        className: 'qcard-security animate-slide'
      }
    ]
  },
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
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  router.push('/editor/new')
}

// 儲存問卷資料到 localStorage
const saveFormsToStorage = () => {
  // 以種子資料補齊，但不覆蓋使用者已編輯過的表單（依 id 合併）
  try {
    const existing: any[] = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const byId = new Map<string, any>(existing.map(f => [f.id, f]))
    const merged: any[] = []

    for (const seed of forms.value as any[]) {
      if (byId.has(seed.id)) {
        // 保留使用者內容（包含 displayMode / markdownContent / questions 等）
        merged.push(byId.get(seed.id))
        byId.delete(seed.id)
      } else {
        merged.push(seed)
      }
    }
    // 其餘使用者自建表單也保留
    for (const rest of byId.values()) merged.push(rest)

    localStorage.setItem('qter_forms', JSON.stringify(merged))
  } catch {
    // 失敗則退回原行為
    localStorage.setItem('qter_forms', JSON.stringify(forms.value))
  }
}

// 頁面載入時儲存問卷資料
onMounted(() => {
  // 檢查認證狀態
  authStore.checkAuth()
  saveFormsToStorage()
})

const openForm = (id: string) => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  // 確保列表資料已寫入 localStorage，編輯器才能正確載入
  saveFormsToStorage()
  router.push(`/editor/${id}`)
}

const viewResponses = (id: string) => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  router.push(`/responses/${id}`)
}

const fillForm = (id: string) => {
  // 先確保最新列表已寫入
  saveFormsToStorage()
  // 讀取該表單設定，依 displayMode 走不同路由
  try {
    const savedForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    const target = savedForms.find((f: any) => f.id === id)
    const mode = target?.displayMode ?? 'step-by-step'
    if (mode === 'all-at-once') {
      router.push(`/fill/${id}/all`)
    } else {
      router.push(`/fill/${id}`)
    }
  } catch {
    router.push(`/fill/${id}`)
  }
}

// 登入處理
const handleLogin = () => {
  router.push('/login')
}

// 登出處理
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 前往儀表板
const goToDashboard = () => {
  router.push('/dashboard')
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
            <!-- 已登入狀態 -->
            <template v-if="authStore.isAuthenticated">
              <button
                @click="goToDashboard"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                我的儀表板
              </button>
              <div class="flex items-center space-x-2">
                <img
                  v-if="authStore.user?.picture"
                  :src="authStore.user.picture"
                  :alt="authStore.user.name"
                  class="h-8 w-8 rounded-full"
                >
                <span class="text-sm text-gray-700">{{ authStore.user?.name }}</span>
              </div>
              <button 
                @click="handleLogout"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                登出
              </button>
            </template>
            
            <!-- 未登入狀態 -->
            <template v-else>
              <span class="text-sm text-gray-600">訪客模式</span>
              <button 
                @click="handleLogin"
                class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                登入 / 註冊
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容 -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 未登入提示 -->
      <div v-if="!authStore.isAuthenticated" class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p class="text-sm text-amber-800">
            您目前處於訪客模式。<button @click="handleLogin" class="underline font-medium">登入</button>以建立和管理您的問卷。
          </p>
        </div>
      </div>

      <!-- 操作區 -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ authStore.isAuthenticated ? '我的問卷' : '公開問卷' }}
            </h2>
            <p class="mt-1 text-sm text-gray-600">
              {{ authStore.isAuthenticated ? '管理和查看您的所有問卷表單' : '瀏覽並填寫公開問卷' }}
            </p>
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
          :class="[
            'rounded-lg transition-shadow p-6 border',
            form.featured
              ? 'bg-gradient-to-br from-indigo-50 to-fuchsia-50 border-transparent shadow-md hover:shadow-lg ring-1 ring-violet-300'
              : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
          ]"
        >
          <!-- 問卷狀態標籤 -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-2">
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
              <span
                v-if="form.featured"
                class="px-2 py-1 text-xs rounded-full text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow"
              >
                精選
              </span>
            </div>
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