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
import { Settings, Clock, Save, AlertTriangle, ClipboardList, Brain, CalendarClock, Bell, ListChecks, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const PREDEFINED_ACTIONS = [
  { id: 'administer_pain_relief', label: 'Administer Pain Relief medication (if prescribed)' },
  { id: 'recheck_pain', label: 'Recheck pain again' },
  { id: 'reposition', label: 'Reposition' },
  { id: 'contact_gp', label: 'Contact GP' },
  { id: 'call_ambulance', label: 'Call Ambulance' },
] as const;

type PredefinedActionId = typeof PREDEFINED_ACTIONS[number]['id'];

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
  // Helper to determine if a value is better expressed in days
  const toUnitAndValue = (hours: number): { value: number; unit: 'hours' | 'days' } => {
    if (hours >= 24 && hours % 24 === 0) return { value: hours / 24, unit: 'days' };
    return { value: hours, unit: 'hours' };
  };

  const initMild = toUnitAndValue(effectiveConfig.mild_reassess_hours);
  const initModerate = toUnitAndValue(effectiveConfig.moderate_reassess_hours);
  const initSevere = toUnitAndValue(effectiveConfig.severe_reassess_hours);

  const [mildValue, setMildValue] = useState(initMild.value);
  const [mildUnit, setMildUnit] = useState<'hours' | 'days'>(initMild.unit);
  const [moderateValue, setModerateValue] = useState(initModerate.value);
  const [moderateUnit, setModerateUnit] = useState<'hours' | 'days'>(initModerate.unit);
  const [severeValue, setSevereValue] = useState(initSevere.value);
  const [severeUnit, setSevereUnit] = useState<'hours' | 'days'>(initSevere.unit);

  const toHours = (value: number, unit: 'hours' | 'days') => unit === 'days' ? value * 24 : value;
  const [enabledTools, setEnabledTools] = useState<string[]>(effectiveConfig.enabled_tools || ['abbey', 'painad']);
  const [overdueAlertEnabled, setOverdueAlertEnabled] = useState((effectiveConfig as any).overdue_alert_enabled ?? true);
  const [overdueThresholdDays, setOverdueThresholdDays] = useState((effectiveConfig as any).overdue_threshold_days ?? 1);

  // Action plan state
  const [mildActions, setMildActions] = useState<string[]>((effectiveConfig as any).mild_actions ?? ['reposition', 'recheck_pain']);
  const [moderateActions, setModerateActions] = useState<string[]>((effectiveConfig as any).moderate_actions ?? ['administer_pain_relief', 'recheck_pain', 'contact_gp']);
  const [severeActions, setSevereActions] = useState<string[]>((effectiveConfig as any).severe_actions ?? ['administer_pain_relief', 'contact_gp', 'call_ambulance']);
  const [mildCustomActions, setMildCustomActions] = useState<string[]>((effectiveConfig as any).mild_custom_actions ?? []);
  const [moderateCustomActions, setModerateCustomActions] = useState<string[]>((effectiveConfig as any).moderate_custom_actions ?? []);
  const [severeCustomActions, setSevereCustomActions] = useState<string[]>((effectiveConfig as any).severe_custom_actions ?? []);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      const freq = (config.assessment_triggers.find(t => ['daily', 'weekly', 'fortnightly'].includes(t)) || 'daily') as AssessmentFrequency;
      setFrequency(freq);
      setSituationalEnabled(config.assessment_triggers.includes('staff_concern'));
      const m = toUnitAndValue(config.mild_reassess_hours);
      setMildValue(m.value); setMildUnit(m.unit);
      const mod = toUnitAndValue(config.moderate_reassess_hours);
      setModerateValue(mod.value); setModerateUnit(mod.unit);
      const s = toUnitAndValue(config.severe_reassess_hours);
      setSevereValue(s.value); setSevereUnit(s.unit);
      setEnabledTools(config.enabled_tools || ['abbey', 'painad']);
      setOverdueAlertEnabled((config as any).overdue_alert_enabled ?? true);
      setOverdueThresholdDays((config as any).overdue_threshold_days ?? 1);
      setMildActions((config as any).mild_actions ?? ['reposition', 'recheck_pain']);
      setModerateActions((config as any).moderate_actions ?? ['administer_pain_relief', 'recheck_pain', 'contact_gp']);
      setSevereActions((config as any).severe_actions ?? ['administer_pain_relief', 'contact_gp', 'call_ambulance']);
      setMildCustomActions((config as any).mild_custom_actions ?? []);
      setModerateCustomActions((config as any).moderate_custom_actions ?? []);
      setSevereCustomActions((config as any).severe_custom_actions ?? []);
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
      mild_reassess_hours: toHours(mildValue, mildUnit),
      moderate_reassess_hours: toHours(moderateValue, moderateUnit),
      severe_reassess_hours: toHours(severeValue, severeUnit),
      mild_alert_recipients: [],
      moderate_alert_recipients: [],
      severe_alert_recipients: [],
      enabled_tools: enabledTools,
      default_tool: enabledTools[0] || 'abbey',
      overdue_alert_enabled: overdueAlertEnabled,
      overdue_threshold_days: overdueThresholdDays,
      mild_actions: mildActions,
      moderate_actions: moderateActions,
      severe_actions: severeActions,
      mild_custom_actions: mildCustomActions,
      moderate_custom_actions: moderateCustomActions,
      severe_custom_actions: severeCustomActions,
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
            {([
              { label: 'Mild Pain', dotClass: 'bg-orange-400', value: mildValue, unit: mildUnit, setValue: setMildValue, setUnit: setMildUnit, defaultVal: 4 },
              { label: 'Moderate Pain', dotClass: 'bg-orange-600', value: moderateValue, unit: moderateUnit, setValue: setModerateValue, setUnit: setModerateUnit, defaultVal: 2 },
              { label: 'Severe Pain', dotClass: 'bg-destructive', value: severeValue, unit: severeUnit, setValue: setSevereValue, setUnit: setSevereUnit, defaultVal: 1 },
            ] as const).map((item) => (
              <div key={item.label} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.dotClass}`} />
                  {item.label}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={item.unit === 'days' ? 30 : 720}
                    value={item.value}
                    onChange={(e) => item.setValue(parseInt(e.target.value) || item.defaultVal)}
                    className="w-20"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => item.setUnit(e.target.value as 'hours' | 'days')}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert Threshold */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Overdue Assessment Alert
          </CardTitle>
          <CardDescription>
            Flag an amber alert when no pain assessment has been completed within the configured threshold.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Enable Overdue Alert</p>
                <p className="text-xs text-muted-foreground">Show amber status when assessment is overdue</p>
              </div>
            </div>
            <Switch
              checked={overdueAlertEnabled}
              onCheckedChange={setOverdueAlertEnabled}
            />
          </div>
          {overdueAlertEnabled && (
            <div className="space-y-2 pl-3">
              <Label>Flag as overdue after</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={overdueThresholdDays}
                  onChange={(e) => setOverdueThresholdDays(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">day(s) without an assessment</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Plan per Severity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Action Plan by Severity
          </CardTitle>
          <CardDescription>
            Configure which actions are presented to staff based on the assessment outcome. These will appear under Actions when pain is detected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {([
            { label: 'Mild Pain', dotClass: 'bg-orange-400', actions: mildActions, setActions: setMildActions, customActions: mildCustomActions, setCustomActions: setMildCustomActions },
            { label: 'Moderate Pain', dotClass: 'bg-orange-600', actions: moderateActions, setActions: setModerateActions, customActions: moderateCustomActions, setCustomActions: setModerateCustomActions },
            { label: 'Severe Pain', dotClass: 'bg-destructive', actions: severeActions, setActions: setSevereActions, customActions: severeCustomActions, setCustomActions: setSevereCustomActions },
          ] as const).map((group) => (
            <div key={group.label} className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <div className={`w-3 h-3 rounded-full ${group.dotClass}`} />
                {group.label}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                {PREDEFINED_ACTIONS.map((action) => (
                  <div key={action.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${group.label}-${action.id}`}
                      checked={group.actions.includes(action.id)}
                      onCheckedChange={(checked) => {
                        group.setActions(prev =>
                          checked ? [...prev, action.id] : prev.filter(a => a !== action.id)
                        );
                      }}
                    />
                    <Label htmlFor={`${group.label}-${action.id}`} className="text-sm cursor-pointer">
                      {action.label}
                    </Label>
                  </div>
                ))}
              </div>
              {/* Custom "Other" actions */}
              <div className="pl-5 space-y-2">
                {group.customActions.map((custom, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={custom}
                      onChange={(e) => {
                        const updated = [...group.customActions];
                        updated[idx] = e.target.value;
                        group.setCustomActions(updated);
                      }}
                      placeholder="Other action..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => group.setCustomActions(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => group.setCustomActions(prev => [...prev, ''])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Other
                </Button>
              </div>
            </div>
          ))}
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
