/**
 * Pressure Area Prevention Config Settings
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { usePressureAreaConfig } from '@/hooks/usePressureArea';
import { Save, Loader2, Scale, Droplets, Heart, Thermometer, Moon, ShieldCheck } from 'lucide-react';

const RELATED_MODULES = [
  {
    id: 'weight',
    name: 'Weight Chart',
    description: 'Track weight changes that may indicate fluid or digestive issues',
    icon: Scale,
    path: '/module/weight'
  },
  {
    id: 'hydration',
    name: 'Hydration / Fluid Balance',
    description: 'Monitor fluid intake to support healthy bowel function',
    icon: Droplets,
    path: '/module/hydration'
  },
  {
    id: 'health-prevention',
    name: 'Health Prevention',
    description: 'Proactive health monitoring to catch early warning signs',
    icon: Heart,
    path: '/module/health-prevention'
  },
  {
    id: 'pain-assessment',
    name: 'Pain Assessment',
    description: 'Identify discomfort that may be related to bowel health',
    icon: Thermometer,
    path: '/module/pain-check'
  },
  {
    id: 'sleep',
    name: 'Sleep Chart',
    description: 'Quality sleep supports overall digestive health',
    icon: Moon,
    path: '/module/sleep'
  },
  {
    id: 'continence',
    name: 'Continence Management',
    description: 'Monitor continence care including pad changes and skin integrity',
    icon: ShieldCheck,
    path: '/module/continence'
  },
];

interface Props {
  clientId?: string;
}

export function PressureAreaConfigSettings({ clientId }: Props) {
  const { config, saveConfig, isSaving } = usePressureAreaConfig(clientId);

  const [enableCompliance, setEnableCompliance] = useState(true);
  const [skinCheckDays, setSkinCheckDays] = useState(7);
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  useEffect(() => {
    if (config) {
      setEnableCompliance(config.enable_compliance_scoring);
      setSkinCheckDays(config.skin_check_frequency_days);
    }
  }, [config]);

  const handleSave = () => {
    saveConfig({
      enable_compliance_scoring: enableCompliance,
      skin_check_frequency_days: skinCheckDays,
    });
  };

  return (
    <div className="space-y-4">
      <RestrictedSection>
        <Card>
          <CardHeader><CardTitle className="text-base">Module Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Compliance Scoring</Label>
                <p className="text-xs text-muted-foreground">Track daily repositioning compliance against the plan</p>
              </div>
              <Switch checked={enableCompliance} onCheckedChange={setEnableCompliance} />
            </div>
            <div>
              <Label>Skin Check Frequency (days)</Label>
              <Input type="number" value={skinCheckDays} onChange={e => setSkinCheckDays(Number(e.target.value))} min={1} className="w-32" />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </RestrictedSection>

      <ModuleNotificationsCard
        moduleName="pressure-area"
        moduleDisplayName="Pressure Area Prevention"
        settings={notificationSettings}
        onSettingsChange={setNotificationSettings}
        clientId={clientId}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Other Recommended Related Modules</CardTitle>
          <CardDescription>
            Comprehensive care involves monitoring multiple aspects of health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RELATED_MODULES.map((module) => (
              <Link
                key={module.id}
                to={module.path}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="p-2 rounded-md bg-primary/10">
                  <module.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{module.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Always consult a healthcare professional to ensure modules are clinically valid and set according to individual need.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
