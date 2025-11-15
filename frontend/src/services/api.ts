// API 服務層 - 使用 Supabase
import { supabase } from '../lib/supabase'
import type { Form } from '../types'
import type { Database } from '../types/database'

export const formApi = {
  async getForms(): Promise<{ success: boolean; forms: Form[] }> {
    try {
      const { data: session } = await supabase.auth.getSession()

      // 離線模式：如果沒有 session，返回本地 localStorage 數據
      if (!session?.session?.user) {
        const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
        return { success: true, forms: localForms }
      }

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 轉換資料庫欄位名稱到前端格式
      const forms = (data || []).map((form: any) => ({
        id: form.id,
        userId: form.user_id,
        title: form.title,
        description: form.description || '',
        questions: form.questions,
        displayMode: (form.display_mode || 'step-by-step') as any,
        markdownContent: form.markdown_content || '',
        autoAdvance: form.auto_advance,
        autoAdvanceDelay: form.auto_advance_delay,
        showProgress: form.show_progress,
        allowGoBack: form.allow_go_back,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
      }))

      return { success: true, forms }
    } catch (error) {
      console.error('getForms error:', error)
      // 降級到本地數據
      const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      return { success: true, forms: localForms }
    }
  },

  async getForm(id: string): Promise<{ success: boolean; form: Form }> {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single<Database['public']['Tables']['forms']['Row']>()

      if (error) throw error

      // 轉換資料庫欄位名稱到前端格式
      const form = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        questions: data.questions,
        displayMode: (data.display_mode || 'step-by-step') as any,
        markdownContent: data.markdown_content || '',
        autoAdvance: data.auto_advance,
        autoAdvanceDelay: data.auto_advance_delay,
        showProgress: data.show_progress,
        allowGoBack: data.allow_go_back,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return { success: true, form }
    } catch (error) {
      console.error('getForm error:', error)
      throw error
    }
  },

  async createForm(data: {
    id: string
    title: string
    description?: string
    questions: any[]
    displayMode?: string
    markdownContent?: string
    autoAdvance?: boolean
    autoAdvanceDelay?: number
    showProgress?: boolean
    allowGoBack?: boolean
  }): Promise<{ success: boolean; form: any }> {
    try {
      const { data: session } = await supabase.auth.getSession()

      // 離線模式：如果沒有 session，僅儲存到 localStorage
      if (!session?.session?.user) {
        const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
        const newForm = {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        localForms.push(newForm)
        localStorage.setItem('qter_forms', JSON.stringify(localForms))
        return { success: true, form: newForm }
      }

      // 轉換前端格式到資料庫欄位名稱
      const insertData = {
        id: data.id,
        user_id: session.session.user.id,
        title: data.title,
        description: data.description || null,
        questions: data.questions as any,
        display_mode: data.displayMode || 'classic',
        markdown_content: data.markdownContent || null,
        auto_advance: data.autoAdvance ?? false,
        auto_advance_delay: data.autoAdvanceDelay ?? 3,
        show_progress: data.showProgress ?? true,
        allow_go_back: data.allowGoBack ?? true,
      }

      const { data: result, error } = await supabase
        .from('forms')
        .insert(insertData as any)
        .select()
        .single<Database['public']['Tables']['forms']['Row']>()

      if (error) throw error

      return { success: true, form: result }
    } catch (error) {
      console.error('createForm error:', error)
      // 降級到本地存儲
      const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      const newForm = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localForms.push(newForm)
      localStorage.setItem('qter_forms', JSON.stringify(localForms))
      return { success: true, form: newForm }
    }
  },

  async updateForm(id: string, data: {
    title?: string
    description?: string
    questions?: any[]
    displayMode?: string
    markdownContent?: string
    autoAdvance?: boolean
    autoAdvanceDelay?: number
    showProgress?: boolean
    allowGoBack?: boolean
  }): Promise<{ success: boolean }> {
    try {
      const { data: session } = await supabase.auth.getSession()

      // 離線模式：如果沒有 session，僅更新 localStorage
      if (!session?.session?.user) {
        const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
        const formIndex = localForms.findIndex((f: any) => f.id === id)
        if (formIndex !== -1) {
          localForms[formIndex] = {
            ...localForms[formIndex],
            ...data,
            updatedAt: new Date().toISOString(),
          }
          localStorage.setItem('qter_forms', JSON.stringify(localForms))
        }
        return { success: true }
      }

      // 轉換前端格式到資料庫欄位名稱
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.questions !== undefined) updateData.questions = data.questions
      if (data.displayMode !== undefined) updateData.display_mode = data.displayMode
      if (data.markdownContent !== undefined) updateData.markdown_content = data.markdownContent
      if (data.autoAdvance !== undefined) updateData.auto_advance = data.autoAdvance
      if (data.autoAdvanceDelay !== undefined) updateData.auto_advance_delay = data.autoAdvanceDelay
      if (data.showProgress !== undefined) updateData.show_progress = data.showProgress
      if (data.allowGoBack !== undefined) updateData.allow_go_back = data.allowGoBack
      updateData.updated_at = new Date().toISOString()

      const { error } = await (supabase
        .from('forms') as any)
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('updateForm error:', error)
      // 降級到本地存儲
      const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      const formIndex = localForms.findIndex((f: any) => f.id === id)
      if (formIndex !== -1) {
        localForms[formIndex] = {
          ...localForms[formIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem('qter_forms', JSON.stringify(localForms))
      }
      return { success: true }
    }
  },

  async deleteForm(id: string): Promise<{ success: boolean }> {
    try {
      const { data: session } = await supabase.auth.getSession()

      // 離線模式：如果沒有 session，僅從 localStorage 刪除
      if (!session?.session?.user) {
        const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
        const filteredForms = localForms.filter((f: any) => f.id !== id)
        localStorage.setItem('qter_forms', JSON.stringify(filteredForms))
        return { success: true }
      }

      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('deleteForm error:', error)
      // 降級到本地存儲
      const localForms = JSON.parse(localStorage.getItem('qter_forms') || '[]')
      const filteredForms = localForms.filter((f: any) => f.id !== id)
      localStorage.setItem('qter_forms', JSON.stringify(filteredForms))
      return { success: true }
    }
  },

  async submitResponse(formId: string, responses: Record<string, any>): Promise<any> {
    try {
      const { data: session } = await supabase.auth.getSession()

      const insertData = {
        form_id: formId,
        respondent_user_id: session?.session?.user?.id || null,
        submitted_at: new Date().toISOString(),
        meta_json: { responses } as any,
      }

      const { data, error } = await supabase
        .from('responses')
        .insert(insertData as any)
        .select()
        .single<Database['public']['Tables']['responses']['Row']>()

      if (error) throw error

      return { success: true, response: data }
    } catch (error) {
      console.error('submitResponse error:', error)
      throw error
    }
  },

  async getResponses(formId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('getResponses error:', error)
      throw error
    }
  },
}

