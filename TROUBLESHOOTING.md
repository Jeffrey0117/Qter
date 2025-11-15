# 問題排查文檔 (Troubleshooting Guide)

本文檔記錄 Qter 專案開發過程中遇到的常見問題及解決方案。

---

## 1. User not authenticated 錯誤

### 問題描述

在使用應用程式時，可能會遇到以下錯誤訊息：

```
Error: User not authenticated
```

或在瀏覽器控制台看到：

```
POST https://[project-id].supabase.co/rest/v1/forms 401 (Unauthorized)
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT invalid"
}
```

### 錯誤原因

此錯誤的主要原因是 **Supabase Auth 功能未啟用**，導致：

1. 無法生成有效的 JWT (JSON Web Token)
2. API 請求缺少有效的身份驗證憑證
3. Supabase RLS (Row Level Security) 政策拒絕未授權的請求

### 臨時解決方案：離線模式 (localStorage)

在開發階段，我們實作了離線模式作為臨時解決方案，將資料儲存在瀏覽器的 localStorage 中。

#### 實作方式

**frontend/src/stores/offlineStore.ts**

```typescript
import { defineStore } from 'pinia'
import type { Form } from '@/types/form'

export const useOfflineStore = defineStore('offline', {
  state: () => ({
    forms: [] as Form[],
    isOfflineMode: true
  }),

  actions: {
    // 儲存表單到 localStorage
    saveForms() {
      localStorage.setItem('qter_forms', JSON.stringify(this.forms))
    },

    // 從 localStorage 載入表單
    loadForms() {
      const data = localStorage.getItem('qter_forms')
      if (data) {
        this.forms = JSON.parse(data)
      }
    },

    // 新增表單
    addForm(form: Form) {
      this.forms.push(form)
      this.saveForms()
    },

    // 更新表單
    updateForm(id: string, updates: Partial<Form>) {
      const index = this.forms.findIndex(f => f.id === id)
      if (index !== -1) {
        this.forms[index] = { ...this.forms[index], ...updates }
        this.saveForms()
      }
    },

    // 刪除表單
    deleteForm(id: string) {
      this.forms = this.forms.filter(f => f.id !== id)
      this.saveForms()
    }
  }
})
```

#### 使用離線模式

```typescript
import { useOfflineStore } from '@/stores/offlineStore'

const offlineStore = useOfflineStore()

// 檢查是否為離線模式
if (offlineStore.isOfflineMode) {
  // 使用 localStorage
  const forms = offlineStore.forms
} else {
  // 使用 Supabase API
  const { data } = await supabase.from('forms').select('*')
}
```

#### 離線模式的限制

- 資料僅儲存在本地瀏覽器，清除快取會遺失資料
- 無法跨裝置同步
- 無法多人協作
- 沒有伺服器端驗證

---

## 2. 長期解決方案：啟用 Supabase Auth

### 方案 A：啟用 Google OAuth

#### 步驟 1：設定 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google+ API**
4. 建立 OAuth 2.0 憑證：
   - 應用程式類型：網頁應用程式
   - 授權重新導向 URI：`https://[project-id].supabase.co/auth/v1/callback`

#### 步驟 2：在 Supabase 中設定

1. 進入 Supabase Dashboard
2. 前往 **Authentication > Providers**
3. 啟用 **Google Provider**
4. 填入 Google OAuth 憑證：
   - Client ID
   - Client Secret
5. 儲存設定

#### 步驟 3：前端整合

```typescript
// frontend/src/services/auth.ts
import { supabase } from './supabase'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  })

  if (error) {
    console.error('登入失敗:', error)
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('登出失敗:', error)
    throw error
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

#### 步驟 4：在元件中使用

```vue
<template>
  <div>
    <button v-if="!user" @click="handleLogin">
      使用 Google 登入
    </button>
    <div v-else>
      <p>歡迎，{{ user.email }}</p>
      <button @click="handleLogout">登出</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { signInWithGoogle, signOut, getCurrentUser } from '@/services/auth'
import { supabase } from '@/services/supabase'

const user = ref(null)

onMounted(async () => {
  // 獲取當前用戶
  user.value = await getCurrentUser()

  // 監聽認證狀態變化
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
  })
})

async function handleLogin() {
  try {
    await signInWithGoogle()
  } catch (error) {
    alert('登入失敗，請稍後再試')
  }
}

async function handleLogout() {
  try {
    await signOut()
    user.value = null
  } catch (error) {
    alert('登出失敗')
  }
}
</script>
```

### 方案 B：使用匿名登入

適合不需要用戶識別的應用場景。

#### 在 Supabase 中啟用

1. 進入 Supabase Dashboard
2. 前往 **Authentication > Providers**
3. 啟用 **Anonymous Sign-ins**

#### 前端實作

```typescript
// 自動匿名登入
export async function ensureAnonymousSession() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('匿名登入失敗:', error)
      throw error
    }
    return data.user
  }

  return user
}

// 在 App.vue 或路由守衛中使用
onMounted(async () => {
  await ensureAnonymousSession()
})
```

### 方案 C：Email/Password 認證

#### 啟用方式

1. Supabase Dashboard > **Authentication > Providers**
2. 確保 **Email** provider 已啟用
3. 設定 Email 模板（可選）

#### 前端實作

```typescript
// 註冊
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  })

  if (error) throw error
  return data
}

