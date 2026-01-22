/**
 * Bowel Care History - Log entries timeline
 */

import { useBowelLogs } from '@/hooks/useBowelCare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { BRISTOL_TYPES, STOOL_SIZES } from '@/types/bowelCare';
import { Clock, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoolIllustration } from './StoolIllustration';

interface BowelCareHistoryProps {
  clientId: string;
}

export function BowelCareHistory({ clientId }: BowelCareHistoryProps) {
  const { logs, isLoading } = useBowelLogs(clientId, 30);

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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Bowel Care Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No entries recorded yet</p>
            <p className="text-sm mt-1">Log a bowel entry to start tracking</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => {
                const bristolInfo = BRISTOL_TYPES.find(b => b.type === log.bristol_type);
                const sizeInfo = STOOL_SIZES.find(s => s.value === log.stool_size);
                const isNoMovement = log.bristol_type === 0;
                const isConstipation = log.bristol_type >= 1 && log.bristol_type <= 2;
                const isNormal = log.bristol_type >= 3 && log.bristol_type <= 5;
                const isDiarrhoea = log.bristol_type >= 6 && log.bristol_type <= 7;

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
                            {format(new Date(log.entry_time), 'EEE, d MMM yyyy • HH:mm')}
                          </div>
                          {!isNoMovement && sizeInfo && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Size: {sizeInfo.label} ({sizeInfo.description})
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {log.observed_status === 'observed' && 'Observed'}
                          {log.observed_status === 'self_reported' && 'Self-reported'}
                          {log.observed_status === 'not_observed' && 'Not observed'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(log.entry_time), { addSuffix: true })}
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
