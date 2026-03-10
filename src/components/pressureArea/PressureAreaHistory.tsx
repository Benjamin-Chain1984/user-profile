/**
 * Pressure Area Prevention History - Events and Skin Checks
 * Shows last 5 entries with time-range filters
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePressureReliefEvents, useSkinChecks } from '@/hooks/usePressureArea';
import { HIGH_RISK_AREAS, SKIN_FINDING_TYPES } from '@/types/pressureArea';
import { formatDistanceToNow, subHours, subDays, subMonths, subYears } from 'date-fns';
import { RotateCcw, Eye, User, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

interface Props {
  clientId?: string;
}

const TIME_FILTERS = [
  { label: '24h', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '1 year', value: '1y' },
  { label: 'All', value: 'all' },
] as const;

type TimeFilter = typeof TIME_FILTERS[number]['value'];

function getFilterCutoff(filter: TimeFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case '24h': return subHours(now, 24);
    case '7d': return subDays(now, 7);
    case '30d': return subDays(now, 30);
    case '1y': return subYears(now, 1);
    case 'all': return null;
  }
}

function formatDateTime(val: string): string {
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const DISPLAY_LIMIT = 5;

export function PressureAreaHistory({ clientId }: Props) {
  const { events } = usePressureReliefEvents(clientId);
  const { sessions } = useSkinChecks(clientId);
  const [reliefFilter, setReliefFilter] = useState<TimeFilter>('24h');
  const [skinFilter, setSkinFilter] = useState<TimeFilter>('24h');
  const [reliefShowAll, setReliefShowAll] = useState(false);
  const [skinShowAll, setSkinShowAll] = useState(false);

  const filteredEvents = useMemo(() => {
    const cutoff = getFilterCutoff(reliefFilter);
    const filtered = cutoff
      ? events.filter(e => new Date(e.event_occurred_at) >= cutoff)
      : events;
    return filtered;
  }, [events, reliefFilter]);

  const filteredSessions = useMemo(() => {
    const cutoff = getFilterCutoff(skinFilter);
    const filtered = cutoff
      ? sessions.filter(s => new Date(s.event_occurred_at) >= cutoff)
      : sessions;
    return filtered;
  }, [sessions, skinFilter]);

  const displayedEvents = reliefShowAll ? filteredEvents : filteredEvents.slice(0, DISPLAY_LIMIT);
  const displayedSessions = skinShowAll ? filteredSessions : filteredSessions.slice(0, DISPLAY_LIMIT);

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
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base">Pressure Relief Events</CardTitle>
              <div className="flex gap-1 flex-wrap">
                {TIME_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={reliefFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => { setReliefFilter(f.value); setReliefShowAll(false); }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No events in this period.</p>
            ) : (
              <div className="space-y-3">
                {displayedEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{event.position_completed}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(event.event_occurred_at)}</span>
                    </div>
                    {(event as any).created_by_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Logged by: <span className="font-medium text-foreground">{(event as any).created_by_name}</span></span>
                      </div>
                    )}
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

                {!reliefShowAll && filteredEvents.length > DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setReliefShowAll(true)}
                  >
                    Show all {filteredEvents.length} events
                  </Button>
                )}
                {reliefShowAll && filteredEvents.length > DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setReliefShowAll(false)}
                  >
                    Show less
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skin">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base">Skin Check History</CardTitle>
              <div className="flex gap-1 flex-wrap">
                {TIME_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={skinFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => { setSkinFilter(f.value); setSkinShowAll(false); }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No skin checks in this period.</p>
            ) : (
              <div className="space-y-3">
                {displayedSessions.map(session => {
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

                      {completedBy && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>Completed by: <span className="font-medium text-foreground">{completedBy}</span></span>
                        </div>
                      )}

                      {markers.length > 0 ? (
                        <div className="space-y-1">
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

                {!skinShowAll && filteredSessions.length > DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setSkinShowAll(true)}
                  >
                    Show all {filteredSessions.length} checks
                  </Button>
                )}
                {skinShowAll && filteredSessions.length > DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setSkinShowAll(false)}
                  >
                    Show less
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
