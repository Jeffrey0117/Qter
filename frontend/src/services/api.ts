// API 服務層
import type { Form, Question } from '../types'

// API 基礎配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 通用 API 請求函數
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // 添加認證 token（如果有的話）
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// 表單相關 API
export const formApi = {
  // 獲取所有表單
  async getForms(): Promise<Form[]> {
    return apiRequest('/forms')
  },

  // 獲取單個表單
  async getForm(id: string): Promise<Form> {
    return apiRequest(`/forms/${id}`)
  },

  // 創建表單
  async createForm(form: Omit<Form, 'id'>): Promise<Form> {
    return apiRequest('/forms', {
      method: 'POST',
      body: JSON.stringify(form),
    })
  },

  // 更新表單
  async updateForm(id: string, form: Partial<Form>): Promise<Form> {
    return apiRequest(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    })
  },

  // 刪除表單
  async deleteForm(id: string): Promise<void> {
    return apiRequest(`/forms/${id}`, {
      method: 'DELETE',
    })
  },

  // 提交表單回應
  async submitResponse(formId: string, responses: Record<string, any>): Promise<any> {
    return apiRequest(`/forms/${formId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    })
  },

  // 獲取表單回應
  async getResponses(formId: string): Promise<any[]> {
    return apiRequest(`/forms/${formId}/responses`)
  },
}

// 認證相關 API
export const authApi = {
  // 登入
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // 註冊
  async register(email: string, password: string, name: string): Promise<{ token: string; user: any }> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  // 獲取當前用戶
  async getCurrentUser(): Promise<any> {
    return apiRequest('/auth/me')
  },
}

// 檔案上傳 API
export const fileApi = {
  // 上傳檔案
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    return response.json()
  },
}

// 導出所有 API
export const api = {
  form: formApi,
  auth: authApi,
  file: fileApi,
}