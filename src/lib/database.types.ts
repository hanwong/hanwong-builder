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
      belt_techniques: {
        Row: {
          belt: string
          created_at: string
          id: string
          sort_order: number
          technique_slug: string
        }
        Insert: {
          belt: string
          created_at?: string
          id?: string
          sort_order?: number
          technique_slug: string
        }
        Update: {
          belt?: string
          created_at?: string
          id?: string
          sort_order?: number
          technique_slug?: string
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
          gym_class_id: string | null
          id: string
          imported_from: string | null
          logged_on: string
          shared_at: string | null
          sparring_rounds: number
          terms: Json
          user_id: string
        }
        Insert: {
          ai_status?: string
          body: string
          created_at?: string
          gym_class_id?: string | null
          id?: string
          imported_from?: string | null
          logged_on: string
          shared_at?: string | null
          sparring_rounds?: number
          terms?: Json
          user_id: string
        }
        Update: {
          ai_status?: string
          body?: string
          created_at?: string
          gym_class_id?: string | null
          id?: string
          imported_from?: string | null
          logged_on?: string
          shared_at?: string | null
          sparring_rounds?: number
          terms?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_logs_gym_class_id_fkey"
            columns: ["gym_class_id"]
            isOneToOne: false
            referencedRelation: "gym_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_logs_imported_from_fkey"
            columns: ["imported_from"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          body: string[]
          created_at: string
          examples: string[]
          id: string
          kind: string
          name_en: string
          name_ko: string
          related_positions: string[]
          related_techniques: string[]
          see_also: string[]
          slug: string
          sort_order: number
          summary: string
        }
        Insert: {
          body?: string[]
          created_at?: string
          examples?: string[]
          id?: string
          kind: string
          name_en: string
          name_ko: string
          related_positions?: string[]
          related_techniques?: string[]
          see_also?: string[]
          slug: string
          sort_order?: number
          summary: string
        }
        Update: {
          body?: string[]
          created_at?: string
          examples?: string[]
          id?: string
          kind?: string
          name_en?: string
          name_ko?: string
          related_positions?: string[]
          related_techniques?: string[]
          see_also?: string[]
          slug?: string
          sort_order?: number
          summary?: string
        }
        Relationships: []
      }
      drills: {
        Row: {
          aliases: string[]
          created_at: string
          id: string
          name_en: string
          name_ko: string
          related_techniques: string[]
          slug: string
          sort_order: number
          steps: string[]
          summary: string
          tips: string[]
          why: string[]
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          id?: string
          name_en: string
          name_ko: string
          related_techniques?: string[]
          slug: string
          sort_order?: number
          steps?: string[]
          summary: string
          tips?: string[]
          why?: string[]
        }
        Update: {
          aliases?: string[]
          created_at?: string
          id?: string
          name_en?: string
          name_ko?: string
          related_techniques?: string[]
          slug?: string
          sort_order?: number
          steps?: string[]
          summary?: string
          tips?: string[]
          why?: string[]
        }
        Relationships: []
      }
      gym_attendance: {
        Row: {
          class_log_id: string | null
          created_at: string
          gym_class_id: string
          id: string
          user_id: string
        }
        Insert: {
          class_log_id?: string | null
          created_at?: string
          gym_class_id: string
          id?: string
          user_id: string
        }
        Update: {
          class_log_id?: string | null
          created_at?: string
          gym_class_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_attendance_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_attendance_gym_class_id_fkey"
            columns: ["gym_class_id"]
            isOneToOne: false
            referencedRelation: "gym_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_class_techniques: {
        Row: {
          custom_name: string | null
          gym_class_id: string
          id: string
          sort_order: number
          technique_id: string | null
        }
        Insert: {
          custom_name?: string | null
          gym_class_id: string
          id?: string
          sort_order?: number
          technique_id?: string | null
        }
        Update: {
          custom_name?: string | null
          gym_class_id?: string
          id?: string
          sort_order?: number
          technique_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_class_techniques_gym_class_id_fkey"
            columns: ["gym_class_id"]
            isOneToOne: false
            referencedRelation: "gym_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_class_techniques_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_classes: {
        Row: {
          body: string
          created_at: string
          gym_id: string
          held_on: string
          id: string
          name: string
          posted_by: string
          schedule_id: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          gym_id: string
          held_on: string
          id?: string
          name: string
          posted_by: string
          schedule_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          gym_id?: string
          held_on?: string
          id?: string
          name?: string
          posted_by?: string
          schedule_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_classes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_classes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_classes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "gym_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_members: {
        Row: {
          consented_at: string
          gym_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          gym_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          consented_at?: string
          gym_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_schedules: {
        Row: {
          active_from: string
          active_until: string | null
          coach_id: string | null
          created_at: string
          gym_id: string
          id: string
          minutes: number
          name: string
          starts_at: string
          weekday: number
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          coach_id?: string | null
          created_at?: string
          gym_id: string
          id?: string
          minutes?: number
          name: string
          starts_at: string
          weekday: number
        }
        Update: {
          active_from?: string
          active_until?: string | null
          coach_id?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          minutes?: number
          name?: string
          starts_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_schedules_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_schedules_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          coach_code: string
          created_at: string
          created_by: string
          id: string
          join_code: string
          name: string
          network: string | null
          region_gu: string | null
          region_si: string | null
        }
        Insert: {
          coach_code: string
          created_at?: string
          created_by: string
          id?: string
          join_code: string
          name: string
          network?: string | null
          region_gu?: string | null
          region_si?: string | null
        }
        Update: {
          coach_code?: string
          created_at?: string
          created_by?: string
          id?: string
          join_code?: string
          name?: string
          network?: string | null
          region_gu?: string | null
          region_si?: string | null
        }
        Relationships: []
      }
      log_comments: {
        Row: {
          author_id: string
          body: string
          class_log_id: string
          created_at: string
          gym_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          class_log_id: string
          created_at?: string
          gym_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          class_log_id?: string
          created_at?: string
          gym_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_comments_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_comments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_comments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms_public"
            referencedColumns: ["id"]
          },
        ]
      }
      map_agent_runs: {
        Row: {
          created_at: string
          drafted: string[]
          finished_at: string | null
          id: string
          input_tokens: number
          output_tokens: number
          questions: number
          run_on: string
          searches: number
          status: string
          summary: string | null
          topic: string | null
        }
        Insert: {
          created_at?: string
          drafted?: string[]
          finished_at?: string | null
          id?: string
          input_tokens?: number
          output_tokens?: number
          questions?: number
          run_on: string
          searches?: number
          status?: string
          summary?: string | null
          topic?: string | null
        }
        Update: {
          created_at?: string
          drafted?: string[]
          finished_at?: string | null
          id?: string
          input_tokens?: number
          output_tokens?: number
          questions?: number
          run_on?: string
          searches?: number
          status?: string
          summary?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          class_log_id: string | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          technique_id: string | null
          user_id: string
        }
        Insert: {
          class_log_id?: string | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          technique_id?: string | null
          user_id: string
        }
        Update: {
          class_log_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          technique_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_class_log_id_fkey"
            columns: ["class_log_id"]
            isOneToOne: false
            referencedRelation: "class_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
        ]
      }
      open_mat_events: {
        Row: {
          belt: string
          created_at: string
          id: number
          nickname: string
          technique_names: string[]
        }
        Insert: {
          belt: string
          created_at?: string
          id?: never
          nickname: string
          technique_names?: string[]
        }
        Update: {
          belt?: string
          created_at?: string
          id?: never
          nickname?: string
          technique_names?: string[]
        }
        Relationships: []
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
      position_notes: {
        Row: {
          created_at: string
          decisions: string[]
          drills: string[]
          goals: string[]
          id: string
          keys: string[]
          mistakes: string[]
          position_id: string
          role: string
        }
        Insert: {
          created_at?: string
          decisions?: string[]
          drills?: string[]
          goals?: string[]
          id?: string
          keys?: string[]
          mistakes?: string[]
          position_id: string
          role: string
        }
        Update: {
          created_at?: string
          decisions?: string[]
          drills?: string[]
          goals?: string[]
          id?: string
          keys?: string[]
          mistakes?: string[]
          position_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_notes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          id: string
          name_en: string
          name_ko: string
          slug: string
          sort_order: number
          summary: string | null
          variants: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name_en: string
          name_ko: string
          slug: string
          sort_order?: number
          summary?: string | null
          variants?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name_en?: string
          name_ko?: string
          slug?: string
          sort_order?: number
          summary?: string | null
          variants?: string[]
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          asked_on: string
          created_at: string
          id: string
          question: string
          slugs: string[]
          user_id: string
        }
        Insert: {
          answer: string
          asked_on: string
          created_at?: string
          id?: string
          question: string
          slugs?: string[]
          user_id?: string
        }
        Update: {
          answer?: string
          asked_on?: string
          created_at?: string
          id?: string
          question?: string
          slugs?: string[]
          user_id?: string
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
          defense: string[]
          ends_at: string[]
          id: string
          if_blocked: string[]
          key_points: string[]
          kind: string
          mistakes: string[]
          name_en: string | null
          name_key: string
          name_ko: string | null
          note: string | null
          position_id: string | null
          role: string | null
          rules: string[]
          slug: string | null
          status: string
          steps: string[]
          tech_kind: string | null
          technique_id: string | null
        }
        Insert: {
          alias_of?: string | null
          aliases?: string[]
          created_at?: string
          custom_name: string
          decided_at?: string | null
          defense?: string[]
          ends_at?: string[]
          id?: string
          if_blocked?: string[]
          key_points?: string[]
          kind?: string
          mistakes?: string[]
          name_en?: string | null
          name_key: string
          name_ko?: string | null
          note?: string | null
          position_id?: string | null
          role?: string | null
          rules?: string[]
          slug?: string | null
          status?: string
          steps?: string[]
          tech_kind?: string | null
          technique_id?: string | null
        }
        Update: {
          alias_of?: string | null
          aliases?: string[]
          created_at?: string
          custom_name?: string
          decided_at?: string | null
          defense?: string[]
          ends_at?: string[]
          id?: string
          if_blocked?: string[]
          key_points?: string[]
          kind?: string
          mistakes?: string[]
          name_en?: string | null
          name_key?: string
          name_ko?: string | null
          note?: string | null
          position_id?: string | null
          role?: string | null
          rules?: string[]
          slug?: string | null
          status?: string
          steps?: string[]
          tech_kind?: string | null
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
          defense: string[]
          ends_at: string[]
          id: string
          if_blocked: string[]
          is_reviewed: boolean
          key_points: string[]
          kind: string | null
          mistakes: string[]
          name_en: string
          name_ko: string
          owner_id: string | null
          owner_status: string | null
          position_id: string
          role: string | null
          rules: string[]
          slug: string
          sort_order: number
          source: string | null
          steps: string[]
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          defense?: string[]
          ends_at?: string[]
          id?: string
          if_blocked?: string[]
          is_reviewed?: boolean
          key_points?: string[]
          kind?: string | null
          mistakes?: string[]
          name_en: string
          name_ko: string
          owner_id?: string | null
          owner_status?: string | null
          position_id: string
          role?: string | null
          rules?: string[]
          slug: string
          sort_order?: number
          source?: string | null
          steps: string[]
        }
        Update: {
          aliases?: string[]
          created_at?: string
          defense?: string[]
          ends_at?: string[]
          id?: string
          if_blocked?: string[]
          is_reviewed?: boolean
          key_points?: string[]
          kind?: string | null
          mistakes?: string[]
          name_en?: string
          name_ko?: string
          owner_id?: string | null
          owner_status?: string | null
          position_id?: string
          role?: string | null
          rules?: string[]
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
      gyms_public: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          network: string | null
          region_gu: string | null
          region_si: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          network?: string | null
          region_gu?: string | null
          region_si?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          network?: string | null
          region_gu?: string | null
          region_si?: string | null
        }
        Relationships: []
      }
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
      attend_class: { Args: { p_class: string }; Returns: string }
      comment_log: {
        Args: { p_body: string; p_gym: string; p_log: string }
        Returns: string
      }
      create_gym: {
        Args: { p_gu: string; p_name: string; p_network?: string; p_si: string }
        Returns: string
      }
      custom_name_counts: {
        Args: { keys: string[] }
        Returns: {
          name_key: string
          people: number
          times: number
        }[]
      }
      gen_gym_code: { Args: never; Returns: string }
      gym_codes: { Args: { p_gym: string }; Returns: Json }
      gym_member_log: { Args: { p_gym: string; p_log: string }; Returns: Json }
      gym_member_names: {
        Args: { p_gym: string }
        Returns: {
          belt: string
          joined_at: string
          nick: string
          role: string
          started_on: string
          user_id: string
        }[]
      }
      gym_member_overview: {
        Args: { p_before?: string; p_gym: string; p_user: string }
        Returns: Json
      }
      import_shared_log: { Args: { p_id: string }; Returns: string }
      is_operator: { Args: never; Returns: boolean }
      join_gym: { Args: { p_code: string }; Returns: string }
      map_growth: { Args: never; Returns: Json }
      my_gym_role: { Args: { p_gym: string }; Returns: string }
      my_log_comments: { Args: { p_log: string }; Returns: Json }
      my_pending_suggestions: { Args: never; Returns: number }
      name_key: { Args: { t: string }; Returns: string }
      open_mat_announce: { Args: { p_log: string }; Returns: undefined }
      open_mat_me: { Args: never; Returns: Json }
      open_mat_nickname: { Args: { seed: string }; Returns: string }
      peek_gym: { Args: { p_code: string }; Returns: Json }
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
      publish_technique_draft: {
        Args: { p_draft: string; p_source: string }
        Returns: Json
      }
      regen_gym_code: {
        Args: { p_gym: string; p_which: string }
        Returns: string
      }
      reject_user_technique: { Args: { p_id: string }; Returns: undefined }
      shared_log: { Args: { p_id: string }; Returns: Json }
      transfer_gym_owner: {
        Args: { p_gym: string; p_user: string }
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
  public: {
    Enums: {},
  },
} as const
