export type PainSeverity = 'no_pain' | 'mild' | 'moderate' | 'severe';
export type PainType = 'acute' | 'chronic' | 'acute_on_chronic';

export type AssessmentTrigger = 
  | 'daily'
  | 'weekly'
  | 'transfers'
  | 'personal_care'
  | 'agitation'
  | 'behaviours_of_concern'
  | 'post_fall'
  | 'staff_concern'
  | 'other';

export const ASSESSMENT_TRIGGER_LABELS: Record<AssessmentTrigger, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  transfers: 'During transfers',
  personal_care: 'During personal care',
  agitation: 'When agitation is observed',
  behaviours_of_concern: 'When behaviours of concern occur',
  post_fall: 'Post-fall or injury',
  staff_concern: 'When staff are concerned about pain',
  other: 'Other',
};

export interface AbbeyPainConfig {
  id: string;
  client_id: string | null;
  assessment_triggers: AssessmentTrigger[];
  custom_trigger_text: string | null;
  mild_reassess_hours: number;
  moderate_reassess_hours: number;
  severe_reassess_hours: number;
  mild_alert_recipients: string[];
  moderate_alert_recipients: string[];
  severe_alert_recipients: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AbbeyPainAssessment {
  id: string;
  client_id: string | null;
  q1_vocalization: number;
  q2_facial_expression: number;
  q3_body_language: number;
  q4_behavioral_change: number;
  q5_physiological_change: number;
  q6_physical_change: number;
  total_score: number;
  severity: PainSeverity;
  pain_type: PainType;
  notes: string | null;
  trigger_reason: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface PainActionRecord {
  id: string;
  assessment_id: string;
  action_taken: string;
  action_time: string;
  outcome: string | null;
  outcome_recorded_at: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
}

export interface AbbeyQuestion {
  id: keyof Pick<AbbeyPainAssessment, 'q1_vocalization' | 'q2_facial_expression' | 'q3_body_language' | 'q4_behavioral_change' | 'q5_physiological_change' | 'q6_physical_change'>;
  number: number;
  title: string;
  description: string;
  examples: string;
  options: {
    value: number;
    label: string;
  }[];
}

// Abbey Pain Scale uses 0-3 scale for each question (max total = 18)
export const ABBEY_QUESTIONS: AbbeyQuestion[] = [
  {
    id: 'q1_vocalization',
    number: 1,
    title: 'Vocalisation',
    description: 'Sounds indicating pain or distress',
    examples: 'e.g. whimpering, groaning, crying',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
  {
    id: 'q2_facial_expression',
    number: 2,
    title: 'Facial Expression',
    description: 'Visual indicators of discomfort',
    examples: 'e.g. tense, frowning, grimacing, frightened',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
  {
    id: 'q3_body_language',
    number: 3,
    title: 'Change in Body Language',
    description: 'Protective or distressed posture',
    examples: 'e.g. fidgeting, rocking, guarding body, withdrawn',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
  {
    id: 'q4_behavioral_change',
    number: 4,
    title: 'Behavioural Change',
    description: 'Changes from usual patterns',
    examples: 'e.g. increased confusion, refusing food, change in usual patterns',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
  {
    id: 'q5_physiological_change',
    number: 5,
    title: 'Physiological Change',
    description: 'Physical signs of distress',
    examples: 'e.g. temperature, pulse, blood pressure outside normal limits',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
  {
    id: 'q6_physical_change',
    number: 6,
    title: 'Physical Changes',
    description: 'Observable physical conditions',
    examples: 'e.g. skin tears, pressure areas, arthritis, contractures, injuries',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Mild' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Severe' },
    ],
  },
];

// Max score is now 18 (6 questions × 3 max each)
export function calculateSeverity(totalScore: number): PainSeverity {
  if (totalScore <= 2) return 'no_pain';
  if (totalScore <= 7) return 'mild';
  if (totalScore <= 13) return 'moderate';
  return 'severe';
}

export function getSeverityLabel(severity: PainSeverity): string {
  switch (severity) {
    case 'no_pain': return 'No Pain';
    case 'mild': return 'Mild Pain';
    case 'moderate': return 'Moderate Pain';
    case 'severe': return 'Severe Pain';
  }
}

export function getSeverityColor(severity: PainSeverity): string {
  switch (severity) {
    case 'no_pain': return 'text-success'; // Green
    case 'mild': return 'text-orange-400'; // Light Orange
    case 'moderate': return 'text-orange-600'; // Dark Orange
    case 'severe': return 'text-destructive'; // Red
  }
}

export function getSeverityBgColor(severity: PainSeverity): string {
  switch (severity) {
    case 'no_pain': return 'bg-success/10';
    case 'mild': return 'bg-orange-400/10';
    case 'moderate': return 'bg-orange-600/10';
    case 'severe': return 'bg-destructive/10';
  }
}

export function getSeverityBorderColor(severity: PainSeverity): string {
  switch (severity) {
    case 'no_pain': return 'border-l-success';
    case 'mild': return 'border-l-orange-400';
    case 'moderate': return 'border-l-orange-600';
    case 'severe': return 'border-l-destructive';
  }
}

export function getSeverityDotColor(severity: PainSeverity): string {
  switch (severity) {
    case 'no_pain': return 'bg-success';
    case 'mild': return 'bg-orange-400';
    case 'moderate': return 'bg-orange-600';
    case 'severe': return 'bg-destructive';
  }
}

export function getPainTypeLabel(type: PainType): string {
  switch (type) {
    case 'acute': return 'Acute';
    case 'chronic': return 'Chronic';
    case 'acute_on_chronic': return 'Acute on Chronic';
  }
}

// Suggested actions per severity level
export const SEVERITY_ACTION_PROMPTS: Record<PainSeverity, string[]> = {
  no_pain: ['No action required'],
  mild: [
    'Monitor closely',
    'Review environment / positioning',
    'Reassess within configured hours',
  ],
  moderate: [
    'Administer PRN pain medication (if prescribed)',
    'Notify supervisor / team leader',
    'Notify family / next of kin',
    'Monitor and reassess within configured hours',
  ],
  severe: [
    'Urgent GP / medical review',
    'Administer PRN pain medication (if prescribed)',
    'Escalate immediately',
    'Contact on-call medical support',
  ],
};
