/**
 * Bowel Care History - Log entries timeline
 * Shows "Recorded on Behalf Of" attribution when applicable
 */

import { useState, useMemo } from 'react';
import { useBowelLogs } from '@/hooks/useBowelCare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow, subHours, subDays, subMonths, isAfter } from 'date-fns';
import { BRISTOL_TYPES, STOOL_SIZES, STAFF_ROLES, ON_BEHALF_REASONS } from '@/types/bowelCare';
import { Clock, Edit, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoolIllustration } from './StoolIllustration';

const TIME_RANGES = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '14d', label: '2 weeks' },
  { value: '1m', label: '1 month' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
];

function getCutoffDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case '24h': return subHours(now, 24);
    case '7d': return subDays(now, 7);
    case '14d': return subDays(now, 14);
    case '1m': return subMonths(now, 1);
    case '6m': return subMonths(now, 6);
    case '12m': return subMonths(now, 12);
    default: return subDays(now, 7);
  }
}

interface BowelCareHistoryProps {
  clientId: string;
}

export function BowelCareHistory({ clientId }: BowelCareHistoryProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const { logs, isLoading } = useBowelLogs(clientId, 500);

  const filteredLogs = useMemo(() => {
    const cutoff = getCutoffDate(timeRange);
    return logs.filter(log => {
      const eventTime = log.event_occurred_at || log.entry_time;
      return isAfter(new Date(eventTime), cutoff);
    });
  }, [logs, timeRange]);

  const getRoleLabel = (role: string | null) => {
    if (!role) return null;
    return STAFF_ROLES.find(r => r.value === role)?.label || role;
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return null;
    return ON_BEHALF_REASONS.find(r => r.value === reason)?.label || reason;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bowel Care Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bowel Care Timeline
          </CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{filteredLogs.length} entries</p>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No entries in selected period</p>
            <p className="text-sm mt-1">Try a longer time range</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const bristolInfo = BRISTOL_TYPES.find(b => b.type === log.bristol_type);
                const sizeInfo = STOOL_SIZES.find(s => s.value === log.stool_size);
                const isNoMovement = log.bristol_type === 0;
                const isConstipation = log.bristol_type >= 1 && log.bristol_type <= 2;
                const isNormal = log.bristol_type >= 3 && log.bristol_type <= 5;
                const isDiarrhoea = log.bristol_type >= 6 && log.bristol_type <= 7;
                const isOnBehalfOf = !!log.recorded_on_behalf_of_name;
                const eventTime = log.event_occurred_at || log.entry_time;

                return (
                  <div
                    key={log.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      isNoMovement && 'bg-muted/50 border-muted',
                      isConstipation && 'bg-amber-50 border-amber-200',
                      isNormal && 'bg-green-50 border-green-200',
                      isDiarrhoea && 'bg-orange-50 border-orange-200',
                    )}
                  >
                    {/* On Behalf Of indicator */}
                    {isOnBehalfOf && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                        <Users className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800">
                          <span className="font-medium">On behalf of:</span>{' '}
                          {log.recorded_on_behalf_of_name}
                          {log.recorded_on_behalf_of_role && (
                            <span className="text-blue-600"> ({getRoleLabel(log.recorded_on_behalf_of_role)})</span>
                          )}
                          {log.recorded_on_behalf_of_reason && (
                            <span className="block text-blue-600 mt-0.5">
                              Reason: {getReasonLabel(log.recorded_on_behalf_of_reason)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-14 h-10 rounded-lg flex items-center justify-center p-1',
                          isNoMovement && 'bg-slate-100',
                          isConstipation && 'bg-amber-50',
                          isNormal && 'bg-green-50',
                          isDiarrhoea && 'bg-orange-50',
                        )}>
                          <StoolIllustration type={log.bristol_type} />
                        </div>
                        <div>
                          <div className="font-medium">
                            {bristolInfo?.name || `Type ${log.bristol_type}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(eventTime), 'EEE, d MMM yyyy • HH:mm')}
                          </div>
                          {!isNoMovement && sizeInfo && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Size: {sizeInfo.label} ({sizeInfo.description})
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Badge variant="outline" className="text-xs">
                            {log.observed_status === 'observed' && 'Observed'}
                            {log.observed_status === 'self_reported' && 'Self-reported'}
                            {log.observed_status === 'not_observed' && 'Not observed'}
                          </Badge>
                          {isOnBehalfOf && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              <Users className="h-3 w-3 mr-1" />
                              On behalf
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(eventTime), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Indicators */}
                    {log.indicators && Object.keys(log.indicators).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(log.indicators as Record<string, unknown>).straining && (
                          <Badge variant="secondary" className="text-xs">Straining</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).mucus && (
                          <Badge variant="secondary" className="text-xs">Mucus</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).bloating && (
                          <Badge variant="secondary" className="text-xs">Bloating</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).vomiting && (
                          <Badge variant="destructive" className="text-xs">Vomiting</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).blood && (log.indicators as Record<string, unknown>).blood !== 'none' && (
                          <Badge variant="destructive" className="text-xs">Blood: {String((log.indicators as Record<string, unknown>).blood).replace('_', ' ')}</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).pain && (log.indicators as Record<string, unknown>).pain !== 'none' && (
                          <Badge variant="secondary" className="text-xs">Pain: {String((log.indicators as Record<string, unknown>).pain)}</Badge>
                        )}
                        {(log.indicators as Record<string, unknown>).abdominal_pain && (log.indicators as Record<string, unknown>).abdominal_pain !== 'none' && (
                          <Badge variant="secondary" className="text-xs">Abdominal pain: {String((log.indicators as Record<string, unknown>).abdominal_pain)}</Badge>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        "{log.notes}"
                      </p>
                    )}

                    {/* Edit indicator */}
                    {log.edited_at && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Edit className="h-3 w-3" />
                        <span>Edited {formatDistanceToNow(new Date(log.edited_at), { addSuffix: true })}</span>
                        {log.edit_reason && <span>– {log.edit_reason}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
