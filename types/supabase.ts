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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      estimate_items: {
        Row: {
          category: string | null
          created_at: string | null
          display_order: number | null
          estimate_id: string | null
          id: string
          labor_cost: number
          name: string
          part_cost: number
          total_cost: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          estimate_id?: string | null
          id?: string
          labor_cost?: number
          name: string
          part_cost?: number
          total_cost: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          estimate_id?: string | null
          id?: string
          labor_cost?: number
          name?: string
          part_cost?: number
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          shop_name: string
          shop_type: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          shop_name: string
          shop_type?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          shop_name?: string
          shop_type?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_verifications: {
        Row: {
          average_price: number
          created_at: string | null
          estimate_item_id: string | null
          id: string
          labor_cost_average: number
          labor_cost_user: number
          max_price: number
          median_price: number
          min_price: number
          part_cost_average: number
          part_cost_user: number
          part_price_source: string | null
          sample_count: number | null
          status: string
          user_price: number
          verification_result_id: string | null
        }
        Insert: {
          average_price: number
          created_at?: string | null
          estimate_item_id?: string | null
          id?: string
          labor_cost_average?: number
          labor_cost_user?: number
          max_price: number
          median_price: number
          min_price: number
          part_cost_average?: number
          part_cost_user?: number
          part_price_source?: string | null
          sample_count?: number | null
          status: string
          user_price: number
          verification_result_id?: string | null
        }
        Update: {
          average_price?: number
          created_at?: string | null
          estimate_item_id?: string | null
          id?: string
          labor_cost_average?: number
          labor_cost_user?: number
          max_price?: number
          median_price?: number
          min_price?: number
          part_cost_average?: number
          part_cost_user?: number
          part_price_source?: string | null
          sample_count?: number | null
          status?: string
          user_price?: number
          verification_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_verifications_estimate_item_id_fkey"
            columns: ["estimate_item_id"]
            isOneToOne: false
            referencedRelation: "estimate_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_verifications_verification_result_id_fkey"
            columns: ["verification_result_id"]
            isOneToOne: false
            referencedRelation: "verification_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_verifications_verification_result_id_fkey"
            columns: ["verification_result_id"]
            isOneToOne: false
            referencedRelation: "verification_results"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_standard_items: {
        Row: {
          category: string
          created_at: string | null
          id: string
          no: number
          work_name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          no: number
          work_name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          no?: number
          work_name?: string
        }
        Relationships: []
      }
      national_repair_shops: {
        Row: {
          bsn_sttus: string | null
          created_at: string | null
          id: string
          inspofc_nm: string | null
          inspofc_type: string | null
          instt_code: string | null
          latitude: number | null
          lnmadr: string | null
          longitude: number | null
          phone_number: string | null
          rdnmadr: string | null
          reference_date: string | null
          shop_type: string | null
          updated_at: string | null
        }
        Insert: {
          bsn_sttus?: string | null
          created_at?: string | null
          id?: string
          inspofc_nm?: string | null
          inspofc_type?: string | null
          instt_code?: string | null
          latitude?: number | null
          lnmadr?: string | null
          longitude?: number | null
          phone_number?: string | null
          rdnmadr?: string | null
          reference_date?: string | null
          shop_type?: string | null
          updated_at?: string | null
        }
        Update: {
          bsn_sttus?: string | null
          created_at?: string | null
          id?: string
          inspofc_nm?: string | null
          inspofc_type?: string | null
          instt_code?: string | null
          latitude?: number | null
          lnmadr?: string | null
          longitude?: number | null
          phone_number?: string | null
          rdnmadr?: string | null
          reference_date?: string | null
          shop_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string | null
          fuel_type: string
          id: string
          manufacturer: string
          mileage: number
          model: string
          updated_at: string | null
          user_id: string | null
          variant: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          fuel_type: string
          id?: string
          manufacturer: string
          mileage?: number
          model: string
          updated_at?: string | null
          user_id?: string | null
          variant?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          fuel_type?: string
          id?: string
          manufacturer?: string
          mileage?: number
          model?: string
          updated_at?: string | null
          user_id?: string | null
          variant?: string | null
          year?: number
        }
        Relationships: []
      }
      verification_results: {
        Row: {
          confidence: number | null
          created_at: string | null
          estimate_id: string | null
          id: string
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          estimate_id?: string | null
          id?: string
          status: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          estimate_id?: string | null
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_results_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: true
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_lookup_mock: {
        Row: {
          id: string
          created_at: string | null
          registration_number: string
          owner_name: string | null
          mileage: number | null
          spec_management_number: string | null
          model_type_name: string | null
          model_type_kind_name: string | null
          model_type_class_name: string | null
          engine_type_name: string | null
          form_name: string | null
          displacement: number | null
          seating_capacity: number | null
          max_load_capacity: number | null
          car_name: string | null
          model_year: string | null
          fuel_name: string | null
          domestic_import_name: string | null
          chassis_body_type_name: string | null
          body_length: number | null
          body_width: number | null
          body_height: number | null
          wheel_base: number | null
          front_tread: number | null
          rear_tread: number | null
          transmission_type_name: string | null
          spec_model_year: string | null
          vin: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          registration_number: string
          owner_name?: string | null
          mileage?: number | null
          spec_management_number?: string | null
          model_type_name?: string | null
          model_type_kind_name?: string | null
          model_type_class_name?: string | null
          engine_type_name?: string | null
          form_name?: string | null
          displacement?: number | null
          seating_capacity?: number | null
          max_load_capacity?: number | null
          car_name?: string | null
          model_year?: string | null
          fuel_name?: string | null
          domestic_import_name?: string | null
          chassis_body_type_name?: string | null
          body_length?: number | null
          body_width?: number | null
          body_height?: number | null
          wheel_base?: number | null
          front_tread?: number | null
          rear_tread?: number | null
          transmission_type_name?: string | null
          spec_model_year?: string | null
          vin?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          registration_number?: string
          owner_name?: string | null
          mileage?: number | null
          spec_management_number?: string | null
          model_type_name?: string | null
          model_type_kind_name?: string | null
          model_type_class_name?: string | null
          engine_type_name?: string | null
          form_name?: string | null
          displacement?: number | null
          seating_capacity?: number | null
          max_load_capacity?: number | null
          car_name?: string | null
          model_year?: string | null
          fuel_name?: string | null
          domestic_import_name?: string | null
          chassis_body_type_name?: string | null
          body_length?: number | null
          body_width?: number | null
          body_height?: number | null
          wheel_base?: number | null
          front_tread?: number | null
          rear_tread?: number | null
          transmission_type_name?: string | null
          spec_model_year?: string | null
          vin?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      verification_history: {
        Row: {
          date: string | null
          estimate_id: string | null
          id: string | null
          items_summary: string | null
          manufacturer: string | null
          model: string | null
          shop_name: string | null
          status: string | null
          total_amount: number | null
          user_id: string | null
          variant: string | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_results_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: true
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
