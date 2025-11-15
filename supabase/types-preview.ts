/**
 * QTER Supabase 資料庫類型定義預覽
 *
 * 這個文件展示了 Supabase 會生成的 TypeScript 類型結構
 * 實際使用時請執行: supabase gen types typescript --local
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          created_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          markdown_content: string | null
          questions: Json | null
          display_mode: string
          show_progress_bar: boolean
          enable_auto_advance: boolean
          advance_delay: number
          allow_back_navigation: boolean
          auto_advance: boolean
          auto_advance_delay: number
          show_progress: boolean
          allow_go_back: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          markdown_content?: string | null
          questions?: Json | null
          display_mode?: string
          show_progress_bar?: boolean
          enable_auto_advance?: boolean
          advance_delay?: number
          allow_back_navigation?: boolean
          auto_advance?: boolean
          auto_advance_delay?: number
          show_progress?: boolean
          allow_go_back?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          markdown_content?: string | null
          questions?: Json | null
          display_mode?: string
          show_progress_bar?: boolean
          enable_auto_advance?: boolean
          advance_delay?: number
          allow_back_navigation?: boolean
          auto_advance?: boolean
          auto_advance_delay?: number
          show_progress?: boolean
          allow_go_back?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      share_links: {
        Row: {
          id: string
          form_id: string
          hash: string
          is_enabled: boolean
          allow_anonymous: boolean
          expire_at: string | null
          max_responses: number | null
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          hash: string
          is_enabled?: boolean
          allow_anonymous?: boolean
          expire_at?: string | null
          max_responses?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          hash?: string
          is_enabled?: boolean
          allow_anonymous?: boolean
          expire_at?: string | null
          max_responses?: number | null
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          form_id: string
          share_link_id: string | null
          respondent_user_id: string | null
          respondent_hash: string | null
          submitted_at: string
          meta_json: Json | null
        }
        Insert: {
          id?: string
          form_id: string
          share_link_id?: string | null
          respondent_user_id?: string | null
          respondent_hash?: string | null
          submitted_at?: string
          meta_json?: Json | null
        }
        Update: {
          id?: string
          form_id?: string
          share_link_id?: string | null
          respondent_user_id?: string | null
          respondent_hash?: string | null
          submitted_at?: string
          meta_json?: Json | null
        }
      }
      response_items: {
        Row: {
          id: string
          response_id: string
          question_id: string
          value_text: string | null
          value_number: number | null
          value_json: Json | null
        }
        Insert: {
          id?: string
          response_id: string
          question_id: string
          value_text?: string | null
          value_number?: number | null
          value_json?: Json | null
        }
        Update: {
          id?: string
          response_id?: string
          question_id?: string
          value_text?: string | null
          value_number?: number | null
          value_json?: Json | null
        }
      }
    }
    Functions: {
      is_share_link_valid: {
        Args: { link_hash: string }
        Returns: boolean
      }
      get_form_by_share_link: {
        Args: { link_hash: string }
        Returns: {
          form_id: string
          form_title: string
          form_description: string
          form_questions: Json
          form_display_mode: string
          form_show_progress_bar: boolean
          form_allow_back_navigation: boolean
        }[]
      }
      get_form_response_stats: {
        Args: { form_uuid: string }
        Returns: {
          total_responses: number
          latest_response: string
          unique_respondents: number
        }[]
      }
    }
  }
}

// ============================================================================
// 自訂類型定義（業務邏輯相關）
// ============================================================================

/**
 * 問題類型
 */
export type QuestionType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'time'
  | 'datetime'
  | 'range'
  | 'file'

/**
 * 問題選項
 */
export interface QuestionOption {
  label: string
  value: string
}

/**
 * 問題定義
 */
export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  placeholder?: string
  options?: QuestionOption[]
  min?: number
  max?: number
  step?: number
  pattern?: string
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

/**
 * 問卷狀態
 */
