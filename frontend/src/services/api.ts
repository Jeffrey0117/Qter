import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private axiosInstance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshToken();
            }
            const newToken = await this.refreshPromise;
            this.refreshPromise = null;
            
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      this.setTokens(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name: string }) {
    const response = await this.axiosInstance.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.axiosInstance.post('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.axiosInstance.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.clearTokens();
  }

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
  }
}

export default new ApiService();