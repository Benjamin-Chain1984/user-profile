import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useWeeklyInsights } from '@/hooks/useWeeklyInsights';
import { useMemo, useState, useEffect } from 'react';
import { format, parseISO, differenceInSeconds } from 'date-fns';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const totalSeconds = Math.max(0, differenceInSeconds(target, now));

      if (totalSeconds <= 0) {
        setTimeLeft('Due now');
        return;
      }

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Next insight: <span className="font-medium text-foreground">{timeLeft}</span></span>
    </div>
  );
}

export function WeeklyHealthInsights() {
  const { profile, enabledModules } = useProfile();

  const enabledModuleIds = useMemo(
    () => enabledModules.filter(m => m.enabled).map(m => m.id),
    [enabledModules]
  );

  const { insight, loading, error } = useWeeklyInsights(
    profile?.id,
    enabledModuleIds
  );

  // Compute the retrospective period label
  const periodLabel = useMemo(() => {
    if (!insight?.generated_at) return null;
    const endDate = parseISO(insight.generated_at);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    return `${format(startDate, 'dd MMM')} – ${format(endDate, 'dd MMM yyyy')}`;
  }, [insight?.generated_at]);

  if (enabledModuleIds.length === 0) return null;

  const bullets = insight?.insight_summary
    ?.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•'))
    .map(line => line.replace(/^•\s*/, ''))
    ?? [];

  const isNoData = !bullets.length && insight?.insight_summary?.includes('No significant');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Weekly Health Insights
          </CardTitle>
          {insight?.next_due_at && (
            <CountdownTimer targetDate={insight.next_due_at} />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {periodLabel
            ? `Retrospective summary for ${periodLabel}, based on recorded data.`
            : 'High-level summary of health patterns based on recorded data.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading insights…</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : isNoData ? (
          <p className="text-sm text-muted-foreground py-2">
            No significant health trends identified this week.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {insight?.generated_at && (
              <p className="text-xs text-muted-foreground">
                Generated {format(parseISO(insight.generated_at), 'dd MMM yyyy, h:mm a')}
                {insight.cached && ' (cached)'}
              </p>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
          This summary highlights patterns in recorded data. It does not replace clinical judgement. Follow the person's health plan and seek medical advice if concerned.
        </p>
      </CardContent>
    </Card>
  );
}
