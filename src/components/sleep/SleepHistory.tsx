/**
 * Sleep History - Recent sleep log entries
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSleepEntries } from '@/hooks/useSleep';
import { format } from 'date-fns';
import { Moon, Sun, AlertCircle } from 'lucide-react';

interface SleepHistoryProps {
  clientId?: string;
}

export function SleepHistory({ clientId }: SleepHistoryProps) {
  const { entries, isLoading } = useSleepEntries(clientId, 20);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Sleep Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No sleep entries yet.</p>
        ) : (
          entries.map(entry => {
            const hours = Number(entry.estimated_hours_slept);
            const statusColor = hours < 5 ? 'text-destructive' : hours < 7 ? 'text-warning' : 'text-success';

            return (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Moon className={`h-4 w-4 mt-1 shrink-0 ${statusColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {format(new Date(entry.event_occurred_at), 'EEE d MMM')}
                    </span>
                    <Badge variant={hours < 5 ? 'destructive' : hours < 7 ? 'secondary' : 'default'} className="text-xs">
                      {hours.toFixed(1)}h
                    </Badge>
                    {entry.number_of_awakenings > 0 && (
                      <Badge variant="outline" className="text-xs">{entry.number_of_awakenings} awakenings</Badge>
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
                  {entry.assistance_types.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assistance: {entry.assistance_types.join(', ')}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
