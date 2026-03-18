/**
 * TrafficLightBadge — Reusable status pill/badge.
 * Standardised across all modules and the Home page.
 * 
 * Labels: IDEAL / Amber / Red
 * Never uses: Stable, Good, OK, Green
 */

import { Badge } from '@/components/ui/badge';
import { Circle, PauseCircle } from 'lucide-react';
import type { TrafficLightStatus } from '@/types/trafficLight';
import { getTrafficLightLabel } from '@/types/trafficLight';
import { cn } from '@/lib/utils';

interface TrafficLightBadgeProps {
  status: TrafficLightStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isPaused?: boolean;
}

const statusVariant: Record<TrafficLightStatus, 'stable' | 'monitor' | 'action'> = {
  green: 'stable',
  amber: 'monitor',
  red: 'action',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function TrafficLightBadge({
  status,
  size = 'md',
  showIcon = true,
  isPaused = false,
}: TrafficLightBadgeProps) {
  if (isPaused) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5 bg-warning/10 text-warning border-warning/30',
          sizeClasses[size]
        )}
      >
        {showIcon && <PauseCircle className="w-3 h-3" />}
        PAUSED
      </Badge>
    );
  }

  return (
    <Badge
      variant={statusVariant[status]}
      className={cn('gap-1.5', sizeClasses[size])}
    >
      {showIcon && (
        <Circle
          className={cn(
            'w-2 h-2 fill-current',
            status === 'red' && 'animate-pulse-gentle'
          )}
        />
      )}
      {getTrafficLightLabel(status)}
    </Badge>
  );
}
