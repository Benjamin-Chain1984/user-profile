import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePainConfig } from '@/hooks/usePainConfig';
import { AssessmentFrequency, ASSESSMENT_FREQUENCY_OPTIONS } from '@/types/painAssessment';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';
import { Settings, Clock, Save, AlertTriangle, ClipboardList, Brain, CalendarClock, Bell } from 'lucide-react';

interface PainConfigSettingsProps {
  clientId?: string;
  onClose?: () => void;
}

const MODULE_NAME = 'pain-check';

export function PainConfigSettings({ clientId, onClose }: PainConfigSettingsProps) {
  const { config, loading, saveConfig, getEffectiveConfig } = usePainConfig(clientId);
  const effectiveConfig = getEffectiveConfig();
  
  // Module alert recipients
  const { data: recipients } = useModuleAlertRecipients(MODULE_NAME, clientId);
  const setRecipients = useSetModuleAlertRecipients();
  
  // Compute notification settings from recipients data (no useState to avoid infinite loops)
  const notificationSettings: ModuleNotificationSettings = useMemo(() => {
    if (!recipients) {
      return {
        enableNotifications: false,
        amberRecipientIds: [],
        redRecipientIds: [],
      };
    }
    return {
      enableNotifications: recipients.length > 0,
      amberRecipientIds: recipients
        .filter((r) => r.alert_severity === 'amber')
        .map((r) => r.notification_contact_id),
      redRecipientIds: recipients
        .filter((r) => r.alert_severity === 'red')
        .map((r) => r.notification_contact_id),
    };
  }, [recipients]);

  // Local state for user modifications (only updates on user interaction)
  const [localNotificationSettings, setLocalNotificationSettings] = useState<ModuleNotificationSettings | null>(null);

  // Use local settings if user has made changes, otherwise use computed from DB
  const activeNotificationSettings = localNotificationSettings ?? notificationSettings;

  // Extract frequency and situational from triggers array
  const initialFrequency = (effectiveConfig.assessment_triggers.find(t => ['daily', 'weekly', 'fortnightly'].includes(t)) || 'daily') as AssessmentFrequency;
  const initialSituational = effectiveConfig.assessment_triggers.includes('staff_concern');
  
  const [frequency, setFrequency] = useState<AssessmentFrequency>(initialFrequency);
  const [situationalEnabled, setSituationalEnabled] = useState(initialSituational);
  const [mildHours, setMildHours] = useState(effectiveConfig.mild_reassess_hours);
  const [moderateHours, setModerateHours] = useState(effectiveConfig.moderate_reassess_hours);
  const [severeHours, setSevereHours] = useState(effectiveConfig.severe_reassess_hours);
  const [enabledTools, setEnabledTools] = useState<string[]>(effectiveConfig.enabled_tools || ['abbey', 'painad']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      const freq = (config.assessment_triggers.find(t => ['daily', 'weekly', 'fortnightly'].includes(t)) || 'daily') as AssessmentFrequency;
      setFrequency(freq);
      setSituationalEnabled(config.assessment_triggers.includes('staff_concern'));
      setMildHours(config.mild_reassess_hours);
      setModerateHours(config.moderate_reassess_hours);
      setSevereHours(config.severe_reassess_hours);
      setEnabledTools(config.enabled_tools || ['abbey', 'painad']);
    }
  }, [config]);

  const handleNotificationSettingsChange = (settings: ModuleNotificationSettings) => {
    setLocalNotificationSettings(settings);
  };

  const handleSaveNotifications = () => {
    const settingsToSave = activeNotificationSettings;
    const allRecipients: { contactId: string; severity: AlertSeverity }[] = [
      ...settingsToSave.amberRecipientIds.map((id) => ({ contactId: id, severity: 'amber' as AlertSeverity })),
      ...settingsToSave.redRecipientIds.map((id) => ({ contactId: id, severity: 'red' as AlertSeverity })),
    ];
    setRecipients.mutate({
      moduleName: MODULE_NAME,
      clientId: clientId || null,
      recipients: allRecipients,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const triggers = [frequency as string];
    if (situationalEnabled) triggers.push('staff_concern');
    
    const success = await saveConfig({
      assessment_triggers: triggers,
      custom_trigger_text: null,
      mild_reassess_hours: mildHours,
      moderate_reassess_hours: moderateHours,
      severe_reassess_hours: severeHours,
      mild_alert_recipients: [],
      moderate_alert_recipients: [],
      severe_alert_recipients: [],
      enabled_tools: enabledTools,
      default_tool: enabledTools[0] || 'abbey',
    } as any);
    handleSaveNotifications();
    setSaving(false);
    if (success && onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Pain Assessment Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure assessment tools, triggers, and thresholds</p>
        </div>
      </div>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Enabled Assessment Tools
          </CardTitle>
          <CardDescription>
            Select which pain assessment tools are available. At least one must be enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-sm">Abbey Pain Scale</p>
                <p className="text-xs text-muted-foreground">6-item scale, scored 0–18</p>
              </div>
            </div>
            <Switch
              checked={enabledTools.includes('abbey')}
              onCheckedChange={(checked) => {
                if (!checked && enabledTools.length <= 1) return;
                setEnabledTools(prev => checked ? [...prev, 'abbey'] : prev.filter(t => t !== 'abbey'));
              }}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">PAINAD Scale</p>
                <p className="text-xs text-muted-foreground">5-item scale, scored 0–10 (advanced dementia)</p>
              </div>
            </div>
            <Switch
              checked={enabledTools.includes('painad')}
              onCheckedChange={(checked) => {
                if (!checked && enabledTools.length <= 1) return;
                setEnabledTools(prev => checked ? [...prev, 'painad'] : prev.filter(t => t !== 'painad'));
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Scheduled Assessment Frequency
          </CardTitle>
          <CardDescription>
            Choose how often routine pain assessments should be completed. A reminder timer will indicate when the next assessment is due.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={frequency} onValueChange={(val) => setFrequency(val as AssessmentFrequency)}>
            {ASSESSMENT_FREQUENCY_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={opt.value} id={`freq-${opt.value}`} />
                <Label htmlFor={`freq-${opt.value}`} className="cursor-pointer flex-1">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (every {opt.hours} hours)
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Situational Assessment</p>
                  <p className="text-xs text-muted-foreground">Also prompt when staff suspect or are concerned about pain</p>
                </div>
              </div>
              <Switch
                checked={situationalEnabled}
                onCheckedChange={setSituationalEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reassessment Timeframes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Reassessment Timeframes
          </CardTitle>
          <CardDescription>
            How soon should a follow-up assessment occur based on severity?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                Mild Pain
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={mildHours}
                  onChange={(e) => setMildHours(parseInt(e.target.value) || 4)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600" />
                Moderate Pain
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={moderateHours}
                  onChange={(e) => setModerateHours(parseInt(e.target.value) || 2)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                Severe Pain
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={severeHours}
                  onChange={(e) => setSevereHours(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Recipients - Centralized */}
      <ModuleNotificationsCard
        moduleName={MODULE_NAME}
        moduleDisplayName="Pain Assessment"
        settings={activeNotificationSettings}
        onSettingsChange={handleNotificationSettingsChange}
        clientId={clientId}
      />

      {/* Clinical Governance Note */}
      <Alert className="border-primary/30 bg-primary/5">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Pain management actions must align with the person's health plan and medication orders.
        </AlertDescription>
      </Alert>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
