import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePainConfig } from '@/hooks/usePainConfig';
import { ASSESSMENT_TRIGGER_LABELS, AssessmentTrigger } from '@/types/painAssessment';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';
import { Settings, Clock, Save, AlertTriangle } from 'lucide-react';

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
  
  const [notificationSettings, setNotificationSettings] = useState<ModuleNotificationSettings>({
    enableNotifications: false,
    amberRecipientIds: [],
    redRecipientIds: [],
  });

  // Initialize recipients from database
  useEffect(() => {
    if (recipients) {
      setNotificationSettings({
        enableNotifications: recipients.length > 0,
        amberRecipientIds: recipients
          .filter((r) => r.alert_severity === 'amber')
          .map((r) => r.notification_contact_id),
        redRecipientIds: recipients
          .filter((r) => r.alert_severity === 'red')
          .map((r) => r.notification_contact_id),
      });
    }
  }, [recipients]);

  const [triggers, setTriggers] = useState<AssessmentTrigger[]>(effectiveConfig.assessment_triggers);
  const [customTrigger, setCustomTrigger] = useState(effectiveConfig.custom_trigger_text || '');
  const [mildHours, setMildHours] = useState(effectiveConfig.mild_reassess_hours);
  const [moderateHours, setModerateHours] = useState(effectiveConfig.moderate_reassess_hours);
  const [severeHours, setSevereHours] = useState(effectiveConfig.severe_reassess_hours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setTriggers(config.assessment_triggers);
      setCustomTrigger(config.custom_trigger_text || '');
      setMildHours(config.mild_reassess_hours);
      setModerateHours(config.moderate_reassess_hours);
      setSevereHours(config.severe_reassess_hours);
    }
  }, [config]);

  const handleTriggerToggle = (trigger: AssessmentTrigger) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleNotificationSettingsChange = (settings: ModuleNotificationSettings) => {
    setNotificationSettings(settings);
  };

  const handleSaveNotifications = () => {
    const allRecipients: { contactId: string; severity: AlertSeverity }[] = [
      ...notificationSettings.amberRecipientIds.map((id) => ({ contactId: id, severity: 'amber' as AlertSeverity })),
      ...notificationSettings.redRecipientIds.map((id) => ({ contactId: id, severity: 'red' as AlertSeverity })),
    ];
    setRecipients.mutate({
      moduleName: MODULE_NAME,
      clientId: clientId || null,
      recipients: allRecipients,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveConfig({
      assessment_triggers: triggers,
      custom_trigger_text: triggers.includes('other') ? customTrigger : null,
      mild_reassess_hours: mildHours,
      moderate_reassess_hours: moderateHours,
      severe_reassess_hours: severeHours,
      mild_alert_recipients: [], // Recipients are now managed centrally
      moderate_alert_recipients: [],
      severe_alert_recipients: [],
    });
    // Also save notification recipients
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
          <p className="text-sm text-muted-foreground">Configure when and how the Abbey Pain Scale is used</p>
        </div>
      </div>

      {/* Assessment Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            When Should the Assessment Be Completed?
          </CardTitle>
          <CardDescription>
            Select all triggers that should prompt a pain assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(ASSESSMENT_TRIGGER_LABELS) as AssessmentTrigger[]).map((trigger) => (
            <div key={trigger} className="flex items-center space-x-3">
              <Checkbox
                id={`trigger-${trigger}`}
                checked={triggers.includes(trigger)}
                onCheckedChange={() => handleTriggerToggle(trigger)}
              />
              <Label htmlFor={`trigger-${trigger}`} className="cursor-pointer">
                {ASSESSMENT_TRIGGER_LABELS[trigger]}
              </Label>
            </div>
          ))}
          
          {triggers.includes('other') && (
            <div className="ml-6 mt-2">
              <Textarea
                value={customTrigger}
                onChange={(e) => setCustomTrigger(e.target.value)}
                placeholder="Describe custom trigger..."
                rows={2}
              />
            </div>
          )}
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
                Mild Pain (3-7)
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
                Moderate Pain (8-13)
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
                Severe Pain (14+)
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
        settings={notificationSettings}
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
