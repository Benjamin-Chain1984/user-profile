import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useModuleSetupStatus } from '@/hooks/useModuleSetupStatus';
import { HEALTH_MONITORING_VITALS } from '@/types/ideal';
import { AlertCircle, Heart, Activity, Wind, Thermometer, Lock, Settings } from 'lucide-react';

const vitalIcons: Record<string, React.ElementType> = {
  'blood-pressure': Heart,
  'heart-rate': Activity,
  'oxygen-levels': Wind,
  'temperature': Thermometer,
  'respiratory-rate': Wind,
};

export function ModuleSelector() {
  const { 
    enabledModules, 
    toggleModule, 
    healthMonitoringConfig, 
    toggleVital,
  } = useProfile();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { isSetupComplete, markSetupComplete } = useModuleSetupStatus();
  const [setupPrompt, setSetupPrompt] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = hasRole('admin');

  const handleToggle = (moduleId: string, moduleName: string, isEnabled: boolean) => {
    if (!isAdmin) return;
    toggleModule(moduleId);
    if (!isEnabled && !isSetupComplete(moduleId)) {
      setSetupPrompt({ id: moduleId, name: moduleName });
    }
  };

  const openModuleSettings = () => {
    if (!setupPrompt) return;
    markSetupComplete(setupPrompt.id);
    const id = setupPrompt.id;
    setSetupPrompt(null);
    navigate(`/module/${id}`);
  };

  const healthMonitoringEnabled = enabledModules.find(m => m.id === 'health-monitoring')?.enabled;
  
  const hasVitalsSelected = 
    healthMonitoringConfig.bloodPressureEnabled ||
    healthMonitoringConfig.heartRateEnabled ||
    healthMonitoringConfig.oxygenLevelsEnabled ||
    healthMonitoringConfig.temperatureEnabled ||
    healthMonitoringConfig.respiratoryRateEnabled;

  const vitalConfigKeys: Record<string, keyof typeof healthMonitoringConfig> = {
    'blood-pressure': 'bloodPressureEnabled',
    'heart-rate': 'heartRateEnabled',
    'oxygen-levels': 'oxygenLevelsEnabled',
    'temperature': 'temperatureEnabled',
    'respiratory-rate': 'respiratoryRateEnabled',
  };

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Module configuration is read-only. Admin access required to make changes.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-foreground">Health Modules</h2>
        <p className="text-sm text-muted-foreground">
          {enabledModules.filter(m => m.enabled).length} enabled
        </p>
      </div>

      <p className="text-sm text-muted-foreground pb-2">
        {isAdmin 
          ? 'Enable the modules relevant to this individual\'s care needs. Only enabled modules will appear on the home page.'
          : 'View the modules configured for this individual. Contact an administrator to make changes.'}
      </p>

      <RestrictedSection requiredRole="admin" message="Admin access required to configure modules">
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
                    onCheckedChange={() => handleToggle(module.id, module.name, module.enabled)}
                    size="lg"
                    variant={module.enabled ? 'success' : 'default'}
                    disabled={!isAdmin}
                  />
                </div>

                {module.enabled && !isSetupComplete(module.id) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-warning" />
                    <p className="flex-1 text-sm text-warning">
                      Setup required — no settings have been applied yet.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        markSetupComplete(module.id);
                        navigate(`/module/${module.id}`);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Set up
                    </Button>
                  </div>
                )}
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
                            onCheckedChange={() => isAdmin && toggleVital(configKey)}
                            disabled={!isAdmin}
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
      </RestrictedSection>

      <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> {isAdmin 
            ? 'Modules enabled reflect the individual\'s assessed health needs. Changes should align with clinical advice and care plans.'
            : 'Module changes require administrator access. Contact your team leader or admin for updates.'}
        </p>
      </div>

      <Dialog open={!!setupPrompt} onOpenChange={(open) => !open && setSetupPrompt(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set up {setupPrompt?.name}</DialogTitle>
            <DialogDescription>
              This module has been enabled with no settings applied — nothing is assumed.
              Open the module and complete its <strong>Settings</strong> tab (thresholds,
              schedules and alert contacts) before staff begin logging.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Until setup is complete the module status stays Amber (Monitor) on the dashboard.
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSetupPrompt(null)}>
              Set up later
            </Button>
            <Button onClick={openModuleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Go to module settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
