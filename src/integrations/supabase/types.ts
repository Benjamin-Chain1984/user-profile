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
          resolved_reason: string | null
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
          resolved_reason?: string | null
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
          resolved_reason?: string | null
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
          enable_log_on_behalf: boolean
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
          enable_log_on_behalf?: boolean
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
          enable_log_on_behalf?: boolean
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
          event_occurred_at: string | null
          id: string
          indicators: Json | null
          notes: string | null
          observed_status: string
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
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
          event_occurred_at?: string | null
          id?: string
          indicators?: Json | null
          notes?: string | null
          observed_status?: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
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
          event_occurred_at?: string | null
          id?: string
          indicators?: Json | null
          notes?: string | null
          observed_status?: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
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
      catheter_alerts: {
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
          resolved_at: string | null
          resolved_by: string | null
          resolved_reason: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "catheter_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_autonomic_risk_logs: {
        Row: {
          actions_taken: string[]
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalated: boolean
          escalated_to: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          outcome: string | null
          symptoms: string[]
        }
        Insert: {
          actions_taken?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated?: boolean
          escalated_to?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          symptoms?: string[]
        }
        Update: {
          actions_taken?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated?: boolean
          escalated_to?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          symptoms?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "catheter_autonomic_risk_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_bag_change_logs: {
        Row: {
          bag_type: string
          change_reason: string
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
        }
        Insert: {
          bag_type: string
          change_reason: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          bag_type?: string
          change_reason?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_bag_change_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_change_logs: {
        Row: {
          catheter_size: string | null
          catheter_type: Database["public"]["Enums"]["catheter_type"]
          change_reason: string
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
        }
        Insert: {
          catheter_size?: string | null
          catheter_type: Database["public"]["Enums"]["catheter_type"]
          change_reason: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Update: {
          catheter_size?: string | null
          catheter_type?: Database["public"]["Enums"]["catheter_type"]
          change_reason?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_change_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_config: {
        Row: {
          bag_types: string[]
          catheter_size: string | null
          catheter_type: Database["public"]["Enums"]["catheter_type"]
          change_frequency_days: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_autonomic_dysreflexia_risk: boolean
          enable_flush_tracking: boolean
          enable_stoma_checks: boolean
          escalation_recipients: string[]
          flush_frequency_hours: number | null
          id: string
          last_catheter_change: string | null
          next_catheter_change_due: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bag_types?: string[]
          catheter_size?: string | null
          catheter_type?: Database["public"]["Enums"]["catheter_type"]
          change_frequency_days?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_autonomic_dysreflexia_risk?: boolean
          enable_flush_tracking?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          flush_frequency_hours?: number | null
          id?: string
          last_catheter_change?: string | null
          next_catheter_change_due?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bag_types?: string[]
          catheter_size?: string | null
          catheter_type?: Database["public"]["Enums"]["catheter_type"]
          change_frequency_days?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_autonomic_dysreflexia_risk?: boolean
          enable_flush_tracking?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          flush_frequency_hours?: number | null
          id?: string
          last_catheter_change?: string | null
          next_catheter_change_due?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_consumables_usage: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_type: string
          month_year: string
          notes: string | null
          quantity_used: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_type: string
          month_year: string
          notes?: string | null
          quantity_used?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_type?: string
          month_year?: string
          notes?: string | null
          quantity_used?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_consumables_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_flush_logs: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          flush_solution: string | null
          flush_volume_ml: number | null
          id: string
          notes: string | null
          output_description: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_solution?: string | null
          flush_volume_ml?: number | null
          id?: string
          notes?: string | null
          output_description?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_solution?: string | null
          flush_volume_ml?: number | null
          id?: string
          notes?: string | null
          output_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_flush_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_stoma_checks: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalated_to_clinician: boolean
          escalation_notes: string | null
          event_occurred_at: string
          granulation: boolean
          id: string
          leaking: boolean
          maceration: boolean
          notes: string | null
          pain: boolean
          redness: boolean
          stoma_condition: string
          swelling: boolean
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          event_occurred_at?: string
          granulation?: boolean
          id?: string
          leaking?: boolean
          maceration?: boolean
          notes?: string | null
          pain?: boolean
          redness?: boolean
          stoma_condition: string
          swelling?: boolean
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          event_occurred_at?: string
          granulation?: boolean
          id?: string
          leaking?: boolean
          maceration?: boolean
          notes?: string | null
          pain?: boolean
          redness?: boolean
          stoma_condition?: string
          swelling?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "catheter_stoma_checks_client_id_fkey"
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
      continence_alerts: {
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
          resolved_at: string | null
          resolved_by: string | null
          resolved_reason: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
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
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "continence_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      continence_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_consumables_monitoring: boolean
          enable_hydration_link: boolean
          enable_uti_testing: boolean
          escalation_recipients: string[]
          fixed_times: string[] | null
          id: string
          interval_hours: number | null
          schedule_type: string
          updated_at: string
          updated_by: string | null
          uti_testing_frequency: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_consumables_monitoring?: boolean
          enable_hydration_link?: boolean
          enable_uti_testing?: boolean
          escalation_recipients?: string[]
          fixed_times?: string[] | null
          id?: string
          interval_hours?: number | null
          schedule_type?: string
          updated_at?: string
          updated_by?: string | null
          uti_testing_frequency?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_consumables_monitoring?: boolean
          enable_hydration_link?: boolean
          enable_uti_testing?: boolean
          escalation_recipients?: string[]
          fixed_times?: string[] | null
          id?: string
          interval_hours?: number | null
          schedule_type?: string
          updated_at?: string
          updated_by?: string | null
          uti_testing_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "continence_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      continence_consumables_checks: {
        Row: {
          barrier_creams_level: string
          check_date: string
          cleansing_products_level: string
          client_id: string | null
          continence_pads_level: string
          created_at: string
          created_by: string | null
          disposable_sheets_level: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          gloves_wipes_level: string
          id: string
          notes: string | null
        }
        Insert: {
          barrier_creams_level: string
          check_date?: string
          cleansing_products_level: string
          client_id?: string | null
          continence_pads_level: string
          created_at?: string
          created_by?: string | null
          disposable_sheets_level: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          gloves_wipes_level: string
          id?: string
          notes?: string | null
        }
        Update: {
          barrier_creams_level?: string
          check_date?: string
          cleansing_products_level?: string
          client_id?: string | null
          continence_pads_level?: string
          created_at?: string
          created_by?: string | null
          disposable_sheets_level?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          gloves_wipes_level?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "continence_consumables_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      continence_pad_changes: {
        Row: {
          change_reason: string
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          pad_condition: string
          pad_type: string
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
        }
        Insert: {
          change_reason: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          pad_condition: string
          pad_type: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Update: {
          change_reason?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          pad_condition?: string
          pad_type?: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "continence_pad_changes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      continence_skin_checks: {
        Row: {
          areas_checked: string[]
          barrier_cream_applied: string
          body_map_markers: Json | null
          client_id: string | null
          created_at: string
          created_by: string | null
          discomfort_level: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalated_to_clinician: boolean
          escalation_notes: string | null
          event_occurred_at: string
          id: string
          moisture_status: string
          notes: string | null
          pad_change_id: string | null
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
          skin_condition: string
        }
        Insert: {
          areas_checked?: string[]
          barrier_cream_applied?: string
          body_map_markers?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discomfort_level?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          event_occurred_at?: string
          id?: string
          moisture_status: string
          notes?: string | null
          pad_change_id?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          skin_condition: string
        }
        Update: {
          areas_checked?: string[]
          barrier_cream_applied?: string
          body_map_markers?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discomfort_level?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          event_occurred_at?: string
          id?: string
          moisture_status?: string
          notes?: string | null
          pad_change_id?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          skin_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "continence_skin_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continence_skin_checks_pad_change_id_fkey"
            columns: ["pad_change_id"]
            isOneToOne: false
            referencedRelation: "continence_pad_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      continence_uti_tests: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalated_to: string | null
          id: string
          notes: string | null
          symptoms: string[]
          test_date: string
          test_result: string
          test_time: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to?: string | null
          id?: string
          notes?: string | null
          symptoms?: string[]
          test_date?: string
          test_result: string
          test_time?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to?: string | null
          id?: string
          notes?: string | null
          symptoms?: string[]
          test_date?: string
          test_result?: string
          test_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "continence_uti_tests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      catheter_type:
        | "spc"
        | "idc"
        | "balloon"
        | "intermittent"
        | "urostomy"
        | "condom"
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
      catheter_type: [
        "spc",
        "idc",
        "balloon",
        "intermittent",
        "urostomy",
        "condom",
      ],
    },
  },
} as const
