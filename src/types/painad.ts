export type PainadSeverity = 'no_pain' | 'mild' | 'moderate' | 'severe';

export interface PainadAssessment {
  id: string;
  client_id: string | null;
  q1_breathing: number;
  q2_negative_vocalization: number;
  q3_facial_expression: number;
  q4_body_language: number;
  q5_consolability: number;
  total_score: number;
  severity: PainadSeverity;
  pain_type: string;
  trigger_reason: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
  edit_reason: string | null;
}

export interface PainadQuestion {
  id: keyof Pick<PainadAssessment, 'q1_breathing' | 'q2_negative_vocalization' | 'q3_facial_expression' | 'q4_body_language' | 'q5_consolability'>;
  number: number;
  title: string;
  description: string;
  options: {
    value: number;
    label: string;
    detail: string;
  }[];
  tooltip?: string;
}

export const PAINAD_QUESTIONS: PainadQuestion[] = [
  {
    id: 'q1_breathing',
    number: 1,
    title: 'Breathing (Independent of Vocalisation)',
    description: 'Observe breathing patterns at rest or during activity.',
    options: [
      { value: 0, label: 'Normal', detail: 'Normal breathing' },
      { value: 1, label: 'Occasional laboured', detail: 'Occasional laboured breathing OR short period of hyperventilation' },
      { value: 2, label: 'Noisy laboured', detail: 'Noisy laboured breathing OR long period of hyperventilation OR Cheyne-Stokes respirations' },
    ],
  },
  {
    id: 'q2_negative_vocalization',
    number: 2,
    title: 'Negative Vocalisation',
    description: 'Sounds indicating pain, discomfort, or distress.',
    options: [
      { value: 0, label: 'None', detail: 'No negative vocalisation' },
      { value: 1, label: 'Occasional moan/groan', detail: 'Occasional moan or groan OR low-level speech with a negative or disapproving quality' },
      { value: 2, label: 'Repeated calling out', detail: 'Repeated troubled calling out OR loud moaning or groaning OR crying' },
    ],
  },
  {
    id: 'q3_facial_expression',
    number: 3,
    title: 'Facial Expression',
    description: 'Observe the face for signs of distress.',
    options: [
      { value: 0, label: 'Smiling/inexpressive', detail: 'Smiling or inexpressive' },
      { value: 1, label: 'Sad/frightened/frown', detail: 'Sad, frightened, or frown' },
      { value: 2, label: 'Facial grimacing', detail: 'Facial grimacing' },
    ],
  },
  {
    id: 'q4_body_language',
    number: 4,
    title: 'Body Language',
    description: 'Observe posture, movement, and tension.',
    tooltip: 'Do not include contractures when scoring body language.',
    options: [
      { value: 0, label: 'Relaxed', detail: 'Relaxed' },
      { value: 1, label: 'Tense/fidgeting', detail: 'Tense OR distressed pacing OR fidgeting' },
      { value: 2, label: 'Rigid/striking out', detail: 'Rigid OR fists clenched OR knees pulled up OR pulling or pushing away OR striking out' },
    ],
  },
  {
    id: 'q5_consolability',
    number: 5,
    title: 'Consolability',
    description: 'Can the person be reassured or distracted?',
    options: [
      { value: 0, label: 'No need to console', detail: 'No need to console' },
      { value: 1, label: 'Distracted/reassured', detail: 'Distracted or reassured by voice or touch' },
      { value: 2, label: 'Unable to console', detail: 'Unable to console, distract or reassure' },
    ],
  },
];

// Max score is 10 (5 questions × 2 max each)
export function calculatePainadSeverity(totalScore: number): PainadSeverity {
  if (totalScore === 0) return 'no_pain';
  if (totalScore <= 3) return 'mild';
  if (totalScore <= 6) return 'moderate';
  return 'severe';
}

export function getPainadSeverityLabel(severity: PainadSeverity): string {
  switch (severity) {
    case 'no_pain': return 'No Pain';
    case 'mild': return 'Mild Pain';
    case 'moderate': return 'Moderate Pain';
    case 'severe': return 'Severe Pain';
  }
}

export function getPainadSeverityColor(severity: PainadSeverity): string {
  switch (severity) {
    case 'no_pain': return 'text-success';
    case 'mild': return 'text-amber-500';
    case 'moderate': return 'text-orange-500';
    case 'severe': return 'text-destructive';
  }
}

export function getPainadSeverityBgColor(severity: PainadSeverity): string {
  switch (severity) {
    case 'no_pain': return 'bg-success/10';
    case 'mild': return 'bg-amber-500/10';
    case 'moderate': return 'bg-orange-500/10';
    case 'severe': return 'bg-destructive/10';
  }
}

export function getPainadSeverityDotColor(severity: PainadSeverity): string {
  switch (severity) {
    case 'no_pain': return 'bg-success';
    case 'mild': return 'bg-amber-500';
    case 'moderate': return 'bg-orange-500';
    case 'severe': return 'bg-destructive';
  }
}

export function getPainadSeverityBorderColor(severity: PainadSeverity): string {
  switch (severity) {
    case 'no_pain': return 'border-l-success';
    case 'mild': return 'border-l-amber-500';
    case 'moderate': return 'border-l-orange-500';
    case 'severe': return 'border-l-destructive';
  }
}

export const PAINAD_CITATION = "Warden, V., Hurley, A. C., & Volicer, L. (2003). Development and psychometric evaluation of the Pain Assessment in Advanced Dementia (PAINAD) scale. Journal of the American Medical Directors Association, 4(1), 9–15.";

export const PAINAD_SEVERE_PROMPTS = [
  'Consider pain medication as prescribed',
  'Consider medical review if persistent',
];
