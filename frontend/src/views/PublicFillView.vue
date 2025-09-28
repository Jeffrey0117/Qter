<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)

function mergeFormIntoLocalStorage(form: any) {
  const key = 'qter_forms'
  const saved: any[] = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = saved.findIndex(f => f.id === form.id)
  if (idx >= 0) {
    // 不覆蓋使用者修改過的欄位，僅更新最關鍵的供渲染
    saved[idx] = {
      ...saved[idx],
      ...form,
      // 確保 markdownContent 欄位名稱與前端一致
      markdownContent: form.markdownContent ?? form.markdown_content ?? saved[idx].markdownContent,
    }
  } else {
    saved.push({
      ...form,
      markdownContent: form.markdownContent ?? form.markdown_content,
    })
  }
  localStorage.setItem(key, JSON.stringify(saved))
}

onMounted(async () => {
  const hash = route.params.hash as string
  if (!hash) {
    error.value = '缺少分享代碼'
    loading.value = false
    return
  }

  try {
    // 從 Workers 取得公開表單
    const res = await api.public.getFormByHash(hash)
    const form = res?.form
    if (!form) {
      error.value = '找不到此問卷或已關閉'
      loading.value = false
      return
    }

    // 將公開表單寫入本地，沿用既有填寫頁面
    mergeFormIntoLocalStorage(form)

    // 依 displayMode 導向既有填寫頁面
    const id = form.id
    const mode = form.displayMode ?? 'step-by-step'
    if (mode === 'all-at-once') {
      router.replace({ path: `/fill/${id}/all`, query: { s: hash } })
    } else {
      router.replace({ path: `/fill/${id}`, query: { s: hash } })
    }
  } catch (e: any) {
    console.error(e)
    error.value = '載入失敗，請稍後重試'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
    <div v-if="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
      <p class="text-gray-600">載入公開問卷中...</p>
    </div>

    <div v-else-if="error" class="max-w-md w-full bg-white rounded-2xl shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">無法開啟問卷</h2>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <div class="text-right">
        <router-link to="/" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">返回首頁</router-link>
      </div>
    </div>
  </div>
</template>