/**
 * IDDSI History - Combined history of observations and positioning checks
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { formatDistanceToNow } from 'date-fns';
import { subDays, subMonths, isAfter } from 'date-fns';
import { CheckCircle2, AlertTriangle, AlertCircle, Utensils, Armchair } from 'lucide-react';

interface Props {
  clientId?: string;
}

const TIME_FILTERS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 2 weeks' },
  { value: '1m', label: 'Last month' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
] as const;

function getFilterDate(filter: string): Date {
  const now = new Date();
  switch (filter) {
    case '7d': return subDays(now, 7);
    case '14d': return subDays(now, 14);
    case '1m': return subMonths(now, 1);
    case '3m': return subMonths(now, 3);
    case '6m': return subMonths(now, 6);
    case '12m': return subMonths(now, 12);
    default: return subDays(now, 7);
  }
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'red') return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (severity === 'amber') return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <CheckCircle2 className="h-4 w-4 text-success" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={
      severity === 'red' ? 'destructive' :
      severity === 'amber' ? 'outline' :
      'default'
    } className={
      severity === 'amber' ? 'border-amber-300 text-amber-700 bg-amber-50' :
      severity === 'green' ? 'bg-success/10 text-success border-success/30' :
      ''
    }>
      {severity === 'red' ? 'RED' : severity === 'amber' ? 'AMBER' : 'IDEAL'}
    </Badge>
  );
}

export function IddsiHistory({ clientId }: Props) {
  const { observations, loading: obsLoading } = useMealtimeObservations(clientId);
  const { checks, loading: posLoading } = usePositioningChecks(clientId);
  const [timeFilter, setTimeFilter] = useState('3m');

  // Merge, filter by time, and sort
  const entries = useMemo(() => {
    const cutoff = getFilterDate(timeFilter);
    const merged = [
      ...observations.map(o => ({
        type: 'observation' as const,
        id: o.id,
        timestamp: o.eventOccurredAt,
        severity: o.severity,
        completedBy: o.completedByName,
        data: o,
      })),
      ...checks.map(c => ({
        type: 'positioning' as const,
        id: c.id,
        timestamp: c.eventOccurredAt,
        severity: c.status,
        completedBy: c.completedByName,
        data: c,
      })),
    ]
      .filter(e => isAfter(new Date(e.timestamp), cutoff))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }, [observations, checks, timeFilter]);

  const loading = obsLoading || posLoading;

  return (
    <div className="space-y-4">
      {/* Last 5 Mealtime Observations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Last 5 Mealtime Observations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : lastFiveObservations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No observations yet.</p>
          ) : (
            <div className="space-y-2">
              {lastFiveObservations.map(obs => (
                <div key={obs.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Utensils className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Mealtime Observation</span>
                      <SeverityBadge severity={obs.severity} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(obs.eventOccurredAt), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">by {obs.completedByName}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {obs.coughing !== 'none' && (
                        <Badge variant="outline" className="text-xs">Coughing: {obs.coughing}</Badge>
                      )}
                      {obs.wetVoice && <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Wet voice</Badge>}
                      {obs.mealCompletionPct !== null && (
                        <Badge variant="outline" className="text-xs">Meal: {obs.mealCompletionPct}%</Badge>
                      )}
                    </div>
                  </div>
                  <SeverityIcon severity={obs.severity} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Activity with Time Filter */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">All Activity</CardTitle>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_FILTERS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No entries in this period.</p>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="mt-0.5">
                    {entry.type === 'observation' ? (
                      <Utensils className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Armchair className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {entry.type === 'observation' ? 'Mealtime Observation' : 'Positioning Check'}
                      </span>
                      <SeverityBadge severity={entry.severity} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">by {entry.completedBy}</span>
                    </div>
                    {entry.type === 'observation' && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(entry.data as any).coughing !== 'none' && (
                          <Badge variant="outline" className="text-xs">Coughing: {(entry.data as any).coughing}</Badge>
                        )}
                        {(entry.data as any).wetVoice && <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Wet voice</Badge>}
                        {(entry.data as any).mealCompletionPct !== null && (
                          <Badge variant="outline" className="text-xs">Meal: {(entry.data as any).mealCompletionPct}%</Badge>
                        )}
                      </div>
                    )}
                    {entry.type === 'positioning' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Angle: {(entry.data as any).angleDegrees}°
                      </p>
                    )}
                  </div>
                  <SeverityIcon severity={entry.severity} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}