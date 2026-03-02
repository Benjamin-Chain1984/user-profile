/**
 * Skin Check Compliance Card
 * Shows area-by-area completion status against configured frequencies from the care plan.
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSkinChecks } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { HIGH_RISK_AREAS, SKIN_CHECK_FREQUENCY_LABELS } from '@/types/pressureArea';
import type { SkinCheckFrequency, SkinCheckAreaSchedule } from '@/types/pressureArea';
import { CheckCircle2, Circle, AlertCircle, ClipboardCheck } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function SkinCheckComplianceCard({ clientId }: Props) {
  const { sessions } = useSkinChecks(clientId);
  const { plan } = usePressureReliefPlan(clientId);

  const schedule: Record<string, SkinCheckAreaSchedule> = plan?.skin_check_schedule || {};

  // Get enabled areas with their required frequency
  const enabledAreas = useMemo(() => {
    return Object.entries(schedule)
      .filter(([, s]) => s?.enabled)
      .map(([areaId, s]) => {
        const label = HIGH_RISK_AREAS.find(a => a.id === areaId)?.label || areaId;
        const freq = s.frequency as SkinCheckFrequency;
        let required = 1;
        switch (freq) {
          case 'twice_daily': required = 2; break;
          case 'three_times_daily': required = 3; break;
          case 'every_reposition': required = -1; break; // dynamic
          case 'custom': required = s.custom_times_per_day || 1; break;
          default: required = 1;
        }
        return { areaId, label, frequency: freq, required };
      });
  }, [schedule]);

  // Count today's checks per area
  const todayChecksByArea = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const counts: Record<string, number> = {};

    for (const session of sessions) {
      if (new Date(session.event_occurred_at) < todayStart) continue;
      const markers = (session as any).skin_finding_markers || [];
      for (const marker of markers) {
        if (marker.location) {
          counts[marker.location] = (counts[marker.location] || 0) + 1;
        }
      }
    }
    return counts;
  }, [sessions]);

  if (enabledAreas.length === 0) return null;

  const allComplete = enabledAreas.every(a =>
    a.required === -1
      ? (todayChecksByArea[a.areaId] || 0) > 0
      : (todayChecksByArea[a.areaId] || 0) >= a.required
  );

  const totalRequired = enabledAreas.reduce((sum, a) => sum + (a.required === -1 ? 1 : a.required), 0);
  const totalDone = enabledAreas.reduce((sum, a) => {
    const done = todayChecksByArea[a.areaId] || 0;
    const req = a.required === -1 ? 1 : a.required;
    return sum + Math.min(done, req);
  }, 0);

  return (
    <Card>
      <Collapsible>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Today's Skin Checks
            </div>
            <Badge
              variant="outline"
              className={allComplete
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              }
            >
              {totalDone}/{totalRequired}
            </Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-1.5">
            {enabledAreas.map(({ areaId, label, frequency, required }) => {
              const done = todayChecksByArea[areaId] || 0;
              const isComplete = required === -1 ? done > 0 : done >= required;
              const displayRequired = required === -1 ? '1+' : required;
              const freqLabel = SKIN_CHECK_FREQUENCY_LABELS[frequency];

              return (
                <div
                  key={areaId}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm border ${
                    isComplete
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : done > 0 ? (
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  )}

                  <span className="flex-1 font-medium">{label}</span>

                  {required !== -1 && required <= 4 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: required }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-2.5 rounded-full ${
                            i < done
                              ? 'bg-green-500'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {done}/{displayRequired}
                    </span>
                  )}

                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {freqLabel}
                  </span>
                </div>
              );
            })}

            {allComplete && (
              <div className="flex items-center gap-2 pt-2 text-sm text-green-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                All skin checks completed for today
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
