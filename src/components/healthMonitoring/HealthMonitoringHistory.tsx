/**
 * HealthMonitoringHistory - Timeline of vital sign entries
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ChevronRight, User, Thermometer, Heart, Wind, Activity, Edit } from 'lucide-react';
import { useVitalSignEntries, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { VITAL_THRESHOLDS } from '@/types/healthMonitoring';
import { getStatusColor, getStatusLabel, calculateVitalStatus, calculateBpStatus, calculateOverallStatus } from '@/utils/vitalSignStatusCalculator';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HealthMonitoringHistoryProps {
  clientId?: string;
}

export function HealthMonitoringHistory({ clientId }: HealthMonitoringHistoryProps) {
  const { entries, isLoading } = useVitalSignEntries(clientId, 20);
  const { criteriaMap } = useAlteredCriteria(clientId);

  // Helper to get active criteria for a vital type
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Entries
          </CardTitle>
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
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No vital signs recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                // Recalculate statuses using altered criteria (priority) or defaults
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

                return (
                <div
                  key={entry.id}
                  className={cn(
                    'p-3 rounded-lg border-l-4 bg-card border',
                    overallStatus === 'red' && 'border-l-red-500',
                    overallStatus === 'amber' && 'border-l-amber-500',
                    overallStatus === 'ideal' && 'border-l-green-500',
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.event_occurred_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    {entry.temperature_celsius && (
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          'font-mono',
                          tempStatus === 'red' && 'text-red-600 font-medium',
                          tempStatus === 'amber' && 'text-amber-600 font-medium',
                        )}>
                          {entry.temperature_celsius}°C
                        </span>
                      </div>
                    )}
                    {entry.bp_systolic && entry.bp_diastolic && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          'font-mono',
                          bpStatus === 'red' && 'text-red-600 font-medium',
                          bpStatus === 'amber' && 'text-amber-600 font-medium',
                        )}>
                          {entry.bp_systolic}/{entry.bp_diastolic}
                        </span>
                      </div>
                    )}
                    {entry.oxygen_saturation && (
                      <div className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          'font-mono',
                          o2Status === 'red' && 'text-red-600 font-medium',
                          o2Status === 'amber' && 'text-amber-600 font-medium',
                        )}>
                          {entry.oxygen_saturation}%
                        </span>
                      </div>
                    )}
                    {entry.heart_rate && (
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          'font-mono',
                          hrStatus === 'red' && 'text-red-600 font-medium',
                          hrStatus === 'amber' && 'text-amber-600 font-medium',
                        )}>
                          {entry.heart_rate} bpm
                        </span>
                      </div>
                    )}
                    {entry.respiratory_rate && (
                      <div className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                          'font-mono',
                          rrStatus === 'red' && 'text-red-600 font-medium',
                          rrStatus === 'amber' && 'text-amber-600 font-medium',
                        )}>
                          {entry.respiratory_rate}/min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  {entry.symptoms && entry.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.symptoms.map((symptom) => (
                        <Badge key={symptom} variant="secondary" className="text-xs">
                          {symptom.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground italic truncate">
                      {entry.notes}
                    </p>
                  )}

                  {/* On behalf attribution */}
                  {entry.recorded_on_behalf_of_name && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      Recorded by {entry.recorded_on_behalf_of_name}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-[10px] text-muted-foreground mt-2">
                    {format(new Date(entry.event_occurred_at), 'PPpp')}
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
