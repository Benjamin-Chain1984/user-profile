/**
 * Weight & BMI Status Calculator - Single source of truth for all status logic
 */

import { differenceInDays, addDays, parseISO } from 'date-fns';
import type { 
  WeightBmiConfig, 
  WeightEntry, 
  WeightBmiAlert,
  WeightStatusInfo,
  BmiCategory 
} from '@/types/weightBmi';
import { FREQUENCY_DAYS } from '@/types/weightBmi';

/**
 * Calculate BMI from weight and height
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Get BMI category from BMI value
 */
export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Calculate height from knee height using clinical formulas
 */
export function calculateHeightFromKneeHeight(
  kneeHeightCm: number,
  sex: 'male' | 'female' | 'unknown'
): number {
  // Using Chumlea formulas (commonly used in clinical practice)
  if (sex === 'male') {
    return 64.19 + (2.02 * kneeHeightCm);
  } else if (sex === 'female') {
    return 84.88 + (1.83 * kneeHeightCm);
  }
  // For unknown sex, use average of both formulas
  return (64.19 + (2.02 * kneeHeightCm) + 84.88 + (1.83 * kneeHeightCm)) / 2;
}

/**
 * Calculate next due date based on last entry and frequency
 */
export function calculateNextDueDate(
  lastEntryDate: string | null,
  frequency: 'weekly' | 'fortnightly' | 'monthly'
): Date | null {
  if (!lastEntryDate) return null;
  const lastDate = parseISO(lastEntryDate);
  const daysToAdd = FREQUENCY_DAYS[frequency];
  return addDays(lastDate, daysToAdd);
}

/**
 * Check if rapid weight change occurred within the configured window
 */
export function checkRapidWeightChange(
  entries: WeightEntry[],
  thresholdKg: number,
  windowDays: number
): { hasRapidChange: boolean; changeKg: number | null } {
  if (entries.length < 2) {
    return { hasRapidChange: false, changeKg: null };
  }

  const now = new Date();
  const windowStart = addDays(now, -windowDays);
  
  // Get entries within window
  const entriesInWindow = entries.filter(e => 
    parseISO(e.event_occurred_at) >= windowStart
  );

  if (entriesInWindow.length < 2) {
    return { hasRapidChange: false, changeKg: null };
  }

  // Sort by date
  const sorted = [...entriesInWindow].sort(
    (a, b) => parseISO(a.event_occurred_at).getTime() - parseISO(b.event_occurred_at).getTime()
  );

  const firstWeight = sorted[0].weight_kg;
  const lastWeight = sorted[sorted.length - 1].weight_kg;
  const changeKg = Math.abs(lastWeight - firstWeight);

  return {
    hasRapidChange: changeKg >= thresholdKg,
    changeKg
  };
}

/**
 * Ensure every entry carries a BMI value derived from the configured height.
 * Existing entries logged before a height was configured (or logged against an
 * outdated height) are recalculated so BMI is always consistent with Settings.
 */
export function applyConfiguredBmi(
  entries: WeightEntry[],
  config: WeightBmiConfig | null
): WeightEntry[] {
  const heightCm = config?.height_cm ?? null;
  if (!heightCm || heightCm <= 0) return entries;

  return entries.map(entry => {
    if (entry.height_used_cm === heightCm && entry.bmi_value != null) return entry;
    const bmi = Math.round(calculateBmi(entry.weight_kg, heightCm) * 10) / 10;
    return {
      ...entry,
      height_used_cm: heightCm,
      bmi_value: bmi,
      bmi_category: getBmiCategory(bmi),
    };
  });
}

/**
 * Calculate comprehensive weight/BMI status
 */
