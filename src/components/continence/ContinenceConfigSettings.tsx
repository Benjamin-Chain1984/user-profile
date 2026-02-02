/**
 * Continence Config Settings - Admin configuration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useContinenceConfig } from '@/hooks/useContinence';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';
import {
  SCHEDULE_TYPES,
  UTI_FREQUENCIES,
  ScheduleType,
  UTITestingFrequency,
} from '@/types/continence';
import { Clock, TestTube, Droplets, Package, Save, X, Plus } from 'lucide-react';

const MODULE_NAME = 'continence';

interface ContinenceConfigSettingsProps {
  clientId?: string;
}

export function ContinenceConfigSettings({ clientId }: ContinenceConfigSettingsProps) {
  const { config, loading, updateConfig } = useContinenceConfig(clientId);
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

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

  const [scheduleType, setScheduleType] = useState<ScheduleType>('as_required');
  const [fixedTimes, setFixedTimes] = useState<string[]>([]);
  const [intervalHours, setIntervalHours] = useState(4);
  const [enableUTI, setEnableUTI] = useState(false);
  const [enableHydration, setEnableHydration] = useState(false);
  const [enableConsumables, setEnableConsumables] = useState(false);
  const [utiFrequency, setUtiFrequency] = useState<UTITestingFrequency>('if_symptoms');
  const [newTime, setNewTime] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setScheduleType(config.schedule_type as ScheduleType);
      setFixedTimes(config.fixed_times || []);
      setIntervalHours(config.interval_hours || 4);
      setEnableUTI(config.enable_uti_testing);
      setEnableHydration(config.enable_hydration_link);
      setEnableConsumables(config.enable_consumables_monitoring);
      setUtiFrequency(config.uti_testing_frequency as UTITestingFrequency);
      setHasChanges(false);
    }
  }, [config]);

  const markChanged = () => setHasChanges(true);

  const addFixedTime = () => {
    if (newTime && !fixedTimes.includes(newTime)) {
      setFixedTimes([...fixedTimes, newTime].sort());
      setNewTime('');
      markChanged();
    }
  };

  const removeFixedTime = (time: string) => {
    setFixedTimes(fixedTimes.filter((t) => t !== time));
    markChanged();
  };

  const handleNotificationSettingsChange = (settings: ModuleNotificationSettings) => {
    setNotificationSettings(settings);
    setHasChanges(true);
  };

  const handleSaveRecipients = () => {
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
    await updateConfig.mutateAsync({
      schedule_type: scheduleType,
      fixed_times: fixedTimes,
      interval_hours: intervalHours,
      enable_uti_testing: enableUTI,
      enable_hydration_link: enableHydration,
      enable_consumables_monitoring: enableConsumables,
      uti_testing_frequency: utiFrequency,
    });
    // Also save notification recipients
    handleSaveRecipients();
    setHasChanges(false);
  };

  const handleReset = () => {
    if (config) {
      setScheduleType(config.schedule_type as ScheduleType);
      setFixedTimes(config.fixed_times || []);
      setIntervalHours(config.interval_hours || 4);
      setEnableUTI(config.enable_uti_testing);
      setEnableHydration(config.enable_hydration_link);
      setEnableConsumables(config.enable_consumables_monitoring);
      setUtiFrequency(config.uti_testing_frequency as UTITestingFrequency);
      setHasChanges(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Pad Change Schedule */}
      <RestrictedSection requiredRole="admin">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pad Change Schedule
            </CardTitle>
            <CardDescription>
              Configure when pad changes should be performed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Schedule Type */}
            <div className="space-y-3">
              <Label>Schedule Type</Label>
              <div className="grid gap-3">
                {SCHEDULE_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      scheduleType === type.value
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setScheduleType(type.value);
                      markChanged();
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                      scheduleType === type.value
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Times */}
            {scheduleType === 'fixed_times' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label>Scheduled Times</Label>
                <div className="flex flex-wrap gap-2">
                  {fixedTimes.map((time) => (
                    <Badge key={time} variant="secondary" className="gap-1 py-1.5">
                      {time}
                      <button
                        onClick={() => removeFixedTime(time)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-32"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addFixedTime}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Hourly Interval */}
            {scheduleType === 'hourly' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label htmlFor="intervalHours">Interval (hours)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="intervalHours"
                    type="number"
                    min={1}
                    max={24}
                    value={intervalHours}
                    onChange={(e) => {
                      setIntervalHours(parseInt(e.target.value) || 4);
                      markChanged();
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Every {intervalHours} hour{intervalHours !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </RestrictedSection>

      {/* Optional Features */}
      <RestrictedSection requiredRole="admin">
        <Card>
          <CardHeader>
            <CardTitle>Optional Features</CardTitle>
            <CardDescription>
              Enable additional monitoring features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* UTI Testing */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <TestTube className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">UTI Testing</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable urinary tract infection test logging and monitoring
                  </p>
                </div>
              </div>
              <Switch
                checked={enableUTI}
                onCheckedChange={(checked) => {
                  setEnableUTI(checked);
                  markChanged();
                }}
              />
            </div>

            {/* UTI Frequency (if enabled) */}
            {enableUTI && (
              <div className="ml-8 p-4 bg-muted/50 rounded-lg space-y-2">
                <Label>Testing Frequency</Label>
                <Select
                  value={utiFrequency}
                  onValueChange={(v) => {
                    setUtiFrequency(v as UTITestingFrequency);
                    markChanged();
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UTI_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hydration Link */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Hydration / Fluid Balance Link</Label>
                  <p className="text-sm text-muted-foreground">
                    Link to Fluid Balance module for cross-reference
                  </p>
                </div>
              </div>
              <Switch
                checked={enableHydration}
                onCheckedChange={(checked) => {
                  setEnableHydration(checked);
                  markChanged();
                }}
              />
            </div>

            {/* Consumables Monitoring */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-base">Consumables Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Track stock levels for continence supplies
                  </p>
                </div>
              </div>
              <Switch
                checked={enableConsumables}
                onCheckedChange={(checked) => {
                  setEnableConsumables(checked);
                  markChanged();
                }}
              />
            </div>
          </CardContent>
        </Card>
      </RestrictedSection>

      {/* Notification Recipients - Centralized */}
      <ModuleNotificationsCard
        moduleName={MODULE_NAME}
        moduleDisplayName="Continence Management"
        settings={notificationSettings}
        onSettingsChange={handleNotificationSettingsChange}
        clientId={clientId}
        disabled={!isAdmin}
      />

      {/* Save/Reset Buttons */}
      {isAdmin && hasChanges && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={updateConfig.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {updateConfig.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
