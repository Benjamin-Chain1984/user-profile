/**
 * VitalTile - Individual traffic-light tile for a single vital sign
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Thermometer, 
  Heart, 
  Wind, 
  Activity, 
  Gauge,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { type VitalType, type VitalStatus, VITAL_THRESHOLDS } from '@/types/healthMonitoring';
import { formatDistanceToNow } from 'date-fns';

interface VitalTileProps {
  vitalType: VitalType;
  value: number | null;
  status: VitalStatus | null;
  lastRecordedAt?: string;
  trend?: 'up' | 'down' | 'stable' | null;
  onClick?: () => void;
  className?: string;
}

const VITAL_ICONS: Record<VitalType, React.ReactNode> = {
  temperature: <Thermometer className="h-6 w-6" />,
  bp_systolic: <Heart className="h-6 w-6" />,
  bp_diastolic: <Heart className="h-6 w-6" />,
  oxygen: <Gauge className="h-6 w-6" />,
  heart_rate: <Activity className="h-6 w-6" />,
  respiratory: <Wind className="h-6 w-6" />,
};

const VITAL_LABELS: Record<VitalType, string> = {
  temperature: 'Temperature',
  bp_systolic: 'Blood Pressure',
  bp_diastolic: 'Blood Pressure',
  oxygen: 'Oxygen Saturation',
  heart_rate: 'Heart Rate',
  respiratory: 'Respiratory Rate',
};

export function VitalTile({
  vitalType,
  value,
  status,
  lastRecordedAt,
  trend,
  onClick,
  className,
}: VitalTileProps) {
  const threshold = VITAL_THRESHOLDS[vitalType];

  const getStatusStyles = () => {
    switch (status) {
      case 'red':
        return 'border-red-400 bg-red-50 hover:bg-red-100';
      case 'amber':
        return 'border-amber-400 bg-amber-50 hover:bg-amber-100';
      case 'ideal':
        return 'border-green-400 bg-green-50 hover:bg-green-100';
      default:
        return 'border-border bg-muted/30 hover:bg-muted/50';
    }
  };

  const getStatusIconStyles = () => {
    switch (status) {
      case 'red': return 'text-red-600';
      case 'amber': return 'text-amber-600';
      case 'ideal': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'red': return 'Red';
      case 'amber': return 'Amber';
      case 'ideal': return 'IDEAL';
      default: return 'No data';
    }
  };

  const getStatusBadgeStyles = () => {
    switch (status) {
      case 'red': return 'bg-red-500 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'ideal': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        'border-2 transition-all cursor-pointer',
        getStatusStyles(),
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Icon and Label */}
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', status ? getStatusStyles() : 'bg-muted')}>
              <div className={getStatusIconStyles()}>
                {VITAL_ICONS[vitalType]}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{VITAL_LABELS[vitalType]}</p>
              {value !== null ? (
                <p className={cn('text-2xl font-bold font-mono', getStatusIconStyles())}>
                  {vitalType === 'temperature' ? value.toFixed(1) : value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {threshold.unit}
                  </span>
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">—</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={cn('text-xs shrink-0', getStatusBadgeStyles())}>
            {getStatusLabel()}
          </Badge>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          {/* Last recorded */}
          {lastRecordedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDistanceToNow(new Date(lastRecordedAt), { addSuffix: true })}
            </div>
          )}

          {/* Trend indicator */}
          {trend && value !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              trend === 'up' && 'text-amber-600',
              trend === 'down' && 'text-blue-600',
              trend === 'stable' && 'text-green-600',
            )}>
              <TrendIcon className="h-3 w-3" />
              {trend === 'stable' ? 'Stable' : trend === 'up' ? 'Rising' : 'Falling'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Blood Pressure specific tile
interface BpTileProps {
  systolic: number | null;
  diastolic: number | null;
  status: VitalStatus | null;
  lastRecordedAt?: string;
  trend?: 'up' | 'down' | 'stable' | null;
  onClick?: () => void;
  className?: string;
}

export function BloodPressureTile({
  systolic,
  diastolic,
  status,
  lastRecordedAt,
  trend,
  onClick,
  className,
}: BpTileProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'red':
        return 'border-red-400 bg-red-50 hover:bg-red-100';
      case 'amber':
        return 'border-amber-400 bg-amber-50 hover:bg-amber-100';
      case 'ideal':
        return 'border-green-400 bg-green-50 hover:bg-green-100';
      default:
        return 'border-border bg-muted/30 hover:bg-muted/50';
    }
  };

  const getStatusIconStyles = () => {
    switch (status) {
      case 'red': return 'text-red-600';
      case 'amber': return 'text-amber-600';
      case 'ideal': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'red': return 'Red';
      case 'amber': return 'Amber';
      case 'ideal': return 'IDEAL';
      default: return 'No data';
    }
  };

  const getStatusBadgeStyles = () => {
    switch (status) {
      case 'red': return 'bg-red-500 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'ideal': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        'border-2 transition-all cursor-pointer',
        getStatusStyles(),
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', status ? getStatusStyles() : 'bg-muted')}>
              <Heart className={cn('h-6 w-6', getStatusIconStyles())} />
            </div>
            <div>
              <p className="font-medium text-sm">Blood Pressure</p>
              {systolic !== null && diastolic !== null ? (
                <p className={cn('text-2xl font-bold font-mono', getStatusIconStyles())}>
                  {systolic}/{diastolic}
                  <span className="text-sm font-normal text-muted-foreground ml-1">mmHg</span>
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">—</p>
              )}
            </div>
          </div>

          <Badge className={cn('text-xs shrink-0', getStatusBadgeStyles())}>
            {getStatusLabel()}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          {lastRecordedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDistanceToNow(new Date(lastRecordedAt), { addSuffix: true })}
            </div>
          )}

          {trend && systolic !== null && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              trend === 'up' && 'text-amber-600',
              trend === 'down' && 'text-blue-600',
              trend === 'stable' && 'text-green-600',
            )}>
              <TrendIcon className="h-3 w-3" />
              {trend === 'stable' ? 'Stable' : trend === 'up' ? 'Rising' : 'Falling'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
