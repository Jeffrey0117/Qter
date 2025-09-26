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

<<<<<<< HEAD
  async forgotPassword(email: string) {
    return this.axiosInstance.post('/auth/forgot-password', { email });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.axiosInstance.post('/auth/reset-password', data);
  }

  async getProfile() {
    return this.axiosInstance.get('/auth/profile');
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.axiosInstance.put('/auth/profile', data);
  }

  // Form endpoints
  async getForms(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    return this.axiosInstance.get('/forms', { params });
  }

  async getForm(id: number) {
    return this.axiosInstance.get(`/forms/${id}`);
  }

  // Public form (for filling)
  async getPublicForm(id: number) {
    // backend mounts formRoutes at /api with public route GET /public/:id
    return this.axiosInstance.get(`/public/${id}`);
  }

  async createForm(data: any) {
    return this.axiosInstance.post('/forms', data);
  }

  async updateForm(id: number, data: any) {
    return this.axiosInstance.put(`/forms/${id}`, data);
  }

  async deleteForm(id: number) {
    return this.axiosInstance.delete(`/forms/${id}`);
  }

  async duplicateForm(id: number) {
    return this.axiosInstance.post(`/forms/${id}/duplicate`);
  }

  async publishForm(id: number) {
    return this.axiosInstance.patch(`/forms/${id}/publish`);
  }

  async unpublishForm(id: number) {
    return this.axiosInstance.patch(`/forms/${id}/unpublish`);
  }

  // Question endpoints
  async addQuestion(formId: number, data: any) {
    return this.axiosInstance.post(`/forms/${formId}/questions`, data);
  }

  async updateQuestion(formId: number, questionId: number, data: any) {
    return this.axiosInstance.put(`/forms/${formId}/questions/${questionId}`, data);
  }

  async deleteQuestion(formId: number, questionId: number) {
    return this.axiosInstance.delete(`/forms/${formId}/questions/${questionId}`);
  }

  async reorderQuestions(formId: number, questionIds: number[]) {
    return this.axiosInstance.patch(`/forms/${formId}/questions/reorder`, { questionIds });
  }

  // Response endpoints
  async submitResponse(formId: number, data: any) {
    return this.axiosInstance.post(`/forms/${formId}/responses`, data);
  }

  async getFormResponses(formId: number, params?: any) {
    return this.axiosInstance.get(`/forms/${formId}/responses`, { params });
  }

  async getResponse(responseId: number) {
    return this.axiosInstance.get(`/responses/${responseId}`);
  }

  async deleteResponse(responseId: number) {
    return this.axiosInstance.delete(`/responses/${responseId}`);
  }

  async getFormStatistics(formId: number) {
    return this.axiosInstance.get(`/forms/${formId}/statistics`);
  }

  async exportResponses(formId: number, format: 'csv' | 'excel') {
    return this.axiosInstance.get(`/forms/${formId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  // File endpoints
  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return this.axiosInstance.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  async deleteFile(fileId: string) {
    return this.axiosInstance.delete(`/files/${fileId}`);
  }

  // Generic request method for custom endpoints
  request(config: AxiosRequestConfig) {
    return this.axiosInstance.request(config);
=======
    return await response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
>>>>>>> de9b241
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