export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_instructions: {
        Row: {
          created_at: string
          id: string
          instructions_text: string | null
          is_active: boolean
          priority: number
          updated_at: string
          url_pattern: string
          use_playwright: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          instructions_text?: string | null
          is_active?: boolean
          priority?: number
          updated_at?: string
          url_pattern: string
          use_playwright?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          instructions_text?: string | null
          is_active?: boolean
          priority?: number
          updated_at?: string
          url_pattern?: string
          use_playwright?: boolean
        }
        Relationships: []
      }
      event_flags: {
        Row: {
          changes_requested: string
          created_at: string
          flagger_user_id: string
          happening_id: string
          id: string
          resolved_at: string | null
          resolved_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          changes_requested: string
          created_at?: string
          flagger_user_id: string
          happening_id: string
          id?: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          changes_requested?: string
          created_at?: string
          flagger_user_id?: string
          happening_id?: string
          id?: string
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_flags_happening_id_fkey"
            columns: ["happening_id"]
            isOneToOne: false
            referencedRelation: "happenings"
            referencedColumns: ["id"]
          },
        ]
      }
      happenings: {
        Row: {
          created_at: string
          description: string | null
          end_datetime: string | null
          id: string
          location: string | null
          scrape_log_id: string | null
          source_url: string | null
          start_datetime: string
          status: string
          submitter_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          id?: string
          location?: string | null
          scrape_log_id?: string | null
          source_url?: string | null
          start_datetime: string
          status?: string
          submitter_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          id?: string
          location?: string | null
          scrape_log_id?: string | null
          source_url?: string | null
          start_datetime?: string
          status?: string
          submitter_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scrape_logs: {
        Row: {
          created_at: string
          custom_instruction_id_used: string | null
          error_message: string | null
          id: string
          is_reported_bad: boolean
          parsed_event_data: Json | null
          playwright_flag_used: boolean
          raw_llm_response: Json | null
          requested_by_user_id: string
          url_scraped: string
        }
        Insert: {
          created_at?: string
          custom_instruction_id_used?: string | null
          error_message?: string | null
          id?: string
          is_reported_bad?: boolean
          parsed_event_data?: Json | null
          playwright_flag_used: boolean
          raw_llm_response?: Json | null
          requested_by_user_id: string
          url_scraped: string
        }
        Update: {
          created_at?: string
          custom_instruction_id_used?: string | null
          error_message?: string | null
          id?: string
          is_reported_bad?: boolean
          parsed_event_data?: Json | null
          playwright_flag_used?: boolean
          raw_llm_response?: Json | null
          requested_by_user_id?: string
          url_scraped?: string
        }
        Relationships: []
      }
      user_attendance: {
        Row: {
          created_at: string
          happening_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          happening_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          happening_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_attendance_happening_id_fkey"
            columns: ["happening_id"]
            isOneToOne: false
            referencedRelation: "happenings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          email: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          email?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_update_profile: {
        Args: { user_id: string; target_user_id: string; new_role: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
