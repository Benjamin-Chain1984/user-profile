import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { HealthModule } from '@/types/ideal';
import { StatusBadge } from './StatusBadge';
import { ChevronRight } from 'lucide-react';
import { 
  Droplets, Heart, Apple, Pill, Activity, Scale, 
  Smile, BedDouble, Eye, CircleDot,
  HeartPulse, Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FOOD_LEVELS, DRINK_LEVELS, getFoodLevelKey } from '@/types/iddsi';

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

function IddsiModuleRow({ module, onClick, clientId }: { module: HealthModule; onClick: () => void; clientId?: string }) {
  const Icon = moduleIcons[module.id] || Pill;
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [drinkImage, setDrinkImage] = useState<string | null>(null);
  const [foodName, setFoodName] = useState<string | null>(null);
  const [drinkName, setDrinkName] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('iddsi_config')
      .select('food_level, food_level_variant, drink_level')
      .eq('client_id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.food_level !== null) {
            const key = getFoodLevelKey(data.food_level, data.food_level_variant);
            const info = FOOD_LEVELS[key];
            if (info) {
              setFoodImage(info.image);
              setFoodName(`Level ${data.food_level}`);
            }
          }
          if (data.drink_level !== null) {
            const info = DRINK_LEVELS[data.drink_level];
            if (info) {
              setDrinkImage(info.image);
              setDrinkName(`Level ${data.drink_level}`);
            }
          }
        }
      });
  }, [clientId]);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex flex-col gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      {/* Top row: icon, name, status */}
      <div className="flex items-center gap-3 w-full">
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
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={module.status || 'stable'} size="sm" showIcon={false} />
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>

      {/* Food & Drink level images */}
      {(foodImage || drinkImage) && (
        <div className="flex gap-4 pl-2">
          {foodImage && (
            <div className="flex items-center gap-2">
              <img src={foodImage} alt="Food level" className="h-14 w-14 object-contain" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Food</p>
                <p className="text-xs font-medium">{foodName}</p>
              </div>
            </div>
          )}
          {drinkImage && (
            <div className="flex items-center gap-2">
              <img src={drinkImage} alt="Drink level" className="h-14 w-14 object-contain" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Drink</p>
                <p className="text-xs font-medium">{drinkName}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

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
        <StatusBadge status={module.status || 'stable'} size="sm" showIcon={false} />
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}

export function ModuleGrid() {
  const { enabledModules, healthMonitoringConfig, profile } = useProfile();
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
        module.id === 'iddsi' ? (
          <IddsiModuleRow
            key={module.id}
            module={module}
            onClick={() => handleModuleClick(module.id)}
            clientId={profile?.id}
          />
        ) : (
          <ModuleRow 
            key={module.id} 
            module={module} 
            onClick={() => handleModuleClick(module.id)}
          />
        )
      ))}
    </div>
  );
}
