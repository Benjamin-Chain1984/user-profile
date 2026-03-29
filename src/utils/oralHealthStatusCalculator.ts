/**
 * Oral Health Status Calculator
 */

import type { OralHealthAssessment, OralHealthTaskLog, OralHealthConfig, OralHealthStatusInfo } from '@/types/oralHealth';
import { differenceInDays, differenceInHours, parseISO, format, startOfDay } from 'date-fns';

interface CalculateParams {
  assessments: OralHealthAssessment[];
  taskLogs: OralHealthTaskLog[];
  config: Partial<OralHealthConfig>;
}

export function calculateOralHealthStatus({ assessments, taskLogs, config }: CalculateParams): OralHealthStatusInfo {
  const now = new Date();
  const latestAssessment = assessments[0];

  // Check assessment overdue
  const frequencyHours: Record<string, number> = {
    daily: 24,
    weekly: 168,
    monthly: 720,
    if_concerns: 8760, // 1 year
  };
  const freq = config.assessment_frequency || 'weekly';
  const maxHours = frequencyHours[freq] || 168;

  if (latestAssessment) {
    const hoursSince = differenceInHours(now, parseISO(latestAssessment.created_at));

    // Unhealthy assessment = Action
    if (latestAssessment.overall_status === 'unhealthy') {
      return {
        status: 'action',
        message: 'Unhealthy oral health assessment recorded. Urgent dental review required.',
        lastEntry: `Unhealthy – ${differenceInDays(now, parseISO(latestAssessment.created_at))}d ago`,
      };
    }

    // Overdue > 2 cycles = Action
    if (hoursSince > maxHours * 2) {
      return {
        status: 'action',
        message: 'Oral health assessment significantly overdue.',
        lastEntry: `Overdue – ${differenceInDays(now, parseISO(latestAssessment.created_at))}d ago`,
      };
    }

    // Overdue 1 cycle = Monitor
    if (hoursSince > maxHours) {
      return {
        status: 'monitor',
        message: 'Oral health assessment is overdue.',
        lastEntry: `Due – ${differenceInDays(now, parseISO(latestAssessment.created_at))}d since last`,
      };
    }

    // Changes = Monitor
    if (latestAssessment.overall_status === 'changes') {
      return {
        status: 'monitor',
        message: 'Changes noted in oral health. Notify at next dental visit.',
        lastEntry: `Changes noted – ${differenceInDays(now, parseISO(latestAssessment.created_at))}d ago`,
      };
    }
  } else {
    // No assessments at all
    return {
      status: 'monitor',
      message: 'No oral health assessment recorded yet.',
      lastEntry: 'Not yet assessed',
    };
  }

  // AM/PM deadline check: flag amber if AM not logged by 11am, PM not logged by 10pm
  const todayStr = format(now, 'yyyy-MM-dd');
  const currentHour = now.getHours();
  const todayLogs = taskLogs.filter(l => l.log_date === todayStr);

  const amCompleted = todayLogs.some(l => l.period === 'am' && l.completed);
  const pmCompleted = todayLogs.some(l => l.period === 'pm' && l.completed);

  if (currentHour >= 11 && !amCompleted) {
    return {
      status: 'monitor',
      message: 'Morning oral care not completed by 11:00 AM.',
      lastEntry: 'AM oral care overdue',
    };
  }

  if (currentHour >= 22 && !pmCompleted) {
    return {
      status: 'monitor',
      message: 'Night oral care not completed by 10:00 PM.',
      lastEntry: 'PM oral care overdue',
    };
  }

  // Compliance monitoring
  if (config.enable_compliance_monitoring && taskLogs.length > 0) {
    const last7Days = taskLogs.filter(l => differenceInDays(now, parseISO(l.log_date)) <= 7);
    const completed = last7Days.filter(l => l.completed).length;
    const total = last7Days.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;

    if (percent < 70) {
      return {
        status: 'action',
        message: `Low oral health compliance (${percent}%). Review plan adherence.`,
        lastEntry: `Compliance: ${percent}%`,
        compliancePercent: percent,
      };
    }
    if (percent < 90) {
      return {
        status: 'monitor',
        message: `Oral health compliance at ${percent}%.`,
        lastEntry: `Compliance: ${percent}%`,
        compliancePercent: percent,
      };
    }

    return {
      status: 'ideal',
      message: 'Oral health status is IDEAL.',
      lastEntry: `Compliance: ${percent}% • Healthy`,
      compliancePercent: percent,
    };
  }

  return {
    status: 'ideal',
    message: 'Oral health status is IDEAL.',
    lastEntry: latestAssessment
      ? `Healthy – ${differenceInDays(now, parseISO(latestAssessment.created_at))}d ago`
      : 'Up to date',
  };
}
