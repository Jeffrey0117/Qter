import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GOOGLE_CLIENT_ID } from '@/config/google'

interface User {
  id: string
  email: string
  name: string
  picture: string
  googleId: string
}

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const googleInitialized = ref(false)

  // 計算屬性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userInitials = computed(() => {
    if (!user.value?.name) return ''
    return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase()
  })

  // 方法
  const initGoogleAuth = async () => {
    try {
      isLoading.value = true
      await waitForGoogle()

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        ux_mode: 'popup',
      })

      googleInitialized.value = true
    } catch (e) {
      console.error('Google Identity Services not loaded', e)
      error.value = '無法載入 Google 登入，請重試'
    } finally {
      isLoading.value = false
    }
  }

  const handleGoogleResponse = async (response: any) => {
    try {
      isLoading.value = true
      error.value = null
      console.debug('[Auth] Google callback received', { hasCredential: !!response?.credential })

      // 解碼 JWT token 獲取用戶資訊
      const credential = response.credential
      const payload = decodeJWT(credential)
      console.debug('[Auth] Decoded payload', { sub: payload.sub, email: payload.email, name: payload.name })
      if (!payload?.email || !payload?.sub) {
        console.warn('[Auth] Payload missing fields, will still proceed but redirect may be blocked by guard')
      }
      
      // 設定用戶資料
      user.value = {
        id: payload.sub,
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
      
      // 儲存 token
      token.value = credential
      localStorage.setItem('auth_token', credential)
      localStorage.setItem('user', JSON.stringify(user.value))

      // 確認認證狀態，並做保險導向（避免 watch 沒觸發）
      console.debug('[Auth] State set, isAuthenticated =', isAuthenticated.value)
      if (isAuthenticated.value) {
        // 若使用 One Tap，避免自動再次彈出
        if (typeof google !== 'undefined') {
          try { google.accounts.id.disableAutoSelect() } catch {}
        }
        // 硬導向，確保能離開登入頁
        window.location.assign('/dashboard')
      }
      
    } catch (e) {
      error.value = '登入失敗，請稍後再試'
      console.error('Login error:', e)
    } finally {
      isLoading.value = false
    }
  }

  const login = async () => {
    try {
      await initGoogleAuth()
      google.accounts.id.prompt()
    } catch (e) {
      console.error('Google Identity Services not loaded')
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    
    // 撤銷 Google 登入
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect()
    }
  }

  const checkAuth = () => {
    // 檢查本地儲存的認證資訊
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  // 解碼 JWT token
  const decodeJWT = (token: string) => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  // 等待 Google GSI 載入
  const waitForGoogle = (maxWait = 8000, interval = 50): Promise<void> => {
    if (typeof google !== 'undefined' && google?.accounts?.id) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const timer = setInterval(() => {
        if (typeof google !== 'undefined' && google?.accounts?.id) {
          clearInterval(timer)
          resolve()
        } else if (Date.now() - start > maxWait) {
          clearInterval(timer)
          reject(new Error('Google GSI script not ready'))
        }
      }, interval)
    })
  }

  return {
    // 狀態
    user,
    token,
    isLoading,
    error,
    // 計算屬性
    isAuthenticated,
    userInitials,
    // 方法
    initGoogleAuth,
    login,
    logout,
    checkAuth
  }
})