import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { ModuleTile } from './ModuleTile';

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
  });

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
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
      {activeModules.map((module) => (
        <ModuleTile 
          key={module.id} 
          module={module} 
          onClick={() => handleModuleClick(module.id)}
        />
      ))}
    </div>
  );
}
