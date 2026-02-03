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
          created_by: string | null
          date_of_birth: string | null
          edited_at: string | null
          edited_by: string | null
          email: string | null
          full_name: string | null
          id: string
          person_responsible_name: string | null
          photo_url: string | null
          poster_qr_token_created_at: string
          poster_qr_token_hash: string
          poster_qr_token_rotated_at: string | null
          preferred_name: string
          primary_contact_number: string | null
          relationship_to_individual: string | null
          secondary_contact: string | null
          short_bio: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          edited_at?: string | null
          edited_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          person_responsible_name?: string | null
          photo_url?: string | null
          poster_qr_token_created_at?: string
          poster_qr_token_hash: string
          poster_qr_token_rotated_at?: string | null
          preferred_name: string
          primary_contact_number?: string | null
          relationship_to_individual?: string | null
          secondary_contact?: string | null
          short_bio?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          edited_at?: string | null
          edited_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          person_responsible_name?: string | null
          photo_url?: string | null
          poster_qr_token_created_at?: string
          poster_qr_token_hash?: string
          poster_qr_token_rotated_at?: string | null
          preferred_name?: string
          primary_contact_number?: string | null
          relationship_to_individual?: string | null
          secondary_contact?: string | null
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
      fluid_balance_alerts: {
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
            foreignKeyName: "fluid_balance_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          day_boundary_time: string
          dehydration_threshold_ml: number
          dehydration_warning_percent: number
          enable_output_logging: boolean
          escalation_recipients: string[] | null
          fluid_restriction_enabled: boolean
          hard_stop_on_limit_exceeded: boolean
          id: string
          max_fluid_allowance_ml: number | null
          overhydration_threshold_ml: number
          overhydration_warning_percent: number
          target_daily_intake_ml: number
          time_checkpoint_for_warning: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          day_boundary_time?: string
          dehydration_threshold_ml?: number
          dehydration_warning_percent?: number
          enable_output_logging?: boolean
          escalation_recipients?: string[] | null
          fluid_restriction_enabled?: boolean
          hard_stop_on_limit_exceeded?: boolean
          id?: string
          max_fluid_allowance_ml?: number | null
          overhydration_threshold_ml?: number
          overhydration_warning_percent?: number
          target_daily_intake_ml?: number
          time_checkpoint_for_warning?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          day_boundary_time?: string
          dehydration_threshold_ml?: number
          dehydration_warning_percent?: number
          enable_output_logging?: boolean
          escalation_recipients?: string[] | null
          fluid_restriction_enabled?: boolean
          hard_stop_on_limit_exceeded?: boolean
          id?: string
          max_fluid_allowance_ml?: number | null
          overhydration_threshold_ml?: number
          overhydration_warning_percent?: number
          target_daily_intake_ml?: number
          time_checkpoint_for_warning?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_intake_entries: {
        Row: {
          amount_ml: number
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          fluid_type: string
          id: string
          is_self_reported: boolean
          notes: string | null
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
        }
        Insert: {
          amount_ml: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          fluid_type: string
          id?: string
          is_self_reported?: boolean
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Update: {
          amount_ml?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          fluid_type?: string
          id?: string
          is_self_reported?: boolean
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_intake_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fluid_output_entries: {
        Row: {
          amount_ml: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          is_unmeasured: boolean
          notes: string | null
          output_type: string
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
          urine_colour: number | null
        }
        Insert: {
          amount_ml?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          is_unmeasured?: boolean
          notes?: string | null
          output_type: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          urine_colour?: number | null
        }
        Update: {
          amount_ml?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          is_unmeasured?: boolean
          notes?: string | null
          output_type?: string
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          urine_colour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fluid_output_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_symptom_checks: {
        Row: {
          check_date: string
          client_id: string | null
          confusion: boolean
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          fatigue_dizziness: boolean
          id: string
          nausea_vomiting: boolean
          notes: string | null
          swelling: boolean
          thirst_dry_mouth: boolean
          urine_colour: number | null
        }
        Insert: {
          check_date?: string
          client_id?: string | null
          confusion?: boolean
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          fatigue_dizziness?: boolean
          id?: string
          nausea_vomiting?: boolean
          notes?: string | null
          swelling?: boolean
          thirst_dry_mouth?: boolean
          urine_colour?: number | null
        }
        Update: {
          check_date?: string
          client_id?: string | null
          confusion?: boolean
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          fatigue_dizziness?: boolean
          id?: string
          nausea_vomiting?: boolean
          notes?: string | null
          swelling?: boolean
          thirst_dry_mouth?: boolean
          urine_colour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hydration_symptom_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      module_alert_recipients: {
        Row: {
          alert_severity: string
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          module_name: string
          notification_contact_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alert_severity: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          module_name: string
          notification_contact_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alert_severity?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          module_name?: string
          notification_contact_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_alert_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_alert_recipients_notification_contact_id_fkey"
            columns: ["notification_contact_id"]
            isOneToOne: false
            referencedRelation: "notification_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_contacts: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          preferred_contact_hours: string | null
          relationship: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          preferred_contact_hours?: string | null
          relationship: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          preferred_contact_hours?: string | null
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          alert_id: string | null
          alert_severity: string | null
          alert_type: string | null
          client_id: string | null
          contact_email: string
          contact_name: string
          delivery_method: string
          delivery_status: string
          error_message: string | null
          id: string
          metadata: Json | null
          module_name: string
          notification_contact_id: string | null
          sent_at: string
        }
        Insert: {
          alert_id?: string | null
          alert_severity?: string | null
          alert_type?: string | null
          client_id?: string | null
          contact_email: string
          contact_name: string
          delivery_method?: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          module_name: string
          notification_contact_id?: string | null
          sent_at?: string
        }
        Update: {
          alert_id?: string | null
          alert_severity?: string | null
          alert_type?: string | null
          client_id?: string | null
          contact_email?: string
          contact_name?: string
          delivery_method?: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          module_name?: string
          notification_contact_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_notification_contact_id_fkey"
            columns: ["notification_contact_id"]
            isOneToOne: false
            referencedRelation: "notification_contacts"
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
      vital_sign_action_logs: {
        Row: {
          action_description: string
          action_type: string
          advice_received: string | null
          alert_id: string | null
          client_id: string | null
          contact_role: string | null
          contact_time: string | null
          contacted_person: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          follow_up_due_at: string | null
          follow_up_required: boolean | null
          id: string
          outcome: string | null
          vital_entry_id: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          advice_received?: string | null
          alert_id?: string | null
          client_id?: string | null
          contact_role?: string | null
          contact_time?: string | null
          contacted_person?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          follow_up_due_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          vital_entry_id?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          advice_received?: string | null
          alert_id?: string | null
          client_id?: string | null
          contact_role?: string | null
          contact_time?: string | null
          contacted_person?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          follow_up_due_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome?: string | null
          vital_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_sign_action_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "vital_sign_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_sign_action_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_sign_action_logs_vital_entry_id_fkey"
            columns: ["vital_entry_id"]
            isOneToOne: false
            referencedRelation: "vital_sign_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_sign_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_taken: string | null
          alert_type: string
          client_id: string | null
          created_at: string
          created_by: string | null
          emergency_contact_time: string | null
          emergency_services_contacted: boolean | null
          id: string
          is_trend_alert: boolean
          message: string
          metadata: Json | null
          outcome: string | null
          recommended_action: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_reason: string | null
          severity: string
          trend_data: Json | null
          vital_entry_id: string | null
          vital_type: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          emergency_contact_time?: string | null
          emergency_services_contacted?: boolean | null
          id?: string
          is_trend_alert?: boolean
          message: string
          metadata?: Json | null
          outcome?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          severity?: string
          trend_data?: Json | null
          vital_entry_id?: string | null
          vital_type?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          emergency_contact_time?: string | null
          emergency_services_contacted?: boolean | null
          id?: string
          is_trend_alert?: boolean
          message?: string
          metadata?: Json | null
          outcome?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          severity?: string
          trend_data?: Json | null
          vital_entry_id?: string | null
          vital_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_sign_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_sign_alerts_vital_entry_id_fkey"
            columns: ["vital_entry_id"]
            isOneToOne: false
            referencedRelation: "vital_sign_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_sign_altered_criteria: {
        Row: {
          amber_high_max: number | null
          amber_high_min: number | null
          amber_low_max: number | null
          amber_low_min: number | null
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          clinical_reason: string | null
          confirmation_date: string | null
          confirmed_by_medical_professional: boolean
          created_at: string
          created_by: string | null
          green_max: number | null
          green_min: number | null
          id: string
          is_active: boolean
          medical_professional_name: string | null
          medical_professional_role: string | null
          updated_at: string
          updated_by: string | null
          vital_type: string
        }
        Insert: {
          amber_high_max?: number | null
          amber_high_min?: number | null
          amber_low_max?: number | null
          amber_low_min?: number | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          clinical_reason?: string | null
          confirmation_date?: string | null
          confirmed_by_medical_professional?: boolean
          created_at?: string
          created_by?: string | null
          green_max?: number | null
          green_min?: number | null
          id?: string
          is_active?: boolean
          medical_professional_name?: string | null
          medical_professional_role?: string | null
          updated_at?: string
          updated_by?: string | null
          vital_type: string
        }
        Update: {
          amber_high_max?: number | null
          amber_high_min?: number | null
          amber_low_max?: number | null
          amber_low_min?: number | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          clinical_reason?: string | null
          confirmation_date?: string | null
          confirmed_by_medical_professional?: boolean
          created_at?: string
          created_by?: string | null
          green_max?: number | null
          green_min?: number | null
          id?: string
          is_active?: boolean
          medical_professional_name?: string | null
          medical_professional_role?: string | null
          updated_at?: string
          updated_by?: string | null
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vital_sign_altered_criteria_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_sign_config: {
        Row: {
          amber_recheck_hours: number
          bp_enabled: boolean
          bp_frequency_hours: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_log_on_behalf: boolean
          escalation_recipients: string[] | null
          heart_rate_enabled: boolean
          heart_rate_frequency_hours: number | null
          id: string
          oxygen_enabled: boolean
          oxygen_frequency_hours: number | null
          respiratory_enabled: boolean
          respiratory_frequency_hours: number | null
          temperature_enabled: boolean
          temperature_frequency_hours: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amber_recheck_hours?: number
          bp_enabled?: boolean
          bp_frequency_hours?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_log_on_behalf?: boolean
          escalation_recipients?: string[] | null
          heart_rate_enabled?: boolean
          heart_rate_frequency_hours?: number | null
          id?: string
          oxygen_enabled?: boolean
          oxygen_frequency_hours?: number | null
          respiratory_enabled?: boolean
          respiratory_frequency_hours?: number | null
          temperature_enabled?: boolean
          temperature_frequency_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amber_recheck_hours?: number
          bp_enabled?: boolean
          bp_frequency_hours?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_log_on_behalf?: boolean
          escalation_recipients?: string[] | null
          heart_rate_enabled?: boolean
          heart_rate_frequency_hours?: number | null
          id?: string
          oxygen_enabled?: boolean
          oxygen_frequency_hours?: number | null
          respiratory_enabled?: boolean
          respiratory_frequency_hours?: number | null
          temperature_enabled?: boolean
          temperature_frequency_hours?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_sign_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_sign_entries: {
        Row: {
          bp_diastolic: number | null
          bp_status: string | null
          bp_systolic: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          heart_rate: number | null
          heart_rate_status: string | null
          id: string
          notes: string | null
          overall_status: string
          oxygen_saturation: number | null
          oxygen_status: string | null
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
          respiratory_rate: number | null
          respiratory_status: string | null
          symptoms: string[] | null
          temperature_celsius: number | null
          temperature_status: string | null
        }
        Insert: {
          bp_diastolic?: number | null
          bp_status?: string | null
          bp_systolic?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          heart_rate?: number | null
          heart_rate_status?: string | null
          id?: string
          notes?: string | null
          overall_status?: string
          oxygen_saturation?: number | null
          oxygen_status?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          respiratory_rate?: number | null
          respiratory_status?: string | null
          symptoms?: string[] | null
          temperature_celsius?: number | null
          temperature_status?: string | null
        }
        Update: {
          bp_diastolic?: number | null
          bp_status?: string | null
          bp_systolic?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          heart_rate?: number | null
          heart_rate_status?: string | null
          id?: string
          notes?: string | null
          overall_status?: string
          oxygen_saturation?: number | null
          oxygen_status?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          respiratory_rate?: number | null
          respiratory_status?: string | null
          symptoms?: string[] | null
          temperature_celsius?: number | null
          temperature_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_sign_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_bmi_alerts: {
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
            foreignKeyName: "weight_bmi_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_bmi_config: {
        Row: {
          baseline_weight_kg: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_rapid_change_alert: boolean
          enable_trend_graph: boolean
          escalation_recipients: string[] | null
          height_cm: number | null
          height_is_estimate: boolean | null
          height_method: string | null
          height_method_notes: string | null
          id: string
          knee_height_cm: number | null
          knee_height_sex: string | null
          max_target_weight_kg: number | null
          min_target_weight_kg: number | null
          monitoring_frequency: string
          overdue_escalation_cycles: number | null
          rapid_change_threshold_kg: number | null
          rapid_change_window_days: number | null
          target_range_alert_severity: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          baseline_weight_kg?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_rapid_change_alert?: boolean
          enable_trend_graph?: boolean
          escalation_recipients?: string[] | null
          height_cm?: number | null
          height_is_estimate?: boolean | null
          height_method?: string | null
          height_method_notes?: string | null
          id?: string
          knee_height_cm?: number | null
          knee_height_sex?: string | null
          max_target_weight_kg?: number | null
          min_target_weight_kg?: number | null
          monitoring_frequency?: string
          overdue_escalation_cycles?: number | null
          rapid_change_threshold_kg?: number | null
          rapid_change_window_days?: number | null
          target_range_alert_severity?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          baseline_weight_kg?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_rapid_change_alert?: boolean
          enable_trend_graph?: boolean
          escalation_recipients?: string[] | null
          height_cm?: number | null
          height_is_estimate?: boolean | null
          height_method?: string | null
          height_method_notes?: string | null
          id?: string
          knee_height_cm?: number | null
          knee_height_sex?: string | null
          max_target_weight_kg?: number | null
          min_target_weight_kg?: number | null
          monitoring_frequency?: string
          overdue_escalation_cycles?: number | null
          rapid_change_threshold_kg?: number | null
          rapid_change_window_days?: number | null
          target_range_alert_severity?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_bmi_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          bmi_category: string | null
          bmi_value: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          height_used_cm: number | null
          id: string
          meal_timing: string | null
          notes: string | null
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
          time_of_day: string | null
          weight_kg: number
          wheelchair_context: string | null
        }
        Insert: {
          bmi_category?: string | null
          bmi_value?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          height_used_cm?: number | null
          id?: string
          meal_timing?: string | null
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          time_of_day?: string | null
          weight_kg: number
          wheelchair_context?: string | null
        }
        Update: {
          bmi_category?: string | null
          bmi_value?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          height_used_cm?: number | null
          id?: string
          meal_timing?: string | null
          notes?: string | null
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          time_of_day?: string | null
          weight_kg?: number
          wheelchair_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
