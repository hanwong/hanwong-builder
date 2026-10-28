export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_calls: {
        Row: {
          called_at: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          called_at?: string
          created_at?: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          called_at?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      class_log_techniques: {
        Row: {
          class_log_id: string
          created_at: string
          custom_name: string | null
          id: string
          technique_id: string | null
          user_id: string
        }
        Insert: {
          class_log_id: string
          created_at?: string
          custom_name?: string | null
          id?: string
          technique_id?: string | null
          user_id: string
        }
        Update: {
          class_log_id?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          technique_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_log_techniques_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_log_techniques_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      class_logs: {
        Row: {
          ai_status: string
          body: string
          created_at: string
          id: string
          logged_on: string
          terms: Json
          user_id: string
        }
        Insert: {
          ai_status?: string
          body: string
          created_at?: string
          id?: string
          logged_on: string
          terms?: Json
          user_id: string
        }
        Update: {
          ai_status?: string
          body?: string
          created_at?: string
          id?: string
          logged_on?: string
          terms?: Json
          user_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          technique_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          technique_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          technique_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_ko: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_ko: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_ko?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      review_cards: {
        Row: {
          created_at: string
          due_on: string
          id: string
          interval_step: number
          last_reviewed_at: string | null
          reviews_count: number
          technique_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_on: string
          id?: string
          interval_step?: number
          last_reviewed_at?: string | null
          reviews_count?: number
          technique_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_on?: string
          id?: string
          interval_step?: number
          last_reviewed_at?: string | null
          reviews_count?: number
          technique_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cards_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      review_logs: {
        Row: {
          created_at: string
          id: string
          next_step: number
          prev_step: number
          rating: string
          review_card_id: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_step: number
          prev_step: number
          rating: string
          review_card_id: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_step?: number
          prev_step?: number
          rating?: string
          review_card_id?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_review_card_id_fkey"
            columns: ["review_card_id"]
            isOneToOne: false
            referencedRelation: "review_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      technique_drafts: {
        Row: {
          alias_of: string | null
          aliases: string[]
          created_at: string
          custom_name: string
          decided_at: string | null
          id: string
          kind: string
          name_en: string | null
          name_key: string
          name_ko: string | null
          note: string | null
          position_id: string | null
          slug: string | null
          status: string
          steps: string[]
          technique_id: string | null
        }
        Insert: {
          alias_of?: string | null
          aliases?: string[]
          created_at?: string
          custom_name: string
          decided_at?: string | null
          id?: string
          kind?: string
          name_en?: string | null
          name_key: string
          name_ko?: string | null
          note?: string | null
          position_id?: string | null
          slug?: string | null
          status?: string
          steps?: string[]
          technique_id?: string | null
        }
        Update: {
          alias_of?: string | null
          aliases?: string[]
          created_at?: string
          custom_name?: string
          decided_at?: string | null
          id?: string
          kind?: string
          name_en?: string | null
          name_key?: string
          name_ko?: string | null
          note?: string | null
          position_id?: string | null
          slug?: string | null
          status?: string
          steps?: string[]
          technique_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technique_drafts_alias_of_fkey"
            columns: ["alias_of"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technique_drafts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technique_drafts_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      technique_levels: {
        Row: {
          created_at: string
          id: string
          level: string
          technique_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          technique_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          technique_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technique_levels_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      technique_suggestions: {
        Row: {
          add_aliases: string[]
          created_at: string
          decided_at: string | null
          id: string
          reason: string | null
          status: string
          steps: string[]
          technique_id: string
          user_id: string
        }
        Insert: {
          add_aliases?: string[]
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          status?: string
          steps: string[]
          technique_id: string
          user_id: string
        }
        Update: {
          add_aliases?: string[]
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          status?: string
          steps?: string[]
          technique_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technique_suggestions_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      techniques: {
        Row: {
          aliases: string[]
          created_at: string
          id: string
          is_reviewed: boolean
          name_en: string
          name_ko: string
          owner_id: string | null
          owner_status: string | null
          position_id: string
          slug: string
          sort_order: number
          source: string | null
          steps: string[]
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          id?: string
          is_reviewed?: boolean
          name_en: string
          name_ko: string
          owner_id?: string | null
          owner_status?: string | null
          position_id: string
          slug: string
          sort_order?: number
          source?: string | null
          steps: string[]
        }
        Update: {
          aliases?: string[]
          created_at?: string
          id?: string
          is_reviewed?: boolean
          name_en?: string
          name_ko?: string
          owner_id?: string | null
          owner_status?: string | null
          position_id?: string
          slug?: string
          sort_order?: number
          source?: string | null
          steps?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "techniques_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_technique_draft: {
        Args: { p_draft: string; p_due: string }
        Returns: Json
      }
      approve_technique_suggestion: {
        Args: { p_aliases: string[]; p_id: string; p_steps: string[] }
        Returns: Json
      }
      approve_user_technique: {
        Args: {
          p_id: string
          p_name_en: string
          p_name_ko: string
          p_position: string
          p_steps: string[]
        }
        Returns: undefined
      }
      custom_name_counts: {
        Args: { keys: string[] }
        Returns: {
          name_key: string
          people: number
          times: number
        }[]
      }
      is_operator: { Args: never; Returns: boolean }
      my_pending_suggestions: { Args: never; Returns: number }
      name_key: { Args: { t: string }; Returns: string }
      pending_custom_names: {
        Args: never
        Returns: {
          custom_name: string
          last_seen: string
          name_key: string
          people: number
          times: number
        }[]
      }
      reject_user_technique: { Args: { p_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
