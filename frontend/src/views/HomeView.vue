<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const forms = ref([
  {
    id: 'featured-2025',
    title: '科技趨勢調查 2025',
    description: '探索生成式 AI、邊緣運算、低程式碼工具等最新趨勢，協助我們了解業界脈動！',
    responseCount: 342,
    createdAt: new Date('2025-09-20'),
    status: 'active',
    featured: true,
    displayMode: 'step-by-step',
    markdownContent: `
---
title: 科技趨勢調查 2025
description: 探索生成式 AI、邊緣運算、低程式碼工具等最新趨勢
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');
  body { font-family: Inter, system-ui, -apple-system, sans-serif; }
  .qtitle {
    font-family: 'Space Grotesk', Inter, sans-serif;
    letter-spacing: .3px;
    color: #0f172a;
    font-size: 4.5rem;
    line-height: 1.05;
    text-shadow: 0 6px 30px rgba(99,102,241,.25);
  }
  .qter-badges { display:flex; justify-content:center; align-items:center; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .qter-badge {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 10px; border-radius:9999px;
    background: linear-gradient(90deg, rgba(236,72,153,.15), rgba(59,130,246,.15));
    color:#334155; border:1px solid rgba(99,102,241,.35);
  }
  .progress-boost .bg-blue-500 { box-shadow: 0 0 0 2px rgba(191,219,254,1) inset; }
  .qcard-ai { background: linear-gradient(180deg, #f0f9ff, #eef2ff); border: 1px solid rgba(99,102,241,.35); box-shadow: 0 8px 24px rgba(99,102,241,.25); }
  .qcard-ai:hover { box-shadow: 0 12px 28px rgba(99,102,241,.35); }
  .qcard-edge { background: linear-gradient(180deg, #f0fdf4, #ecfdf5); border: 1px solid rgba(16,185,129,.35); box-shadow: 0 8px 24px rgba(16,185,129,.20); }
  .qcard-edge:hover { box-shadow: 0 12px 28px rgba(16,185,129,.30); }
  .qcard-lowcode { background: linear-gradient(180deg, #fef2f2, #fff7ed); border: 1px solid rgba(249,115,22,.35); box-shadow: 0 8px 24px rgba(249,115,22,.25); }
  .qcard-lowcode:hover { box-shadow: 0 12px 28px rgba(249,115,22,.35); }
  .qcard-security { background: linear-gradient(180deg, #f3f4f6, #f8fafc); border: 1px solid rgba(15,23,42,.25); box-shadow: 0 8px 24px rgba(15,23,42,.20); }
  .qcard-security:hover { box-shadow: 0 12px 28px rgba(15,23,42,.30); }
  .color-label { display:inline-flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; border:1px solid rgba(0,0,0,.06); }
  .color-dot { width:18px; height:18px; border-radius:50%; box-shadow:0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,.08) }
  .animate-fade { animation: fadein .6s ease-out both; }
  .animate-slide { animation: slideup .6s ease-out both; }
  @keyframes fadein { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform:none } }
  @keyframes slideup { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform:none } }
  .flip-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:14px; margin:14px 0; }
  .flip-card { perspective: 1000px; }
  .flip-inner { position:relative; transform-style:preserve-3d; transition: transform .6s; }
  .flip-card:hover .flip-inner { transform: rotateY(180deg); }
  .flip-face { position:relative; backface-visibility:hidden; border-radius:16px; padding:16px; border:1px solid rgba(99,102,241,.3); background: linear-gradient(180deg,#eef2ff,#faf5ff) }
  .flip-back { position:absolute; inset:0; transform: rotateY(180deg); background: linear-gradient(180deg,#ecfeff,#f0f9ff) }
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
    questions: []
  },
  {
    id: '2',
    title: '年度員工調查問卷',
    description: '收集員工對公司文化與福利的意見',
    responseCount: 128,
    createdAt: new Date('2025-09-15'),
    status: 'active',
    questions: []
  }
])

onMounted(() => {
  authStore.checkAuth()
})

const fillDemoForm = (id: string) => {
  const demoForm = forms.value.find(f => f.id === id)
  if (demoForm) {
    localStorage.setItem(`qter_demo_${id}`, JSON.stringify(demoForm))
    const mode = demoForm.displayMode ?? 'step-by-step'
    if (mode === 'all-at-once') {
      router.push(`/fill/${id}/all`)
    } else {
      router.push(`/fill/${id}`)
    }
  }
}

const previewDemoForm = (id: string) => {
  const demoForm = forms.value.find(f => f.id === id)
  if (demoForm) {
    localStorage.setItem(`qter_demo_${id}`, JSON.stringify(demoForm))
    router.push(`/editor/${id}?readonly=true`)
  }
}

const copyDemoAsTemplate = (id: string) => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  const demoForm = forms.value.find(f => f.id === id)
  if (demoForm) {
    const newId = crypto.randomUUID()
    const newForm = {
      ...demoForm,
      id: newId,
      title: `${demoForm.title}（複製）`,
      responseCount: 0,
      createdAt: new Date(),
      featured: false
    }

    const existing = JSON.parse(localStorage.getItem('qter_forms') || '[]')
    existing.push(newForm)
    localStorage.setItem('qter_forms', JSON.stringify(existing))

    router.push(`/editor/${newId}`)
  }
}

const handleLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-800">📝 QTER</h1>
          </div>
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <button
                @click="goToDashboard"
                class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
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
            
            <template v-else>
              <button
                @click="handleLogin"
                class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                登入 / 註冊
              </button>
              <button
                @click="router.push('/demo')"
                class="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                體驗範例
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <main class="bg-white">
      <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 class="text-5xl font-bold text-gray-900 mb-6">
          📝 QTER 輕巧問卷系統
        </h1>
        <p class="text-2xl text-gray-600 mb-4">3 分鐘建立專業問卷</p>
        <p class="text-lg text-gray-500 mb-8">支援 Markdown、客製化樣式、多種填寫模式</p>
        
        <div class="flex justify-center gap-4">
          <button
            @click="handleLogin"
            class="px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            立即開始
          </button>
          <a
            href="#demos"
            class="px-8 py-3 bg-white text-indigo-600 text-lg rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            查看範例
          </a>
        </div>
      </section>

      <section class="bg-gray-50 py-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">功能亮點</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="text-xl font-semibold mb-2">自訂樣式</h3>
              <p class="text-gray-600">Markdown + CSS 完全控制視覺</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-4">📊</div>
              <h3 class="text-xl font-semibold mb-2">多種題型</h3>
              <p class="text-gray-600">文字、選擇、評分、滑動條、圖片題</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-4">🔄</div>
              <h3 class="text-xl font-semibold mb-2">彈性填寫</h3>
              <p class="text-gray-600">支援分步驟 or 一次填完</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-4">📈</div>
              <h3 class="text-xl font-semibold mb-2">即時分析</h3>
              <p class="text-gray-600">回覆統計與資料匯出</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-4">🔗</div>
              <h3 class="text-xl font-semibold mb-2">公開分享</h3>
              <p class="text-gray-600">產生短網址，輕鬆散播</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-4">⚡</div>
              <h3 class="text-xl font-semibold mb-2">快速建立</h3>
              <p class="text-gray-600">範本複製，秒速上手</p>
            </div>
          </div>
        </div>
      </section>

      <section id="demos" class="py-16">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-gray-900 text-center mb-4">範例問卷</h2>
          <p class="text-gray-600 text-center mb-12">探索 Qter 的強大功能，立即體驗或複製為您的模板</p>
          
          <div class="grid md:grid-cols-3 gap-6">
            <div
              v-for="form in forms.slice(0, 3)"
              :key="form.id"
              class="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-indigo-400 hover:shadow-lg transition-all"
            >
              <div class="flex items-center gap-2 mb-3">
                <span
                  v-if="form.featured"
                  class="px-2 py-1 text-xs rounded-full text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500"
                >
                  精選範例
                </span>
              </div>
              
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ form.title }}</h3>
              <p class="text-sm text-gray-600 mb-4 line-clamp-3">{{ form.description }}</p>
              
              <div class="flex flex-col gap-2">
                <button
                  @click="fillDemoForm(form.id)"
                  class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  立即體驗
                </button>
                <button
                  @click="previewDemoForm(form.id)"
                  class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  查看範例
                </button>
                <button
                  @click="copyDemoAsTemplate(form.id)"
                  class="w-full px-4 py-2 bg-white text-indigo-600 rounded-lg border border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  複製為模板
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-gray-50 py-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">使用流程</h2>
          
          <div class="space-y-8">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div>
                <h3 class="text-xl font-semibold mb-2">註冊登入</h3>
                <p class="text-gray-600">使用 Google 帳號 3 秒完成註冊</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div>
                <h3 class="text-xl font-semibold mb-2">建立問卷</h3>
                <p class="text-gray-600">可選擇範例模板或從頭開始設計</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div>
                <h3 class="text-xl font-semibold mb-2">自訂樣式</h3>
                <p class="text-gray-600">使用 Markdown 與 CSS 打造獨特視覺</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">4</div>
              <div>
                <h3 class="text-xl font-semibold mb-2">分享連結</h3>
                <p class="text-gray-600">產生公開或私密分享連結</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">5</div>
              <div>
                <h3 class="text-xl font-semibold mb-2">查看分析</h3>
                <p class="text-gray-600">即時查看回覆統計與資料匯出</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl font-bold mb-6">準備好開始了嗎？</h2>
          <p class="text-xl mb-8 opacity-90">加入 Qter，3 分鐘建立您的第一份專業問卷</p>
          <button
            @click="handleLogin"
            class="px-8 py-4 bg-white text-indigo-600 text-lg rounded-lg hover:bg-gray-100 transition-colors shadow-xl font-semibold"
          >
            免費註冊
          </button>
        </div>
      </section>

      <footer class="bg-gray-900 text-gray-400 py-12">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <h3 class="text-white font-semibold mb-4">關於 Qter</h3>
              <p class="text-sm">輕巧、彈性、強大的問卷系統</p>
            </div>
            <div>
              <h3 class="text-white font-semibold mb-4">產品</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-white">功能介紹</a></li>
                <li><a href="#demos" class="hover:text-white">範例展示</a></li>
              </ul>
            </div>
            <div>
              <h3 class="text-white font-semibold mb-4">資源</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="https://github.com" class="hover:text-white">GitHub</a></li>
                <li><a href="#" class="hover:text-white">技術文件</a></li>
              </ul>
            </div>
            <div>
              <h3 class="text-white font-semibold mb-4">法律</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-white">隱私政策</a></li>
                <li><a href="#" class="hover:text-white">服務條款</a></li>
              </ul>
            </div>
          </div>
          <div class="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 Qter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
</style>