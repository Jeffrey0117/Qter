<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function mergeFormIntoLocalStorage(form: any) {
  const key = 'qter_forms'
  const saved: any[] = JSON.parse(localStorage.getItem(key) || '[]')
  const idx = saved.findIndex(f => f.id === form.id)
  if (idx >= 0) {
    saved[idx] = {
      ...saved[idx],
      ...form,
      markdownContent: form.markdownContent ?? saved[idx].markdownContent,
    }
  } else {
    saved.push(form)
  }
  localStorage.setItem(key, JSON.stringify(saved))
}

onMounted(() => {
  // 內建示範問卷（完整測試版本）
  const demoForm = {
    id: 'test-survey-2025',
    title: '產品體驗與滿意度調查',
    description: '請花 3-5 分鐘協助我們了解您的使用體驗，您的寶貴意見將幫助我們持續改進',
    status: 'active',
    featured: true,
    displayMode: 'step-by-step',
    showProgressBar: true,
    enableAutoAdvance: true,
    advanceDelay: 2,
    allowBackNavigation: true,
    markdownContent: `---
title: 產品體驗與滿意度調查
description: 您的意見對我們很重要！
showProgressBar: true
enableAutoAdvance: true
advanceDelay: 2
allowBackNavigation: true
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700&display=swap');
  body { font-family: 'Noto Sans TC', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  .survey-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 2rem;
    border-radius: 1rem;
    margin-bottom: 2rem;
    text-align: center;
    animation: fadeIn 0.8s ease-in;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .question-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
  }
  .question-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  .highlight {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }
</style>

<div class="survey-header">
  <h1>歡迎參與我們的調查！</h1>
  <p>您的意見將幫助我們打造更好的產品體驗</p>
</div>

## 基本資訊

### 1. 您的姓名或暱稱 {.question-card}
type: text
required: true
placeholder: 請輸入您的稱呼
validation: minLength:2;maxLength:50
helperText: 我們會保護您的隱私

---

### 2. 您的電子郵件 {.question-card}
type: email
required: false
placeholder: example@email.com
helperText: 選填，方便我們回覆您的意見

---

### 3. 您的年齡範圍 {.question-card}
type: radio
required: true
options:
  - 18歲以下
  - 18-25歲
  - 26-35歲
  - 36-45歲
  - 46-55歲
  - 56歲以上

---

## 產品使用體驗

### 4. 您使用我們產品多久了？ {.question-card}
type: radio
required: true
options:
  - 第一次使用
  - 不到一個月
  - 1-3個月
  - 3-6個月
  - 6個月-1年
  - 超過1年

---

### 5. 您最常使用哪些功能？ {.question-card}
type: checkbox
required: true
minSelect: 1
maxSelect: 3
options:
  - 📝 問卷編輯器
  - 📊 數據分析
  - 🎨 自訂主題
  - 📤 分享功能
  - 📱 行動版體驗
  - 🔐 隱私設定
  - 📈 即時報表
  - 🔗 API 整合
helperText: 請選擇1-3個最常用的功能

---

### 6. 整體滿意度評分 {.question-card}
type: rating
required: true
scale: 10
lowLabel: 非常不滿意
highLabel: 非常滿意
helperText: 請給我們一個整體評分

---

### 7. 您會推薦給朋友嗎？ {.question-card}
type: rating
required: true
scale: 5
icon: ⭐
lowLabel: 絕對不會
highLabel: 強烈推薦

---

## 改進建議

### 8. 哪些方面需要改進？ {.question-card}
type: checkbox
required: false
options:
  - 🚀 載入速度
  - 🎨 介面設計
  - 📱 手機體驗
  - 📝 功能豐富度
  - 📚 使用說明
  - 💰 價格方案
  - 🛟 客戶支援
  - 🔐 安全性

---

### 9. 您的寶貴建議 {.question-card}
type: textarea
required: false
placeholder: 請告訴我們您的想法和建議...
maxLength: 500
rows: 5
helperText: 任何建議都歡迎！

---

### 10. 上傳相關截圖（選填） {.question-card}
type: file
required: false
accept: image/*
maxSize: 5MB
helperText: 如有相關問題截圖，可上傳幫助我們了解

---

## 感謝您！

<div class="survey-header">
  <h2 class="highlight">感謝您的寶貴時間！</h2>
  <p>我們已收到您的回饋，將會認真評估每一條建議。</p>
  <p>🎁 作為感謝，我們將在下週抽出10位幸運參與者送出精美禮品！</p>
</div>
`,
  }

  mergeFormIntoLocalStorage(demoForm)

  const mode = demoForm.displayMode ?? 'step-by-step'
  const id = demoForm.id
  console.log('Demo Survey Created:', id, 'Mode:', mode)
  if (mode === 'all-at-once') {
    router.replace(`/fill/${id}/all`)
  } else {
    router.replace(`/fill/${id}`)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
      <p class="text-gray-600">建立示範問卷並導向中...</p>
    </div>
  </div>
</template>