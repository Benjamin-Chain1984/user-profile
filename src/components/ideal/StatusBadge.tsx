import { Badge } from '@/components/ui/badge';
import { HealthStatus } from '@/types/ideal';
import { Circle } from 'lucide-react';

interface StatusBadgeProps {
  status: HealthStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  stable: {
    label: 'Stable',
    variant: 'stable' as const,
  },
  monitor: {
    label: 'Monitor',
    variant: 'monitor' as const,
  },
  action: {
    label: 'Action Needed',
    variant: 'action' as const,
  },
};

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${sizeClasses[size]}`}>
      {showIcon && (
        <Circle 
          className={`w-2 h-2 fill-current ${status === 'action' ? 'animate-pulse-gentle' : ''}`} 
        />
      )}
      {config.label}
    </Badge>
  );
}
