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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { usePressureAreaConfig } from '@/hooks/usePressureArea';
import { Save, Loader2, Scale, Droplets, Heart, Thermometer, Moon, ShieldCheck } from 'lucide-react';

const RELATED_MODULES = [
  { id: 'weight', name: 'Weight Chart', description: 'Track weight changes that may indicate fluid or digestive issues', icon: Scale, path: '/module/weight' },
  { id: 'hydration', name: 'Hydration / Fluid Balance', description: 'Monitor fluid intake to support healthy bowel function', icon: Droplets, path: '/module/hydration' },
  { id: 'health-prevention', name: 'Health Prevention', description: 'Proactive health monitoring to catch early warning signs', icon: Heart, path: '/module/health-prevention' },
  { id: 'pain-assessment', name: 'Pain Assessment', description: 'Identify discomfort that may be related to bowel health', icon: Thermometer, path: '/module/pain-check' },
  { id: 'sleep', name: 'Sleep Chart', description: 'Quality sleep supports overall digestive health', icon: Moon, path: '/module/sleep' },
  { id: 'continence', name: 'Continence Management', description: 'Monitor continence care including pad changes and skin integrity', icon: ShieldCheck, path: '/module/continence' },
];

const CHECKS_PER_DAY_OPTIONS = [
  { value: '1', label: '1 time per day' },
  { value: '2', label: '2 times per day' },
  { value: '3', label: '3 times per day' },
  { value: '4', label: '4 times per day' },
  { value: '5', label: '5 times per day' },
];

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '18:00'],
  3: ['07:00', '14:00', '21:00'],
  4: ['06:00', '10:00', '16:00', '21:00'],
  5: ['06:00', '09:00', '12:00', '16:00', '20:00'],
};

interface Props {
  clientId?: string;
}

export function PressureAreaConfigSettings({ clientId }: Props) {
  const { config, saveConfig, isSaving } = usePressureAreaConfig(clientId);

  const [enableCompliance, setEnableCompliance] = useState(true);
  const [checksPerDay, setChecksPerDay] = useState(1);
  const [checkTimes, setCheckTimes] = useState<string[]>(['08:00']);
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  useEffect(() => {
    if (config) {
      setEnableCompliance(config.enable_compliance_scoring);
      setChecksPerDay(config.skin_checks_per_day || 1);
      setCheckTimes(config.skin_check_times?.length ? config.skin_check_times : DEFAULT_TIMES[1]);
    }
  }, [config]);

  const handleChecksPerDayChange = (value: string) => {
    const num = parseInt(value);
    setChecksPerDay(num);
    // Reset times to defaults for new count
    setCheckTimes(DEFAULT_TIMES[num] || DEFAULT_TIMES[1]);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...checkTimes];
    newTimes[index] = value;
    setCheckTimes(newTimes);
  };

  const handleSave = () => {
    saveConfig({
      enable_compliance_scoring: enableCompliance,
      skin_checks_per_day: checksPerDay,
      skin_check_times: checkTimes.slice(0, checksPerDay),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <p className="text-sm font-medium mb-1">Who can help set up this module?</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
            <li>Registered Nurse</li>
            <li>General Practitioner (GP)</li>
            <li>Occupational Therapist</li>
          </ul>
        </CardContent>
      </Card>

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
          </CardContent>
        </Card>
      </RestrictedSection>

      <RestrictedSection>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled Skin Checks</CardTitle>
            <CardDescription>Configure how many skin checks are required each day and at what times.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>How many skin checks are required per day?</Label>
              <Select value={String(checksPerDay)} onValueChange={handleChecksPerDayChange}>
                <SelectTrigger className="w-64 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECKS_PER_DAY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Scheduled Skin Check Times</Label>
              <p className="text-xs text-muted-foreground">
                Set the exact time for each scheduled skin check. Overdue alerts trigger 2 hours after the scheduled time.
              </p>
              {Array.from({ length: checksPerDay }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-28">Skin Check {i + 1}:</span>
                  <Input
                    type="time"
                    value={checkTimes[i] || '08:00'}
                    onChange={e => handleTimeChange(i, e.target.value)}
                    className="w-36"
                  />
                </div>
              ))}
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
          <CardDescription>Comprehensive care involves monitoring multiple aspects of health</CardDescription>
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
                  <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
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