// 認證相關 API - 使用 Supabase Auth
export const authApi = {
  // 使用 Google OAuth 登入
  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  },

  // Email/Password 登入
  async login(email: string, password: string): Promise<{ user: any; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { user: data.user, session: data.session }
  },

  // 註冊
  async register(email: string, password: string, metadata?: { name?: string }): Promise<{ user: any; session: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
    return { user: data.user, session: data.session }
  },

  // 登出
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 獲取當前用戶
  async getCurrentUser(): Promise<any> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // 獲取當前 Session
  async getSession(): Promise<any> {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },
}

// 公開填寫 API - 使用 Supabase
export const publicApi = {
  // 以分享哈希取得公開表單
  async getFormByHash(hash: string): Promise<any> {
    try {
      // 通過 share_links 表查詢表單
      const { data: shareLink, error: shareLinkError } = await supabase
        .from('share_links')
        .select('form_id, is_enabled, expire_at')
        .eq('hash', hash)
        .single<Database['public']['Tables']['share_links']['Row']>()

      if (shareLinkError) throw shareLinkError
      if (!shareLink.is_enabled) throw new Error('Share link is disabled')
      if (shareLink.expire_at && new Date(shareLink.expire_at) < new Date()) {
        throw new Error('Share link has expired')
      }

      // 查詢表單詳情
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', shareLink.form_id)
        .single<Database['public']['Tables']['forms']['Row']>()

      if (error) throw error

      // 轉換資料庫欄位名稱到前端格式
      const form = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        questions: data.questions,
        displayMode: (data.display_mode || 'step-by-step') as any,
        markdownContent: data.markdown_content || '',
        autoAdvance: data.auto_advance,
        autoAdvanceDelay: data.auto_advance_delay,
        showProgress: data.show_progress,
        allowGoBack: data.allow_go_back,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      return { success: true, form }
    } catch (error) {
      console.error('getFormByHash error:', error)
      throw error
    }
  },

  // 提交公開回覆
  async submitByHash(hash: string, payload: { responses: Record<string, any>; turnstileToken?: string }): Promise<any> {
    try {
      // 查詢 share_link 和 form
      const { data: shareLink, error: shareLinkError } = await supabase
        .from('share_links')
        .select('id, form_id, is_enabled')
        .eq('hash', hash)
        .single<Database['public']['Tables']['share_links']['Row']>()

      if (shareLinkError) throw shareLinkError
      if (!shareLink.is_enabled) throw new Error('Share link is disabled')

      // 創建 response 記錄
      const responseInsertData = {
        form_id: shareLink.form_id,
        share_link_id: shareLink.id,
        respondent_user_id: null,
        submitted_at: new Date().toISOString(),
        meta_json: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        } as any,
      }

      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert(responseInsertData as any)
        .select()
        .single<Database['public']['Tables']['responses']['Row']>()

      if (responseError) throw responseError

      // 插入每個問題的回答到 response_items
      const responseItems: any[] = Object.entries(payload.responses).map(([questionId, answer]) => {
        let value_text: string | null = null
        let value_number: number | null = null
        let value_json: any = null

        if (typeof answer === 'string') {
          value_text = answer
          const num = Number(answer)
          if (!isNaN(num)) value_number = num
        } else if (typeof answer === 'number') {
          value_number = answer
          value_text = String(answer)
        } else {
          value_json = answer
        }

        return {
          response_id: responseData.id,
          question_id: questionId,
          value_text,
          value_number,
          value_json,
        }
      })

      const { error: itemsError } = await supabase
        .from('response_items')
        .insert(responseItems as any)

      if (itemsError) throw itemsError

      return { success: true, responseId: responseData.id }
    } catch (error) {
      console.error('submitByHash error:', error)
      throw error
    }
  },
}

// 檔案上傳 API - 使用 Supabase Storage
export const fileApi = {
  // 上傳檔案到 Supabase Storage
  async uploadFile(file: File, bucket: string = 'uploads'): Promise<{ url: string; filename: string; path: string }> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) {
        throw new Error('User not authenticated')
      }

      // 生成唯一檔案名稱
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.session.user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // 取得公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return {
        url: publicUrl,
        filename: file.name,
        path: data.path,
      }
    } catch (error) {
      console.error('uploadFile error:', error)
      throw error
    }
  },

  // 刪除檔案
  async deleteFile(path: string, bucket: string = 'uploads'): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
    } catch (error) {
      console.error('deleteFile error:', error)
      throw error
    }
  },
}

// 導出所有 API
export const api = {
  form: formApi,
  auth: authApi,
  file: fileApi,
  public: publicApi,
}

// 導出 default 以相容舊的 import 方式
export default api