export function calculateWeightBmiStatus(
  entries: WeightEntry[],
  config: WeightBmiConfig | null,
  alerts: WeightBmiAlert[]
): WeightStatusInfo {
  const activeAlerts = alerts.filter(a => !a.resolved_at);
  
  // No entries yet
  if (entries.length === 0) {
    const defaultDueDate = config ? addDays(new Date(), FREQUENCY_DAYS[config.monitoring_frequency]) : null;
    return {
      status: 'stable',
      statusLabel: 'IDEAL',
      message: 'No weight entries recorded yet',
      currentWeight: null,
      bmiValue: null,
      bmiCategory: null,
      lastRecordedDate: null,
      nextDueDate: defaultDueDate?.toISOString() || null,
      isOverdue: false,
      daysUntilDue: null,
      activeAlerts
    };
  }

  // Sort entries by event time
  const sortedEntries = [...entries].sort(
    (a, b) => parseISO(b.event_occurred_at).getTime() - parseISO(a.event_occurred_at).getTime()
  );

  const latestEntry = sortedEntries[0];
  const currentWeight = latestEntry.weight_kg;
  const bmiValue = latestEntry.bmi_value;
  const bmiCategory = latestEntry.bmi_category;
  const lastRecordedDate = latestEntry.event_occurred_at;

  // Calculate next due date
  const frequency = config?.monitoring_frequency || 'weekly';
  const nextDueDate = calculateNextDueDate(lastRecordedDate, frequency);
  const now = new Date();
  const isOverdue = nextDueDate ? nextDueDate < now : false;
  const daysUntilDue = nextDueDate ? differenceInDays(nextDueDate, now) : null;

  // Determine status based on alerts and conditions
  let status: 'stable' | 'monitor' | 'action' = 'stable';
  let statusLabel = 'IDEAL';
  let message = 'Weight monitoring is on track';

  // Check for RED conditions
  const hasRedAlert = activeAlerts.some(a => a.severity === 'red');
  const isUnderweight = bmiCategory === 'underweight';
  const isObese = bmiCategory === 'obese';
  const overdueMultipleCycles = isOverdue && daysUntilDue !== null && 
    config?.overdue_escalation_cycles && 
    Math.abs(daysUntilDue) >= (FREQUENCY_DAYS[frequency] * config.overdue_escalation_cycles);

  if (hasRedAlert || overdueMultipleCycles) {
    status = 'action';
    statusLabel = 'Red – Action Needed';
    message = hasRedAlert 
      ? activeAlerts.find(a => a.severity === 'red')?.message || 'Immediate attention required'
      : `Weight measurement overdue by ${Math.abs(daysUntilDue || 0)} days – escalation required`;
  }
  // Check for AMBER conditions
  else if (isOverdue || isUnderweight || isObese || activeAlerts.length > 0) {
    status = 'monitor';
    statusLabel = 'Amber – Attention Required';
    
    if (isOverdue) {
      message = `Weight measurement overdue – please log weight`;
    } else if (isUnderweight) {
      message = 'BMI indicates underweight – monitor intake';
    } else if (isObese) {
      message = 'BMI indicates obesity – monitor and seek advice if concerned';
    } else if (activeAlerts.length > 0) {
      message = activeAlerts[0].message;
    }
  }
  // Check target range
  else if (config?.min_target_weight_kg || config?.max_target_weight_kg) {
    const belowMin = config.min_target_weight_kg && currentWeight < config.min_target_weight_kg;
    const aboveMax = config.max_target_weight_kg && currentWeight > config.max_target_weight_kg;
    
    if (belowMin || aboveMax) {
      status = config.target_range_alert_severity === 'red' ? 'action' : 'monitor';
      statusLabel = config.target_range_alert_severity === 'red' ? 'Red – Action Needed' : 'Amber – Attention Required';
      message = belowMin 
        ? `Weight ${currentWeight}kg is below target minimum ${config.min_target_weight_kg}kg`
        : `Weight ${currentWeight}kg is above target maximum ${config.max_target_weight_kg}kg`;
    }
  }

  return {
    status,
    statusLabel,
    message,
    currentWeight,
    bmiValue,
    bmiCategory,
    lastRecordedDate,
    nextDueDate: nextDueDate?.toISOString() || null,
    isOverdue,
    daysUntilDue,
    activeAlerts
  };
}
