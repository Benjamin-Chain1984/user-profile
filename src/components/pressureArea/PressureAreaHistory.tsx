/**
 * Pressure Area Prevention History - Events and Skin Checks
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePressureReliefEvents, useSkinChecks } from '@/hooks/usePressureArea';
import { HIGH_RISK_AREAS, SKIN_FINDING_TYPES } from '@/types/pressureArea';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, Eye, User, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

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

                  const markers = (session as any).skin_finding_markers || [];
                  const completedBy = (session as any).created_by_name;

                  return (
                    <div key={session.id} className="border rounded-lg p-3 text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        {statusBadge}
                        <span className="text-xs text-muted-foreground">{formatDateTime(session.event_occurred_at)}</span>
                      </div>

                      {/* Completed by */}
                      {completedBy && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>Completed by: <span className="font-medium text-foreground">{completedBy}</span></span>
                        </div>
                      )}

                      {/* Areas checked detail */}
                      {markers.length > 0 ? (
                        <div className="space-y-1">
                          {/* Findings first */}
                          {markers.filter((m: any) => m.finding_type !== 'ok' && m.finding_type !== 'unable').length > 0 && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">Findings:</p>
                              {markers.filter((m: any) => m.finding_type !== 'ok' && m.finding_type !== 'unable').map((m: any) => {
                                const areaLabel = HIGH_RISK_AREAS.find(a => a.id === m.location)?.label || m.location;
                                const findingLabel = SKIN_FINDING_TYPES.find(t => t.id === m.finding_type)?.label || m.finding_type;
                                return (
                                  <div key={m.id} className="flex items-center gap-2 text-xs pl-2">
                                    {m.severity === 'red' ? (
                                      <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                    )}
                                    <span><span className="font-medium">{areaLabel}</span> — {findingLabel}</span>
                                    {m.notes && <span className="text-muted-foreground">({m.notes})</span>}
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* OK areas */}
                          {markers.filter((m: any) => m.finding_type === 'ok').length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-muted-foreground">Checked OK:</p>
                              <div className="flex flex-wrap gap-1 pl-2">
                                {markers.filter((m: any) => m.finding_type === 'ok').map((m: any) => {
                                  const areaLabel = HIGH_RISK_AREAS.find(a => a.id === m.location)?.label || m.location;
                                  return (
                                    <Badge key={m.id} variant="outline" className="text-[10px] border-green-300 text-green-700 dark:text-green-400 gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {areaLabel}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Unable to check */}
                          {markers.filter((m: any) => m.finding_type === 'unable').length > 0 && (
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-muted-foreground">Unable to check:</p>
                              <div className="flex flex-wrap gap-1 pl-2">
                                {markers.filter((m: any) => m.finding_type === 'unable').map((m: any) => {
                                  const areaLabel = HIGH_RISK_AREAS.find(a => a.id === m.location)?.label || m.location;
                                  return (
                                    <Badge key={m.id} variant="outline" className="text-[10px] gap-1">
                                      <MinusCircle className="h-3 w-3" />
                                      {areaLabel}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Not checked count */}
                          {(() => {
                            const checkedIds = markers.map((m: any) => m.location);
                            const notChecked = HIGH_RISK_AREAS.filter(a => !checkedIds.includes(a.id));
                            if (notChecked.length > 0) {
                              return (
                                <p className="text-[10px] text-muted-foreground pl-2 pt-1">
                                  {notChecked.length} area{notChecked.length !== 1 ? 's' : ''} not assessed: {notChecked.map(a => a.label).join(', ')}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-2">
                          <MinusCircle className="h-3.5 w-3.5" />
                          <span>No areas were assessed in this check</span>
                        </div>
                      )}

                      {session.notes && <p className="text-muted-foreground text-xs mt-1">{session.notes}</p>}
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