export type FormStatus = 'active' | 'draft' | 'archived' | 'closed'

/**
 * 顯示模式
 */
export type DisplayMode = 'step-by-step' | 'all-in-one'

/**
 * 完整的問卷類型（含 questions 解析）
 */
export interface FormWithQuestions extends Database['public']['Tables']['forms']['Row'] {
  questions: Question[]
}

/**
 * 回應 metadata
 */
export interface ResponseMeta {
  ip?: string
  userAgent?: string
  referrer?: string
  language?: string
  screenResolution?: string
  timezone?: string
  [key: string]: any
}

/**
 * 完整的回應類型（含 meta 解析）
 */
export interface ResponseWithMeta extends Database['public']['Tables']['responses']['Row'] {
  meta_json: ResponseMeta | null
}

/**
 * 回應項目（含答案解析）
 */
export interface ResponseItemWithValue extends Database['public']['Tables']['response_items']['Row'] {
  value_json: string[] | Record<string, any> | null
}

/**
 * 統計資料
 */
export interface FormStats {
  total_responses: number
  latest_response: string | null
  unique_respondents: number
  completion_rate?: number
  average_time?: number
}

/**
 * 問卷含統計
 */
export interface FormWithStats extends FormWithQuestions {
  stats: FormStats
}

/**
 * 完整的回應（含項目和用戶資訊）
 */
export interface FullResponse {
  response: ResponseWithMeta
  items: ResponseItemWithValue[]
  respondent?: Database['public']['Tables']['users']['Row']
}

// ============================================================================
// Supabase 客戶端類型輔助
// ============================================================================

/**
 * 表格名稱
 */
export type TableName = keyof Database['public']['Tables']

/**
 * 表格的 Row 類型
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

/**
 * 表格的 Insert 類型
 */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/**
 * 表格的 Update 類型
 */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

// ============================================================================
// API 請求/回應類型
// ============================================================================

/**
 * 創建問卷請求
 */
export interface CreateFormRequest {
  title: string
  description?: string
  markdown_content?: string
  questions: Question[]
  display_mode?: DisplayMode
  show_progress_bar?: boolean
  enable_auto_advance?: boolean
  advance_delay?: number
  allow_back_navigation?: boolean
}

/**
 * 更新問卷請求
 */
export interface UpdateFormRequest extends Partial<CreateFormRequest> {
  status?: FormStatus
}

/**
 * 創建分享連結請求
 */
export interface CreateShareLinkRequest {
  form_id: string
  allow_anonymous?: boolean
  expire_at?: string
  max_responses?: number
}

/**
 * 提交回應請求
 */
export interface SubmitResponseRequest {
  form_id: string
  share_link_id: string
  answers: Record<string, any>
  meta?: ResponseMeta
}

/**
 * 查詢參數
 */
export interface QueryParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  status?: FormStatus
  search?: string
}

// ============================================================================
// 使用範例
// ============================================================================

/*
// 1. 使用 Supabase 客戶端
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types-preview'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

// 2. 類型安全的查詢
const { data: forms } = await supabase
  .from('forms')
  .select('*')
  .eq('user_id', userId)

// 3. 使用自訂類型
const form: FormWithQuestions = {
  ...formRow,
  questions: JSON.parse(formRow.questions as string)
}

// 4. 插入數據
const newForm: TableInsert<'forms'> = {
  user_id: userId,
  title: 'New Form',
  questions: questionsArray
}

const { data, error } = await supabase
  .from('forms')
  .insert(newForm)
  .select()
  .single()

// 5. 調用函數
const { data: isValid } = await supabase
  .rpc('is_share_link_valid', { link_hash: 'abc123' })

// 6. 複雜查詢
const { data: fullResponse } = await supabase
  .from('responses')
  .select(`
    *,
    items:response_items(*),
    respondent:users(*)
  `)
  .eq('id', responseId)
  .single()
*/
