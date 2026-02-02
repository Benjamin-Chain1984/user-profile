/**
 * Catheter Config Settings - Admin configuration panel
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useAuth } from '@/contexts/AuthContext';
import { useCatheterConfig } from '@/hooks/useCatheter';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';
import { CATHETER_TYPES, CATHETER_TYPE_CONFIG, BAG_TYPES, CHANGE_FREQUENCY_OPTIONS, FLUSH_FREQUENCY_OPTIONS, type CatheterType, type BagType } from '@/types/catheter';

const MODULE_NAME = 'catheter';

interface CatheterConfigSettingsProps {
  clientId?: string;
}

export function CatheterConfigSettings({ clientId }: CatheterConfigSettingsProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const { config, loading, updateConfig } = useCatheterConfig(clientId);

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

  const [catheterType, setCatheterType] = useState<CatheterType>('idc');
  const [catheterSize, setCatheterSize] = useState('');
  const [changeFrequency, setChangeFrequency] = useState(28);
  const [flushFrequency, setFlushFrequency] = useState<number | null>(24);
  const [enableFlushTracking, setEnableFlushTracking] = useState(true);
  const [enableStomaChecks, setEnableStomaChecks] = useState(false);
  const [enableAD, setEnableAD] = useState(false);
  const [bagTypes, setBagTypes] = useState<BagType[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const typeConfig = CATHETER_TYPE_CONFIG[catheterType];

  useEffect(() => {
    if (config) {
      setCatheterType(config.catheter_type);
      setCatheterSize(config.catheter_size || '');
      setChangeFrequency(config.change_frequency_days);
      setFlushFrequency(config.flush_frequency_hours);
      setEnableFlushTracking(config.enable_flush_tracking);
      setEnableStomaChecks(config.enable_stoma_checks);
      setEnableAD(config.enable_autonomic_dysreflexia_risk);
      setBagTypes(config.bag_types as BagType[]);
    }
  }, [config]);

  useEffect(() => {
    if (!config) {
      setHasChanges(true);
      return;
    }
    const changed = catheterType !== config.catheter_type ||
      catheterSize !== (config.catheter_size || '') ||
      changeFrequency !== config.change_frequency_days ||
      flushFrequency !== config.flush_frequency_hours ||
      enableFlushTracking !== config.enable_flush_tracking ||
      enableStomaChecks !== config.enable_stoma_checks ||
      enableAD !== config.enable_autonomic_dysreflexia_risk ||
      JSON.stringify(bagTypes) !== JSON.stringify(config.bag_types);
    setHasChanges(changed);
  }, [config, catheterType, catheterSize, changeFrequency, flushFrequency, enableFlushTracking, enableStomaChecks, enableAD, bagTypes]);

  const handleNotificationSettingsChange = (settings: ModuleNotificationSettings) => {
    setLocalNotificationSettings(settings);
    setHasChanges(true);
  };

  const handleSaveRecipients = () => {
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
    await updateConfig.mutateAsync({
      catheter_type: catheterType,
      catheter_size: catheterSize || null,
      change_frequency_days: changeFrequency,
      flush_frequency_hours: flushFrequency,
      enable_flush_tracking: enableFlushTracking,
      enable_stoma_checks: enableStomaChecks,
      enable_autonomic_dysreflexia_risk: enableAD,
      bag_types: bagTypes,
    });
    // Also save notification recipients
    handleSaveRecipients();
    setHasChanges(false);
  };

  const toggleBagType = (bt: BagType) => {
    setBagTypes(prev => prev.includes(bt) ? prev.filter(b => b !== bt) : [...prev, bt]);
  };

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <RestrictedSection requiredRole="admin" message="Admin access required to configure catheter settings">
        <Card>
          <CardHeader>
            <CardTitle>Catheter Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Catheter Type */}
            <div className="space-y-2">
              <Label>Catheter Type</Label>
              <Select value={catheterType} onValueChange={(v) => { setCatheterType(v as CatheterType); setBagTypes([]); }} disabled={!isAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATHETER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            {typeConfig.sizeOptions.length > 0 && (
              <div className="space-y-2">
                <Label>{typeConfig.sizeLabel}</Label>
                <Select value={catheterSize} onValueChange={setCatheterSize} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {typeConfig.sizeOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Change Frequency */}
            <div className="space-y-2">
              <Label>Change Frequency</Label>
              <Select value={String(changeFrequency)} onValueChange={(v) => setChangeFrequency(Number(v))} disabled={!isAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANGE_FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Flush Settings */}
            {typeConfig.enableFlushTracking && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Flush Tracking</Label>
                  <Switch checked={enableFlushTracking} onCheckedChange={setEnableFlushTracking} disabled={!isAdmin} />
                </div>
                {enableFlushTracking && (
                  <div className="space-y-2">
                    <Label>Flush Frequency</Label>
                    <Select value={String(flushFrequency || '')} onValueChange={(v) => setFlushFrequency(Number(v))} disabled={!isAdmin}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FLUSH_FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Stoma Checks */}
            {typeConfig.enableStomaChecks && (
              <div className="flex items-center justify-between">
                <Label>Enable Stoma Checks</Label>
                <Switch checked={enableStomaChecks} onCheckedChange={setEnableStomaChecks} disabled={!isAdmin} />
              </div>
            )}

            {/* Bag Types */}
            {typeConfig.allowedBagTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Allowed Bag Types</Label>
                <div className="flex flex-wrap gap-2">
                  {typeConfig.allowedBagTypes.map(bt => {
                    const label = BAG_TYPES.find(b => b.value === bt)?.label || bt;
                    const selected = bagTypes.includes(bt);
                    return (
                      <Badge key={bt} variant={selected ? 'default' : 'outline'} className="cursor-pointer" onClick={() => isAdmin && toggleBagType(bt)}>
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AD Risk */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Autonomic Dysreflexia Risk</Label>
                <p className="text-sm text-muted-foreground">Show emergency action plan</p>
              </div>
              <Switch checked={enableAD} onCheckedChange={setEnableAD} disabled={!isAdmin} />
            </div>
          </CardContent>
        </Card>

        {/* Notification Recipients - Centralized */}
        <ModuleNotificationsCard
          moduleName={MODULE_NAME}
          moduleDisplayName="Catheter Management"
          settings={activeNotificationSettings}
          onSettingsChange={handleNotificationSettingsChange}
          clientId={clientId}
          disabled={!isAdmin}
        />

        {/* Save */}
        {isAdmin && hasChanges && (
          <Button onClick={handleSave} disabled={updateConfig.isPending}>
            {updateConfig.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        )}
      </RestrictedSection>
    </div>
  );
}
