/**
 * DurationEscalationTimeline — Visual timeline showing the
 * Red (24h) → Amber (24h) → IDEAL escalation after a seizure
 * exceeds the duration threshold.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DurationEscalationInfo } from '@/types/epilepsy';

interface Props {
  escalation: DurationEscalationInfo;
  durationThreshold: number;
}

export function DurationEscalationTimeline({ escalation, durationThreshold }: Props) {
  if (!escalation.isActive) return null;

  const { phase, hoursRemaining, hoursElapsed, triggerEventDate } = escalation;

  // Progress: 0–24h = red fill, 24–48h = amber fill
  const redPct = phase === 'red' ? ((hoursElapsed / 24) * 100) : 100;
  const amberPct = phase === 'amber' ? (((hoursElapsed - 24) / 24) * 100) : 0;

  return (
    <Card className={cn(
      'border-2',
      phase === 'red' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duration Breach Escalation Timeline
        </CardTitle>
        {triggerEventDate && (
          <p className="text-xs text-muted-foreground">
            Triggered: {format(new Date(triggerEventDate), 'dd MMM yyyy, HH:mm')} — seizure exceeded {durationThreshold} min
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase countdown */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          phase === 'red' ? 'bg-destructive/10' : 'bg-warning/10'
        )}>
          {phase === 'red' ? (
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {phase === 'red' ? 'RED Phase' : 'AMBER Phase'} — {Math.ceil(hoursRemaining)}h remaining
            </p>
            <p className="text-xs text-muted-foreground">
              {phase === 'red'
                ? 'Follow Epilepsy Management Plan. Increased monitoring required.'
                : 'Continue close monitoring. Will return to IDEAL if no further seizure activity.'}
            </p>
          </div>
        </div>

        {/* Visual timeline bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Event</span>
            <span className="flex-1" />
            <span>+24h</span>
            <span className="flex-1" />
            <span>+48h (Clear)</span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden bg-muted/30 border">
            {/* Red segment (0–24h) */}
            <div className="relative w-1/2 bg-muted/20">
              <div
                className="absolute inset-y-0 left-0 bg-destructive/70 transition-all duration-500"
                style={{ width: `${Math.min(100, redPct)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold z-10">
                RED (0–24h)
              </span>
            </div>
            {/* Amber segment (24–48h) */}
            <div className="relative w-1/2 bg-muted/20 border-l border-border">
              <div
                className="absolute inset-y-0 left-0 bg-warning/70 transition-all duration-500"
                style={{ width: `${Math.min(100, amberPct)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold z-10">
                AMBER (24–48h)
              </span>
            </div>
          </div>

          {/* Phase markers */}
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-1 flex-1">
              <div className={cn(
                'w-3 h-3 rounded-full border-2',
                phase === 'red' ? 'bg-destructive border-destructive animate-pulse' : 'bg-destructive/40 border-destructive/40'
              )} />
              <span className="text-[10px] text-muted-foreground">Red</span>
            </div>
            <div className="flex items-center gap-1 flex-1">
              <div className={cn(
                'w-3 h-3 rounded-full border-2',
                phase === 'amber' ? 'bg-warning border-warning animate-pulse' : 'bg-warning/30 border-warning/30'
              )} />
              <span className="text-[10px] text-muted-foreground">Amber</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 bg-success/30 border-success/30" />
              <span className="text-[10px] text-muted-foreground">IDEAL</span>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-muted-foreground border-t pt-2">
          Seizures lasting ≥{durationThreshold} min trigger a mandatory 48h escalation window: 
          24 hours at Red status, then 24 hours at Amber, before returning to IDEAL 
          (provided no further seizure activity occurs).
        </p>
      </CardContent>
    </Card>
  );
}
