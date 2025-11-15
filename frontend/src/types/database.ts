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
          questions: Json
          display_mode: string
          markdown_content: string | null
          auto_advance: boolean
          auto_advance_delay: number
          show_progress: boolean
          allow_go_back: boolean
          share_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id?: string
          title: string
          description?: string | null
          questions: Json
          display_mode?: string
          markdown_content?: string | null
          auto_advance?: boolean
          auto_advance_delay?: number
          show_progress?: boolean
          allow_go_back?: boolean
          share_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          questions?: Json
          display_mode?: string
          markdown_content?: string | null
          auto_advance?: boolean
          auto_advance_delay?: number
          show_progress?: boolean
          allow_go_back?: boolean
          share_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          form_id: string
          user_id: string | null
          responses: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          user_id?: string | null
          responses: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          user_id?: string | null
          responses?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
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
