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
      abbey_pain_assessments: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          notes: string | null
          pain_type: string
          q1_vocalization: number
          q2_facial_expression: number
          q3_body_language: number
          q4_behavioral_change: number
          q5_physiological_change: number
          q6_physical_change: number
          severity: string
          total_score: number
          trigger_reason: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          notes?: string | null
          pain_type: string
          q1_vocalization: number
          q2_facial_expression: number
          q3_body_language: number
          q4_behavioral_change: number
          q5_physiological_change: number
          q6_physical_change: number
          severity: string
          total_score: number
          trigger_reason?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          notes?: string | null
          pain_type?: string
          q1_vocalization?: number
          q2_facial_expression?: number
          q3_body_language?: number
          q4_behavioral_change?: number
          q5_physiological_change?: number
          q6_physical_change?: number
          severity?: string
          total_score?: number
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abbey_pain_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      abbey_pain_config: {
        Row: {
          assessment_triggers: string[]
          client_id: string | null
          created_at: string
          created_by: string | null
          custom_trigger_text: string | null
          id: string
          mild_alert_recipients: string[]
          mild_reassess_hours: number
          moderate_alert_recipients: string[]
          moderate_reassess_hours: number
          severe_alert_recipients: string[]
          severe_reassess_hours: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_triggers?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_trigger_text?: string | null
          id?: string
          mild_alert_recipients?: string[]
          mild_reassess_hours?: number
          moderate_alert_recipients?: string[]
          moderate_reassess_hours?: number
          severe_alert_recipients?: string[]
          severe_reassess_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_triggers?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_trigger_text?: string | null
          id?: string
          mild_alert_recipients?: string[]
          mild_reassess_hours?: number
          moderate_alert_recipients?: string[]
          moderate_reassess_hours?: number
          severe_alert_recipients?: string[]
          severe_reassess_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abbey_pain_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          client_id: string | null
          id: string
          metadata_json: Json | null
          timestamp: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          client_id?: string | null
          id?: string
          metadata_json?: Json | null
          timestamp?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          client_id?: string | null
          id?: string
          metadata_json?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_care_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "bowel_care_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_care_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          diarrhoea_hours_window: number
          diarrhoea_type67_count_threshold: number
          escalation_recipients: string[]
          id: string
          max_prn_doses_in_window: number
          max_prn_doses_per_24h: number
          monitor_hours_after_prn: number
          no_bm_after_prn_hours_escalation: number
          no_bm_days_threshold: number
          prn_dose_lookback_window_hours: number
          type1_consecutive_days_threshold: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          diarrhoea_hours_window?: number
          diarrhoea_type67_count_threshold?: number
          escalation_recipients?: string[]
          id?: string
          max_prn_doses_in_window?: number
          max_prn_doses_per_24h?: number
          monitor_hours_after_prn?: number
          no_bm_after_prn_hours_escalation?: number
          no_bm_days_threshold?: number
          prn_dose_lookback_window_hours?: number
          type1_consecutive_days_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          diarrhoea_hours_window?: number
          diarrhoea_type67_count_threshold?: number
          escalation_recipients?: string[]
          id?: string
          max_prn_doses_in_window?: number
          max_prn_doses_per_24h?: number
          monitor_hours_after_prn?: number
          no_bm_after_prn_hours_escalation?: number
          no_bm_days_threshold?: number
          prn_dose_lookback_window_hours?: number
          type1_consecutive_days_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bowel_care_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_escalation_records: {
        Row: {
          advice_received: string | null
          alert_id: string | null
          client_id: string | null
          contact_role: string | null
          contact_time: string
          contacted_person: string
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalation_reason: string
          id: string
        }
        Insert: {
          advice_received?: string | null
          alert_id?: string | null
          client_id?: string | null
          contact_role?: string | null
          contact_time?: string
          contacted_person: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_reason: string
          id?: string
        }
        Update: {
          advice_received?: string | null
          alert_id?: string | null
          client_id?: string | null
          contact_role?: string | null
          contact_time?: string
          contacted_person?: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_reason?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bowel_escalation_records_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "bowel_care_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowel_escalation_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_log_entries: {
        Row: {
          bristol_type: number
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          entry_time: string
          id: string
          indicators: Json | null
          notes: string | null
          observed_status: string
          stool_size: string | null
        }
        Insert: {
          bristol_type: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          entry_time?: string
          id?: string
          indicators?: Json | null
          notes?: string | null
          observed_status?: string
          stool_size?: string | null
        }
        Update: {
          bristol_type?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          entry_time?: string
          id?: string
          indicators?: Json | null
          notes?: string | null
          observed_status?: string
          stool_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bowel_log_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_prn_administrations: {
        Row: {
          administration_time: string
          bowel_motion_occurred: boolean | null
          client_id: string | null
          created_at: string
          created_by: string | null
          dose_given: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          medication_id: string | null
          medication_name: string
          monitoring_end_time: string | null
          notes: string | null
          outcome_bristol_type: number | null
          outcome_recorded_at: string | null
          prior_bristol_type: number | null
        }
        Insert: {
          administration_time?: string
          bowel_motion_occurred?: boolean | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose_given: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          medication_id?: string | null
          medication_name: string
          monitoring_end_time?: string | null
          notes?: string | null
          outcome_bristol_type?: number | null
          outcome_recorded_at?: string | null
          prior_bristol_type?: number | null
        }
        Update: {
          administration_time?: string
          bowel_motion_occurred?: boolean | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose_given?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          medication_id?: string | null
          medication_name?: string
          monitoring_end_time?: string | null
          notes?: string | null
          outcome_bristol_type?: number | null
          outcome_recorded_at?: string | null
          prior_bristol_type?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bowel_prn_administrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowel_prn_administrations_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "bowel_prn_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_prn_medications: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          display_order: number
          dose_instructions: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          route: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          dose_instructions: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          route?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          dose_instructions?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          route?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bowel_prn_medications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          photo_url: string | null
          poster_qr_token_created_at: string
          poster_qr_token_hash: string
          poster_qr_token_rotated_at: string | null
          preferred_name: string
          short_bio: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url?: string | null
          poster_qr_token_created_at?: string
          poster_qr_token_hash: string
          poster_qr_token_rotated_at?: string | null
          preferred_name: string
          short_bio?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string | null
          poster_qr_token_created_at?: string
          poster_qr_token_hash?: string
          poster_qr_token_rotated_at?: string | null
          preferred_name?: string
          short_bio?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pain_action_records: {
        Row: {
          action_taken: string
          action_time: string
          assessment_id: string
          created_at: string
          created_by: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          outcome: string | null
          outcome_recorded_at: string | null
        }
        Insert: {
          action_taken: string
          action_time?: string
          assessment_id: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          outcome?: string | null
          outcome_recorded_at?: string | null
        }
        Update: {
          action_taken?: string
          action_time?: string
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          outcome?: string | null
          outcome_recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_action_records_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "abbey_pain_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone_verified_at: string | null
          updated_at: string
          verified_phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone_verified_at?: string | null
          updated_at?: string
          verified_phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone_verified_at?: string | null
          updated_at?: string
          verified_phone?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempt_count: number
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          locked_until: string | null
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          locked_until?: string | null
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_client_id?: string
          p_metadata_json?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "worker" | "team_leader" | "clinician" | "admin"
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
      app_role: ["worker", "team_leader", "clinician", "admin"],
    },
  },
} as const
