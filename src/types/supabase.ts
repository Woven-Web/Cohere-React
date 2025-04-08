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
      custom_instructions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          url_pattern: string
          use_playwright: boolean
          instructions_text: string | null
          priority: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          url_pattern: string
          use_playwright?: boolean
          instructions_text?: string | null
          priority?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          url_pattern?: string
          use_playwright?: boolean
          instructions_text?: string | null
          priority?: number
          is_active?: boolean
        }
      }
      event_flags: {
        Row: {
          id: string
          happening_id: string
          flagger_user_id: string
          changes_requested: string
          status: 'pending' | 'resolved' | 'rejected'
          created_at: string
          updated_at: string
          resolved_by_user_id: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          happening_id: string
          flagger_user_id: string
          changes_requested: string
          status?: 'pending' | 'resolved' | 'rejected'
          created_at?: string
          updated_at?: string
          resolved_by_user_id?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          happening_id?: string
          flagger_user_id?: string
          changes_requested?: string
          status?: 'pending' | 'resolved' | 'rejected'
          created_at?: string
          updated_at?: string
          resolved_by_user_id?: string | null
          resolved_at?: string | null
        }
      }
      happenings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          start_datetime: string
          end_datetime: string | null
          location: string | null
          source_url: string | null
          submitter_user_id: string
          scrape_log_id: string | null
          status: 'pending' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          start_datetime: string
          end_datetime?: string | null
          location?: string | null
          source_url?: string | null
          submitter_user_id: string
          scrape_log_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          start_datetime?: string
          end_datetime?: string | null
          location?: string | null
          source_url?: string | null
          submitter_user_id?: string
          scrape_log_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
        }
      }
      scrape_logs: {
        Row: {
          id: string
          created_at: string
          requested_by_user_id: string
          url_scraped: string
          custom_instruction_id_used: string | null
          playwright_flag_used: boolean
          raw_llm_response: Json | null
          parsed_event_data: Json | null
          is_reported_bad: boolean
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          requested_by_user_id: string
          url_scraped: string
          custom_instruction_id_used?: string | null
          playwright_flag_used: boolean
          raw_llm_response?: Json | null
          parsed_event_data?: Json | null
          is_reported_bad?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          requested_by_user_id?: string
          url_scraped?: string
          custom_instruction_id_used?: string | null
          playwright_flag_used?: boolean
          raw_llm_response?: Json | null
          parsed_event_data?: Json | null
          is_reported_bad?: boolean
          error_message?: string | null
        }
      }
      user_attendance: {
        Row: {
          user_id: string
          happening_id: string
          status: 'going' | 'maybe_going'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          happening_id: string
          status: 'going' | 'maybe_going'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          happening_id?: string
          status?: 'going' | 'maybe_going'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          role: 'basic' | 'submitter' | 'curator' | 'admin'
          updated_at: string
          email: string | null
        }
        Insert: {
          id: string
          role?: 'basic' | 'submitter' | 'curator' | 'admin'
          updated_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          role?: 'basic' | 'submitter' | 'curator' | 'admin'
          updated_at?: string
          email?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: 'basic' | 'submitter' | 'curator' | 'admin'
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
