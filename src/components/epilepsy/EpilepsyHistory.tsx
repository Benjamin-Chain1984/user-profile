/**
 * Epilepsy History - Recent seizure events list
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSeizureEvents } from '@/hooks/useEpilepsy';
import { format } from 'date-fns';
import { Clock, Zap } from 'lucide-react';

interface EpilepsyHistoryProps {
  clientId?: string;
}

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
  const { events, isLoading } = useSeizureEvents(clientId, 20);

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading history...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Seizure Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No seizure events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const totalDuration = event.duration_minutes + (event.duration_seconds / 60);
              return (
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
