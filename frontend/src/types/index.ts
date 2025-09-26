// 類型定義

export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'date' | 'file' | 'divider'

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