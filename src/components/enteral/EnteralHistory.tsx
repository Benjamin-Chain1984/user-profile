/**
 * Enteral Nutrition History - Feed logs, flush logs, medication logs, and stoma checks
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnteralFeedLogs, useEnteralMedicationLogs, useEnteralStomaChecks, useEnteralFlushLogs } from '@/hooks/useEnteral';
import { format, subHours, subDays, subMonths, subYears } from 'date-fns';
import { Apple, Pill, CheckCircle2, User, Droplets } from 'lucide-react';

const DISPLAY_LIMIT = 5;

const TIME_FILTERS = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '1y', value: '1y' },
  { label: 'All', value: 'all' },
] as const;

const FLUSH_REASON_LABELS: Record<string, string> = {
  flush_before_feed: 'Before Feed',
  flush_after_feed: 'After Feed',
  flush_before_medication: 'Before Medication',
  flush_after_medication: 'After Medication',
  routine_flush: 'Routine Flush',
  extra_hydration: 'Extra Hydration',
  tube_blocked: 'Tube Blocked',
};

function getFilterCutoff(filter: string): Date | null {
  const now = new Date();
  switch (filter) {
    case '24h': return subHours(now, 24);
    case '7d': return subDays(now, 7);
    case '30d': return subMonths(now, 1);
    case '1y': return subYears(now, 1);
    default: return null;
  }
}

interface EnteralHistoryProps {
  clientId?: string;
}

export function EnteralHistory({ clientId }: EnteralHistoryProps) {
  const { data: feedLogs = [] } = useEnteralFeedLogs(clientId);
  const { data: medLogs = [] } = useEnteralMedicationLogs(clientId);
  const { data: stomaChecks = [] } = useEnteralStomaChecks(clientId);
  const { data: flushLogs = [] } = useEnteralFlushLogs(clientId);

  const [activityFilter, setActivityFilter] = useState('7d');
  const [activityShowAll, setActivityShowAll] = useState(false);
  const [stomaFilter, setStomaFilter] = useState('7d');
  const [stomaShowAll, setStomaShowAll] = useState(false);

  // Combine feeds and flushes into a single chronological list
  const combinedActivity = useMemo(() => {
    const feedItems = feedLogs.map(log => ({ ...log, _type: 'feed' as const }));
    // Exclude feed-related flushes (flush_before_feed, flush_after_feed) since
    // those volumes are already displayed within the feed entry itself
    const flushItems = flushLogs
      .filter((log: any) => {
        const reason = log.flush_reason || '';
        return reason !== 'flush_before_feed' && reason !== 'flush_after_feed';
      })
      .map((log: any) => ({ ...log, _type: 'flush' as const }));
    return [...feedItems, ...flushItems].sort(
      (a, b) => new Date(b.event_occurred_at).getTime() - new Date(a.event_occurred_at).getTime()
    );
  }, [feedLogs, flushLogs]);

  const filteredActivity = useMemo(() => {
    const cutoff = getFilterCutoff(activityFilter);
    return cutoff ? combinedActivity.filter(e => new Date(e.event_occurred_at) >= cutoff) : combinedActivity;
  }, [combinedActivity, activityFilter]);

  const displayedActivity = activityShowAll ? filteredActivity : filteredActivity.slice(0, DISPLAY_LIMIT);

  const filteredStoma = useMemo(() => {
    const cutoff = getFilterCutoff(stomaFilter);
    return cutoff ? stomaChecks.filter(e => new Date(e.event_occurred_at) >= cutoff) : stomaChecks;
  }, [stomaChecks, stomaFilter]);

  const displayedStoma = stomaShowAll ? filteredStoma : filteredStoma.slice(0, DISPLAY_LIMIT);

  return (
    <Tabs defaultValue="activity" className="space-y-4">
      <TabsList>
        <TabsTrigger value="activity" className="gap-2">
          <Apple className="h-4 w-4" /> Feeds & Flushes
        </TabsTrigger>
        <TabsTrigger value="medications" className="gap-2">
          <Pill className="h-4 w-4" /> Medications
        </TabsTrigger>
        <TabsTrigger value="stoma" className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Stoma
        </TabsTrigger>
      </TabsList>

      {/* Feeds & Flushes combined */}
      <TabsContent value="activity">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Feed & Flush Log</CardTitle>
              <div className="flex gap-1">
                {TIME_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={activityFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => { setActivityFilter(f.value); setActivityShowAll(false); }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayedActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No feed or flush entries found.</p>
            ) : (
              displayedActivity.map((entry: any) => {
                if (entry._type === 'feed') {
                  return (
                    <div key={`feed-${entry.id}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Apple className="h-3.5 w-3.5 text-amber-600" />
                          {entry.feed_volume_ml}ml feed + {entry.flush_given_ml}ml flush
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.event_occurred_at), 'dd/MM/yy HH:mm')}
                          {entry.method && ` • ${entry.method}`}
                          {entry.scheduled_time && ` • Sched: ${entry.scheduled_time}`}
                        </div>
                        {entry.staff_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <User className="h-3 w-3" />
                            <span>{entry.staff_name}</span>
                          </div>
                        )}
                      </div>
                      {entry.position_confirmed && (
                        <Badge variant="outline" className="text-xs">✓ Position</Badge>
                      )}
                    </div>
                  );
                }
                // Flush entry
                return (
                  <div key={`flush-${entry.id}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" />
                        {entry.flush_volume_ml}ml flush
                        {entry.flush_reason && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {FLUSH_REASON_LABELS[entry.flush_reason] || entry.flush_reason.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.event_occurred_at), 'dd/MM/yy HH:mm')}
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</div>
                      )}
                      {entry.staff_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <User className="h-3 w-3" />
                          <span>{entry.staff_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {filteredActivity.length > DISPLAY_LIMIT && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setActivityShowAll(!activityShowAll)}
              >
                {activityShowAll ? 'Show less' : `Show all (${filteredActivity.length})`}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Medications */}
      <TabsContent value="medications">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Medication Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {medLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No medication entries found.</p>
            ) : (
              medLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{log.medication_name} — {log.dose}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.event_occurred_at), 'dd/MM/yy HH:mm')}
                      {' • Flush: '}{log.flush_before_ml + log.flush_after_ml}ml
                    </div>
                    {(log as any).staff_name && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <User className="h-3 w-3" />
                        <span>{(log as any).staff_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Stoma Checks */}
      <TabsContent value="stoma">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Stoma Checks</CardTitle>
              <div className="flex gap-1">
                {TIME_FILTERS.map(f => (
                  <Button
                    key={f.value}
                    variant={stomaFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => { setStomaFilter(f.value); setStomaShowAll(false); }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayedStoma.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No stoma checks found.</p>
            ) : (
              displayedStoma.map(check => (
                <div key={check.id} className={`p-3 rounded-lg border ${
                  check.status_level === 'red' ? 'border-destructive/50 bg-destructive/5' :
                  check.status_level === 'amber' ? 'border-warning/50 bg-warning/5' :
                  'bg-muted/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {(check.findings as string[]).join(', ') || 'No findings'}
                    </div>
                    <Badge variant={check.status_level === 'red' ? 'destructive' : check.status_level === 'amber' ? 'outline' : 'secondary'} className="text-xs">
                      {check.status_level?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(check.event_occurred_at), 'dd/MM/yy HH:mm')}
                    {check.pain_level !== 'none' && ` • Pain: ${check.pain_level}`}
                    {check.escalation_type && ` • ${check.escalation_type}`}
                  </div>
                  {(check as any).staff_name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <User className="h-3 w-3" />
                      <span>{(check as any).staff_name}</span>
                    </div>
                  )}
                </div>
              ))
            )}
            {filteredStoma.length > DISPLAY_LIMIT && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setStomaShowAll(!stomaShowAll)}
              >
                {stomaShowAll ? 'Show less' : `Show all (${filteredStoma.length})`}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}