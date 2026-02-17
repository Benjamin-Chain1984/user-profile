/**
 * Oral Health Status Card with Next Assessment Countdown
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, AlertTriangle, AlertCircle, CheckCircle, CalendarClock } from 'lucide-react';
import { useOralHealthAssessments, useOralHealthTaskLogs, useOralHealthConfig } from '@/hooks/useOralHealth';
import { calculateOralHealthStatus } from '@/utils/oralHealthStatusCalculator';
import { parseISO, addDays, addMonths, differenceInCalendarDays, differenceInHours, format, startOfDay } from 'date-fns';
import type { AssessmentFrequency } from '@/types/oralHealth';

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
    const lastAssessment = assessments[0]; // already sorted desc
    const dueDate = getNextDueDate(lastAssessment.created_at.split('T')[0], frequency);
    if (!dueDate) return null;
    return { ...formatCountdown(dueDate), dueDate, frequency };
  }, [assessments, config?.assessment_frequency]);

  const statusConfig = {
    ideal: { label: 'IDEAL', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    monitor: { label: 'Amber – Attention Required', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    action: { label: 'Red – Action Needed', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  const s = statusConfig[statusInfo.status];
  const Icon = s.icon;

  const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly', monthly: 'Monthly' };

  return (
    <div className="space-y-3">
      <Card className={`${s.border} border`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smile className="h-5 w-5" />
            Oral Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${s.bg}`}>
              <Icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="flex-1">
              <Badge variant="outline" className={`${s.color} mb-1`}>{s.label}</Badge>
              <p className="text-sm text-muted-foreground mt-1">{statusInfo.message}</p>
              {statusInfo.compliancePercent !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  Weekly compliance: {statusInfo.compliancePercent}%
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
