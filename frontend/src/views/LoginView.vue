<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <!-- Logo 和標題 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Qter</h1>
        <p class="text-gray-600">智能問卷平台</p>
      </div>

      <!-- 登入區域 -->
      <div class="space-y-6">
        <!-- Google 登入按鈕 -->
        <div id="google-login-button"></div>
        
        <!-- 或使用手動按鈕 -->
        <button
          @click="handleGoogleLogin"
          class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="text-gray-700 font-medium">使用 Google 帳號登入</span>
        </button>

        <!-- 載入中狀態 -->
        <div v-if="authStore.isLoading" class="text-center py-4">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">登入中...</p>
        </div>

        <!-- 錯誤訊息 -->
        <div v-if="authStore.error" class="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
          {{ authStore.error }}
        </div>
      </div>

      <!-- 功能特色 -->
      <div class="mt-12 space-y-3">
        <div class="flex items-center gap-3 text-gray-600">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm">建立個人專屬問卷庫</span>
        </div>
        <div class="flex items-center gap-3 text-gray-600">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm">輕鬆分享與收集回應</span>
        </div>
        <div class="flex items-center gap-3 text-gray-600">
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm">即時數據分析與視覺化</span>
        </div>
      </div>

      <!-- 隱私政策 -->
      <div class="mt-8 text-center text-xs text-gray-500">
        登入即表示您同意我們的
        <a href="#" class="text-indigo-600 hover:underline">服務條款</a>
        和
        <a href="#" class="text-indigo-600 hover:underline">隱私政策</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// 監看登入狀態，成功後導向儀表板
watch(() => authStore.isAuthenticated, (authed) => {
  console.debug('[LoginView] isAuthenticated changed =>', authed)
  if (authed) {
    try {
      router.push('/dashboard')
    } catch {}
  }
})

// 檢查是否已登入
onMounted(async () => {
  authStore.checkAuth()
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
    return
  }

  // 初始化 Google 登入（等待腳本載入）
  await authStore.initGoogleAuth()

  // 渲染 Google 登入按鈕
  if (typeof google !== 'undefined') {
    google.accounts.id.renderButton(
      document.getElementById('google-login-button')!,
      {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'zh-TW'
      }
    )
  }
})

// 手動觸發 Google 登入
const handleGoogleLogin = () => {
  authStore.login()
}
</script>