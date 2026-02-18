/**
 * IDDSI History - Combined history of observations and positioning checks
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle2, AlertTriangle, AlertCircle, Utensils, Armchair } from 'lucide-react';

interface Props {
  clientId?: string;
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

  // Merge and sort by time
  const entries = [
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
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const loading = obsLoading || posLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 20).map(entry => (
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
  );
}
