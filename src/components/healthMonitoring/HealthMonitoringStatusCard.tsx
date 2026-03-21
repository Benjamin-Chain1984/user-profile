/**
 * HealthMonitoringStatusCard - Uses shared TrafficLightStatusCard
 */

import { useState, useEffect, useMemo } from 'react';
import { Activity, Heart, Thermometer, Wind, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useVitalSignEntries, useVitalSignAlerts, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeHealthMonitoringStatus } from '@/utils/computeHealthMonitoringStatus';
import type { PerVitalStatus } from '@/utils/computeHealthMonitoringStatus';
import type { VitalSignConfig } from '@/types/healthMonitoring';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

function getNextDueVital(vitals: PerVitalStatus[]): { label: string; dueAt: Date } | null {
  const now = Date.now();
  let earliest: { label: string; dueAt: Date } | null = null;

  for (const v of vitals) {
    if (!v.enabled || !v.expectedIntervalHours) continue;
    const intervalMs = v.expectedIntervalHours * 3600000;
    const lastMs = v.lastRecordedAt ? new Date(v.lastRecordedAt).getTime() : 0;
    const dueMs = lastMs > 0 ? lastMs + intervalMs : now; // if never recorded, due now
    if (dueMs <= now) continue; // already overdue, skip
    if (!earliest || dueMs < earliest.dueAt.getTime()) {
      earliest = { label: v.label, dueAt: new Date(dueMs) };
    }
  }
  return earliest;
}

function formatCountdown(ms: number): string {
  const totalMins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface HealthMonitoringStatusCardProps {
  clientId?: string;
}

export function HealthMonitoringStatusCard({ clientId }: HealthMonitoringStatusCardProps) {
  const { entries } = useVitalSignEntries(clientId, 50);
  const { alerts } = useVitalSignAlerts(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);

  const { data: config } = useQuery({
    queryKey: ['vitalSignConfig', clientId, 'raw'],
    queryFn: async () => {
      let query = supabase.from('vital_sign_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as VitalSignConfig | null;
    },
  });

  const computed = computeHealthMonitoringStatus({
    config: config ?? null,
    entries,
    alerts,
    alteredCriteriaMap: criteriaMap,
  });

  const trafficLight = toTrafficLight(computed.moduleStatus);

  const vitalIcons: Record<string, React.ReactNode> = {
    temperature: <Thermometer className="h-3 w-3" />,
    bp: <Heart className="h-3 w-3" />,
    oxygen: <Wind className="h-3 w-3" />,
    heart_rate: <Activity className="h-3 w-3" />,
    respiratory: <Wind className="h-3 w-3" />,
  };

  const enabledVitals = computed.perVitalStatuses.filter(v => v.enabled);

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={computed.message}
      lastUpdated={computed.latestEntry?.event_occurred_at}
    >
      {/* Config missing warning */}
      {computed.configMissing && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 mb-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Configuration required</p>
            <p className="text-xs opacity-80 mt-0.5">
              Health monitoring settings must be configured in Settings before overdue detection can run.
            </p>
          </div>
        </div>
      )}

      {/* Overdue observations banner */}
      {computed.overdueVitals.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 mb-3">
          <Clock className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Scheduled observations overdue</p>
            <p className="text-xs opacity-80 mt-0.5">
              {computed.overdueVitals.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Per-vital status grid */}
      {enabledVitals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {enabledVitals.map((vital) => (
            <div
              key={String(vital.vitalKey)}
              className={cn(
                'p-2 rounded border text-center',
                vital.statusColor === 'red' && 'border-destructive/30 bg-destructive/5',
                vital.statusColor === 'amber' && 'border-warning/30 bg-warning/5',
                vital.statusColor === 'ideal' && 'border-success/30 bg-success/5',
                !vital.statusColor && 'border-border bg-muted/50'
              )}
            >
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                {vitalIcons[String(vital.vitalKey)]}
                {vital.label}
              </div>
              {vital.overdue ? (
                <div className="text-xs font-medium text-warning flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Overdue
                  {vital.elapsedHours != null && vital.expectedIntervalHours != null && (
                    <span>
                      {' '}+{(() => {
                        const overdueH = vital.elapsedHours - vital.expectedIntervalHours;
                        if (overdueH < 24) return '<1d';
                        const days = Math.round(overdueH / 24);
                        return `${days}d`;
                      })()}
                    </span>
                  )}
                </div>
              ) : (
                <div className={cn(
                  'font-mono font-medium text-sm',
                  vital.statusColor === 'red' && 'text-destructive',
                  vital.statusColor === 'amber' && 'text-warning',
                  vital.statusColor === 'ideal' && 'text-success',
                  !vital.statusColor && 'text-muted-foreground'
                )}>
                  {vital.lastRecordedAt ? (
                    <span className="flex items-center justify-center gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      On schedule
                    </span>
                  ) : '—'}
                </div>
              )}
              {vital.lastRecordedAt && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(vital.lastRecordedAt), { addSuffix: true })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!computed.latestEntry && !computed.configMissing && (
        <p className="text-sm text-muted-foreground italic">
          No vital signs recorded yet
        </p>
      )}
    </TrafficLightStatusCard>
  );
}
