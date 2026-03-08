/**
 * Vital Check Compliance Card
 * Shows today's vital sign check progress against configured frequency.
 * Flags amber when checks are missed.
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useVitalSignEntries, useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { CheckCircle2, Circle, AlertCircle, ClipboardCheck, Thermometer, Heart, Wind, Activity } from 'lucide-react';
import type { VitalSignEntry } from '@/types/healthMonitoring';

interface Props {
  clientId?: string;
}

interface VitalCheckInfo {
  key: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  frequencyHours: number | null;
  requiredToday: number;
  completedToday: number;
}

/** Map frequency hours to expected daily checks */
function getRequiredChecksPerDay(hours: number | null): number {
  if (!hours) return 0; // as_needed
  if (hours <= 8) return 3;   // three times daily
  if (hours <= 12) return 2;  // twice daily
  if (hours <= 24) return 1;  // daily
  return 0; // weekly/monthly — not tracked daily
}

function getFrequencyLabel(hours: number | null): string {
  if (!hours) return 'As needed';
  if (hours <= 8) return '3× daily';
  if (hours <= 12) return '2× daily';
  if (hours <= 24) return 'Daily';
  if (hours <= 84) return '2× weekly';
  if (hours <= 168) return 'Weekly';
  return 'Monthly';
}

export function VitalCheckComplianceCard({ clientId }: Props) {
  const { config } = useVitalSignConfig(clientId);
  const { entries } = useVitalSignEntries(clientId, 100);

  // Count today's entries per vital type
  const todayCounts = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const counts = {
      temperature: 0,
      bp: 0,
      oxygen: 0,
      heart_rate: 0,
      respiratory: 0,
    };

    for (const entry of entries) {
      if (new Date(entry.event_occurred_at) < todayStart) continue;
      if (entry.temperature_celsius !== null) counts.temperature++;
      if (entry.bp_systolic !== null) counts.bp++;
      if (entry.oxygen_saturation !== null) counts.oxygen++;
      if (entry.heart_rate !== null) counts.heart_rate++;
      if (entry.respiratory_rate !== null) counts.respiratory++;
    }

    return counts;
  }, [entries]);

  const vitals: VitalCheckInfo[] = useMemo(() => {
    const list: VitalCheckInfo[] = [
      {
        key: 'temperature',
        label: 'Temperature',
        icon: <Thermometer className="h-3.5 w-3.5" />,
        enabled: config.temperature_enabled,
        frequencyHours: config.temperature_frequency_hours ?? null,
        requiredToday: getRequiredChecksPerDay(config.temperature_frequency_hours ?? null),
        completedToday: todayCounts.temperature,
      },
      {
        key: 'bp',
        label: 'Blood Pressure',
        icon: <Heart className="h-3.5 w-3.5" />,
        enabled: config.bp_enabled,
        frequencyHours: config.bp_frequency_hours ?? null,
        requiredToday: getRequiredChecksPerDay(config.bp_frequency_hours ?? null),
        completedToday: todayCounts.bp,
      },
      {
        key: 'oxygen',
        label: 'SpO₂',
        icon: <Wind className="h-3.5 w-3.5" />,
        enabled: config.oxygen_enabled,
        frequencyHours: config.oxygen_frequency_hours ?? null,
        requiredToday: getRequiredChecksPerDay(config.oxygen_frequency_hours ?? null),
        completedToday: todayCounts.oxygen,
      },
      {
        key: 'heart_rate',
        label: 'Heart Rate',
        icon: <Activity className="h-3.5 w-3.5" />,
        enabled: config.heart_rate_enabled,
        frequencyHours: config.heart_rate_frequency_hours ?? null,
        requiredToday: getRequiredChecksPerDay(config.heart_rate_frequency_hours ?? null),
        completedToday: todayCounts.heart_rate,
      },
      {
        key: 'respiratory',
        label: 'Respiratory Rate',
        icon: <Wind className="h-3.5 w-3.5" />,
        enabled: config.respiratory_enabled,
        frequencyHours: config.respiratory_frequency_hours ?? null,
        requiredToday: getRequiredChecksPerDay(config.respiratory_frequency_hours ?? null),
        completedToday: todayCounts.respiratory,
      },
    ];

    // Only show vitals that are enabled AND have a daily frequency (≤24h)
    return list.filter(v => v.enabled && v.requiredToday > 0);
  }, [config, todayCounts]);

  if (vitals.length === 0) return null;

  const totalRequired = vitals.reduce((sum, v) => sum + v.requiredToday, 0);
  const totalDone = vitals.reduce((sum, v) => sum + Math.min(v.completedToday, v.requiredToday), 0);
  const allComplete = totalDone >= totalRequired;

  return (
    <Card>
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Today's Vital Checks
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
            {vitals.map((vital) => {
              const isComplete = vital.completedToday >= vital.requiredToday;
              const hasPartial = vital.completedToday > 0 && !isComplete;

              return (
                <div
                  key={vital.key}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm border ${
                    isComplete
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : hasPartial ? (
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  )}

                  <div className="flex items-center gap-1.5 flex-1">
                    {vital.icon}
                    <span className="font-medium">{vital.label}</span>
                  </div>

                  {/* Progress dots */}
                  {vital.requiredToday <= 4 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: vital.requiredToday }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-2.5 rounded-full ${
                            i < vital.completedToday
                              ? 'bg-green-500'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {vital.completedToday}/{vital.requiredToday}
                    </span>
                  )}

                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {getFrequencyLabel(vital.frequencyHours)}
                  </span>
                </div>
              );
            })}

            {allComplete && (
              <div className="flex items-center gap-2 pt-2 text-sm text-green-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                All vital checks completed for today
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
