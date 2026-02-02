/**
 * VitalTilesDashboard - Grid of traffic-light vital sign tiles
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VitalTile, BloodPressureTile } from './VitalTile';
import { useVitalSignEntries, useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { calculateBpStatus, calculateVitalStatus } from '@/utils/vitalSignStatusCalculator';
import type { VitalType, VitalStatus } from '@/types/healthMonitoring';
import { Activity } from 'lucide-react';

interface VitalTilesDashboardProps {
  clientId?: string;
  onVitalClick?: (vitalType: VitalType) => void;
}

export function VitalTilesDashboard({ clientId, onVitalClick }: VitalTilesDashboardProps) {
  const { entries } = useVitalSignEntries(clientId, 20);
  const { config } = useVitalSignConfig(clientId);

  // Calculate latest values and trends
  const vitalData = useMemo(() => {
    const latest = entries[0];
    const previous = entries[1];

    const calculateTrend = (current: number | null, prev: number | null): 'up' | 'down' | 'stable' | null => {
      if (current === null || prev === null) return null;
      const diff = current - prev;
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    return {
      temperature: {
        value: latest?.temperature_celsius ?? null,
        status: latest?.temperature_status as VitalStatus | null,
        trend: calculateTrend(latest?.temperature_celsius ?? null, previous?.temperature_celsius ?? null),
        lastRecordedAt: latest?.event_occurred_at,
      },
      bp: {
        systolic: latest?.bp_systolic ?? null,
        diastolic: latest?.bp_diastolic ?? null,
        status: latest?.bp_status as VitalStatus | null,
        trend: calculateTrend(latest?.bp_systolic ?? null, previous?.bp_systolic ?? null),
        lastRecordedAt: latest?.event_occurred_at,
      },
      oxygen: {
        value: latest?.oxygen_saturation ?? null,
        status: latest?.oxygen_status as VitalStatus | null,
        trend: calculateTrend(latest?.oxygen_saturation ?? null, previous?.oxygen_saturation ?? null),
        lastRecordedAt: latest?.event_occurred_at,
      },
      heart_rate: {
        value: latest?.heart_rate ?? null,
        status: latest?.heart_rate_status as VitalStatus | null,
        trend: calculateTrend(latest?.heart_rate ?? null, previous?.heart_rate ?? null),
        lastRecordedAt: latest?.event_occurred_at,
      },
      respiratory: {
        value: latest?.respiratory_rate ?? null,
        status: latest?.respiratory_status as VitalStatus | null,
        trend: calculateTrend(latest?.respiratory_rate ?? null, previous?.respiratory_rate ?? null),
        lastRecordedAt: latest?.event_occurred_at,
      },
    };
  }, [entries]);

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
          <span className={`text-sm font-medium ${getOverallStatusColor()}`}>
            {getOverallStatusText()}
          </span>
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
