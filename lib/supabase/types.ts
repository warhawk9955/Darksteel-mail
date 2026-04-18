// Generated with: supabase gen types typescript --local --schema public
// Do not edit by hand. Regenerate after every migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // @supabase/supabase-js ≥ 2.100 expects this field. The CLI generator
  // (older) doesn't emit it yet — added manually until the CLI catches up.
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          default_offer: string | null
          default_sub: string | null
          group_id: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          default_offer?: string | null
          default_sub?: string | null
          group_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          default_offer?: string | null
          default_sub?: string | null
          group_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "exclusivity_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exclusivity_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      spots: {
        Row: {
          accent_color: string | null
          business_name: string | null
          category_id: string | null
          contact_email: string | null
          created_at: string
          group_id: string | null
          id: string
          offer: string | null
          pending_at: string | null
          phone: string | null
          position: number
          sold_at: string | null
          status: Database["public"]["Enums"]["spot_status"]
          stripe_session_id: string | null
          tier: Database["public"]["Enums"]["spot_tier"]
          updated_at: string
          url: string | null
          zone_id: string
        }
        Insert: {
          accent_color?: string | null
          business_name?: string | null
          category_id?: string | null
          contact_email?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          offer?: string | null
          pending_at?: string | null
          phone?: string | null
          position: number
          sold_at?: string | null
          status?: Database["public"]["Enums"]["spot_status"]
          stripe_session_id?: string | null
          tier: Database["public"]["Enums"]["spot_tier"]
          updated_at?: string
          url?: string | null
          zone_id: string
        }
        Update: {
          accent_color?: string | null
          business_name?: string | null
          category_id?: string | null
          contact_email?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          offer?: string | null
          pending_at?: string | null
          phone?: string | null
          position?: number
          sold_at?: string | null
          status?: Database["public"]["Enums"]["spot_status"]
          stripe_session_id?: string | null
          tier?: Database["public"]["Enums"]["spot_tier"]
          updated_at?: string
          url?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "exclusivity_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          drop_date: string
          featured_founding_cents: number
          featured_regular_cents: number
          founding_threshold: number
          household_count: number
          id: string
          name: string
          slug: string
          standard_founding_cents: number
          standard_regular_cents: number
          zip: string
        }
        Insert: {
          created_at?: string
          drop_date: string
          featured_founding_cents: number
          featured_regular_cents: number
          founding_threshold?: number
          household_count: number
          id?: string
          name: string
          slug: string
          standard_founding_cents: number
          standard_regular_cents: number
          zip: string
        }
        Update: {
          created_at?: string
          drop_date?: string
          featured_founding_cents?: number
          featured_regular_cents?: number
          founding_threshold?: number
          household_count?: number
          id?: string
          name?: string
          slug?: string
          standard_founding_cents?: number
          standard_regular_cents?: number
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sweep_stale_pending_spots: { Args: never; Returns: number }
    }
    Enums: {
      spot_status: "available" | "pending" | "sold"
      spot_tier: "standard" | "featured"
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
      spot_status: ["available", "pending", "sold"],
      spot_tier: ["standard", "featured"],
    },
  },
} as const

