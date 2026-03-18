/**
 * Epilepsy History - Recent seizure events list with time-range filter
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSeizureEvents } from '@/hooks/useEpilepsy';
import { format, subDays, isAfter } from 'date-fns';
import { Clock, Zap } from 'lucide-react';

interface EpilepsyHistoryProps {
  clientId?: string;
}

type FilterRange = 'last5' | '7d' | '14d' | '1m' | '3m' | '6m' | '12m';

const FILTER_OPTIONS: { value: FilterRange; label: string }[] = [
  { value: 'last5', label: 'Last 5 entries' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 2 weeks' },
  { value: '1m', label: 'Last 1 month' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
];

const RANGE_DAYS: Record<Exclude<FilterRange, 'last5'>, number> = {
  '7d': 7,
  '14d': 14,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '12m': 365,
};

const seizureTypeLabels: Record<string, string> = {
  focal_aware: 'Focal Aware',
  focal_impaired_awareness: 'Focal Impaired Awareness',
  focal_to_bilateral: 'Focal to Bilateral Tonic-Clonic',
  absence: 'Absence',
  tonic: 'Tonic',
  atonic: 'Atonic',
  myoclonic: 'Myoclonic',
  tonic_clonic: 'Tonic-Clonic',
  unknown: 'Unknown Type',
};

export function EpilepsyHistory({ clientId }: EpilepsyHistoryProps) {
  const [filter, setFilter] = useState<FilterRange>('last5');
  const { events, isLoading } = useSeizureEvents(clientId, 500);

  const filteredEvents = useMemo(() => {
    if (filter === 'last5') return events.slice(0, 5);
    const cutoff = subDays(new Date(), RANGE_DAYS[filter]);
    return events.filter(e => isAfter(new Date(e.event_occurred_at), cutoff));
  }, [events, filter]);

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading history...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Seizure Events
        </CardTitle>
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
      <CardContent>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No seizure events recorded for this period.</p>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <div key={event.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-warning" />
                    <span className="font-medium text-sm">
                      {seizureTypeLabels[event.seizure_type] || event.seizure_type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.event_occurred_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {event.duration_minutes}m {event.duration_seconds}s
                  </Badge>
                  {event.triggers.slice(0, 3).map(t => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                  {event.recovery.includes('Emergency support required') && (
                    <Badge variant="destructive" className="text-xs">Emergency</Badge>
                  )}
                  {event.recovery.includes('Injured (notes required)') && (
                    <Badge variant="destructive" className="text-xs">Injury</Badge>
                  )}
                </div>
                {event.notes && (
                  <p className="text-xs text-muted-foreground">{event.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
