/**
 * Health Prevention Module Types
 * Supports Australian national cancer screening programs and vaccination guidance
 */

// Screening types aligned with Australian national programs
export type ScreeningType = 'bowel' | 'breast' | 'cervical' | 'lung';
export type VaccinationType = 'influenza' | 'covid19' | 'pneumococcal' | 'shingles';
export type SmokingHistory = 'yes' | 'no' | 'unsure';

export type ScreeningStatus = 'due' | 'completed' | 'deferred' | 'not_applicable';
export type VaccinationStatus = 'not_recorded' | 'due' | 'completed';

export interface HealthPreventionConfig {
  id: string;
  clientId: string | null;
  enableCancerScreening: boolean;
  enableVaccinationReminders: boolean;
  gpPracticeName: string | null;
  gpContactDetails: string | null;
  reminderText: string;
  lungScreeningSmokingHistory: SmokingHistory | null;
  escalationRecipients: string[];
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface CancerScreeningRecord {
  id: string;
  clientId: string | null;
  screeningType: ScreeningType;
  status: ScreeningStatus;
  dateCompleted: string | null;
  location: string | null;
  outcomeKnown: boolean | null;
  deferredReason: string | null;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: string;
  createdBy: string | null;
  editedAt: string | null;
  editedBy: string | null;
  editReason: string | null;
}

export interface VaccinationRecord {
  id: string;
  clientId: string | null;
  vaccinationType: VaccinationType;
  status: VaccinationStatus;
  dateGiven: string | null;
  givenBy: string | null;
  vaccineBrand: string | null;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: string;
  createdBy: string | null;
  editedAt: string | null;
  editedBy: string | null;
  editReason: string | null;
}

export interface HealthPreventionAlert {
  id: string;
  clientId: string | null;
  alertType: 'screening_due' | 'screening_overdue' | 'vaccination_due' | 'vaccination_overdue';
  itemType: string;
  itemName: string;
  severity: 'amber' | 'red';
  message: string;
  metadata: Record<string, unknown> | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolvedReason: string | null;
  createdAt: string;
  createdBy: string | null;
}

// Screening eligibility and configuration
export interface ScreeningProgram {
  id: ScreeningType;
  name: string;
  description: string;
  eligibleSex: 'male' | 'female' | 'all';
  minAge: number;
  maxAge: number;
  frequencyYears: number;
  isAdvisoryOnly?: boolean; // For lung screening
}

export interface VaccinationProgram {
  id: VaccinationType;
  name: string;
  description: string;
  frequencyText: string;
  frequencyYears: number | null; // null = varies/once
  minAge: number | null;
  courseBased?: boolean;
}

// Australian National Screening Programs
export const CANCER_SCREENING_PROGRAMS: ScreeningProgram[] = [
  {
    id: 'bowel',
    name: 'Bowel Cancer Screening',
    description: 'A free at-home test that checks for hidden blood in bowel motions. Early detection can save lives.',
    eligibleSex: 'all',
    minAge: 50,
    maxAge: 74,
    frequencyYears: 2,
  },
  {
    id: 'breast',
    name: 'Breast Cancer Screening',
    description: 'A mammogram (breast X-ray) to detect early signs of breast cancer.',
    eligibleSex: 'female',
    minAge: 50,
    maxAge: 74,
    frequencyYears: 2,
  },
  {
    id: 'cervical',
    name: 'Cervical Screening',
    description: 'A test that looks for HPV, the virus that can cause cervical cancer.',
    eligibleSex: 'female',
    minAge: 25,
    maxAge: 74,
    frequencyYears: 5,
  },
  {
    id: 'lung',
    name: 'Lung Cancer Screening',
    description: 'A low-dose CT scan for people at higher risk. Speak with a GP to assess eligibility.',
    eligibleSex: 'all',
    minAge: 50,
    maxAge: 70,
    frequencyYears: 1,
    isAdvisoryOnly: true,
  },
];

// Australian Vaccination Programs
export const VACCINATION_PROGRAMS: VaccinationProgram[] = [
  {
    id: 'influenza',
    name: 'Influenza (Flu)',
    description: 'Annual flu vaccination helps protect against seasonal influenza.',
    frequencyText: 'Recommended annually',
    frequencyYears: 1,
    minAge: null,
  },
  {
    id: 'covid19',
    name: 'COVID-19',
    description: 'COVID-19 boosters help maintain protection against severe illness.',
    frequencyText: 'Booster timing per current advice',
    frequencyYears: null,
    minAge: null,
  },
  {
    id: 'pneumococcal',
    name: 'Pneumococcal',
    description: 'Protects against pneumococcal disease including pneumonia and meningitis.',
    frequencyText: 'Recommended for adults ≥65 or specific health conditions',
    frequencyYears: null,
    minAge: 65,
  },
  {
    id: 'shingles',
    name: 'Shingles (Zoster)',
    description: 'Protects against shingles (herpes zoster) which can cause painful rash and complications.',
    frequencyText: 'Recommended ≥65 years (2-dose course)',
    frequencyYears: null,
    minAge: 65,
    courseBased: true,
  },
];

// Reminder text options
export const REMINDER_TEXT_OPTIONS = [
  'Discuss at next GP visit',
  'Book appointment',
  'Speak with GP',
] as const;

// Helper functions
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isEligibleForScreening(
  program: ScreeningProgram,
  age: number,
  sex: string | null | undefined
): boolean {
  // Age check
  if (age < program.minAge || age > program.maxAge) {
    return false;
  }
  
  // Sex check
  if (program.eligibleSex !== 'all') {
    if (!sex) return false;
    if (program.eligibleSex !== sex.toLowerCase()) return false;
  }
  
  return true;
}

export function calculateNextDueDate(
  lastCompletedDate: string,
  frequencyYears: number
): string {
  const date = new Date(lastCompletedDate);
  date.setFullYear(date.getFullYear() + frequencyYears);
  return date.toISOString().split('T')[0];
}

export function getScreeningDisplayStatus(
  record: CancerScreeningRecord | null,
  program: ScreeningProgram,
  isEligible: boolean
): 'up_to_date' | 'due' | 'overdue' | 'not_eligible' | 'deferred' {
  if (!isEligible) return 'not_eligible';
  
  if (!record || record.status === 'not_applicable') {
    return 'due';
  }
  
  if (record.status === 'deferred') {
    return 'deferred';
  }
  
  if (record.status === 'completed' && record.nextDueDate) {
    const now = new Date();
    const dueDate = new Date(record.nextDueDate);
    if (now < dueDate) {
      return 'up_to_date';
    } else {
      return 'overdue';
    }
  }
  
  return 'due';
}

export function getVaccinationDisplayStatus(
  record: VaccinationRecord | null
): 'completed' | 'due' | 'overdue' | 'not_recorded' {
  if (!record || record.status === 'not_recorded') {
    return 'not_recorded';
  }
  
  if (record.status === 'completed') {
    if (record.nextDueDate) {
      const now = new Date();
      const dueDate = new Date(record.nextDueDate);
      if (now > dueDate) {
        return 'overdue';
      }
    }
    return 'completed';
  }
  
  return 'due';
}

// Module disclaimer text
export const HEALTH_PREVENTION_DISCLAIMER = 
  "This module supports preventive health planning only. Screening and vaccination decisions should be discussed with a GP or qualified health professional.";
