// API 服務層 - 使用 Supabase
import { supabase } from '../lib/supabase'
import type { Form } from '../types'
import type { Database } from '../types/database'

export const formApi = {
  async getForms(): Promise<{ success: boolean; forms: Form[] }> {
    try {
      // 使用固定測試用戶 ID 查詢
      const defaultUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      console.log('🔵 [API] getForms called with userId:', defaultUserId)

      console.log('📤 [API] Sending to Supabase: SELECT * FROM forms WHERE user_id =', defaultUserId)
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', defaultUserId)
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

      console.log('✅ [API] Success: Retrieved', forms.length, 'forms')
      return { success: true, forms }
    } catch (error) {
      console.error('❌ [API] getForms error:', error)
      console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
      throw error
    }
  },

  async getForm(id: string): Promise<{ success: boolean; form: Form }> {
    try {
      console.log('🔵 [API] getForm called with id:', id)

      console.log('📤 [API] Sending to Supabase: SELECT * FROM forms WHERE id =', id)
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

      console.log('✅ [API] Success: Retrieved form:', form.id, form.title)
      return { success: true, form }
    } catch (error) {
      console.error('❌ [API] getForm error:', error)
      console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
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
      console.log('🔵 [API] createForm called with:', data.id, data.title)

      // 使用固定測試用戶 ID（暫時方案，與 sync-form.html 一致）
      const defaultUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

      // 轉換前端格式到資料庫欄位名稱
      const insertData = {
        id: data.id,
        user_id: defaultUserId,
        title: data.title,
        description: data.description || null,
        questions: data.questions as any,
        display_mode: data.displayMode || 'step-by-step',
        markdown_content: data.markdownContent || null,
        auto_advance: data.autoAdvance ?? true,
        auto_advance_delay: data.autoAdvanceDelay ?? 300,
        show_progress: data.showProgress ?? true,
        allow_go_back: data.allowGoBack ?? true,
        status: 'active',
      }

      console.log('📤 [API] Sending to Supabase (upsert):', insertData)
      const { data: result, error } = await supabase
        .from('forms')
        .upsert(insertData as any, {
          onConflict: 'id',  // 如果 ID 衝突則更新
          ignoreDuplicates: false  // 不忽略，而是更新
        })
        .select()
        .single<Database['public']['Tables']['forms']['Row']>()

      if (error) {
        console.error('❌ [API] Supabase upsert error:', error)
        console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ [API] Success: Form created/updated in database:', result.id)
      return { success: true, form: result }
    } catch (error) {
      console.error('❌ [API] createForm failed:', error)
      console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
      throw error
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
      console.log('🔵 [API] updateForm called with:', id, data.title || '(title not updated)')

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

      console.log('📤 [API] Sending to Supabase:', updateData)
      const { error } = await (supabase
        .from('forms') as any)
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('❌ [API] Supabase update error:', error)
        console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('✅ [API] Success: Form updated in database:', id)
      return { success: true }
    } catch (error) {
      console.error('❌ [API] updateForm failed:', error)
      console.error('❌ [API] Error details:', JSON.stringify(error, null, 2))
      throw error
    }
  },

  async deleteForm(id: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('✅ Form deleted from database:', id)
      return { success: true }
    } catch (error) {
      console.error('❌ deleteForm failed:', error)
      throw error
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