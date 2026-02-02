/**
 * ModuleNotificationsCard - Reusable notification settings card for all modules
 * Selects recipients from centralized Profile Notification Contacts
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertRecipientSelector } from '@/components/profile/AlertRecipientSelector';
import { Bell, Mail } from 'lucide-react';

export interface ModuleNotificationSettings {
  enableNotifications: boolean;
  amberRecipientIds: string[];
  redRecipientIds: string[];
}

interface ModuleNotificationsCardProps {
  moduleName: string;
  moduleDisplayName: string;
  settings: ModuleNotificationSettings;
  onSettingsChange: (settings: ModuleNotificationSettings) => void;
  clientId?: string;
  disabled?: boolean;
}

export function ModuleNotificationsCard({
  moduleName,
  moduleDisplayName,
  settings,
  onSettingsChange,
  clientId,
  disabled = false,
}: ModuleNotificationsCardProps) {
  const handleToggleNotifications = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enableNotifications: enabled,
    });
  };

  const handleAmberRecipientsChange = (contactIds: string[]) => {
    onSettingsChange({
      ...settings,
      amberRecipientIds: contactIds,
    });
  };

  const handleRedRecipientsChange = (contactIds: string[]) => {
    onSettingsChange({
      ...settings,
      redRecipientIds: contactIds,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Configure who receives email alerts for {moduleDisplayName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <Label className="text-base">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email alerts when thresholds are triggered
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={handleToggleNotifications}
            disabled={disabled}
          />
        </div>

        {/* Recipients Selection (shown when enabled) */}
        {settings.enableNotifications && (
          <div className="space-y-6 pt-2">
            {/* Amber Alert Recipients */}
            <AlertRecipientSelector
              moduleName={moduleName}
              severity="amber"
              selectedContactIds={settings.amberRecipientIds}
              onSelectionChange={handleAmberRecipientsChange}
              clientId={clientId}
            />

            {/* Red Alert Recipients */}
            <AlertRecipientSelector
              moduleName={moduleName}
              severity="red"
              selectedContactIds={settings.redRecipientIds}
              onSelectionChange={handleRedRecipientsChange}
              clientId={clientId}
            />

            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>
                <strong>Amber alerts:</strong> {settings.amberRecipientIds.length} recipient(s) selected
              </p>
              <p>
                <strong>Red alerts:</strong> {settings.redRecipientIds.length} recipient(s) selected
              </p>
              <p className="mt-2 text-xs">
                Recipients are managed in Profile → Notification Contacts
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
