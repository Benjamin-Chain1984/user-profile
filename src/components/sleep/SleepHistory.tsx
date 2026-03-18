/**
 * Sleep History - Recent sleep log entries with time-range filter
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSleepEntries } from '@/hooks/useSleep';
import { getAwakeningCount, hasProlongedAwakenings, estimateAwakeMinutes } from '@/types/sleep';
import { format, subDays, isAfter } from 'date-fns';
import { Moon, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SleepHistoryProps {
  clientId?: string;
}

type FilterRange = 'last5' | '7d' | '14d' | '1m' | '3m';

const FILTER_OPTIONS: { value: FilterRange; label: string }[] = [
  { value: 'last5', label: 'Last 5 entries' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 2 weeks' },
  { value: '1m', label: 'Last 1 month' },
  { value: '3m', label: 'Last 3 months' },
];

const RANGE_DAYS: Record<Exclude<FilterRange, 'last5'>, number> = {
  '7d': 7,
  '14d': 14,
  '1m': 30,
  '3m': 90,
};

export function SleepHistory({ clientId }: SleepHistoryProps) {
  const [filter, setFilter] = useState<FilterRange>('last5');
  const { entries, isLoading } = useSleepEntries(clientId, 100);

  const filteredEntries = useMemo(() => {
    if (filter === 'last5') return entries.slice(0, 5);
    const cutoff = subDays(new Date(), RANGE_DAYS[filter]);
    return entries.filter(e => isAfter(new Date(e.event_occurred_at), cutoff));
  }, [entries, filter]);

  // Fetch staff names for created_by UUIDs
  const creatorIds = [...new Set(filteredEntries.map(e => e.created_by).filter(Boolean))];
  const { data: profiles } = useQuery({
    queryKey: ['sleepHistoryProfiles', creatorIds],
    queryFn: async () => {
      if (!creatorIds.length) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds as string[]);
      return data || [];
    },
    enabled: creatorIds.length > 0,
  });

  const getStaffName = (userId: string | null) => {
    if (!userId || !profiles) return null;
    const p = profiles.find(pr => pr.id === userId);
    return p?.full_name || null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Recent Sleep Logs</CardTitle>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterRange)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No sleep entries for this period.</p>
        ) : (
          filteredEntries.map(entry => {
            const hours = Number(entry.estimated_hours_slept);
            const awakenings = getAwakeningCount(entry);
            const hasEvents = entry.awakening_events?.length > 0;
            const prolonged = hasProlongedAwakenings(entry);
            const statusColor = hours < 5 ? 'text-destructive' : hours < 7 ? 'text-warning' : hours > 12 ? 'text-warning' : 'text-success';

            return (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Moon className={`h-4 w-4 mt-1 shrink-0 ${statusColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {format(new Date(entry.event_occurred_at), 'EEE d MMM')}
                    </span>
                    <Badge variant={hours < 5 ? 'destructive' : hours < 7 ? 'secondary' : hours > 12 ? 'secondary' : 'default'} className="text-xs">
                      {hours.toFixed(1)}h
                    </Badge>
                    {awakenings > 0 && (
                      <Badge variant="outline" className="text-xs">{awakenings} awakenings</Badge>
                    )}
                    {prolonged && (
                      <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">&gt;30min wake</Badge>
                    )}
                    {entry.restlessness && (
                      <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">Restless</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.bedtime), 'h:mm a')} → {format(new Date(entry.wake_time), 'h:mm a')}
                    {entry.day_nap && entry.day_nap_duration_minutes && (
                      <> • Nap: {entry.day_nap_duration_minutes}min</>
                    )}
                  </p>
                  {hasEvents && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.awakening_events.map((evt, i) => (
                        <span key={evt.id || i}>
                          {i > 0 && ' • '}
                          {evt.duration_category === 'less_than_10' ? '<10min' : evt.duration_category === '10_to_30' ? '10-30min' : '>30min'}
                          {evt.reason && evt.reason !== 'unknown' && ` (${evt.reason})`}
                        </span>
                      ))}
                      {' '}• ~{estimateAwakeMinutes(entry.awakening_events)}min awake
                    </div>
                  )}
                  {entry.assistance_types.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assistance: {entry.assistance_types.join(', ')}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>
                  )}
                  {(() => {
                    const staffName = entry.recorded_on_behalf_of_name || getStaffName(entry.created_by);
                    return staffName ? (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Logged by: {staffName}
                        {entry.recorded_on_behalf_of_role && ` — ${entry.recorded_on_behalf_of_role}`}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
