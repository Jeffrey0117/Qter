// 類型定義

export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'date' | 'file' | 'divider'

export type DisplayMode = 'step-by-step' | 'all-at-once'

export interface Option {
  id: string
  text: string
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: Option[]
}

export interface Form {
  id: string
  title: string
  description: string
  questions: Question[]
  displayMode?: DisplayMode
  // 新增設定：自動跳題與延遲（預設 true / 300ms）
  autoAdvance?: boolean
  autoAdvanceDelay?: number
  // 顯示進度條（預設 true）與允許回到上一題（預設 true）
  showProgress?: boolean
  allowGoBack?: boolean
  createdAt?: string
  updatedAt?: string
  userId?: string
}

export interface FormResponse {
  id: string
  formId: string
  responses: Record<string, any>
  submittedAt: string
  userId?: string
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

// API 錯誤類型
export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}