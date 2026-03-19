/**
 * Oral Health Config Settings
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOralHealthConfig } from '@/hooks/useOralHealth';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { FREQUENCY_LABELS, type AssessmentFrequency } from '@/types/oralHealth';
import { Settings, Save, HelpCircle, Scale, Heart, Utensils, CupSoda, Thermometer, Moon } from 'lucide-react';

const RELATED_MODULES = [
  { id: 'weight', name: 'Weight Chart', description: 'Track weight changes that may indicate nutritional or swallowing concerns', icon: Scale, path: '/module/weight' },
  { id: 'health-prevention', name: 'Health Prevention', description: 'Proactive health monitoring to catch early warning signs', icon: Heart, path: '/module/health-prevention' },
  { id: 'enteral', name: 'Enteral Nutrition', description: 'Monitor enteral feeding for those with oral intake difficulties', icon: Utensils, path: '/module/enteral' },
  { id: 'iddsi', name: 'IDDSI & Safe Swallowing', description: 'Ensure texture-modified diets and safe swallowing strategies', icon: CupSoda, path: '/module/iddsi' },
  { id: 'pain-assessment', name: 'Pain Assessment', description: 'Identify oral or dental pain that may affect eating and wellbeing', icon: Thermometer, path: '/module/pain-check' },
  { id: 'sleep', name: 'Sleep Chart', description: 'Quality sleep supports overall health and recovery', icon: Moon, path: '/module/sleep' },
];

interface Props {
  clientId?: string;
}

export function OralHealthConfigSettings({ clientId }: Props) {
  const { config, isLoading, updateConfig, isUpdating } = useOralHealthConfig(clientId);

  const [enableCompliance, setEnableCompliance] = useState(false);
  const [frequency, setFrequency] = useState<AssessmentFrequency>('weekly');
  const [missedTasksAlert, setMissedTasksAlert] = useState(2);
  const [dysphagiaFlagged, setDysphagiaFlagged] = useState(false);
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
      setDysphagiaFlagged((config as any).dysphagia_flagged || false);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      enable_compliance_monitoring: enableCompliance,
      assessment_frequency: frequency,
      consecutive_missed_tasks_alert: missedTasksAlert,
      dysphagia_flagged: dysphagiaFlagged,
    } as any);
  };

  return (
    <div className="space-y-4">
      {/* Who can help */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-4">
          <p className="text-sm font-medium mb-1">Who can help set up this module?</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
            <li>Dentist</li>
          </ul>
        </CardContent>
      </Card>

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

          {/* Dysphagia Question */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex-1">
              <Label className="text-sm font-medium">Does the person have dysphagia (difficulty swallowing)?</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                If yes, a clinical alert will be displayed on the Oral Health dashboard highlighting increased aspiration pneumonia risk.
              </p>
            </div>
            <Switch checked={dysphagiaFlagged} onCheckedChange={setDysphagiaFlagged} />
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
