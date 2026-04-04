/**
 * HealthMonitoringHistory - Timeline of vital sign entries with standard time filter
 * Format aligned with Continence module history
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Thermometer, Heart, Wind, Activity, Edit, UserPlus } from 'lucide-react';
import { useVitalSignEntries, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { getStatusColor, getStatusLabel, calculateVitalStatus, calculateBpStatus, calculateOverallStatus } from '@/utils/vitalSignStatusCalculator';
import { format, formatDistanceToNow, subDays, subMonths, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TIME_FILTERS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '1m', label: 'Last month' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
];

function getFilterDate(filter: string): Date {
  const now = new Date();
  switch (filter) {
    case '24h': return subDays(now, 1);
    case '7d': return subDays(now, 7);
    case '14d': return subDays(now, 14);
    case '1m': return subMonths(now, 1);
    case '6m': return subMonths(now, 6);
    case '12m': return subMonths(now, 12);
    default: return subDays(now, 7);
  }
}

function useStaffNames(userIds: string[]) {
  return useQuery({
    queryKey: ['staff-names', userIds.sort().join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return {} as Record<string, string>;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p) => { map[p.id] = p.full_name || 'Unknown'; });
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

interface HealthMonitoringHistoryProps {
  clientId?: string;
}

export function HealthMonitoringHistory({ clientId }: HealthMonitoringHistoryProps) {
  const [timeFilter, setTimeFilter] = useState('7d');
  const { entries, isLoading } = useVitalSignEntries(clientId, 500);
  const { criteriaMap } = useAlteredCriteria(clientId);

  const filteredEntries = useMemo(() => {
    const cutoff = getFilterDate(timeFilter);
    return entries.filter(e => isAfter(new Date(e.event_occurred_at), cutoff));
  }, [entries, timeFilter]);

  const allStaffIds = useMemo(() => {
    const ids = new Set<string>();
    filteredEntries.forEach(e => { if (e.created_by) ids.add(e.created_by); });
    return Array.from(ids);
  }, [filteredEntries]);
  const { data: staffNames = {} } = useStaffNames(allStaffIds);

  const getActiveCriteria = (vitalType: string) => {
    const criteria = criteriaMap[vitalType as keyof typeof criteriaMap];
    if (criteria?.is_active && criteria?.confirmed_by_medical_professional) {
      return criteria;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-muted rounded" />
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
          <div>
            <CardTitle className="text-lg">Recent Entries</CardTitle>
            <CardDescription>{filteredEntries.length} entries</CardDescription>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredEntries.length === 0 ? (
            <p className="text-muted-foreground">No vital signs recorded in this period.</p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const tempStatus = entry.temperature_celsius != null
                  ? calculateVitalStatus(entry.temperature_celsius, 'temperature', getActiveCriteria('temperature'))
                  : null;
                const bpStatus = calculateBpStatus(
                  entry.bp_systolic ?? null,
                  entry.bp_diastolic ?? null,
                  getActiveCriteria('bp_systolic'),
                  getActiveCriteria('bp_diastolic')
                );
                const o2Status = entry.oxygen_saturation != null
                  ? calculateVitalStatus(entry.oxygen_saturation, 'oxygen', getActiveCriteria('oxygen'))
                  : null;
                const hrStatus = entry.heart_rate != null
                  ? calculateVitalStatus(entry.heart_rate, 'heart_rate', getActiveCriteria('heart_rate'))
                  : null;
                const rrStatus = entry.respiratory_rate != null
                  ? calculateVitalStatus(entry.respiratory_rate, 'respiratory', getActiveCriteria('respiratory'))
                  : null;
                const overallStatus = calculateOverallStatus([tempStatus, bpStatus, o2Status, hrStatus, rrStatus]);

                const loggedByName = entry.created_by ? staffNames[entry.created_by] : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs', getStatusColor(overallStatus))}>
                            {getStatusLabel(overallStatus)}
                          </Badge>
                          {entry.edited_at && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Edit className="h-3 w-3" />
                              Edited
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.event_occurred_at), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Vitals Grid */}
                      <div className="flex flex-wrap gap-2">
                        {entry.temperature_celsius != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Thermometer className="h-3 w-3" />
                            <span className={cn(
                              'font-mono',
                              tempStatus === 'red' && 'text-red-600 font-medium',
                              tempStatus === 'amber' && 'text-amber-600 font-medium',
                            )}>
                              {entry.temperature_celsius}°C
                            </span>
                          </Badge>
                        )}
                        {entry.bp_systolic != null && entry.bp_diastolic != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Heart className="h-3 w-3" />
                            <span className={cn(
                              'font-mono',
                              bpStatus === 'red' && 'text-red-600 font-medium',
                              bpStatus === 'amber' && 'text-amber-600 font-medium',
                            )}>
                              {entry.bp_systolic}/{entry.bp_diastolic}
                            </span>
                          </Badge>
                        )}
                        {entry.oxygen_saturation != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Wind className="h-3 w-3" />
                            <span className={cn(
                              'font-mono',
                              o2Status === 'red' && 'text-red-600 font-medium',
                              o2Status === 'amber' && 'text-amber-600 font-medium',
                            )}>
                              {entry.oxygen_saturation}%
                            </span>
                          </Badge>
                        )}
                        {entry.heart_rate != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Activity className="h-3 w-3" />
                            <span className={cn(
                              'font-mono',
                              hrStatus === 'red' && 'text-red-600 font-medium',
                              hrStatus === 'amber' && 'text-amber-600 font-medium',
                            )}>
                              {entry.heart_rate} bpm
                            </span>
                          </Badge>
                        )}
                        {entry.respiratory_rate != null && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Wind className="h-3 w-3" />
                            <span className={cn(
                              'font-mono',
                              rrStatus === 'red' && 'text-red-600 font-medium',
                              rrStatus === 'amber' && 'text-amber-600 font-medium',
                            )}>
                              {entry.respiratory_rate}/min
                            </span>
                          </Badge>
                        )}
                      </div>

                      {/* Symptoms */}
                      {entry.symptoms && entry.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.symptoms.map((symptom) => (
                            <Badge key={symptom} variant="secondary" className="text-xs">
                              {symptom.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* On behalf badge */}
                      {entry.recorded_on_behalf_of_name && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <UserPlus className="h-3 w-3" />
                          On behalf of {entry.recorded_on_behalf_of_name}
                          {entry.recorded_on_behalf_of_role && ` (${entry.recorded_on_behalf_of_role})`}
                        </Badge>
                      )}

                      {/* Staff attribution */}
                      {loggedByName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Logged by: {loggedByName}
                        </div>
                      )}

                      {/* Notes */}
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.event_occurred_at), 'dd/MM/yy HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
