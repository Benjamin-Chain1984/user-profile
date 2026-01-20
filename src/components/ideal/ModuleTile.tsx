import { HealthModule } from '@/types/ideal';
import { StatusBadge } from './StatusBadge';
import { 
  Droplets, Heart, Apple, Pill, Activity, Scale, 
  Smile, BedDouble, Thermometer, Eye, CircleDot,
  HeartPulse, Wind, Gauge
} from 'lucide-react';

interface ModuleTileProps {
  module: HealthModule;
  onClick?: () => void;
}

const moduleIcons: Record<string, React.ElementType> = {
  'constipation': CircleDot,
  'continence': Droplets,
  'diabetes': Activity,
  'enteral': Apple,
  'epilepsy': HeartPulse,
  'fluid-balance': Droplets,
  'health-monitoring': Heart,
  'health-prevention': Gauge,
  'iddsi': Apple,
  'oral-health': Smile,
  'ostomy': CircleDot,
  'pain-check': Eye,
  'pressure-area': BedDouble,
  'sleep': BedDouble,
  'catheter': Droplets,
  'weight': Scale,
};

export function ModuleTile({ module, onClick }: ModuleTileProps) {
  const Icon = moduleIcons[module.id] || Pill;

  return (
    <button
      onClick={onClick}
      className="w-full h-full text-left p-4 bg-card rounded-xl border border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98] min-h-[140px] flex flex-col"
    >
      {/* Header with icon and status */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-lg shrink-0 ${
          module.status === 'stable' ? 'bg-success/10' :
          module.status === 'monitor' ? 'bg-warning/10' :
          'bg-destructive/10'
        }`}>
          <Icon className={`w-5 h-5 ${
            module.status === 'stable' ? 'text-success' :
            module.status === 'monitor' ? 'text-warning' :
            'text-destructive'
          }`} />
        </div>
        <div className="shrink-0">
          <StatusBadge status={module.status || 'stable'} size="sm" showIcon={false} />
        </div>
      </div>
      
      {/* Module name - always visible, wraps to multiple lines */}
      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1.5 line-clamp-3 break-words hyphens-auto">
        {module.name}
      </h3>
      
      {/* Last entry - optional, can truncate */}
      {module.lastEntry && (
        <p className="text-xs text-muted-foreground leading-relaxed truncate">
          {module.lastEntry}
        </p>
      )}
      
      {/* Spacer to push actions to bottom */}
      <div className="flex-1 min-h-2" />
      
      {/* Action buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          Log
        </span>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          View
        </span>
      </div>
    </button>
  );
}
