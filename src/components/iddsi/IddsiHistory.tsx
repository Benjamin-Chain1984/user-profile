/**
 * IDDSI History - Combined history of observations and positioning checks
 * Layout matches Continence module format.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { format, formatDistanceToNow, subDays, subMonths, isAfter } from 'date-fns';
import { Clock, User, Utensils, Armchair, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  clientId?: string;
}

const TIME_FILTERS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '1m', label: 'Last month' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
];

function getFilterDate(filter: string): Date {
  const now = new Date();
  switch (filter) {
    case '24h': return subDays(now, 1);
    case '7d': return subDays(now, 7);
    case '14d': return subDays(now, 14);
    case '1m': return subMonths(now, 1);
    case '6m': return subMonths(now, 6);
    case '12m': return subMonths(now, 12);
    default: return subDays(now, 7);
  }
}

function useStaffNames(userIds: string[]) {
  return useQuery({
    queryKey: ['staff-names', userIds.sort().join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return {} as Record<string, string>;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p) => { map[p.id] = p.full_name || 'Unknown'; });
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

function getSeverityColor(severity: string) {
  if (severity === 'red') return 'bg-red-100 text-red-800';
  if (severity === 'amber') return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
}

function getSeverityLabel(severity: string) {
  if (severity === 'red') return 'RED';
  if (severity === 'amber') return 'AMBER';
  return 'IDEAL';
}

export function IddsiHistory({ clientId }: Props) {
  const { observations, loading: obsLoading } = useMealtimeObservations(clientId);
  const { checks, loading: posLoading } = usePositioningChecks(clientId);
  const [timeFilter, setTimeFilter] = useState('7d');

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
        createdBy: o.createdBy || null,
        recordedOnBehalfOfName: o.recordedOnBehalfOfName || null,
        recordedOnBehalfOfRole: o.recordedOnBehalfOfRole || null,
        data: o,
      })),
      ...checks.map(c => ({
        type: 'positioning' as const,
        id: c.id,
        timestamp: c.eventOccurredAt,
        severity: c.status,
        completedBy: c.completedByName,
        createdBy: (c as any).createdBy || null,
        recordedOnBehalfOfName: null as string | null,
        recordedOnBehalfOfRole: null as string | null,
        data: c,
      })),
    ]
      .filter(e => isAfter(new Date(e.timestamp), cutoff))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }, [observations, checks, timeFilter]);

  // Resolve staff names
  const allStaffIds = useMemo(() => {
    const ids = new Set<string>();
    entries.forEach(e => { if (e.createdBy) ids.add(e.createdBy); });
    return Array.from(ids);
  }, [entries]);
  const { data: staffNames = {} } = useStaffNames(allStaffIds);

  const loading = obsLoading || posLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Entries</CardTitle>
            <CardDescription>{entries.length} entries</CardDescription>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[160px]">
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
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">No entries in this period.</p>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => {
                const loggedByName = entry.createdBy ? staffNames[entry.createdBy] : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      {entry.type === 'observation' ? (
                        <Utensils className="h-4 w-4 text-primary" />
                      ) : (
                        <Armchair className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {entry.type === 'observation' ? 'Mealtime Observation' : 'Positioning Check'}
                          </span>
                          <Badge className={getSeverityColor(entry.severity)}>
                            {getSeverityLabel(entry.severity)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Observation details */}
                      {entry.type === 'observation' && (
                        <div className="flex flex-wrap gap-1">
                          {(entry.data as any).coughing !== 'none' && (
                            <Badge variant="outline" className="text-xs">
                              Coughing: {(entry.data as any).coughing}
                            </Badge>
                          )}
                          {(entry.data as any).wetVoice && (
                            <Badge variant="outline" className="text-xs">
                              Wet voice
                            </Badge>
                          )}
                          {(entry.data as any).throatClearing && (
                            <Badge variant="outline" className="text-xs">
                              Throat clearing
                            </Badge>
                          )}
                          {(entry.data as any).pocketing && (
                            <Badge variant="outline" className="text-xs">
                              Pocketing
                            </Badge>
                          )}
                          {(entry.data as any).fatigue && (
                            <Badge variant="outline" className="text-xs">
                              Fatigue
                            </Badge>
                          )}
                          {(entry.data as any).refusal && (
                            <Badge variant="outline" className="text-xs">
                              Refusal
                            </Badge>
                          )}
                          {(entry.data as any).mealCompletionPct != null && (
                            <Badge variant="outline" className="text-xs">
                              Meal: {(entry.data as any).mealCompletionPct}%
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Positioning details */}
                      {entry.type === 'positioning' && (
                        <Badge variant="outline" className="text-xs">
                          Angle: {(entry.data as any).angleDegrees}°
                        </Badge>
                      )}

                      {/* On behalf badge */}
                      {entry.recordedOnBehalfOfName && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <UserPlus className="h-3 w-3" />
                          On behalf of {entry.recordedOnBehalfOfName}
                          {entry.recordedOnBehalfOfRole && ` (${entry.recordedOnBehalfOfRole})`}
                        </Badge>
                      )}

                      {/* Staff attribution */}
                      {loggedByName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Logged by: {loggedByName}
                        </div>
                      )}

                      {/* Notes */}
                      {(entry.data as any).notes && (
                        <p className="text-sm text-muted-foreground">
                          {(entry.data as any).notes}
                        </p>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.timestamp), 'dd/MM/yy HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
