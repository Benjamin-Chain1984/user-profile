/**
 * Pressure Area Prevention History - Events and Skin Checks
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePressureReliefEvents, useSkinChecks } from '@/hooks/usePressureArea';
import { HIGH_RISK_AREAS, SKIN_FINDING_TYPES } from '@/types/pressureArea';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, Eye } from 'lucide-react';

interface Props {
  clientId?: string;
}

function formatDateTime(val: string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function PressureAreaHistory({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);

  return (
    <Tabs defaultValue="relief" className="space-y-4">
      <TabsList>
        <TabsTrigger value="relief" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Relief Events
        </TabsTrigger>
        <TabsTrigger value="skin" className="gap-2">
          <Eye className="h-4 w-4" />
          Skin Checks
        </TabsTrigger>
      </TabsList>

      <TabsContent value="relief">
        <Card>
          <CardHeader><CardTitle className="text-base">Pressure Relief Events</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No events logged yet.</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 30).map(event => (
                  <div key={event.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{event.position_completed}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(event.event_occurred_at)}</span>
                    </div>
                    {event.issues && event.issues.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {event.issues.map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{issue}</Badge>
                        ))}
                      </div>
                    )}
                    {event.escalation_required && (
                      <Badge variant="destructive" className="text-xs mt-1">Escalation Required</Badge>
                    )}
                    {event.notes && <p className="text-muted-foreground mt-1">{event.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skin">
        <Card>
          <CardHeader><CardTitle className="text-base">Skin Check History</CardTitle></CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No skin checks logged yet.</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 20).map(session => {
                  const statusBadge = session.overall_status === 'red'
                    ? <Badge variant="destructive" className="text-xs">Red</Badge>
                    : session.overall_status === 'amber'
                    ? <Badge className="bg-amber-100 text-amber-800 text-xs">Amber</Badge>
                    : <Badge className="bg-green-100 text-green-800 text-xs">Healthy</Badge>;

                  return (
                    <div key={session.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        {statusBadge}
                        <span className="text-xs text-muted-foreground">{formatDateTime(session.event_occurred_at)}</span>
                      </div>
                      {session.notes && <p className="text-muted-foreground mt-1">{session.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
