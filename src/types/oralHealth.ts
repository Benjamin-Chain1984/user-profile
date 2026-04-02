/**
 * Oral Health Care Module Types
 */

export const ORAL_HEALTH_CATEGORIES = [
  'lips',
  'tongue',
  'roof_of_mouth',
  'gums',
  'teeth',
  'dentures',
  'breath',
  'cleanliness',
  'dental_pain',
] as const;

export type OralHealthCategory = typeof ORAL_HEALTH_CATEGORIES[number];

export const CATEGORY_LABELS: Record<OralHealthCategory, string> = {
  lips: 'Lips',
  tongue: 'Tongue',
  roof_of_mouth: 'Roof of Mouth',
  gums: 'Gums',
  teeth: 'Teeth',
  dentures: 'Dentures',
  breath: 'Breath',
  cleanliness: 'Cleanliness',
  dental_pain: 'Dental Pain',
};

export type AssessmentRating = 'healthy' | 'changes' | 'unhealthy' | 'n_a';

export const ASSESSMENT_DESCRIPTORS: Record<OralHealthCategory, Record<Exclude<AssessmentRating, 'n_a'>, string>> = {
  lips: {
    healthy: 'Pink, smooth, moist',
    changes: 'Red/white patches, dry, split',
    unhealthy: 'Red/white patches, lump, swelling, ulcer (>3 weeks)',
  },
  tongue: {
    healthy: 'Pink, smooth, moist',
    changes: 'Red/white patches, grooved, coated, hairy',
    unhealthy: 'Red/white patches, lump, swelling, ulcer (>3 weeks)',
  },
  roof_of_mouth: {
    healthy: 'Pink, firm, moist',
    changes: 'White patches, coated, inflamed',
    unhealthy: 'Red/white patches, lump, swelling, ulcer (>3 weeks)',
  },
  gums: {
    healthy: 'Pink, firm, moist',
    changes: 'Redness in some areas, bleeding',
    unhealthy: 'Generalised redness, spongy, lump/swelling, gum boil',
  },
  teeth: {
    healthy: 'Shades of white, smooth',
    changes: 'Chalky, some wear, chipped, rough',
    unhealthy: 'Dark, severe wear, loose, broken/lost filling, decay, abscess',
  },
  dentures: {
    healthy: 'Pink, smooth, fits well',
    changes: 'Stains, loose, discoloured',
    unhealthy: 'One or more broken areas',
  },
  breath: {
    healthy: 'Fresh',
    changes: 'Stale',
    unhealthy: 'Bad',
  },
  cleanliness: {
    healthy: 'No food, plaque, tartar',
    changes: 'Minimal food / plaque in some areas',
    unhealthy: 'Food, thick plaque or tartar in most areas',
  },
  dental_pain: {
    healthy: 'No verbal, behavioural, or physical signs',
    changes: 'Sometimes – verbal or behavioural signs',
    unhealthy: "Won't eat, difficulty sleeping, aggression, behaviours of concern",
  },
};

export type AssistanceLevel = 'reminding' | 'supervision' | 'full_assistance';

export const ASSISTANCE_LABELS: Record<AssistanceLevel, string> = {
  reminding: 'Reminding',
  supervision: 'Supervision',
  full_assistance: 'Full Assistance',
};

export type AssessmentFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'if_concerns';

export const FREQUENCY_LABELS: Record<AssessmentFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  if_concerns: 'If Concerns Identified',
};

export interface OralHealthConfig {
  id: string;
  client_id: string | null;
  enable_compliance_monitoring: boolean;
  assessment_frequency: AssessmentFrequency;
  consecutive_missed_tasks_alert: number;
  escalation_recipients: string[];
  global_assistance_level: AssistanceLevel;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface OralHealthPlanCategory {
  id: string;
  client_id: string | null;
  category: OralHealthCategory;
  am_required: boolean;
  pm_required: boolean;
  products: string | null;
  cleaning_method: string | null;
  additional_instructions: string | null;
  assistance_level: AssistanceLevel | null;
  dentist_instructions: string | null;
  display_order: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface OralHealthTaskLog {
  id: string;
  client_id: string | null;
  log_date: string;
  period: 'am' | 'pm';
  completed: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface MouthAnnotation {
  issue_type: string;
  location: string;
  notes?: string;
}

export interface OralHealthAssessment {
  id: string;
  client_id: string | null;
  assessment_trigger: 'scheduled' | 'concern';
  lips: AssessmentRating;
  tongue: AssessmentRating;
  roof_of_mouth: AssessmentRating;
  gums: AssessmentRating;
  teeth: AssessmentRating;
  dentures: AssessmentRating | null;
  breath: AssessmentRating;
  cleanliness: AssessmentRating;
  dental_pain: AssessmentRating;
  overall_status: 'healthy' | 'changes' | 'unhealthy';
  action_taken: string | null;
  action_notes: string | null;
  escalation_contact: string | null;
  mouth_annotations: MouthAnnotation[];
  recorded_on_behalf_of_name: string | null;
  recorded_on_behalf_of_role: string | null;
  recorded_on_behalf_of_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface OralHealthAlert {
  id: string;
  client_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown> | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export type OralHealthStatus = 'ideal' | 'monitor' | 'action';

export interface OralHealthStatusInfo {
  status: OralHealthStatus;
  message: string;
  lastEntry: string;
  compliancePercent?: number;
}

export const MOUTH_ISSUE_TYPES = [
  'Ulcer',
  'Swelling',
  'Redness',
  'Decay',
  'Broken tooth',
  'Plaque build-up',
  'Bleeding',
  'Pain',
  'Other',
] as const;

export const MOUTH_LOCATIONS = [
  'Upper lip',
  'Lower lip',
  'Upper front teeth',
  'Lower front teeth',
  'Upper left molars',
  'Upper right molars',
  'Lower left molars',
  'Lower right molars',
  'Tongue tip',
  'Tongue back',
  'Left cheek',
  'Right cheek',
  'Roof of mouth',
  'Gums upper',
  'Gums lower',
] as const;
