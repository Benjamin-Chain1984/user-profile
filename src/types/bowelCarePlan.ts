/**
 * Digital Bowel Care Plan Types
 */

export interface RiskEntry {
  id: string;
  risk_type: string;
  custom_label?: string;
  enabled: boolean;
  threshold_value?: number;
  threshold_unit?: string;
  actions: string[];
}

export interface PrnEscalationStep {
  id: string;
  step_number: number;
  medication_name: string;
  dose: string;
  route: 'oral' | 'rectal';
  wait_hours: number;
  next_action: 'repeat' | 'escalate_gp' | 'attend_hospital' | 'second_dose';
  next_medication_name?: string;
  next_dose?: string;
}

export interface EmergencyResponse {
  id: string;
  scenario: string;
  steps: string[];
}

export interface EquipmentChecklist {
  gloves: boolean;
  lubricant: boolean;
  enema: boolean;
  suppositories: boolean;
  continence_pads: boolean;
  hoist: boolean;
  commode: boolean;
  other: string;
}

export interface BowelCarePlan {
  id: string;
  client_id: string | null;
  version: number;
  status: 'draft' | 'published' | 'archived';

  // A1: Plan Overview
  plan_author: string | null;
  date_developed: string | null;
  last_reviewed_date: string | null;
  next_review_due: string | null;
  participant_involvement_confirmed: boolean;
  consent_to_share: boolean;

  // A2: Participant Profile
  normal_stool_bristol_types: number[];
  typical_bowel_frequency: string | null;
  known_bowel_patterns: string | null;
  dietary_considerations: string | null;
  fluid_intake_expectations: string | null;
  mobility_considerations: string | null;
  communication_preferences: string | null;

  // A3: Support Requirements
  toileting_assistance: 'independent' | 'prompting' | 'physical_assistance' | 'full_support';
  positioning_requirements: string | null;
  equipment_required: string | null;
  continence_support: boolean;

  // A4: Risk Monitoring
  risk_entries: RiskEntry[];
  prn_escalation_steps: PrnEscalationStep[];

  // A5: Emergency Response
  emergency_responses: EmergencyResponse[];

  // A6: Equipment
  equipment_checklist: EquipmentChecklist;

  // Audit
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  published_at: string | null;
  published_by: string | null;
}

export interface BowelCarePlanVersion {
  id: string;
  plan_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  change_summary: string | null;
  change_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface BowelCarePlanAcknowledgement {
  id: string;
  plan_id: string;
  plan_version: number;
  user_id: string;
  acknowledged_at: string;
}

export type PlanReviewStatus = 'up_to_date' | 'review_due_soon' | 'review_overdue';

export interface PlanStatusInfo {
  reviewStatus: PlanReviewStatus;
  reviewMessage: string;
  needsAcknowledgement: boolean;
  acknowledgementMessage: string;
  daysUntilReview: number | null;
}

export const RISK_TYPES = [
  { value: 'no_bm_days', label: 'No bowel motion for X days' },
  { value: 'hard_pellets', label: 'Hard pellets (Type 1) for X days' },
  { value: 'loose_watery', label: 'Loose/watery stools' },
  { value: 'abdominal_pain', label: 'Abdominal pain' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'blood_in_stool', label: 'Blood in stool' },
  { value: 'behaviour_change', label: 'Change in behaviour' },
] as const;

export const RISK_ACTIONS = [
  { value: 'monitor', label: 'Monitor' },
  { value: 'record_in_ideal', label: 'Record in IDEAL' },
  { value: 'administer_prn', label: 'Administer PRN' },
  { value: 'escalate_gp', label: 'Escalate to GP' },
  { value: 'urgent_medical', label: 'Seek urgent medical care' },
  { value: 'go_to_hospital', label: 'Go to Hospital' },
] as const;

export const TOILETING_ASSISTANCE_OPTIONS = [
  { value: 'independent', label: 'Independent' },
  { value: 'prompting', label: 'Prompting' },
  { value: 'physical_assistance', label: 'Physical Assistance' },
  { value: 'full_support', label: 'Full Support' },
] as const;

export const DEFAULT_EMERGENCY_RESPONSES: EmergencyResponse[] = [
  {
    id: '1',
    scenario: 'If severe constipation suspected',
    steps: [
      'Monitor for signs of distress or pain',
      'Review bowel chart for last 3-5 days',
      'Administer PRN laxative if prescribed',
      'Contact GP if no improvement within timeframe',
    ],
  },
  {
    id: '2',
    scenario: 'If faecal impaction suspected',
    steps: [
      'Do not administer oral laxatives without medical advice',
      'Contact GP or nurse immediately',
      'Document symptoms and timeline',
      'Follow medical instructions when received',
    ],
  },
  {
    id: '3',
    scenario: 'If blood in stool',
    steps: [
      'Note colour and amount of blood',
      'Contact GP or nurse as soon as possible',
      'If large amount of blood, seek urgent medical care',
      'Document in bowel chart with full details',
    ],
  },
  {
    id: '4',
    scenario: 'If severe abdominal pain',
    steps: [
      'Monitor pain level and location',
      'Keep person comfortable',
      'Contact GP or nurse',
      'If pain is severe or worsening, call ambulance',
    ],
  },
];
