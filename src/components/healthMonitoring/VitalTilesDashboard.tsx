/**
 * VitalTilesDashboard - Grid of traffic-light vital sign tiles
 * 
 * IMPORTANT: This component respects Altered Criteria when enabled.
 * Once altered criteria is active and confirmed, it becomes the authoritative source for status calculation.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VitalTile, BloodPressureTile } from './VitalTile';
import { useVitalSignEntries, useVitalSignConfig, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { calculateBpStatus, calculateVitalStatus } from '@/utils/vitalSignStatusCalculator';
import type { VitalType, VitalStatus } from '@/types/healthMonitoring';
import { Activity, AlertTriangle, HelpCircle } from 'lucide-react';

interface VitalTilesDashboardProps {
  clientId?: string;
  onVitalClick?: (vitalType: VitalType) => void;
}

export function VitalTilesDashboard({ clientId, onVitalClick }: VitalTilesDashboardProps) {
  const { entries } = useVitalSignEntries(clientId, 20);
  const { config } = useVitalSignConfig(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);

  // Check if any altered criteria is active
  const hasActiveAlteredCriteria = useMemo(() => {
    return Object.values(criteriaMap).some(
      c => c?.is_active && c?.confirmed_by_medical_professional
    );
  }, [criteriaMap]);

  // Calculate latest values and trends with REAL-TIME status calculation using altered criteria
  const vitalData = useMemo(() => {
    const latest = entries[0];
    const previous = entries[1];

    const calculateTrend = (current: number | null, prev: number | null): 'up' | 'down' | 'stable' | null => {
      if (current === null || prev === null) return null;
      const diff = current - prev;
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    // Get active altered criteria for each vital type
    const getActiveCriteria = (vitalType: VitalType) => {
      const criteria = criteriaMap[vitalType];
      if (criteria?.is_active && criteria?.confirmed_by_medical_professional) {
        return criteria;
      }
      return null;
    };

    // Calculate temperature status using altered criteria if active
    const temperatureCriteria = getActiveCriteria('temperature');
    const temperatureStatus = latest?.temperature_celsius !== null && latest?.temperature_celsius !== undefined
      ? calculateVitalStatus(latest.temperature_celsius, 'temperature', temperatureCriteria)
      : null;

    // Calculate BP status using altered criteria if active (worst wins)
    const bpSystolicCriteria = getActiveCriteria('bp_systolic');
    const bpDiastolicCriteria = getActiveCriteria('bp_diastolic');
    const bpStatus = calculateBpStatus(
      latest?.bp_systolic ?? null,
      latest?.bp_diastolic ?? null,
      bpSystolicCriteria,
      bpDiastolicCriteria
    );

    // Calculate oxygen status using altered criteria if active
    const oxygenCriteria = getActiveCriteria('oxygen');
    const oxygenStatus = latest?.oxygen_saturation !== null && latest?.oxygen_saturation !== undefined
      ? calculateVitalStatus(latest.oxygen_saturation, 'oxygen', oxygenCriteria)
      : null;

    // Calculate heart rate status using altered criteria if active
    const heartRateCriteria = getActiveCriteria('heart_rate');
    const heartRateStatus = latest?.heart_rate !== null && latest?.heart_rate !== undefined
      ? calculateVitalStatus(latest.heart_rate, 'heart_rate', heartRateCriteria)
      : null;

    // Calculate respiratory status using altered criteria if active
    const respiratoryCriteria = getActiveCriteria('respiratory');
    const respiratoryStatus = latest?.respiratory_rate !== null && latest?.respiratory_rate !== undefined
      ? calculateVitalStatus(latest.respiratory_rate, 'respiratory', respiratoryCriteria)
      : null;

    return {
      temperature: {
        value: latest?.temperature_celsius ?? null,
        status: temperatureStatus,
        trend: calculateTrend(latest?.temperature_celsius ?? null, previous?.temperature_celsius ?? null),
        lastRecordedAt: latest?.event_occurred_at,
        isAltered: !!temperatureCriteria,
      },
      bp: {
        systolic: latest?.bp_systolic ?? null,
        diastolic: latest?.bp_diastolic ?? null,
        status: bpStatus,
        trend: calculateTrend(latest?.bp_systolic ?? null, previous?.bp_systolic ?? null),
        lastRecordedAt: latest?.event_occurred_at,
        isAltered: !!(bpSystolicCriteria || bpDiastolicCriteria),
      },
      oxygen: {
        value: latest?.oxygen_saturation ?? null,
        status: oxygenStatus,
        trend: calculateTrend(latest?.oxygen_saturation ?? null, previous?.oxygen_saturation ?? null),
        lastRecordedAt: latest?.event_occurred_at,
        isAltered: !!oxygenCriteria,
      },
      heart_rate: {
        value: latest?.heart_rate ?? null,
        status: heartRateStatus,
        trend: calculateTrend(latest?.heart_rate ?? null, previous?.heart_rate ?? null),
        lastRecordedAt: latest?.event_occurred_at,
        isAltered: !!heartRateCriteria,
      },
      respiratory: {
        value: latest?.respiratory_rate ?? null,
        status: respiratoryStatus,
        trend: calculateTrend(latest?.respiratory_rate ?? null, previous?.respiratory_rate ?? null),
        lastRecordedAt: latest?.event_occurred_at,
        isAltered: !!respiratoryCriteria,
      },
    };
  }, [entries, criteriaMap]);

  // Get overall status for header
  const overallStatus = useMemo(() => {
    const statuses = [
      vitalData.temperature.status,
      vitalData.bp.status,
      vitalData.oxygen.status,
      vitalData.heart_rate.status,
      vitalData.respiratory.status,
    ].filter(Boolean) as VitalStatus[];

    if (statuses.length === 0) return null;
    if (statuses.includes('red')) return 'red';
    if (statuses.includes('amber')) return 'amber';
    return 'ideal';
  }, [vitalData]);

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'red': return 'Action Needed';
      case 'amber': return 'Attention Required';
      case 'ideal': return 'All Systems IDEAL';
      default: return 'No Data';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'red': return 'text-red-600';
      case 'amber': return 'text-amber-600';
      case 'ideal': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveAlteredCriteria && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700 cursor-help gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Altered Criteria
                      <HelpCircle className="h-3 w-3 opacity-60" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
                    <p>A reading that is different from the person's usual normal, based on limits set by their doctor or specialist.</p>
                    <p className="mt-1 font-medium">👉 Compare to the person's approved baseline, not standard numbers.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Temperature */}
          {config.temperature_enabled && (
            <VitalTile
              vitalType="temperature"
              value={vitalData.temperature.value}
              status={vitalData.temperature.status}
              lastRecordedAt={vitalData.temperature.lastRecordedAt}
              trend={vitalData.temperature.trend}
              hasAlteredCriteria={!!criteriaMap['temperature']?.approved_at}
              onClick={() => onVitalClick?.('temperature')}
            />
          )}

          {/* Blood Pressure */}
          {config.bp_enabled && (
            <BloodPressureTile
              systolic={vitalData.bp.systolic}
              diastolic={vitalData.bp.diastolic}
              status={vitalData.bp.status}
              lastRecordedAt={vitalData.bp.lastRecordedAt}
              trend={vitalData.bp.trend}
              hasAlteredCriteria={!!criteriaMap['bp_systolic']?.approved_at || !!criteriaMap['bp_diastolic']?.approved_at}
              onClick={() => onVitalClick?.('bp_systolic')}
            />
          )}

          {/* Oxygen */}
          {config.oxygen_enabled && (
            <VitalTile
              vitalType="oxygen"
              value={vitalData.oxygen.value}
              status={vitalData.oxygen.status}
              lastRecordedAt={vitalData.oxygen.lastRecordedAt}
              trend={vitalData.oxygen.trend}
              hasAlteredCriteria={!!criteriaMap['oxygen']?.approved_at}
              onClick={() => onVitalClick?.('oxygen')}
            />
          )}

          {/* Heart Rate */}
          {config.heart_rate_enabled && (
            <VitalTile
              vitalType="heart_rate"
              value={vitalData.heart_rate.value}
              status={vitalData.heart_rate.status}
              lastRecordedAt={vitalData.heart_rate.lastRecordedAt}
              trend={vitalData.heart_rate.trend}
              hasAlteredCriteria={!!criteriaMap['heart_rate']?.approved_at}
              onClick={() => onVitalClick?.('heart_rate')}
            />
          )}

          {/* Respiratory */}
          {config.respiratory_enabled && (
            <VitalTile
              vitalType="respiratory"
              value={vitalData.respiratory.value}
              status={vitalData.respiratory.status}
              lastRecordedAt={vitalData.respiratory.lastRecordedAt}
              trend={vitalData.respiratory.trend}
              onClick={() => onVitalClick?.('respiratory')}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
