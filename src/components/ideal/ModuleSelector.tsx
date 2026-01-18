import { useProfile } from '@/contexts/ProfileContext';
import { Switch } from '@/components/ui/switch';
import { HEALTH_MONITORING_VITALS } from '@/types/ideal';
import { AlertCircle, Heart, Activity, Wind, Thermometer } from 'lucide-react';

const vitalIcons: Record<string, React.ElementType> = {
  'blood-pressure': Heart,
  'heart-rate': Activity,
  'oxygen-levels': Wind,
  'temperature': Thermometer,
};

export function ModuleSelector() {
  const { 
    enabledModules, 
    toggleModule, 
    healthMonitoringConfig, 
    toggleVital,
  } = useProfile();

  const healthMonitoringEnabled = enabledModules.find(m => m.id === 'health-monitoring')?.enabled;
  
  const hasVitalsSelected = 
    healthMonitoringConfig.bloodPressureEnabled ||
    healthMonitoringConfig.heartRateEnabled ||
    healthMonitoringConfig.oxygenLevelsEnabled ||
    healthMonitoringConfig.temperatureEnabled;

  const vitalConfigKeys: Record<string, keyof typeof healthMonitoringConfig> = {
    'blood-pressure': 'bloodPressureEnabled',
    'heart-rate': 'heartRateEnabled',
    'oxygen-levels': 'oxygenLevelsEnabled',
    'temperature': 'temperatureEnabled',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Health Modules</h2>
        <p className="text-sm text-muted-foreground">
          {enabledModules.filter(m => m.enabled).length} enabled
        </p>
      </div>

      <p className="text-sm text-muted-foreground pb-2">
        Enable the modules relevant to this individual's care needs. Only enabled modules will appear on the home page.
      </p>

      <div className="grid gap-3">
        {enabledModules.map((module) => (
          <div key={module.id}>
            <div 
              className={`p-4 rounded-xl border transition-all ${
                module.enabled 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{module.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
                </div>
                <Switch
                  checked={module.enabled}
                  onCheckedChange={() => toggleModule(module.id)}
                  size="lg"
                  variant={module.enabled ? 'success' : 'default'}
                />
              </div>
            </div>

            {/* Health Monitoring Sub-modules */}
            {module.id === 'health-monitoring' && module.enabled && (
              <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/20 space-y-2">
                {!hasVitalsSelected && (
                  <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mb-3">
                    <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                    <p className="text-sm text-warning">
                      Select at least one vital sign to enable Health Monitoring
                    </p>
                  </div>
                )}
                
                {HEALTH_MONITORING_VITALS.map((vital) => {
                  const Icon = vitalIcons[vital.id] || Heart;
                  const configKey = vitalConfigKeys[vital.id];
                  const isEnabled = healthMonitoringConfig[configKey];
                  
                  return (
                    <div 
                      key={vital.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isEnabled 
                          ? 'bg-accent border-primary/20' 
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="font-medium text-foreground">{vital.name}</span>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleVital(configKey)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Modules enabled reflect the individual's assessed health needs. 
          Changes should align with clinical advice and care plans.
        </p>
      </div>
    </div>
  );
}
