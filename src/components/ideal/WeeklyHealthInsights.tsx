import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useWeeklyInsights } from '@/hooks/useWeeklyInsights';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

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
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Weekly Health Insights
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          High-level summary of health patterns based on recorded data.
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
