/**
 * Oral Health Status Card - Uses shared TrafficLightStatusCard
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import { useOralHealthAssessments, useOralHealthTaskLogs, useOralHealthConfig } from '@/hooks/useOralHealth';
import { calculateOralHealthStatus } from '@/utils/oralHealthStatusCalculator';
import { parseISO, addDays, addMonths, differenceInCalendarDays, startOfDay, format } from 'date-fns';
import type { AssessmentFrequency } from '@/types/oralHealth';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface Props {
  clientId?: string;
}

function getNextDueDate(lastDate: string, frequency: AssessmentFrequency): Date | null {
  if (frequency === 'if_concerns') return null;
  const base = parseISO(lastDate);
  switch (frequency) {
    case 'daily': return addDays(base, 1);
    case 'weekly': return addDays(base, 7);
    case 'fortnightly': return addDays(base, 14);
    case 'monthly': return addMonths(base, 1);
    default: return null;
  }
}

function formatCountdown(dueDate: Date): { text: string; isOverdue: boolean; isDueToday: boolean } {
  const today = startOfDay(new Date());
  const dueDateStart = startOfDay(dueDate);
  const daysLeft = differenceInCalendarDays(dueDateStart, today);

  if (daysLeft < 0) return { text: `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`, isOverdue: true, isDueToday: false };
  if (daysLeft === 0) return { text: 'Due today', isOverdue: false, isDueToday: true };
  if (daysLeft === 1) return { text: 'Due tomorrow', isOverdue: false, isDueToday: false };
  return { text: `Due in ${daysLeft} days`, isOverdue: false, isDueToday: false };
}

export function OralHealthStatusCard({ clientId }: Props) {
  const { assessments } = useOralHealthAssessments(clientId);
  const { logs } = useOralHealthTaskLogs(clientId);
  const { config } = useOralHealthConfig(clientId);

  const statusInfo = calculateOralHealthStatus({
    assessments,
    taskLogs: logs,
    config,
  });

  const countdown = useMemo(() => {
    const frequency = (config?.assessment_frequency || 'weekly') as AssessmentFrequency;
    if (frequency === 'if_concerns') return null;
    if (!assessments || assessments.length === 0) return { text: 'No assessments yet — first assessment due', isOverdue: true, isDueToday: false, dueDate: null, frequency };
    const lastAssessment = assessments[0];
    const dueDate = getNextDueDate(lastAssessment.created_at.split('T')[0], frequency);
    if (!dueDate) return null;
    return { ...formatCountdown(dueDate), dueDate, frequency };
  }, [assessments, config?.assessment_frequency]);

  const trafficLight = toTrafficLight(statusInfo.status);
  const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' };

  return (
    <div className="space-y-3">
      <TrafficLightStatusCard
        status={trafficLight}
        reason={statusInfo.message}
        lastUpdated={assessments?.[0]?.created_at}
      >
        {statusInfo.compliancePercent !== undefined && (
          <p className="text-xs text-muted-foreground">
            Weekly compliance: {statusInfo.compliancePercent}%
          </p>
        )}
      </TrafficLightStatusCard>

      {/* Next Assessment Countdown */}
      {countdown && (
        <Card className={`border ${countdown.isOverdue ? 'border-destructive/30 bg-destructive/5' : countdown.isDueToday ? 'border-warning/30 bg-warning/5' : 'border-border'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${countdown.isOverdue ? 'bg-destructive/10' : countdown.isDueToday ? 'bg-warning/10' : 'bg-muted'}`}>
                <CalendarClock className={`h-5 w-5 ${countdown.isOverdue ? 'text-destructive' : countdown.isDueToday ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${countdown.isOverdue ? 'text-destructive' : countdown.isDueToday ? 'text-warning' : 'text-foreground'}`}>
                  {countdown.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  Assessment schedule: {FREQ_LABELS[countdown.frequency] || countdown.frequency}
                  {countdown.dueDate && ` · Due ${format(countdown.dueDate, 'dd/MM/yyyy')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
