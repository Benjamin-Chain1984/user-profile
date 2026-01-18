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
      className="w-full text-left p-4 bg-card rounded-xl border border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          module.status === 'stable' ? 'bg-success/10' :
          module.status === 'monitor' ? 'bg-warning/10' :
          'bg-destructive/10'
        }`}>
          <Icon className={`w-6 h-6 ${
            module.status === 'stable' ? 'text-success' :
            module.status === 'monitor' ? 'text-warning' :
            'text-destructive'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{module.name}</h3>
            <StatusBadge status={module.status || 'stable'} size="sm" showIcon={false} />
          </div>
          {module.lastEntry && (
            <p className="text-sm text-muted-foreground mt-1">{module.lastEntry}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
          Log
        </span>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          View
        </span>
      </div>
    </button>
  );
}
