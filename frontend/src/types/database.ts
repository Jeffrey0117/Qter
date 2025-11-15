// Supabase 資料庫類型定義
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
          user_id?: string
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
