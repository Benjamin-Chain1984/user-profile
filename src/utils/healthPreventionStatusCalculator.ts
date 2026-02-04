/**
 * Health Prevention Status Calculator
 * Single source of truth for:
 * - module status (stable/monitor/action)
 * - dueCount
 * - human message + lastEntry
 *
 * IMPORTANT:
 * - Supports backdating: the “latest” record is chosen by clinical date
 *   (date_completed/date_given) falling back to created_at.
 * - Respects vaccine minAge eligibility.
 */

import {
  CANCER_SCREENING_PROGRAMS,
  VACCINATION_PROGRAMS,
  calculateAge,
  getScreeningDisplayStatus,
  getVaccinationDisplayStatus,
  isEligibleForScreening,
  type CancerScreeningRecord,
  type VaccinationRecord,
  type HealthPreventionConfig,
} from '@/types/healthPrevention';

type SexLike = string | null | undefined;

export type HealthPreventionSummary = {
  status: 'stable' | 'monitor' | 'action';
  dueCount: number;
  message: string;
  lastEntry: string;
  timestamp: string;
};

function toDateMs(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

function pickLatestByClinicalDate<T extends { createdAt: string }>(
  records: T[],
  clinicalDateSelector: (r: T) => string | null | undefined
): T | null {
  if (!records.length) return null;
  return records.reduce<T | null>((best, current) => {
    if (!best) return current;

    const bestMs = Math.max(toDateMs(clinicalDateSelector(best)), toDateMs(best.createdAt));
    const currentMs = Math.max(
      toDateMs(clinicalDateSelector(current)),
      toDateMs(current.createdAt)
    );

    return currentMs > bestMs ? current : best;
  }, null);
}

export function calculateHealthPreventionSummary(params: {
  profile: { dateOfBirth?: string | null; sex?: SexLike } | null;
  config: Pick<HealthPreventionConfig, 'enableCancerScreening' | 'enableVaccinationReminders'> | null;
  screeningRecords: CancerScreeningRecord[];
  vaccinationRecords: VaccinationRecord[];
  now?: Date;
}): HealthPreventionSummary {
  const now = params.now ?? new Date();
  const timestamp = now.toISOString();

  const dob = params.profile?.dateOfBirth ?? null;
  const age = dob ? calculateAge(dob) : null;
  const sex = params.profile?.sex;

  const enableCancerScreening = params.config?.enableCancerScreening ?? true;
  const enableVaccinationReminders = params.config?.enableVaccinationReminders ?? true;

  if (!enableCancerScreening && !enableVaccinationReminders) {
    return {
      status: 'stable',
      dueCount: 0,
      message: 'Health prevention features disabled',
      lastEntry: 'Features disabled',
      timestamp,
    };
  }

  // Without DOB we can’t compute eligibility safely; avoid false “due” inflation.
  if (age === null) {
    return {
      status: 'stable',
      dueCount: 0,
      message: 'Add date of birth to calculate preventive health status',
      lastEntry: 'DOB required',
      timestamp,
    };
  }

  let dueCount = 0;
  let hasOverdue = false;

  if (enableCancerScreening) {
    for (const program of CANCER_SCREENING_PROGRAMS) {
      const eligible = isEligibleForScreening(program, age, sex);
      if (!eligible) continue;

      const latest = pickLatestByClinicalDate(
        params.screeningRecords.filter((r) => r.screeningType === program.id),
        (r) => r.dateCompleted
      );

      const display = getScreeningDisplayStatus(latest, program, eligible);

      if (display === 'overdue') {
        dueCount += 1;
        hasOverdue = true;
      } else if (display === 'due') {
        dueCount += 1;
      }
    }
  }

  if (enableVaccinationReminders) {
    for (const program of VACCINATION_PROGRAMS) {
      const ageEligible = program.minAge === null || age >= program.minAge;
      if (!ageEligible) continue;

      const latest = pickLatestByClinicalDate(
        params.vaccinationRecords.filter((r) => r.vaccinationType === program.id),
        (r) => r.dateGiven
      );

      const display = getVaccinationDisplayStatus(latest);

      if (display === 'overdue') {
        dueCount += 1;
        hasOverdue = true;
      } else if (display === 'due' || display === 'not_recorded') {
        dueCount += 1;
      }
    }
  }

  const status: 'stable' | 'monitor' | 'action' = hasOverdue ? 'action' : dueCount > 0 ? 'monitor' : 'stable';
  const message =
    dueCount === 0
      ? 'All preventive health items are up to date.'
      : dueCount === 1
        ? '1 preventive health action pending'
        : `${dueCount} preventive health actions pending`;

  return {
    status,
    dueCount,
    message,
    lastEntry: dueCount === 0 ? 'Up to date' : `${dueCount} action(s) pending`,
    timestamp,
  };
}
