export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          zip: string | null
          metro: string | null
          income_bracket: string | null
          currency: string
          timezone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          zip?: string | null
          metro?: string | null
          income_bracket?: string | null
          currency?: string
          timezone?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          zip?: string | null
          metro?: string | null
          income_bracket?: string | null
          currency?: string
          timezone?: string
          created_at?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          household_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          household_id: string
          user_id: string
          role: string
          joined_at?: string
        }
        Update: {
          household_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          name: string
          type: string
          starting_balance: number
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: string
          starting_balance?: number
          is_archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          type?: string
          starting_balance?: number
          is_archived?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          parent_id: string | null
          icon: string | null
          color: string | null
          is_income: boolean
          sort_order: number
          archived_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          is_income?: boolean
          sort_order?: number
          archived_at?: string | null
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          is_income?: boolean
          sort_order?: number
          archived_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          account_id: string
          category_id: string | null
          entered_by: string
          amount: number
          occurred_on: string
          merchant: string | null
          notes: string | null
          source: string
          external_id: string | null
          external_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          account_id: string
          category_id?: string | null
          entered_by: string
          amount: number
          occurred_on: string
          merchant?: string | null
          notes?: string | null
          source?: string
          external_id?: string | null
          external_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          account_id?: string
          category_id?: string | null
          entered_by?: string
          amount?: number
          occurred_on?: string
          merchant?: string | null
          notes?: string | null
          source?: string
          external_id?: string | null
          external_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      budgets: {
        Row: {
          id: string
          household_id: string
          category_id: string
          period: string
          amount: number
          effective_from: string
          effective_to: string | null
        }
        Insert: {
          id?: string
          household_id: string
          category_id: string
          period: string
          amount: number
          effective_from: string
          effective_to?: string | null
        }
        Update: {
          id?: string
          household_id?: string
          category_id?: string
          period?: string
          amount?: number
          effective_from?: string
          effective_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'budgets_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'budgets_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      savings_goals: {
        Row: {
          id: string
          household_id: string
          name: string
          target_amount: number
          target_date: string | null
          linked_account_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          target_amount: number
          target_date?: string | null
          linked_account_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          linked_account_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'savings_goals_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'savings_goals_linked_account_id_fkey'
            columns: ['linked_account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
      recurring_bills: {
        Row: {
          id: string
          household_id: string
          name: string
          category_id: string | null
          account_id: string | null
          amount: number
          cadence: string
          next_due_date: string | null
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          category_id?: string | null
          account_id?: string | null
          amount: number
          cadence: string
          next_due_date?: string | null
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          category_id?: string | null
          account_id?: string | null
          amount?: number
          cadence?: string
          next_due_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_bills_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      imports: {
        Row: {
          id: string
          household_id: string
          user_id: string
          filename: string
          row_count: number
          status: string
          errors: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          filename: string
          row_count?: number
          status: string
          errors?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          filename?: string
          row_count?: number
          status?: string
          errors?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'imports_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      household_invites: {
        Row: {
          id: string
          household_id: string
          token: string
          created_by: string
          redeemed_by: string | null
          redeemed_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          token?: string
          created_by: string
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          token?: string
          created_by?: string
          redeemed_by?: string | null
          redeemed_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_invites_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      benchmarks_bls_cex: {
        Row: {
          id: number
          income_bracket: string
          household_size: number | null
          region: string | null
          category: string
          annual_avg_spend: number | null
          data_year: number
          source_url: string | null
          ingested_at: string
        }
        Insert: {
          id?: number
          income_bracket: string
          household_size?: number | null
          region?: string | null
          category: string
          annual_avg_spend?: number | null
          data_year: number
          source_url?: string | null
          ingested_at?: string
        }
        Update: {
          id?: number
          income_bracket?: string
          household_size?: number | null
          region?: string | null
          category?: string
          annual_avg_spend?: number | null
          data_year?: number
          source_url?: string | null
          ingested_at?: string
        }
        Relationships: []
      }
      benchmarks_hud_fmr: {
        Row: {
          id: number
          zip_code: string
          bedrooms: number
          rent_amount: number | null
          data_year: number
          source_url: string | null
          ingested_at: string
        }
        Insert: {
          id?: number
          zip_code: string
          bedrooms: number
          rent_amount?: number | null
          data_year: number
          source_url?: string | null
          ingested_at?: string
        }
        Update: {
          id?: number
          zip_code?: string
          bedrooms?: number
          rent_amount?: number | null
          data_year?: number
          source_url?: string | null
          ingested_at?: string
        }
        Relationships: []
      }
      benchmarks_zillow: {
        Row: {
          id: number
          zip_code: string
          metric: string
          value: number | null
          as_of: string
          source_url: string | null
          ingested_at: string
        }
        Insert: {
          id?: number
          zip_code: string
          metric: string
          value?: number | null
          as_of: string
          source_url?: string | null
          ingested_at?: string
        }
        Update: {
          id?: number
          zip_code?: string
          metric?: string
          value?: number | null
          as_of?: string
          source_url?: string | null
          ingested_at?: string
        }
        Relationships: []
      }
      benchmark_ingestion_log: {
        Row: {
          id: number
          function_name: string
          rows_upserted: number
          rows_skipped: number
          errors: Json | null
          started_at: string
          completed_at: string
        }
        Insert: {
          id?: number
          function_name: string
          rows_upserted?: number
          rows_skipped?: number
          errors?: Json | null
          started_at: string
          completed_at?: string
        }
        Update: {
          id?: number
          function_name?: string
          rows_upserted?: number
          rows_skipped?: number
          errors?: Json | null
          started_at?: string
          completed_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_household_member: {
        Args: { hid: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { hid: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
