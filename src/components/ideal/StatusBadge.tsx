import { Badge } from '@/components/ui/badge';
import { HealthStatus } from '@/types/ideal';
import { Circle, PauseCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: HealthStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isPaused?: boolean;
}

const statusConfig = {
  stable: {
    label: 'IDEAL',
    variant: 'stable' as const,
  },
  monitor: {
    label: 'AMBER',
    variant: 'monitor' as const,
  },
  action: {
    label: 'RED',
    variant: 'action' as const,
  },
  paused: {
    label: 'PAUSED',
    variant: 'outline' as const,
  },
};

export function StatusBadge({ status, showIcon = true, size = 'md', isPaused = false }: StatusBadgeProps) {
  const config = isPaused ? statusConfig.paused : statusConfig[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${sizeClasses[size]} ${isPaused ? 'bg-warning/10 text-warning border-warning/30' : ''}`}>
      {showIcon && (
        isPaused ? (
          <PauseCircle className="w-3 h-3" />
        ) : (
          <Circle 
            className={`w-2 h-2 fill-current ${status === 'action' ? 'animate-pulse-gentle' : ''}`} 
          />
        )
      )}
      {config.label}
    </Badge>
  );
}
