/**
 * Oral Health Config Settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOralHealthConfig } from '@/hooks/useOralHealth';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { FREQUENCY_LABELS, type AssessmentFrequency } from '@/types/oralHealth';
import { Settings, Save, HelpCircle } from 'lucide-react';

interface Props {
  clientId?: string;
}

export function OralHealthConfigSettings({ clientId }: Props) {
  const { config, isLoading, updateConfig, isUpdating } = useOralHealthConfig(clientId);

  const [enableCompliance, setEnableCompliance] = useState(false);
  const [frequency, setFrequency] = useState<AssessmentFrequency>('weekly');
  const [missedTasksAlert, setMissedTasksAlert] = useState(2);
  
  const [notifSettings, setNotifSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  useEffect(() => {
    if (config) {
      setEnableCompliance(config.enable_compliance_monitoring || false);
      setFrequency((config.assessment_frequency as AssessmentFrequency) || 'weekly');
      setMissedTasksAlert(config.consecutive_missed_tasks_alert || 2);
      
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      enable_compliance_monitoring: enableCompliance,
      assessment_frequency: frequency,
      consecutive_missed_tasks_alert: missedTasksAlert,
      
    });
  };

  return (
    <div className="space-y-4">
      {/* Assessment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assessment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Assessment Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as AssessmentFrequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Compliance Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Enable Oral Health Compliance Monitoring</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  When enabled, staff can log daily AM/PM task completion. The system tracks compliance percentages and generates alerts when tasks are missed.
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch checked={enableCompliance} onCheckedChange={setEnableCompliance} />
          </div>

          {enableCompliance && (
            <div>
              <div className="flex items-center gap-2">
                <Label>Consecutive Missed Tasks Before Alert</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Number of consecutive missed AM or PM tasks before an alert is triggered.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={missedTasksAlert}
                onChange={(e) => setMissedTasksAlert(Number(e.target.value))}
                className="w-24 mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <ModuleNotificationsCard
        moduleName="oral-health"
        moduleDisplayName="Oral Health"
        settings={notifSettings}
        onSettingsChange={setNotifSettings}
        clientId={clientId}
      />

      <Button onClick={handleSave} disabled={isUpdating}>
        <Save className="h-4 w-4 mr-2" /> Save Settings
      </Button>
    </div>
  );
}
