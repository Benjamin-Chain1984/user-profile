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
          default_tool: string
          enabled_tools: string[]
          id: string
          mild_actions: string[]
          mild_alert_recipients: string[]
          mild_custom_actions: string[]
          mild_reassess_hours: number
          moderate_actions: string[]
          moderate_alert_recipients: string[]
          moderate_custom_actions: string[]
          moderate_reassess_hours: number
          overdue_alert_enabled: boolean
          overdue_threshold_days: number
          severe_actions: string[]
          severe_alert_recipients: string[]
          severe_custom_actions: string[]
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
          default_tool?: string
          enabled_tools?: string[]
          id?: string
          mild_actions?: string[]
          mild_alert_recipients?: string[]
          mild_custom_actions?: string[]
          mild_reassess_hours?: number
          moderate_actions?: string[]
          moderate_alert_recipients?: string[]
          moderate_custom_actions?: string[]
          moderate_reassess_hours?: number
          overdue_alert_enabled?: boolean
          overdue_threshold_days?: number
          severe_actions?: string[]
          severe_alert_recipients?: string[]
          severe_custom_actions?: string[]
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
          default_tool?: string
          enabled_tools?: string[]
          id?: string
          mild_actions?: string[]
          mild_alert_recipients?: string[]
          mild_custom_actions?: string[]
          mild_reassess_hours?: number
          moderate_actions?: string[]
          moderate_alert_recipients?: string[]
          moderate_custom_actions?: string[]
          moderate_reassess_hours?: number
          overdue_alert_enabled?: boolean
          overdue_threshold_days?: number
          severe_actions?: string[]
          severe_alert_recipients?: string[]
          severe_custom_actions?: string[]
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
      annual_health_assessment_records: {
        Row: {
          client_id: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          date_completed: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          location: string | null
          next_due_date: string | null
          notes: string | null
        }
        Insert: {
          client_id?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          date_completed: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          location?: string | null
          next_due_date?: string | null
          notes?: string | null
        }
        Update: {
          client_id?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          date_completed?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          location?: string | null
          next_due_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annual_health_assessment_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
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
          amber_diarrhoea_count: number
          amber_no_bm_days_threshold: number
          amber_type1_consecutive_days: number
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
          red_diarrhoea_count: number
          red_no_bm_days_threshold: number
          red_type1_consecutive_days: number
          type1_consecutive_days_threshold: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amber_diarrhoea_count?: number
          amber_no_bm_days_threshold?: number
          amber_type1_consecutive_days?: number
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
          red_diarrhoea_count?: number
          red_no_bm_days_threshold?: number
          red_type1_consecutive_days?: number
          type1_consecutive_days_threshold?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amber_diarrhoea_count?: number
          amber_no_bm_days_threshold?: number
          amber_type1_consecutive_days?: number
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
          red_diarrhoea_count?: number
          red_no_bm_days_threshold?: number
          red_type1_consecutive_days?: number
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
      bowel_care_plan_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          plan_id: string
          plan_version: number
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          plan_id: string
          plan_version: number
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          plan_id?: string
          plan_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bowel_care_plan_acknowledgements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bowel_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_care_plan_versions: {
        Row: {
          change_reason: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bowel_care_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bowel_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_care_plans: {
        Row: {
          client_id: string | null
          communication_preferences: string | null
          consent_to_share: boolean | null
          continence_support: boolean | null
          created_at: string
          created_by: string | null
          date_developed: string | null
          dietary_considerations: string | null
          emergency_responses: Json | null
          enable_autonomic_dysreflexia: boolean
          equipment_checklist: Json | null
          equipment_required: string | null
          fluid_intake_expectations: string | null
          id: string
          known_bowel_patterns: string | null
          last_reviewed_date: string | null
          mobility_considerations: string | null
          next_review_due: string | null
          normal_stool_bristol_types: number[] | null
          participant_involvement_confirmed: boolean | null
          plan_author: string | null
          positioning_requirements: string | null
          prn_escalation_steps: Json | null
          published_at: string | null
          published_by: string | null
          risk_entries: Json | null
          status: string
          toileting_assistance: string | null
          typical_bowel_frequency: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          client_id?: string | null
          communication_preferences?: string | null
          consent_to_share?: boolean | null
          continence_support?: boolean | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          dietary_considerations?: string | null
          emergency_responses?: Json | null
          enable_autonomic_dysreflexia?: boolean
          equipment_checklist?: Json | null
          equipment_required?: string | null
          fluid_intake_expectations?: string | null
          id?: string
          known_bowel_patterns?: string | null
          last_reviewed_date?: string | null
          mobility_considerations?: string | null
          next_review_due?: string | null
          normal_stool_bristol_types?: number[] | null
          participant_involvement_confirmed?: boolean | null
          plan_author?: string | null
          positioning_requirements?: string | null
          prn_escalation_steps?: Json | null
          published_at?: string | null
          published_by?: string | null
          risk_entries?: Json | null
          status?: string
          toileting_assistance?: string | null
          typical_bowel_frequency?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          client_id?: string | null
          communication_preferences?: string | null
          consent_to_share?: boolean | null
          continence_support?: boolean | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          dietary_considerations?: string | null
          emergency_responses?: Json | null
          enable_autonomic_dysreflexia?: boolean
          equipment_checklist?: Json | null
          equipment_required?: string | null
          fluid_intake_expectations?: string | null
          id?: string
          known_bowel_patterns?: string | null
          last_reviewed_date?: string | null
          mobility_considerations?: string | null
          next_review_due?: string | null
          normal_stool_bristol_types?: number[] | null
          participant_involvement_confirmed?: boolean | null
          plan_author?: string | null
          positioning_requirements?: string | null
          prn_escalation_steps?: Json | null
          published_at?: string | null
          published_by?: string | null
          risk_entries?: Json | null
          status?: string
          toileting_assistance?: string | null
          typical_bowel_frequency?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bowel_care_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
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
      cancer_screening_records: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          date_completed: string | null
          deferred_reason: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          location: string | null
          next_due_date: string | null
          notes: string | null
          outcome_known: boolean | null
          screening_type: string
          status: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_completed?: string | null
          deferred_reason?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          location?: string | null
          next_due_date?: string | null
          notes?: string | null
          outcome_known?: boolean | null
          screening_type: string
          status?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_completed?: string | null
          deferred_reason?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          location?: string | null
          next_due_date?: string | null
          notes?: string | null
          outcome_known?: boolean | null
          screening_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancer_screening_records_client_id_fkey"
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
          condition: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          tubing_changed: boolean
        }
        Insert: {
          bag_type: string
          change_reason: string
          client_id?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          tubing_changed?: boolean
        }
        Update: {
          bag_type?: string
          change_reason?: string
          client_id?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          tubing_changed?: boolean
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
      catheter_bag_config: {
        Row: {
          bag_type: string
          change_frequency: string | null
          change_frequency_days: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          low_stock_threshold: number
          stock_level: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bag_type: string
          change_frequency?: string | null
          change_frequency_days?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          stock_level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bag_type?: string
          change_frequency?: string | null
          change_frequency_days?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          stock_level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catheter_bag_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_care_plan_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          plan_id: string
          plan_version: number
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          plan_id: string
          plan_version: number
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          plan_id?: string
          plan_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catheter_care_plan_acknowledgements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catheter_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_care_plan_versions: {
        Row: {
          change_reason: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "catheter_care_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "catheter_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      catheter_care_plans: {
        Row: {
          additional_instructions: string | null
          bag_management_checklist: Json | null
          balloon_size_ml: string | null
          catheter_size_fr: string | null
          catheter_type: string | null
          change_interval: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          date_developed: string | null
          drainage_monitoring_checklist: Json | null
          enable_autonomic_dysreflexia: boolean
          escalation_instructions: Json | null
          fluid_advice_checklist: Json | null
          flush_custom_interval: string | null
          flush_frequency: string | null
          flush_performer: string | null
          flush_prescribed: boolean
          flush_reason: string | null
          flush_solution_other: string | null
          flush_solution_type: string | null
          flush_volume_ml: number | null
          full_system_change_protocol: string | null
          hygiene_checklist: Json | null
          id: string
          insertion_date: string | null
          last_reviewed_date: string | null
          leg_bag_change_frequency: string | null
          next_review_due: string | null
          night_bag_change_frequency: string | null
          no_urine_hours_threshold: number | null
          plan_author: string | null
          plan_author_email: string | null
          plan_author_phone: string | null
          prescribing_clinician: string | null
          published_at: string | null
          published_by: string | null
          responsible_clinician: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          additional_instructions?: string | null
          bag_management_checklist?: Json | null
          balloon_size_ml?: string | null
          catheter_size_fr?: string | null
          catheter_type?: string | null
          change_interval?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          drainage_monitoring_checklist?: Json | null
          enable_autonomic_dysreflexia?: boolean
          escalation_instructions?: Json | null
          fluid_advice_checklist?: Json | null
          flush_custom_interval?: string | null
          flush_frequency?: string | null
          flush_performer?: string | null
          flush_prescribed?: boolean
          flush_reason?: string | null
          flush_solution_other?: string | null
          flush_solution_type?: string | null
          flush_volume_ml?: number | null
          full_system_change_protocol?: string | null
          hygiene_checklist?: Json | null
          id?: string
          insertion_date?: string | null
          last_reviewed_date?: string | null
          leg_bag_change_frequency?: string | null
          next_review_due?: string | null
          night_bag_change_frequency?: string | null
          no_urine_hours_threshold?: number | null
          plan_author?: string | null
          plan_author_email?: string | null
          plan_author_phone?: string | null
          prescribing_clinician?: string | null
          published_at?: string | null
          published_by?: string | null
          responsible_clinician?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          additional_instructions?: string | null
          bag_management_checklist?: Json | null
          balloon_size_ml?: string | null
          catheter_size_fr?: string | null
          catheter_type?: string | null
          change_interval?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          drainage_monitoring_checklist?: Json | null
          enable_autonomic_dysreflexia?: boolean
          escalation_instructions?: Json | null
          fluid_advice_checklist?: Json | null
          flush_custom_interval?: string | null
          flush_frequency?: string | null
          flush_performer?: string | null
          flush_prescribed?: boolean
          flush_reason?: string | null
          flush_solution_other?: string | null
          flush_solution_type?: string | null
          flush_volume_ml?: number | null
          full_system_change_protocol?: string | null
          hygiene_checklist?: Json | null
          id?: string
          insertion_date?: string | null
          last_reviewed_date?: string | null
          leg_bag_change_frequency?: string | null
          next_review_due?: string | null
          night_bag_change_frequency?: string | null
          no_urine_hours_threshold?: number | null
          plan_author?: string | null
          plan_author_email?: string | null
          plan_author_phone?: string | null
          prescribing_clinician?: string | null
          published_at?: string | null
          published_by?: string | null
          responsible_clinician?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "catheter_care_plans_client_id_fkey"
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
          enable_bag_tracking: boolean
          enable_flush_tracking: boolean
          enable_stoma_checks: boolean
          escalation_recipients: string[]
          flush_frequency_hours: number | null
          frequent_change_threshold: number | null
          frequent_change_window_hours: number | null
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
          enable_bag_tracking?: boolean
          enable_flush_tracking?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          flush_frequency_hours?: number | null
          frequent_change_threshold?: number | null
          frequent_change_window_hours?: number | null
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
          enable_bag_tracking?: boolean
          enable_flush_tracking?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          flush_frequency_hours?: number | null
          frequent_change_threshold?: number | null
          frequent_change_window_hours?: number | null
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
          escalation_required: boolean
          event_occurred_at: string
          flow_after_flush: string | null
          flush_reason: string | null
          flush_solution: string | null
          flush_volume_ml: number | null
          id: string
          notes: string | null
          output_description: string | null
          person_response: string | null
          return_volume_ml: number | null
          training_confirmed: boolean
          urine_appearance: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_required?: boolean
          event_occurred_at?: string
          flow_after_flush?: string | null
          flush_reason?: string | null
          flush_solution?: string | null
          flush_volume_ml?: number | null
          id?: string
          notes?: string | null
          output_description?: string | null
          person_response?: string | null
          return_volume_ml?: number | null
          training_confirmed?: boolean
          urine_appearance?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_required?: boolean
          event_occurred_at?: string
          flow_after_flush?: string | null
          flush_reason?: string | null
          flush_solution?: string | null
          flush_volume_ml?: number | null
          id?: string
          notes?: string | null
          output_description?: string | null
          person_response?: string | null
          return_volume_ml?: number | null
          training_confirmed?: boolean
          urine_appearance?: string | null
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
          action_taken: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          dressing_status: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalated_to_clinician: boolean
          escalation_notes: string | null
          escalation_type: string | null
          event_occurred_at: string
          findings: string[] | null
          granulation: boolean
          id: string
          leaking: boolean
          maceration: boolean
          notes: string | null
          pain: boolean
          pain_level: string | null
          redness: boolean
          status_level: string | null
          stoma_condition: string
          swelling: boolean
        }
        Insert: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dressing_status?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          escalation_type?: string | null
          event_occurred_at?: string
          findings?: string[] | null
          granulation?: boolean
          id?: string
          leaking?: boolean
          maceration?: boolean
          notes?: string | null
          pain?: boolean
          pain_level?: string | null
          redness?: boolean
          status_level?: string | null
          stoma_condition: string
          swelling?: boolean
        }
        Update: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dressing_status?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalated_to_clinician?: boolean
          escalation_notes?: string | null
          escalation_type?: string | null
          event_occurred_at?: string
          findings?: string[] | null
          granulation?: boolean
          id?: string
          leaking?: boolean
          maceration?: boolean
          notes?: string | null
          pain?: boolean
          pain_level?: string | null
          redness?: boolean
          status_level?: string | null
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
          enabled_modules: string[] | null
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
          sex: string | null
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
          enabled_modules?: string[] | null
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
          sex?: string | null
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
          enabled_modules?: string[] | null
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
          sex?: string | null
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
          skin_check_frequency: string
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
          skin_check_frequency?: string
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
          skin_check_frequency?: string
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
      enteral_alerts: {
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
            foreignKeyName: "enteral_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_config: {
        Row: {
          apply_position_to_medication: boolean
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_medication_logging: boolean
          enable_stoma_checks: boolean
          escalation_recipients: string[]
          feed_schedule_times: string[]
          feeding_schedule: Json | null
          feeding_type: string | null
          flush_after_feed_ml: number | null
          flush_after_med_ml: number | null
          flush_before_feed_ml: number | null
          flush_before_med_ml: number | null
          flush_continuous_interval_hours: number | null
          flush_continuous_ml: number | null
          formula_custom_name: string | null
          formula_name: string | null
          grace_window_mins: number
          id: string
          missed_feed_red_threshold: number
          next_tube_change_due: string | null
          nil_by_mouth: boolean
          position_angle_min: number | null
          position_maintain_mins: number | null
          prescribed_volume_ml: number | null
          tube_change_alert_lead_days: number
          tube_change_interval_days: number | null
          tube_change_overdue_days: number
          tube_inserted_date: string | null
          tube_size_fr: string | null
          tube_type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          apply_position_to_medication?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_medication_logging?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          feed_schedule_times?: string[]
          feeding_schedule?: Json | null
          feeding_type?: string | null
          flush_after_feed_ml?: number | null
          flush_after_med_ml?: number | null
          flush_before_feed_ml?: number | null
          flush_before_med_ml?: number | null
          flush_continuous_interval_hours?: number | null
          flush_continuous_ml?: number | null
          formula_custom_name?: string | null
          formula_name?: string | null
          grace_window_mins?: number
          id?: string
          missed_feed_red_threshold?: number
          next_tube_change_due?: string | null
          nil_by_mouth?: boolean
          position_angle_min?: number | null
          position_maintain_mins?: number | null
          prescribed_volume_ml?: number | null
          tube_change_alert_lead_days?: number
          tube_change_interval_days?: number | null
          tube_change_overdue_days?: number
          tube_inserted_date?: string | null
          tube_size_fr?: string | null
          tube_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          apply_position_to_medication?: boolean
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_medication_logging?: boolean
          enable_stoma_checks?: boolean
          escalation_recipients?: string[]
          feed_schedule_times?: string[]
          feeding_schedule?: Json | null
          feeding_type?: string | null
          flush_after_feed_ml?: number | null
          flush_after_med_ml?: number | null
          flush_before_feed_ml?: number | null
          flush_before_med_ml?: number | null
          flush_continuous_interval_hours?: number | null
          flush_continuous_ml?: number | null
          formula_custom_name?: string | null
          formula_name?: string | null
          grace_window_mins?: number
          id?: string
          missed_feed_red_threshold?: number
          next_tube_change_due?: string | null
          nil_by_mouth?: boolean
          position_angle_min?: number | null
          position_maintain_mins?: number | null
          prescribed_volume_ml?: number | null
          tube_change_alert_lead_days?: number
          tube_change_interval_days?: number | null
          tube_change_overdue_days?: number
          tube_inserted_date?: string | null
          tube_size_fr?: string | null
          tube_type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enteral_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_feed_logs: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          feed_volume_ml: number
          flush_given_ml: number
          id: string
          method: string | null
          notes: string | null
          position_angle: number | null
          position_confirmed: boolean
          position_override_reason: string | null
          rate_ml_per_hour: number | null
          scheduled_time: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          feed_volume_ml: number
          flush_given_ml?: number
          id?: string
          method?: string | null
          notes?: string | null
          position_angle?: number | null
          position_confirmed?: boolean
          position_override_reason?: string | null
          rate_ml_per_hour?: number | null
          scheduled_time?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          feed_volume_ml?: number
          flush_given_ml?: number
          id?: string
          method?: string | null
          notes?: string | null
          position_angle?: number | null
          position_confirmed?: boolean
          position_override_reason?: string | null
          rate_ml_per_hour?: number | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enteral_feed_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_flush_logs: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          flush_reason: string
          flush_volume_ml: number
          id: string
          notes: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_reason: string
          flush_volume_ml?: number
          id?: string
          notes?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_reason?: string
          flush_volume_ml?: number
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enteral_flush_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_medication_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          display_order: number
          dose: string
          flush_after_ml: number
          flush_before_ml: number
          id: string
          is_active: boolean
          medication_name: string
          route: string | null
          scheduled_times: string[]
          special_instructions: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          dose: string
          flush_after_ml?: number
          flush_before_ml?: number
          id?: string
          is_active?: boolean
          medication_name: string
          route?: string | null
          scheduled_times?: string[]
          special_instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          dose?: string
          flush_after_ml?: number
          flush_before_ml?: number
          id?: string
          is_active?: boolean
          medication_name?: string
          route?: string | null
          scheduled_times?: string[]
          special_instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enteral_medication_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_medication_logs: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          dose: string
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          flush_after_ml: number
          flush_before_ml: number
          id: string
          medication_config_id: string | null
          medication_name: string
          notes: string | null
          position_confirmed: boolean
          scheduled_time: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_after_ml?: number
          flush_before_ml?: number
          id?: string
          medication_config_id?: string | null
          medication_name: string
          notes?: string | null
          position_confirmed?: boolean
          scheduled_time?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose?: string
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          flush_after_ml?: number
          flush_before_ml?: number
          id?: string
          medication_config_id?: string | null
          medication_name?: string
          notes?: string | null
          position_confirmed?: boolean
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enteral_medication_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enteral_medication_logs_medication_config_id_fkey"
            columns: ["medication_config_id"]
            isOneToOne: false
            referencedRelation: "enteral_medication_config"
            referencedColumns: ["id"]
          },
        ]
      }
      enteral_stoma_checks: {
        Row: {
          action_taken: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalation_type: string | null
          event_occurred_at: string
          findings: string[]
          id: string
          notes: string | null
          pain_level: string
          status_level: string
        }
        Insert: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_type?: string | null
          event_occurred_at?: string
          findings?: string[]
          id?: string
          notes?: string | null
          pain_level?: string
          status_level?: string
        }
        Update: {
          action_taken?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_type?: string | null
          event_occurred_at?: string
          findings?: string[]
          id?: string
          notes?: string | null
          pain_level?: string
          status_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "enteral_stoma_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      epilepsy_alerts: {
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
            foreignKeyName: "epilepsy_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      epilepsy_config: {
        Row: {
          amber_seizure_count: number
          amber_seizure_window: number
          amber_seizure_window_unit: string
          call_000_after_minutes: number
          client_id: string | null
          cluster_seizure_count: number
          cluster_seizure_hours: number
          created_at: string
          created_by: string | null
          duration_threshold_minutes: number
          enable_seizure_monitoring: boolean
          escalation_recipients: string[]
          expected_seizure_frequency: string
          id: string
          known_cluster_seizures: boolean
          known_seizure_durations: Json
          known_seizure_triggers: string[]
          known_seizure_types: string[]
          max_seizures_24h: number
          red_seizure_count: number
          red_seizure_window: number
          red_seizure_window_unit: string
          rescue_medication_dose: string | null
          rescue_medication_name: string | null
          rescue_medication_prescribed: boolean
          rescue_medication_route: string | null
          rescue_medication_when: string | null
          typical_seizure_duration_minutes: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amber_seizure_count?: number
          amber_seizure_window?: number
          amber_seizure_window_unit?: string
          call_000_after_minutes?: number
          client_id?: string | null
          cluster_seizure_count?: number
          cluster_seizure_hours?: number
          created_at?: string
          created_by?: string | null
          duration_threshold_minutes?: number
          enable_seizure_monitoring?: boolean
          escalation_recipients?: string[]
          expected_seizure_frequency?: string
          id?: string
          known_cluster_seizures?: boolean
          known_seizure_durations?: Json
          known_seizure_triggers?: string[]
          known_seizure_types?: string[]
          max_seizures_24h?: number
          red_seizure_count?: number
          red_seizure_window?: number
          red_seizure_window_unit?: string
          rescue_medication_dose?: string | null
          rescue_medication_name?: string | null
          rescue_medication_prescribed?: boolean
          rescue_medication_route?: string | null
          rescue_medication_when?: string | null
          typical_seizure_duration_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amber_seizure_count?: number
          amber_seizure_window?: number
          amber_seizure_window_unit?: string
          call_000_after_minutes?: number
          client_id?: string | null
          cluster_seizure_count?: number
          cluster_seizure_hours?: number
          created_at?: string
          created_by?: string | null
          duration_threshold_minutes?: number
          enable_seizure_monitoring?: boolean
          escalation_recipients?: string[]
          expected_seizure_frequency?: string
          id?: string
          known_cluster_seizures?: boolean
          known_seizure_durations?: Json
          known_seizure_triggers?: string[]
          known_seizure_types?: string[]
          max_seizures_24h?: number
          red_seizure_count?: number
          red_seizure_window?: number
          red_seizure_window_unit?: string
          rescue_medication_dose?: string | null
          rescue_medication_name?: string | null
          rescue_medication_prescribed?: boolean
          rescue_medication_route?: string | null
          rescue_medication_when?: string | null
          typical_seizure_duration_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epilepsy_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      epilepsy_escalation_records: {
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
          seizure_event_id: string | null
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
          seizure_event_id?: string | null
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
          seizure_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epilepsy_escalation_records_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "epilepsy_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epilepsy_escalation_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epilepsy_escalation_records_seizure_event_id_fkey"
            columns: ["seizure_event_id"]
            isOneToOne: false
            referencedRelation: "seizure_events"
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
      health_prevention_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_name: string
          item_type: string
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
          item_name: string
          item_type: string
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
          item_name?: string
          item_type?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_reason?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_prevention_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      health_prevention_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_cancer_screening: boolean
          enable_vaccination_reminders: boolean
          escalation_recipients: string[] | null
          gp_contact_details: string | null
          gp_practice_name: string | null
          id: string
          lung_screening_smoking_history: string | null
          reminder_text: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_cancer_screening?: boolean
          enable_vaccination_reminders?: boolean
          escalation_recipients?: string[] | null
          gp_contact_details?: string | null
          gp_practice_name?: string | null
          id?: string
          lung_screening_smoking_history?: string | null
          reminder_text?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_cancer_screening?: boolean
          enable_vaccination_reminders?: boolean
          escalation_recipients?: string[] | null
          gp_contact_details?: string | null
          gp_practice_name?: string | null
          id?: string
          lung_screening_smoking_history?: string | null
          reminder_text?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_prevention_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
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
      iddsi_alerts: {
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
            foreignKeyName: "iddsi_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      iddsi_config: {
        Row: {
          additional_instructions: string | null
          amber_recipient_ids: string[]
          client_id: string | null
          created_at: string
          created_by: string | null
          drink_level: number | null
          drink_level_set_at: string | null
          enable_notifications: boolean
          enable_observations: boolean
          food_level: number | null
          food_level_set_at: string | null
          food_level_variant: string | null
          id: string
          last_review_date: string | null
          min_safe_angle: number | null
          next_review_due: string | null
          observation_frequency: string
          red_recipient_ids: string[]
          target_safe_angle: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          additional_instructions?: string | null
          amber_recipient_ids?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          drink_level?: number | null
          drink_level_set_at?: string | null
          enable_notifications?: boolean
          enable_observations?: boolean
          food_level?: number | null
          food_level_set_at?: string | null
          food_level_variant?: string | null
          id?: string
          last_review_date?: string | null
          min_safe_angle?: number | null
          next_review_due?: string | null
          observation_frequency?: string
          red_recipient_ids?: string[]
          target_safe_angle?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          additional_instructions?: string | null
          amber_recipient_ids?: string[]
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          drink_level?: number | null
          drink_level_set_at?: string | null
          enable_notifications?: boolean
          enable_observations?: boolean
          food_level?: number | null
          food_level_set_at?: string | null
          food_level_variant?: string | null
          id?: string
          last_review_date?: string | null
          min_safe_angle?: number | null
          next_review_due?: string | null
          observation_frequency?: string
          red_recipient_ids?: string[]
          target_safe_angle?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iddsi_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          billing_entity: string
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at: string
          due_date: string
          gst_cents: number
          id: string
          invoice_number: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_cents: number
          billing_entity?: string
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at?: string
          due_date: string
          gst_cents: number
          id?: string
          invoice_number: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          total_cents: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          billing_entity?: string
          billing_period_end?: string
          billing_period_start?: string
          client_id?: string
          created_at?: string
          due_date?: string
          gst_cents?: number
          id?: string
          invoice_number?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      mealtime_observations: {
        Row: {
          client_id: string | null
          completed_by_name: string
          coughing: string
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          fatigue: boolean
          id: string
          meal_completion_pct: number | null
          notes: string | null
          pocketing: boolean
          refusal: boolean
          severity: string
          throat_clearing: boolean
          wet_voice: boolean
        }
        Insert: {
          client_id?: string | null
          completed_by_name: string
          coughing?: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          fatigue?: boolean
          id?: string
          meal_completion_pct?: number | null
          notes?: string | null
          pocketing?: boolean
          refusal?: boolean
          severity?: string
          throat_clearing?: boolean
          wet_voice?: boolean
        }
        Update: {
          client_id?: string | null
          completed_by_name?: string
          coughing?: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          fatigue?: boolean
          id?: string
          meal_completion_pct?: number | null
          notes?: string | null
          pocketing?: boolean
          refusal?: boolean
          severity?: string
          throat_clearing?: boolean
          wet_voice?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mealtime_observations_client_id_fkey"
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
      oral_health_alerts: {
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
            foreignKeyName: "oral_health_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_assessments: {
        Row: {
          action_notes: string | null
          action_taken: string | null
          assessment_trigger: string
          breath: string
          cleanliness: string
          client_id: string | null
          created_at: string
          created_by: string | null
          dental_pain: string
          dentures: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalation_contact: string | null
          gums: string
          id: string
          lips: string
          mouth_annotations: Json | null
          overall_status: string
          roof_of_mouth: string
          teeth: string
          tongue: string
        }
        Insert: {
          action_notes?: string | null
          action_taken?: string | null
          assessment_trigger?: string
          breath?: string
          cleanliness?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dental_pain?: string
          dentures?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_contact?: string | null
          gums?: string
          id?: string
          lips?: string
          mouth_annotations?: Json | null
          overall_status?: string
          roof_of_mouth?: string
          teeth?: string
          tongue?: string
        }
        Update: {
          action_notes?: string | null
          action_taken?: string | null
          assessment_trigger?: string
          breath?: string
          cleanliness?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dental_pain?: string
          dentures?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_contact?: string | null
          gums?: string
          id?: string
          lips?: string
          mouth_annotations?: Json | null
          overall_status?: string
          roof_of_mouth?: string
          teeth?: string
          tongue?: string
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_config: {
        Row: {
          assessment_frequency: string
          client_id: string | null
          consecutive_missed_tasks_alert: number
          created_at: string
          created_by: string | null
          dysphagia_flagged: boolean
          enable_compliance_monitoring: boolean
          escalation_recipients: string[]
          global_assistance_level: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_frequency?: string
          client_id?: string | null
          consecutive_missed_tasks_alert?: number
          created_at?: string
          created_by?: string | null
          dysphagia_flagged?: boolean
          enable_compliance_monitoring?: boolean
          escalation_recipients?: string[]
          global_assistance_level?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_frequency?: string
          client_id?: string | null
          consecutive_missed_tasks_alert?: number
          created_at?: string
          created_by?: string | null
          dysphagia_flagged?: boolean
          enable_compliance_monitoring?: boolean
          escalation_recipients?: string[]
          global_assistance_level?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_plan_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          notes: string | null
          plan_id: string
          plan_version: number
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          plan_version: number
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          plan_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_plan_acknowledgements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "oral_health_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_plan_categories: {
        Row: {
          additional_instructions: string | null
          am_required: boolean
          assistance_level: string | null
          category: string
          cleaning_method: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          dentist_instructions: string | null
          display_order: number
          id: string
          pm_required: boolean
          products: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          additional_instructions?: string | null
          am_required?: boolean
          assistance_level?: string | null
          category: string
          cleaning_method?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dentist_instructions?: string | null
          display_order?: number
          id?: string
          pm_required?: boolean
          products?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          additional_instructions?: string | null
          am_required?: boolean
          assistance_level?: string | null
          category?: string
          cleaning_method?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dentist_instructions?: string | null
          display_order?: number
          id?: string
          pm_required?: boolean
          products?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_plan_categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_plan_versions: {
        Row: {
          change_reason: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "oral_health_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_plans: {
        Row: {
          additional_instructions: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          date_developed: string | null
          dentist_instructions: string | null
          global_assistance_level: string | null
          id: string
          last_reviewed_date: string | null
          next_review_due: string | null
          plan_author: string | null
          plan_categories: Json | null
          published_at: string | null
          published_by: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          additional_instructions?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          dentist_instructions?: string | null
          global_assistance_level?: string | null
          id?: string
          last_reviewed_date?: string | null
          next_review_due?: string | null
          plan_author?: string | null
          plan_categories?: Json | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          additional_instructions?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          dentist_instructions?: string | null
          global_assistance_level?: string | null
          id?: string
          last_reviewed_date?: string | null
          next_review_due?: string | null
          plan_author?: string | null
          plan_categories?: Json | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      oral_health_task_logs: {
        Row: {
          client_id: string | null
          completed: boolean
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          log_date: string
          notes: string | null
          period: string
        }
        Insert: {
          client_id?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          period: string
        }
        Update: {
          client_id?: string | null
          completed?: boolean
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "oral_health_task_logs_client_id_fkey"
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
      painad_assessments: {
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
          q1_breathing: number
          q2_negative_vocalization: number
          q3_facial_expression: number
          q4_body_language: number
          q5_consolability: number
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
          q1_breathing: number
          q2_negative_vocalization: number
          q3_facial_expression: number
          q4_body_language: number
          q5_consolability: number
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
          q1_breathing?: number
          q2_negative_vocalization?: number
          q3_facial_expression?: number
          q4_body_language?: number
          q5_consolability?: number
          severity?: string
          total_score?: number
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "painad_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      positioning_checks: {
        Row: {
          angle_degrees: number
          client_id: string | null
          completed_by_name: string
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          feet_supported: boolean
          head_midline: boolean
          hips_at_back: boolean
          id: string
          notes: string | null
          person_upright: boolean
          status: string
        }
        Insert: {
          angle_degrees: number
          client_id?: string | null
          completed_by_name: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          feet_supported?: boolean
          head_midline?: boolean
          hips_at_back?: boolean
          id?: string
          notes?: string | null
          person_upright?: boolean
          status?: string
        }
        Update: {
          angle_degrees?: number
          client_id?: string | null
          completed_by_name?: string
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          feet_supported?: boolean
          head_midline?: boolean
          hips_at_back?: boolean
          id?: string
          notes?: string | null
          person_upright?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "positioning_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_area_alerts: {
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
            foreignKeyName: "pressure_area_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_area_config: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          enable_compliance_scoring: boolean | null
          escalation_recipients: string[] | null
          id: string
          skin_check_frequency_days: number | null
          skin_check_times: string[]
          skin_checks_per_day: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_compliance_scoring?: boolean | null
          escalation_recipients?: string[] | null
          id?: string
          skin_check_frequency_days?: number | null
          skin_check_times?: string[]
          skin_checks_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          enable_compliance_scoring?: boolean | null
          escalation_recipients?: string[] | null
          id?: string
          skin_check_frequency_days?: number | null
          skin_check_times?: string[]
          skin_checks_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pressure_area_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_area_escalation_records: {
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
            foreignKeyName: "pressure_area_escalation_records_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "pressure_area_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pressure_area_escalation_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_relief_events: {
        Row: {
          client_id: string | null
          completed_by_name: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalation_advice: string | null
          escalation_contact: string | null
          escalation_required: boolean | null
          event_occurred_at: string
          id: string
          issue_details: string | null
          issues: string[] | null
          notes: string | null
          position_completed: string
          position_recommended: string | null
          scheduled_time: string | null
        }
        Insert: {
          client_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_advice?: string | null
          escalation_contact?: string | null
          escalation_required?: boolean | null
          event_occurred_at?: string
          id?: string
          issue_details?: string | null
          issues?: string[] | null
          notes?: string | null
          position_completed: string
          position_recommended?: string | null
          scheduled_time?: string | null
        }
        Update: {
          client_id?: string | null
          completed_by_name?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_advice?: string | null
          escalation_contact?: string | null
          escalation_required?: boolean | null
          event_occurred_at?: string
          id?: string
          issue_details?: string | null
          issues?: string[] | null
          notes?: string | null
          position_completed?: string
          position_recommended?: string | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pressure_relief_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_relief_plan_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          notes: string | null
          plan_id: string
          plan_version: number
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          plan_version: number
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          plan_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pressure_relief_plan_acknowledgements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pressure_relief_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_relief_plan_versions: {
        Row: {
          change_reason: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pressure_relief_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pressure_relief_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pressure_relief_plans: {
        Row: {
          additional_instructions: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          date_developed: string | null
          day_schedule_end: string | null
          day_schedule_start: string | null
          escalation_rules: Json | null
          high_risk_areas: string[] | null
          id: string
          interval_minutes: number | null
          last_reviewed_date: string | null
          next_review_due: string | null
          night_schedule_end: string | null
          night_schedule_start: string | null
          overdue_amber_minutes: number | null
          overdue_red_minutes: number | null
          plan_author: string | null
          plan_author_email: string | null
          plan_author_phone: string | null
          published_at: string | null
          published_by: string | null
          rotation_sequence: Json | null
          schedule_type: string | null
          skin_check_schedule: Json | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          additional_instructions?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          day_schedule_end?: string | null
          day_schedule_start?: string | null
          escalation_rules?: Json | null
          high_risk_areas?: string[] | null
          id?: string
          interval_minutes?: number | null
          last_reviewed_date?: string | null
          next_review_due?: string | null
          night_schedule_end?: string | null
          night_schedule_start?: string | null
          overdue_amber_minutes?: number | null
          overdue_red_minutes?: number | null
          plan_author?: string | null
          plan_author_email?: string | null
          plan_author_phone?: string | null
          published_at?: string | null
          published_by?: string | null
          rotation_sequence?: Json | null
          schedule_type?: string | null
          skin_check_schedule?: Json | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          additional_instructions?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_developed?: string | null
          day_schedule_end?: string | null
          day_schedule_start?: string | null
          escalation_rules?: Json | null
          high_risk_areas?: string[] | null
          id?: string
          interval_minutes?: number | null
          last_reviewed_date?: string | null
          next_review_due?: string | null
          night_schedule_end?: string | null
          night_schedule_start?: string | null
          overdue_amber_minutes?: number | null
          overdue_red_minutes?: number | null
          plan_author?: string | null
          plan_author_email?: string | null
          plan_author_phone?: string | null
          published_at?: string | null
          published_by?: string | null
          rotation_sequence?: Json | null
          schedule_type?: string | null
          skin_check_schedule?: Json | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pressure_relief_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_monitoring_status: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_paused: boolean
          pause_end_datetime: string | null
          pause_notes: string | null
          pause_reason: string | null
          pause_start_datetime: string | null
          paused_by_user_id: string | null
          resumed_at: string | null
          resumed_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_paused?: boolean
          pause_end_datetime?: string | null
          pause_notes?: string | null
          pause_reason?: string | null
          pause_start_datetime?: string | null
          paused_by_user_id?: string | null
          resumed_at?: string | null
          resumed_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_paused?: boolean
          pause_end_datetime?: string | null
          pause_notes?: string | null
          pause_reason?: string | null
          pause_start_datetime?: string | null
          paused_by_user_id?: string | null
          resumed_at?: string | null
          resumed_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_monitoring_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          last_mfa_verified_at: string | null
          next_mfa_due_at: string | null
          phone_verified_at: string | null
          poster_qr_token_hash: string | null
          updated_at: string
          verified_phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_mfa_verified_at?: string | null
          next_mfa_due_at?: string | null
          phone_verified_at?: string | null
          poster_qr_token_hash?: string | null
          updated_at?: string
          verified_phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_mfa_verified_at?: string | null
          next_mfa_due_at?: string | null
          phone_verified_at?: string | null
          poster_qr_token_hash?: string | null
          updated_at?: string
          verified_phone?: string | null
        }
        Relationships: []
      }
      qr_access_logs: {
        Row: {
          access_method: string
          accessed_at: string
          client_id: string | null
          device_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          access_method?: string
          accessed_at?: string
          client_id?: string | null
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          access_method?: string
          accessed_at?: string
          client_id?: string | null
          device_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_access_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      seizure_actions: {
        Row: {
          action_type: string
          ambulance_called: boolean
          ambulance_outcome: string | null
          ambulance_time_called: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          dose_change_reason: string | null
          dose_matches_plan: boolean | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          escalation_completed: boolean
          id: string
          injuries_noted: string | null
          medication_dose: string | null
          medication_name: string | null
          medication_route: string | null
          post_event_notes: string | null
          seizure_event_id: string | null
          time_administered: string | null
          total_recovery_time_minutes: number | null
          total_seizure_duration_minutes: number | null
          witness_name: string | null
        }
        Insert: {
          action_type?: string
          ambulance_called?: boolean
          ambulance_outcome?: string | null
          ambulance_time_called?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose_change_reason?: string | null
          dose_matches_plan?: boolean | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_completed?: boolean
          id?: string
          injuries_noted?: string | null
          medication_dose?: string | null
          medication_name?: string | null
          medication_route?: string | null
          post_event_notes?: string | null
          seizure_event_id?: string | null
          time_administered?: string | null
          total_recovery_time_minutes?: number | null
          total_seizure_duration_minutes?: number | null
          witness_name?: string | null
        }
        Update: {
          action_type?: string
          ambulance_called?: boolean
          ambulance_outcome?: string | null
          ambulance_time_called?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          dose_change_reason?: string | null
          dose_matches_plan?: boolean | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          escalation_completed?: boolean
          id?: string
          injuries_noted?: string | null
          medication_dose?: string | null
          medication_name?: string | null
          medication_route?: string | null
          post_event_notes?: string | null
          seizure_event_id?: string | null
          time_administered?: string | null
          total_recovery_time_minutes?: number | null
          total_seizure_duration_minutes?: number | null
          witness_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seizure_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seizure_actions_seizure_event_id_fkey"
            columns: ["seizure_event_id"]
            isOneToOne: false
            referencedRelation: "seizure_events"
            referencedColumns: ["id"]
          },
        ]
      }
      seizure_events: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          duration_seconds: number
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          observation_type: string
          recovery: string[]
          recovery_notes: string | null
          seizure_category: string
          seizure_type: string
          trigger_other: string | null
          triggers: string[]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          duration_seconds?: number
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          observation_type?: string
          recovery?: string[]
          recovery_notes?: string | null
          seizure_category?: string
          seizure_type?: string
          trigger_other?: string | null
          triggers?: string[]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          duration_seconds?: number
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          observation_type?: string
          recovery?: string[]
          recovery_notes?: string | null
          seizure_category?: string
          seizure_type?: string
          trigger_other?: string | null
          triggers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "seizure_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_check_sessions: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          event_occurred_at: string
          id: string
          notes: string | null
          overall_status: string
          scheduled_time: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          overall_status?: string
          scheduled_time?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          event_occurred_at?: string
          id?: string
          notes?: string | null
          overall_status?: string
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skin_check_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_finding_markers: {
        Row: {
          created_at: string
          finding_type: string
          id: string
          location: string
          notes: string | null
          session_id: string
          severity: string
          x_percent: number | null
          y_percent: number | null
        }
        Insert: {
          created_at?: string
          finding_type: string
          id?: string
          location: string
          notes?: string | null
          session_id: string
          severity?: string
          x_percent?: number | null
          y_percent?: number | null
        }
        Update: {
          created_at?: string
          finding_type?: string
          id?: string
          location?: string
          notes?: string | null
          session_id?: string
          severity?: string
          x_percent?: number | null
          y_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skin_finding_markers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "skin_check_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_alerts: {
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
            foreignKeyName: "sleep_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_config: {
        Row: {
          client_id: string | null
          consecutive_disruption_alert_days: number
          consecutive_excessive_sleep_trigger: number | null
          created_at: string
          created_by: string | null
          disruption_threshold: number
          escalation_recipients: string[]
          id: string
          max_sleep_threshold_hours: number | null
          min_expected_sleep_hours: number
          poor_sleep_threshold_hours: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          consecutive_disruption_alert_days?: number
          consecutive_excessive_sleep_trigger?: number | null
          created_at?: string
          created_by?: string | null
          disruption_threshold?: number
          escalation_recipients?: string[]
          id?: string
          max_sleep_threshold_hours?: number | null
          min_expected_sleep_hours?: number
          poor_sleep_threshold_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          consecutive_disruption_alert_days?: number
          consecutive_excessive_sleep_trigger?: number | null
          created_at?: string
          created_by?: string | null
          disruption_threshold?: number
          escalation_recipients?: string[]
          id?: string
          max_sleep_threshold_hours?: number | null
          min_expected_sleep_hours?: number
          poor_sleep_threshold_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sleep_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_entries: {
        Row: {
          assistance_other_text: string | null
          assistance_types: string[]
          awake_period_length: string | null
          awakening_events: Json | null
          bedtime: string
          client_id: string | null
          created_at: string
          created_by: string | null
          day_nap: boolean
          day_nap_behaviour_before: string | null
          day_nap_duration_minutes: number | null
          day_nap_notes: string | null
          day_nap_time: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          estimated_hours_slept: number
          event_occurred_at: string
          id: string
          notes: string | null
          number_of_awakenings: number
          recorded_on_behalf_of_name: string | null
          recorded_on_behalf_of_reason: string | null
          recorded_on_behalf_of_role: string | null
          restlessness: boolean
          wake_time: string
        }
        Insert: {
          assistance_other_text?: string | null
          assistance_types?: string[]
          awake_period_length?: string | null
          awakening_events?: Json | null
          bedtime: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          day_nap?: boolean
          day_nap_behaviour_before?: string | null
          day_nap_duration_minutes?: number | null
          day_nap_notes?: string | null
          day_nap_time?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          estimated_hours_slept: number
          event_occurred_at?: string
          id?: string
          notes?: string | null
          number_of_awakenings?: number
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          restlessness?: boolean
          wake_time: string
        }
        Update: {
          assistance_other_text?: string | null
          assistance_types?: string[]
          awake_period_length?: string | null
          awakening_events?: Json | null
          bedtime?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          day_nap?: boolean
          day_nap_behaviour_before?: string | null
          day_nap_duration_minutes?: number | null
          day_nap_notes?: string | null
          day_nap_time?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          estimated_hours_slept?: number
          event_occurred_at?: string
          id?: string
          notes?: string | null
          number_of_awakenings?: number
          recorded_on_behalf_of_name?: string | null
          recorded_on_behalf_of_reason?: string | null
          recorded_on_behalf_of_role?: string | null
          restlessness?: boolean
          wake_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_ends_at: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_type: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_type?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      swallowing_video_views: {
        Row: {
          client_id: string | null
          id: string
          level_type: string
          level_value: number
          skipped: boolean
          staff_name: string
          staff_user_id: string | null
          viewed_at: string
        }
        Insert: {
          client_id?: string | null
          id?: string
          level_type: string
          level_value: number
          skipped?: boolean
          staff_name: string
          staff_user_id?: string | null
          viewed_at?: string
        }
        Update: {
          client_id?: string | null
          id?: string
          level_type?: string
          level_value?: number
          skipped?: boolean
          staff_name?: string
          staff_user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swallowing_video_views_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          device_id: string
          device_name: string | null
          expires_at: string
          id: string
          is_active: boolean
          last_seen_at: string
          revoked_at: string | null
          trusted_at: string
          user_id: string
        }
        Insert: {
          device_id: string
          device_name?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          revoked_at?: string | null
          trusted_at?: string
          user_id: string
        }
        Update: {
          device_id?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          revoked_at?: string | null
          trusted_at?: string
          user_id?: string
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
      vaccination_records: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          date_given: string | null
          edit_reason: string | null
          edited_at: string | null
          edited_by: string | null
          given_by: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          status: string
          vaccination_type: string
          vaccine_brand: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_given?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          given_by?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          status?: string
          vaccination_type: string
          vaccine_brand?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          date_given?: string | null
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string | null
          given_by?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          status?: string
          vaccination_type?: string
          vaccine_brand?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_health_insights: {
        Row: {
          client_id: string
          created_by: string | null
          enabled_modules: string[]
          generated_at: string
          id: string
          insight_summary: string
          next_due_at: string
        }
        Insert: {
          client_id: string
          created_by?: string | null
          enabled_modules?: string[]
          generated_at?: string
          id?: string
          insight_summary: string
          next_due_at?: string
        }
        Update: {
          client_id?: string
          created_by?: string | null
          enabled_modules?: string[]
          generated_at?: string
          id?: string
          insight_summary?: string
          next_due_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_health_insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
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
      billing_cycle: "monthly" | "quarterly" | "annual"
      catheter_type:
        | "spc"
        | "idc"
        | "balloon"
        | "intermittent"
        | "urostomy"
        | "condom"
      invoice_status: "paid" | "due" | "overdue"
      subscription_status:
        | "trial"
        | "active"
        | "grace_period"
        | "restricted"
        | "suspended"
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
      billing_cycle: ["monthly", "quarterly", "annual"],
      catheter_type: [
        "spc",
        "idc",
        "balloon",
        "intermittent",
        "urostomy",
        "condom",
      ],
      invoice_status: ["paid", "due", "overdue"],
      subscription_status: [
        "trial",
        "active",
        "grace_period",
        "restricted",
        "suspended",
      ],
    },
  },
} as const
