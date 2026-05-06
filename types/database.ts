// Supabase スキーマ由来（MCP `generate_typescript_types` と同一内容）。CLI: `npx supabase gen types typescript --project-id <ref>`
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          error_message: string | null
          id: string
          reservation_id: string
          sent_at: string
          status: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          error_message?: string | null
          id?: string
          reservation_id: string
          sent_at?: string
          status: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          error_message?: string | null
          id?: string
          reservation_id?: string
          sent_at?: string
          status?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_categories: {
        Row: {
          blocks_entire_calendar: boolean
          code: string
          created_at: string
          id: string
          label: string
          palette_key: string
          show_in_booking_form: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          blocks_entire_calendar?: boolean
          code: string
          created_at?: string
          id?: string
          label: string
          palette_key: string
          show_in_booking_form?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          blocks_entire_calendar?: boolean
          code?: string
          created_at?: string
          id?: string
          label?: string
          palette_key?: string
          show_in_booking_form?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          customer_name: string
          customer_phone: string | null
          end_at: string
          id: string
          internal_notes: string | null
          notes: string | null
          party_size: number
          start_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_phone?: string | null
          end_at: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          party_size: number
          start_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_phone?: string | null
          end_at?: string
          id?: string
          internal_notes?: string | null
          notes?: string | null
          party_size?: number
          start_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reservation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          login_id: string
          name: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_id: string
          name: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_id?: string
          name?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          display_order: number
          id: string
          is_private: boolean
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string
          display_order?: number
          id?: string
          is_private?: boolean
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          display_order?: number
          id?: string
          is_private?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_channel: "email" | "sms" | "line"
      notification_type: "confirmation" | "reminder" | "cancellation"
      reservation_status:
        | "confirmed"
        | "pending"
        | "cancelled"
        | "no_show"
        | "completed"
      staff_role: "owner" | "manager" | "staff"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_channel: ["email", "sms", "line"],
      notification_type: ["confirmation", "reminder", "cancellation"],
      reservation_status: [
        "confirmed",
        "pending",
        "cancelled",
        "no_show",
        "completed",
      ],
      staff_role: ["owner", "manager", "staff"],
    },
  },
} as const
