/**
 * Bowel Care Competency Check Types
 */

export interface CompetencyQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: 'general' | 'individual';
}

export interface CompetencyAnswer {
  questionId: string;
  question: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  category: 'general' | 'individual';
}

export interface CompetencyAttempt {
  id: string;
  staff_user_id: string;
  client_id: string | null;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
  valid_until: string;
  invalidated: boolean;
  invalidated_at: string | null;
  invalidated_reason: string | null;
  answers_snapshot: CompetencyAnswer[];
  created_at: string;
  created_by: string | null;
}

export interface CompetencyConfig {
  id: string;
  client_id: string | null;
  pass_threshold_percent: number;
  validity_months: number;
  expiry_warning_days: number;
  created_at: string;
  updated_at: string;
}

export type CompetencyStatus = 'completed' | 'expiring_soon' | 'expired' | 'not_completed' | 'invalidated';

export interface StaffCompetencyInfo {
  staffId: string;
  staffName: string;
  status: CompetencyStatus;
  lastCompletedAt: string | null;
  validUntil: string | null;
  score: number | null;
  passed: boolean;
}
