/**
 * Enteral Nutrition Traffic Light Status Card
 * Uses shared TrafficLightStatusCard — matches Bowel Care pattern.
 * Includes next due feed/flush countdown.
 */

import { useMemo, useState, useEffect } from 'react';
import { useEnteralConfig, useEnteralFeedLogs, useEnteralFlushLogs, useEnteralStomaChecks, useEnteralMedicationLogs } from '@/hooks/useEnteral';
import { calculateEnteralStatus } from '@/utils/enteralStatusCalculator';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { migrateScheduleFormat } from './EnteralFeedingSchedule';
import type { FeedingScheduleEntry } from './EnteralFeedingSchedule';
import { Clock, Apple, Droplets } from 'lucide-react';

interface Props {
  clientId?: string;
}

function getNextDueSlot(schedule: FeedingScheduleEntry[]): { label: string; type: 'feed' | 'flush'; dueAt: Date } | null {
  if (!schedule.length) return null;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let feedCounter = 0;

  const upcoming: { label: string; type: 'feed' | 'flush'; dueAt: Date }[] = [];
  for (const entry of schedule) {
    const isFeed = (entry.type || 'feed') === 'feed';
    if (isFeed) feedCounter++;
    const label = isFeed ? `Feed ${feedCounter}` : 'Water Flush';
    const dueAt = new Date(`${todayStr}T${entry.time}:00`);
    if (dueAt > now) {
      upcoming.push({ label, type: entry.type || 'feed', dueAt });
    }
  }
  return upcoming.length > 0 ? upcoming[0] : null;
}

function formatCountdown(ms: number): string {
  const totalMins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function EnteralTrafficLightCard({ clientId }: Props) {
  const { data: config } = useEnteralConfig(clientId);
  const { data: feedLogs = [] } = useEnteralFeedLogs(clientId);
  const { data: flushLogs = [] } = useEnteralFlushLogs(clientId);
  const { data: stomaChecks = [] } = useEnteralStomaChecks(clientId);
  const { data: medLogs = [] } = useEnteralMedicationLogs(clientId);

  const statusResult = useMemo(() => calculateEnteralStatus({
    config: config || null,
    feedLogs,
    flushLogs,
    stomaChecks,
    medLogs,
  }), [config, feedLogs, flushLogs, stomaChecks, medLogs]);

  const schedule = useMemo(() => {
    if (Array.isArray(config?.feeding_schedule) && config.feeding_schedule.length > 0) {
      return migrateScheduleFormat(config.feeding_schedule as any[]);
    }
    return [];
  }, [config?.feeding_schedule]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  const nextSlot = useMemo(() => getNextDueSlot(schedule), [schedule, now]);

  const trafficLight = toTrafficLight(statusResult.status);
  const lastUpdated = feedLogs[0]?.event_occurred_at || flushLogs[0]?.event_occurred_at || null;

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusResult.message}
      lastUpdated={lastUpdated}
    >
      {/* Next due countdown */}
      {nextSlot && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-background/50 border border-current/10">
          {nextSlot.type === 'feed' ? (
            <Apple className="h-4 w-4 text-amber-600 flex-shrink-0" />
          ) : (
            <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <span className="font-medium">Next: {nextSlot.label}</span>
            <span className="text-muted-foreground"> at {nextSlot.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-primary">
            <Clock className="h-3.5 w-3.5" />
            {formatCountdown(nextSlot.dueAt.getTime() - now.getTime())}
          </div>
        </div>
      )}

      {!nextSlot && schedule.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-background/50 border border-current/10">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">All scheduled feeds & flushes completed for today</span>
        </div>
      )}

      {/* Guidance */}
      <div>
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {statusResult.status === 'stable' && 'Continue scheduled feeds and flushes. Monitor tube site and maintain hydration as per plan.'}
          {statusResult.status === 'monitor' && 'Check for missed feeds. Review tube change schedule and stoma site. Escalate any concerns to a nurse or dietitian.'}
          {statusResult.status === 'action' && 'Attend to overdue feeds or tube change immediately. Report stoma concerns to the clinical team. Seek medical advice.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Follow the person's Enteral Nutrition and Medication Plan. Seek medical advice if concerns arise.
      </p>
    </TrafficLightStatusCard>
  );
}
