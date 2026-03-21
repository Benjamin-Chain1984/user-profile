/**
 * Pain Assessment Status Card - Uses shared TrafficLightStatusCard
 */

import { useState, useEffect } from 'react';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';
import { AbbeyPainAssessment, getSeverityLabel, getSeverityColor } from '@/types/painAssessment';
import { PainadAssessment, getPainadSeverityLabel, getPainadSeverityColor } from '@/types/painad';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface NextDueInfo {
  dueDate: Date | null;
  isOverdue: boolean;
  label: string;
  hasAssessments: boolean;
  reason: string | null;
  isReassessment: boolean;
  urgency: 'amber' | 'dark-amber' | 'red' | null;
}

interface PainStatusCardProps {
  latestAbbey: AbbeyPainAssessment | null;
  latestPainad: PainadAssessment | null;
  abbeyTrend: 'improving' | 'worsening' | 'stable';
  painadTrend: 'improving' | 'worsening' | 'stable';
  enabledTools: string[];
  nextDueInfo?: NextDueInfo | null;
}

function mapSeverityToStatus(severity: string | undefined): string {
  switch (severity) {
    case 'no_pain': return 'ideal';
    case 'mild': return 'monitor';
    case 'moderate': return 'monitor';
    case 'severe': return 'action';
    default: return 'ideal';
  }
}

function getWorstStatus(statuses: string[]): string {
  if (statuses.includes('action')) return 'action';
  if (statuses.includes('monitor')) return 'monitor';
  return 'ideal';
}

function getStatusMessage(severity: string | undefined): string {
  switch (severity) {
    case 'no_pain': return 'No pain detected. Continue routine monitoring.';
    case 'mild': return 'Mild pain detected. Monitor closely and reassess.';
    case 'moderate': return 'Moderate pain detected. Action required — seek advice if persistent.';
    case 'severe': return 'Severe pain detected. Urgent clinical review required.';
    default: return 'No assessments recorded yet. Begin an assessment to establish a baseline.';
  }
}

function TrendIndicator({ direction }: { direction: 'improving' | 'worsening' | 'stable' }) {
  const Icon = direction === 'improving' ? TrendingDown : direction === 'worsening' ? TrendingUp : Minus;
  const color = direction === 'improving' ? 'text-success' : direction === 'worsening' ? 'text-destructive' : 'text-muted-foreground';
  const label = direction === 'improving' ? 'Improving' : direction === 'worsening' ? 'Worsening' : 'Stable';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function NextDueBanner({ info }: { info: NextDueInfo }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Don't show countdown for overdue (already reflected in traffic light)
  if (!info.dueDate || info.isOverdue) return null;

  const countdown = formatDistanceToNow(info.dueDate);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm">
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">
          {info.isReassessment ? 'Reassessment due' : 'Next assessment due'}
        </span>
        {info.reason && (
          <span className="text-xs text-muted-foreground ml-1.5">
            ({info.reason})
          </span>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="font-semibold">{countdown}</span>
      </div>
    </div>
  );
}

export function PainStatusCard({ latestAbbey, latestPainad, abbeyTrend, painadTrend, enabledTools, nextDueInfo }: PainStatusCardProps) {
  // Determine worst severity across enabled tools
  const statuses: string[] = [];
  const severities: (string | undefined)[] = [];

  if (enabledTools.includes('abbey') && latestAbbey) {
    statuses.push(mapSeverityToStatus(latestAbbey.severity));
    severities.push(latestAbbey.severity);
  }
  if (enabledTools.includes('painad') && latestPainad) {
    statuses.push(mapSeverityToStatus(latestPainad.severity));
    severities.push(latestPainad.severity as string);
  }

  const worstStatus = statuses.length > 0 ? getWorstStatus(statuses) : 'ideal';
  const trafficLight = toTrafficLight(worstStatus);

  // Pick the worst severity for the message
  const worstSeverity = severities.includes('severe') ? 'severe'
    : severities.includes('moderate') ? 'moderate'
    : severities.includes('mild') ? 'mild'
    : severities.includes('no_pain') ? 'no_pain'
    : undefined;

  const reason = getStatusMessage(worstSeverity);

  // Last updated = most recent assessment across tools
  const lastUpdated = [latestAbbey?.created_at, latestPainad?.created_at]
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={reason}
      lastUpdated={lastUpdated}
    >
      {/* Next due countdown */}
      {nextDueInfo && <NextDueBanner info={nextDueInfo} />}

      {/* Per-tool breakdown */}
      <div className="grid sm:grid-cols-2 gap-4 mt-3">
        {enabledTools.includes('abbey') && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium opacity-70">Abbey Pain Scale</p>
              {latestAbbey ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-lg font-bold ${getSeverityColor(latestAbbey.severity)}`}>
                    {getSeverityLabel(latestAbbey.severity)}
                  </span>
                  <span className="text-xs opacity-60">({latestAbbey.total_score}/18)</span>
                </div>
              ) : (
                <p className="text-sm opacity-70 mt-0.5">No assessments yet</p>
              )}
            </div>
            {latestAbbey && <TrendIndicator direction={abbeyTrend} />}
          </div>
        )}

        {enabledTools.includes('painad') && (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium opacity-70">PAINAD Scale</p>
              {latestPainad ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-lg font-bold ${getPainadSeverityColor(latestPainad.severity)}`}>
                    {getPainadSeverityLabel(latestPainad.severity)}
                  </span>
                  <span className="text-xs opacity-60">({latestPainad.total_score}/10)</span>
                </div>
              ) : (
                <p className="text-sm opacity-70 mt-0.5">No assessments yet</p>
              )}
            </div>
            {latestPainad && <TrendIndicator direction={painadTrend} />}
          </div>
        )}
      </div>

      {/* Guidance */}
      <div className="mt-3 pt-3 border-t border-current/10">
        <h4 className="text-sm font-medium mb-1">What to do:</h4>
        <p className="text-sm opacity-80">
          {worstSeverity === 'no_pain' && 'Continue regular monitoring as per the scheduled assessment frequency.'}
          {worstSeverity === 'mild' && 'Monitor closely. Review environment and positioning. Reassess within the configured timeframe.'}
          {worstSeverity === 'moderate' && 'Administer PRN pain medication if prescribed. Notify supervisor. Reassess within configured hours.'}
          {worstSeverity === 'severe' && 'Escalate immediately. Seek urgent GP / medical review. Administer PRN pain medication if prescribed.'}
          {!worstSeverity && 'Complete an initial pain assessment to establish a baseline for this person.'}
        </p>
      </div>

      <p className="mt-3 text-xs opacity-60 italic">
        Pain assessment tools are screening tools only. If pain is suspected, seek medical advice.
      </p>
    </TrafficLightStatusCard>
  );
}
