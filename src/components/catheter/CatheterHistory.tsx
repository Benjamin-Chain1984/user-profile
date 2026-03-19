/**
 * Catheter History - View all catheter-related logs
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCatheterChanges,
  useFlushLogs,
  useStomaChecks,
  useBagChanges,
  useCatheterConfig,
} from '@/hooks/useCatheter';
import {
  CATHETER_TYPES,
  CHANGE_REASONS,
  BAG_TYPES,
  BAG_CHANGE_REASONS,
  BAG_CONDITIONS,
  STOMA_CONDITIONS,
  STOMA_FINDINGS,
  STOMA_PAIN_LEVELS,
  STOMA_DRESSING_OPTIONS,
  CATHETER_TYPE_CONFIG,
} from '@/types/catheter';
import { format, parseISO } from 'date-fns';
import { User } from 'lucide-react';

const getStaffName = (entry: any): string | null => {
  if (entry.profiles?.full_name) return entry.profiles.full_name;
  return null;
};

function StaffAttribution({ entry }: { entry: any }) {
  const name = getStaffName(entry);
  if (!name) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <User className="h-3 w-3" />
      <span>Logged by {name}</span>
    </div>
  );
}

interface CatheterHistoryProps {
  clientId?: string;
}

export function CatheterHistory({ clientId }: CatheterHistoryProps) {
  const { config } = useCatheterConfig(clientId);
  const { changes, loading: changesLoading } = useCatheterChanges(clientId);
  const { logs: flushLogs, loading: flushLoading } = useFlushLogs(clientId);
  const { checks: stomaChecks, loading: stomaLoading } = useStomaChecks(clientId);
  const { changes: bagChanges, loading: bagLoading } = useBagChanges(clientId);

  const typeConfig = config?.catheter_type ? CATHETER_TYPE_CONFIG[config.catheter_type] : null;

  const getLabel = (value: string, options: { value: string; label: string }[]) =>
    options.find((o) => o.value === value)?.label || value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="changes" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="changes">Catheter Changes</TabsTrigger>
            {typeConfig?.enableFlushTracking && <TabsTrigger value="flushes">Flushes</TabsTrigger>}
            {typeConfig?.enableStomaChecks && <TabsTrigger value="stoma">Stoma Checks</TabsTrigger>}
            {config?.bag_types && config.bag_types.length > 0 && (
              <TabsTrigger value="bags">Bag Changes</TabsTrigger>
            )}
          </TabsList>

          {/* Catheter Changes */}
          <TabsContent value="changes">
            {changesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : changes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No catheter changes logged yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {changes.map((change) => (
                    <div key={change.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getLabel(change.catheter_type, CATHETER_TYPES)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(change.event_occurred_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getLabel(change.change_reason, CHANGE_REASONS)}
                        </Badge>
                        {change.catheter_size && (
                          <Badge variant="secondary">{change.catheter_size}</Badge>
                        )}
                      </div>
                      {change.notes && (
                        <p className="text-sm text-muted-foreground">{change.notes}</p>
                      )}
                      <StaffAttribution entry={change} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Flushes */}
          <TabsContent value="flushes">
            {flushLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : flushLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No flushes logged yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {flushLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Catheter Flush</span>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(log.event_occurred_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.flush_solution}</Badge>
                        {log.flush_volume_ml && (
                          <Badge variant="secondary">{log.flush_volume_ml}ml</Badge>
                        )}
                      </div>
                      {log.output_description && (
                        <p className="text-sm text-muted-foreground">{log.output_description}</p>
                      )}
                      <StaffAttribution entry={log} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Stoma Checks */}
          <TabsContent value="stoma">
            {stomaLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stomaChecks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No stoma checks logged yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {stomaChecks.map((check) => {
                    const checkFindings = (check.findings as string[]) || [];
                    const statusColor = check.status_level === 'red' ? 'destructive' :
                      check.status_level === 'amber' ? 'secondary' : 'default';
                    return (
                      <div key={check.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Stoma Check</span>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(check.event_occurred_at), 'dd MMM yyyy, HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusColor}>
                            {check.status_level === 'red' ? 'Action Required' :
                              check.status_level === 'amber' ? 'Monitor' : 'IDEAL'}
                          </Badge>
                          {check.pain_level && check.pain_level !== 'none' && (
                            <Badge variant="outline">
                              {getLabel(check.pain_level, STOMA_PAIN_LEVELS)}
                            </Badge>
                          )}
                          {check.escalated_to_clinician && (
                            <Badge variant="outline" className="text-amber-600">
                              Escalated
                            </Badge>
                          )}
                        </div>
                        {checkFindings.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {checkFindings.map(f => (
                              <Badge key={f} variant="outline" className="text-xs">
                                {getLabel(f, STOMA_FINDINGS)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {check.notes && (
                          <p className="text-sm text-muted-foreground">{check.notes}</p>
                        )}
                        <StaffAttribution entry={check} />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Bag Changes */}
          <TabsContent value="bags">
            {bagLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bagChanges.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No bag changes logged yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {bagChanges.map((change) => (
                    <div key={change.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getLabel(change.bag_type, BAG_TYPES)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(change.event_occurred_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {getLabel(change.change_reason, BAG_CHANGE_REASONS)}
                        </Badge>
                        {change.condition && (
                          <Badge variant="secondary">
                            {getLabel(change.condition, BAG_CONDITIONS)}
                          </Badge>
                        )}
                        {change.tubing_changed && (
                          <Badge variant="secondary">Tubing changed</Badge>
                        )}
                      </div>
                      {change.notes && (
                        <p className="text-sm text-muted-foreground">{change.notes}</p>
                      )}
                      <StaffAttribution entry={change} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
