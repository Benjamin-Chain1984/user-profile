/**
 * Catheter Config Settings - Admin configuration panel
 * Includes notification recipients and bag management settings.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import { BagManagementSettings } from './BagManagementSettings';
import { CatheterClinicalSettings } from './CatheterClinicalSettings';
import type { AlertSeverity } from '@/types/notificationContacts';

const MODULE_NAME = 'catheter';

interface CatheterConfigSettingsProps {
  clientId?: string;
}

export function CatheterConfigSettings({ clientId }: CatheterConfigSettingsProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Module alert recipients
  const { data: recipients } = useModuleAlertRecipients(MODULE_NAME, clientId);
  const setRecipients = useSetModuleAlertRecipients();

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

  const [localNotificationSettings, setLocalNotificationSettings] = useState<ModuleNotificationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const activeNotificationSettings = localNotificationSettings ?? notificationSettings;

  const handleNotificationSettingsChange = (settings: ModuleNotificationSettings) => {
    setLocalNotificationSettings(settings);
    setHasChanges(true);
  };

  const handleSave = () => {
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
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <RestrictedSection requiredRole="admin" message="Admin access required to configure catheter settings">
        {/* Info Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Catheter type, size, change interval, flush protocol, and all clinical configuration
            are managed here in <strong>Module Settings</strong> — the single source of truth for this module.
          </AlertDescription>
        </Alert>

        {/* Clinical Configuration */}
        <CatheterClinicalSettings clientId={clientId} disabled={!isAdmin} />

        {/* Bag Management Settings */}
        <BagManagementSettings clientId={clientId} />

        {/* Notification Recipients */}
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
          <Button onClick={handleSave} disabled={setRecipients.isPending}>
            {setRecipients.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        )}
      </RestrictedSection>
    </div>
  );
}
