/**
 * Sleep Configuration Settings - Admin-only settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { AlertRecipientSelector } from '@/components/profile';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import { useSleepConfig } from '@/hooks/useSleep';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Settings, Loader2, Bell } from 'lucide-react';
import type { AlertSeverity } from '@/types/notificationContacts';

interface SleepConfigSettingsProps {
  clientId?: string;
}

export function SleepConfigSettings({ clientId }: SleepConfigSettingsProps) {
  const { config, isLoading, updateConfig, isUpdating } = useSleepConfig(clientId);
  const { profile } = useProfile();

  const [minSleep, setMinSleep] = useState(7);
  const [disruptionThreshold, setDisruptionThreshold] = useState(3);
  const [poorSleep, setPoorSleep] = useState(5);
  const [consecutiveDays, setConsecutiveDays] = useState(3);

  useEffect(() => {
    if (config) {
      setMinSleep(config.min_expected_sleep_hours ?? 7);
      setDisruptionThreshold(config.disruption_threshold ?? 3);
      setPoorSleep(config.poor_sleep_threshold_hours ?? 5);
      setConsecutiveDays(config.consecutive_disruption_alert_days ?? 3);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      min_expected_sleep_hours: minSleep,
      disruption_threshold: disruptionThreshold,
      poor_sleep_threshold_hours: poorSleep,
      consecutive_disruption_alert_days: consecutiveDays,
    });
  };

  // Alert recipients
  const { data: amberRecipients = [] } = useModuleAlertRecipients('sleep', clientId);
  const { data: redRecipients = [] } = useModuleAlertRecipients('sleep', clientId);
  const setRecipients = useSetModuleAlertRecipients();

  const amberContactIds = amberRecipients
    .filter(r => r.alert_severity === 'amber')
    .map(r => r.notification_contact_id);

  const redContactIds = redRecipients
    .filter(r => r.alert_severity === 'red')
    .map(r => r.notification_contact_id);

  const handleAmberChange = (contactIds: string[]) => {
    const redKeep = redRecipients
      .filter(r => r.alert_severity === 'red')
      .map(r => ({ contactId: r.notification_contact_id, severity: 'red' as AlertSeverity }));
    const amberNew = contactIds.map(id => ({ contactId: id, severity: 'amber' as AlertSeverity }));
    setRecipients.mutate({ moduleName: 'sleep', clientId: clientId || null, recipients: [...amberNew, ...redKeep] });
  };

  const handleRedChange = (contactIds: string[]) => {
    const amberKeep = amberRecipients
      .filter(r => r.alert_severity === 'amber')
      .map(r => ({ contactId: r.notification_contact_id, severity: 'amber' as AlertSeverity }));
    const redNew = contactIds.map(id => ({ contactId: id, severity: 'red' as AlertSeverity }));
    setRecipients.mutate({ moduleName: 'sleep', clientId: clientId || null, recipients: [...amberKeep, ...redNew] });
  };

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading settings...</CardContent></Card>;
  }

  return (
    <RestrictedSection requiredRole="admin">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sleep Threshold Configuration
            </CardTitle>
            <CardDescription>Define alert thresholds for sleep monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Expected Sleep (hrs)</Label>
                <Input type="number" step="0.5" min="1" max="12" value={minSleep} onChange={e => setMinSleep(parseFloat(e.target.value))} />
                <p className="text-xs text-muted-foreground">Below this → Amber alert</p>
              </div>
              <div className="space-y-2">
                <Label>Poor Sleep Threshold (hrs)</Label>
                <Input type="number" step="0.5" min="1" max="12" value={poorSleep} onChange={e => setPoorSleep(parseFloat(e.target.value))} />
                <p className="text-xs text-muted-foreground">Below this → Red alert</p>
              </div>
              <div className="space-y-2">
                <Label>Disruption Threshold (awakenings)</Label>
                <Input type="number" min="1" max="20" value={disruptionThreshold} onChange={e => setDisruptionThreshold(parseInt(e.target.value))} />
                <p className="text-xs text-muted-foreground">At or above → Amber alert</p>
              </div>
              <div className="space-y-2">
                <Label>Consecutive Disrupted Nights</Label>
                <Input type="number" min="1" max="14" value={consecutiveDays} onChange={e => setConsecutiveDays(parseInt(e.target.value))} />
                <p className="text-xs text-muted-foreground">Triggers escalation alert</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Recipients
            </CardTitle>
            <CardDescription>Select who receives sleep alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Amber Alert Recipients (Monitor)</Label>
              <AlertRecipientSelector
                moduleName="sleep"
                severity="amber"
                selectedContactIds={amberContactIds}
                onSelectionChange={handleAmberChange}
                clientId={clientId}
              />
            </div>
            <div>
              <Label className="mb-2 block">Red Alert Recipients (Action Needed)</Label>
              <AlertRecipientSelector
                moduleName="sleep"
                severity="red"
                selectedContactIds={redContactIds}
                onSelectionChange={handleRedChange}
                clientId={clientId}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </RestrictedSection>
  );
}