// 登入
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}
```

---

## 3. 開發模式 vs 生產模式的差異

### 開發模式 (Development)

```typescript
// .env.development
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_OFFLINE_MODE=true  // 啟用離線模式進行測試
```

特點：
- 可使用離線模式快速開發
- 不需要等待 Auth 設定完成
- 資料儲存在 localStorage
- 適合 UI/UX 開發和測試

### 生產模式 (Production)

```typescript
// .env.production
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_OFFLINE_MODE=false  // 禁用離線模式
```

特點：
- 必須啟用 Supabase Auth
- 資料儲存在雲端資料庫
- 支援多裝置同步
- 完整的安全性和 RLS 保護

### 環境切換邏輯

```typescript
// frontend/src/services/api.ts
const isOfflineMode = import.meta.env.VITE_USE_OFFLINE_MODE === 'true'

export async function createForm(form: Form) {
  if (isOfflineMode) {
    // 離線模式：使用 localStorage
    const offlineStore = useOfflineStore()
    offlineStore.addForm(form)
    return form
  } else {
    // 線上模式：使用 Supabase
    const { data, error } = await supabase
      .from('forms')
      .insert(form)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

---

## 4. 常見錯誤排查清單

### 錯誤 1：401 Unauthorized

**症狀：**
```
POST /rest/v1/forms 401 (Unauthorized)
```

**檢查項目：**
- [ ] Supabase Auth 是否已啟用？
- [ ] 用戶是否已登入？
- [ ] JWT token 是否有效？
- [ ] RLS 政策是否正確設定？

**解決方式：**
```typescript
// 檢查當前用戶
const { data: { user } } = await supabase.auth.getUser()
console.log('當前用戶:', user)

// 如果 user 為 null，需要先登入
if (!user) {
  await signInWithGoogle() // 或其他登入方式
}
```

### 錯誤 2：CORS 錯誤

**症狀：**
```
Access to fetch at 'https://xxx.supabase.co' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**解決方式：**
1. 檢查 Supabase Dashboard > **Settings > API**
2. 在 **URL Configuration** 中新增允許的來源：
   - `http://localhost:5173`
   - `http://localhost:3000`
   - 你的生產環境網址

### 錯誤 3：RLS 政策阻擋請求

**症狀：**
```
new row violates row-level security policy
```

**檢查 RLS 政策：**

```sql
-- 查看現有政策
SELECT * FROM pg_policies WHERE tablename = 'forms';

-- 開發環境臨時解決方案（不推薦用於生產環境）
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;

-- 生產環境正確做法：設定適當的政策
CREATE POLICY "Users can create their own forms"
ON forms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own forms"
ON forms FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
ON forms FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
ON forms FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 錯誤 4：localStorage 資料遺失

**症狀：**
刷新頁面後資料消失

**原因：**
- 瀏覽器隱私模式
- 手動清除快取
- 不同的瀏覽器或裝置

**解決方式：**
```typescript
// 在應用啟動時載入資料
onMounted(() => {
  const offlineStore = useOfflineStore()
  offlineStore.loadForms()
})

// 確保每次變更都儲存
watch(
  () => offlineStore.forms,
  () => {
    offlineStore.saveForms()
  },
  { deep: true }
)
```

### 錯誤 5：環境變數未載入

**症狀：**
```
Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')
```

**解決方式：**
1. 確認 `.env` 檔案存在於專案根目錄
2. 環境變數必須以 `VITE_` 開頭
3. 修改 `.env` 後需要重啟開發伺服器

```bash
# 停止開發伺服器 (Ctrl+C)
# 重新啟動
npm run dev
```

### 錯誤 6：型別錯誤

**症狀：**
```
Type 'string | undefined' is not assignable to type 'string'
```

**解決方式：**
```typescript
// 不好的做法
const url = import.meta.env.VITE_SUPABASE_URL

// 好的做法：提供預設值或檢查
const url = import.meta.env.VITE_SUPABASE_URL || ''

// 或使用型別斷言（確定該值存在時）
const url = import.meta.env.VITE_SUPABASE_URL!

// 最佳做法：在應用啟動時驗證
function validateEnv() {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL is not defined')
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined')
  }
}

validateEnv()
```

---

## 5. 除錯技巧

### 查看 Supabase 請求詳情

```typescript
// 啟用詳細日誌
const { data, error } = await supabase
  .from('forms')
  .insert(form)
  .select()

console.log('請求結果:', { data, error })

// 查看當前 session
const { data: { session } } = await supabase.auth.getSession()
console.log('當前 session:', session)
```

### 使用瀏覽器開發者工具

1. 開啟 **Network** 標籤
2. 篩選 `Fetch/XHR`
3. 檢查請求的：
   - Headers (特別是 `Authorization`)
   - Payload
   - Response

### 檢查 localStorage

```javascript
// 在瀏覽器控制台執行
console.log('Forms:', localStorage.getItem('qter_forms'))
console.log('All keys:', Object.keys(localStorage))

// 清除所有資料（小心使用）
localStorage.clear()
```

---

## 6. 快速診斷指令

### 檢查 Supabase 連接

```typescript
// 在瀏覽器控制台或元件中執行
import { supabase } from '@/services/supabase'

// 測試連接
const { data, error } = await supabase
  .from('forms')
  .select('count')

console.log('連接測試:', { data, error })
```

### 檢查認證狀態

```typescript
// 完整的認證狀態檢查
async function diagAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  console.log('=== 認證診斷 ===')
  console.log('User:', user)
  console.log('Session:', session)
  console.log('Is authenticated:', !!user)

  if (session) {
    console.log('Token expires at:', new Date(session.expires_at! * 1000))
  }
}

diagAuth()
```

---

## 7. 聯絡資訊

如果以上方法都無法解決問題，請：

1. 檢查 [Supabase 官方文檔](https://supabase.com/docs)
2. 查看專案的 GitHub Issues
3. 聯絡開發團隊

---

**最後更新：** 2025-11-16
