export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      accounts: {
        Row: {
          contribution_status: string | null
          created_at: string
          household_id: string
          id: string
          is_archived: boolean
          name: string
          starting_balance: number
          type: string
        }
        Insert: {
          contribution_status?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_archived?: boolean
          name: string
          starting_balance?: number
          type: string
        }
        Update: {
          contribution_status?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_archived?: boolean
          name?: string
          starting_balance?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_ingestion_log: {
        Row: {
          completed_at: string
          errors: Json | null
          function_name: string
          id: number
          rows_skipped: number
          rows_upserted: number
          started_at: string
        }
        Insert: {
          completed_at?: string
          errors?: Json | null
          function_name: string
          id?: number
          rows_skipped?: number
          rows_upserted?: number
          started_at: string
        }
        Update: {
          completed_at?: string
          errors?: Json | null
          function_name?: string
          id?: number
          rows_skipped?: number
          rows_upserted?: number
          started_at?: string
        }
        Relationships: []
      }
      benchmarks_bls_cex: {
        Row: {
          annual_avg_spend: number | null
          category: string
          data_year: number
          household_size: number | null
          id: number
          income_bracket: string
          ingested_at: string
          region: string | null
          source_url: string | null
        }
        Insert: {
          annual_avg_spend?: number | null
          category: string
          data_year: number
          household_size?: number | null
          id?: number
          income_bracket: string
          ingested_at?: string
          region?: string | null
          source_url?: string | null
        }
        Update: {
          annual_avg_spend?: number | null
          category?: string
          data_year?: number
          household_size?: number | null
          id?: number
          income_bracket?: string
          ingested_at?: string
          region?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      benchmarks_hud_fmr: {
        Row: {
          bedrooms: number
          data_year: number
          id: number
          ingested_at: string
          rent_amount: number | null
          source_url: string | null
          zip_code: string
        }
        Insert: {
          bedrooms: number
          data_year: number
          id?: number
          ingested_at?: string
          rent_amount?: number | null
          source_url?: string | null
          zip_code: string
        }
        Update: {
          bedrooms?: number
          data_year?: number
          id?: number
          ingested_at?: string
          rent_amount?: number | null
          source_url?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      benchmarks_zillow: {
        Row: {
          as_of: string
          id: number
          ingested_at: string
          metric: string
          source_url: string | null
          value: number | null
          zip_code: string
        }
        Insert: {
          as_of: string
          id?: number
          ingested_at?: string
          metric: string
          source_url?: string | null
          value?: number | null
          zip_code: string
        }
        Update: {
          as_of?: string
          id?: number
          ingested_at?: string
          metric?: string
          source_url?: string | null
          value?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          effective_from: string
          effective_to: string | null
          household_id: string
          id: string
          period: string
        }
        Insert: {
          amount: number
          category_id: string
          effective_from: string
          effective_to?: string | null
          household_id: string
          id?: string
          period: string
        }
        Update: {
          amount?: number
          category_id?: string
          effective_from?: string
          effective_to?: string | null
          household_id?: string
          id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          color: string | null
          household_id: string
          icon: string | null
          id: string
          is_essential: boolean | null
          is_income: boolean
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          household_id: string
          icon?: string | null
          id?: string
          is_essential?: boolean | null
          is_income?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          is_essential?: boolean | null
          is_income?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reference: {
        Row: {
          category: string | null
          cons: Json | null
          id: string
          name: string | null
          pros: Json | null
          source_date: string | null
          source_name: string | null
          source_url: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cons?: Json | null
          id: string
          name?: string | null
          pros?: Json | null
          source_date?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cons?: Json | null
          id?: string
          name?: string | null
          pros?: Json | null
          source_date?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goal_account_links: {
        Row: {
          account_id: string
          goal_id: string
          include_balance: boolean | null
        }
        Insert: {
          account_id: string
          goal_id: string
          include_balance?: boolean | null
        }
        Update: {
          account_id?: string
          goal_id?: string
          include_balance?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_account_links_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_account_links_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_templates: {
        Row: {
          category: string | null
          created_at: string | null
          default_priority: number | null
          description: string
          id: string
          name: string
          source_citations: Json | null
          target_formula: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_priority?: number | null
          description: string
          id: string
          name: string
          source_citations?: Json | null
          target_formula?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_priority?: number | null
          description?: string
          id?: string
          name?: string
          source_citations?: Json | null
          target_formula?: string | null
        }
        Relationships: []
      }
      household_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          household_id: string
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          household_id: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          household_id?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          display_name: string | null
          household_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          household_id: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          household_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          annual_gross_income: number | null
          created_at: string
          currency: string
          id: string
          income_bracket: string | null
          metro: string | null
          name: string
          partner_age: number | null
          primary_age: number | null
          timezone: string
          zip: string | null
        }
        Insert: {
          annual_gross_income?: number | null
          created_at?: string
          currency?: string
          id?: string
          income_bracket?: string | null
          metro?: string | null
          name: string
          partner_age?: number | null
          primary_age?: number | null
          timezone?: string
          zip?: string | null
        }
        Update: {
          annual_gross_income?: number | null
          created_at?: string
          currency?: string
          id?: string
          income_bracket?: string | null
          metro?: string | null
          name?: string
          partner_age?: number | null
          primary_age?: number | null
          timezone?: string
          zip?: string | null
        }
        Relationships: []
      }
      imports: {
        Row: {
          created_at: string
          errors: Json | null
          filename: string
          household_id: string
          id: string
          row_count: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          errors?: Json | null
          filename: string
          household_id: string
          id?: string
          row_count?: number
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          errors?: Json | null
          filename?: string
          household_id?: string
          id?: string
          row_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_bills: {
        Row: {
          account_id: string | null
          amount: number
          cadence: string
          category_id: string | null
          household_id: string
          id: string
          name: string
          next_due_date: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          cadence: string
          category_id?: string | null
          household_id: string
          id?: string
          name: string
          next_due_date?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          cadence?: string
          category_id?: string | null
          household_id?: string
          id?: string
          name?: string
          next_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_bills_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          computed_target: boolean | null
          created_at: string
          household_id: string
          id: string
          linked_account_id: string | null
          name: string
          priority: number | null
          target_amount: number
          target_date: string | null
          template_id: string | null
        }
        Insert: {
          computed_target?: boolean | null
          created_at?: string
          household_id: string
          id?: string
          linked_account_id?: string | null
          name: string
          priority?: number | null
          target_amount: number
          target_date?: string | null
          template_id?: string | null
        }
        Update: {
          computed_target?: boolean | null
          created_at?: string
          household_id?: string
          id?: string
          linked_account_id?: string | null
          name?: string
          priority?: number | null
          target_amount?: number
          target_date?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "goal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          entered_by: string
          external_hash: string | null
          external_id: string | null
          household_id: string
          id: string
          import_id: string | null
          merchant: string | null
          notes: string | null
          occurred_on: string
          source: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          entered_by: string
          external_hash?: string | null
          external_id?: string | null
          household_id: string
          id?: string
          import_id?: string | null
          merchant?: string | null
          notes?: string | null
          occurred_on: string
          source?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          entered_by?: string
          external_hash?: string | null
          external_id?: string | null
          household_id?: string
          id?: string
          import_id?: string | null
          merchant?: string | null
          notes?: string | null
          occurred_on?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_categories: {
        Args: { p_household_id: string }
        Returns: undefined
      }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          household_name: string
          is_valid: boolean
        }[]
      }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
      redeem_invite: { Args: { p_token: string }; Returns: string }
      setup_household: {
        Args: {
          p_income_bracket: string
          p_metro: string
          p_name: string
          p_zip: string
        }
        Returns: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

