import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { HealthModule } from '@/types/ideal';
import { TrafficLightBadge } from '@/components/shared/TrafficLightBadge';
import { toTrafficLight } from '@/types/trafficLight';
import { ChevronRight } from 'lucide-react';
import { 
  Droplets, Heart, Apple, Pill, Activity, Scale, 
  Smile, BedDouble, Eye, CircleDot,
  HeartPulse, Gauge
} from 'lucide-react';

const moduleIcons: Record<string, React.ElementType> = {
  'constipation': CircleDot,
  'continence': Droplets,
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

function ModuleRow({ module, onClick }: { module: HealthModule; onClick: () => void }) {
  const Icon = moduleIcons[module.id] || Pill;
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg shrink-0 ${
        module.status === 'stable' ? 'bg-success/10' :
        module.status === 'monitor' ? 'bg-warning/10' :
        'bg-destructive/10'
      }`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
          module.status === 'stable' ? 'text-success' :
          module.status === 'monitor' ? 'text-warning' :
          'text-destructive'
        }`} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm sm:text-base leading-snug">
          {module.name}
        </h3>
        {module.lastEntry && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
            {module.lastEntry}
          </p>
        )}
      </div>
      
      {/* Status + Arrow */}
      <div className="flex items-center gap-2 shrink-0">
        <TrafficLightBadge status={toTrafficLight(module.status || 'stable')} size="sm" showIcon={false} />
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}

export function ModuleGrid() {
  const { enabledModules, healthMonitoringConfig } = useProfile();
  const navigate = useNavigate();

  // Filter to only enabled modules, with health monitoring validation
  const activeModules = enabledModules.filter((m) => {
    if (!m.enabled) return false;
    if (m.id === 'health-monitoring') {
      const hasVitals = 
        healthMonitoringConfig.bloodPressureEnabled ||
        healthMonitoringConfig.heartRateEnabled ||
        healthMonitoringConfig.oxygenLevelsEnabled ||
        healthMonitoringConfig.temperatureEnabled;
      return hasVitals;
    }
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleModuleClick = (moduleId: string) => {
    navigate(`/module/${moduleId}`);
  };

  if (activeModules.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-muted/50 rounded-2xl border border-dashed border-border">
        <p className="text-muted-foreground">
          No health modules enabled yet.
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Configure modules in the Profile tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {activeModules.map((module) => (
          <ModuleRow 
            key={module.id} 
            module={module} 
            onClick={() => handleModuleClick(module.id)}
          />
      ))}
    </div>
  );
}
