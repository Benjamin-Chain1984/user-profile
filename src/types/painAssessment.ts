export type PainSeverity = 'no_pain' | 'mild' | 'moderate' | 'severe';
export type PainType = 'acute' | 'chronic' | 'acute_on_chronic';

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
  options: {
    value: number;
    label: string;
    description: string;
  }[];
}

export const ABBEY_QUESTIONS: AbbeyQuestion[] = [
  {
    id: 'q1_vocalization',
    number: 1,
    title: 'Vocalization',
    description: 'Whimpering, groaning, crying',
    options: [
      { value: 0, label: 'Absent', description: 'No vocalization' },
      { value: 1, label: 'Mild', description: 'Occasional whimpering or groaning' },
      { value: 2, label: 'Moderate', description: 'Frequent or loud vocalization' },
    ],
  },
  {
    id: 'q2_facial_expression',
    number: 2,
    title: 'Facial Expression',
    description: 'Looking tense, frowning, grimacing, looking frightened',
    options: [
      { value: 0, label: 'Absent', description: 'Relaxed facial expression' },
      { value: 1, label: 'Mild', description: 'Occasional frown or grimace' },
      { value: 2, label: 'Moderate', description: 'Frequent frowning, grimacing, tense' },
    ],
  },
  {
    id: 'q3_body_language',
    number: 3,
    title: 'Change in Body Language',
    description: 'Fidgeting, rocking, guarding part of body, withdrawn',
    options: [
      { value: 0, label: 'Absent', description: 'Normal body posture' },
      { value: 1, label: 'Mild', description: 'Occasional fidgeting or guarding' },
      { value: 2, label: 'Moderate', description: 'Frequent or constant protective posture' },
    ],
  },
  {
    id: 'q4_behavioral_change',
    number: 4,
    title: 'Behavioural Change',
    description: 'Increased confusion, refusing to eat, alteration in usual patterns',
    options: [
      { value: 0, label: 'Absent', description: 'No behavioral changes' },
      { value: 1, label: 'Mild', description: 'Some change from usual behavior' },
      { value: 2, label: 'Moderate', description: 'Significant behavioral changes' },
    ],
  },
  {
    id: 'q5_physiological_change',
    number: 5,
    title: 'Physiological Change',
    description: 'Temperature, pulse or blood pressure outside normal limits, perspiring, flushing or pallor',
    options: [
      { value: 0, label: 'Absent', description: 'No physiological changes' },
      { value: 1, label: 'Mild', description: 'Minor changes in vital signs' },
      { value: 2, label: 'Moderate', description: 'Significant changes in vital signs' },
    ],
  },
  {
    id: 'q6_physical_change',
    number: 6,
    title: 'Physical Changes',
    description: 'Skin tears, pressure areas, arthritis, contractures, previous injuries',
    options: [
      { value: 0, label: 'Absent', description: 'No physical changes observed' },
      { value: 1, label: 'Mild', description: 'Minor physical changes' },
      { value: 2, label: 'Moderate', description: 'Significant physical changes' },
    ],
  },
];

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

export function getPainTypeLabel(type: PainType): string {
  switch (type) {
    case 'acute': return 'Acute';
    case 'chronic': return 'Chronic';
    case 'acute_on_chronic': return 'Acute on Chronic';
  }
}
