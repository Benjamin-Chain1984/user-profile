/**
 * Pressure Area Prevention Config Settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { usePressureAreaConfig } from '@/hooks/usePressureArea';
import { Save, Loader2 } from 'lucide-react';

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
    </div>
  );
}
