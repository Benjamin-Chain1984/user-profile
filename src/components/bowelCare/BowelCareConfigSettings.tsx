/**
 * Bowel Care Configuration Settings - Admin-only settings panel
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { Switch } from '@/components/ui/switch';
import { useBowelCareConfig, usePrnMedications } from '@/hooks/useBowelCare';
import { useAuth } from '@/contexts/AuthContext';
import { AlertRecipientSelector } from '@/components/profile';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';
import { 
  Settings, 
  Pill, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Loader2, 
  Users,
  Scale,
  Droplets,
  Heart,
  Thermometer,
  Moon,
  Bell
} from 'lucide-react';
import type { BowelCareConfig, PrnMedication } from '@/types/bowelCare';

const RELATED_MODULES = [
  {
    id: 'weight',
    name: 'Weight Chart',
    description: 'Track weight changes that may indicate fluid or digestive issues',
    icon: Scale,
    path: '/module/weight'
  },
  {
    id: 'hydration',
    name: 'Hydration / Fluid Balance',
    description: 'Monitor fluid intake to support healthy bowel function',
    icon: Droplets,
    path: '/module/hydration'
  },
  {
    id: 'health-prevention',
    name: 'Health Prevention',
    description: 'Proactive health monitoring to catch early warning signs',
    icon: Heart,
    path: '/module/health-prevention'
  },
  {
    id: 'pain-assessment',
    name: 'Pain Assessment',
    description: 'Identify discomfort that may be related to bowel health',
    icon: Thermometer,
    path: '/module/pain-check'
  },
  {
    id: 'sleep',
    name: 'Sleep Chart',
    description: 'Quality sleep supports overall digestive health',
    icon: Moon,
    path: '/module/sleep'
  }
];

interface BowelCareConfigSettingsProps {
  clientId: string;
}

const MODULE_NAME = 'bowel-care';

export function BowelCareConfigSettings({ clientId }: BowelCareConfigSettingsProps) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const { config, updateConfig, isUpdating } = useBowelCareConfig(clientId);
  const { medications, addMedication, updateMedication, removeMedication, isAdding } = usePrnMedications(clientId);

  // Module alert recipients
  const { data: recipients } = useModuleAlertRecipients(MODULE_NAME, clientId);
  const setRecipients = useSetModuleAlertRecipients();

  // Compute recipients from database (no useState/useEffect to avoid infinite loops)
  const computedAmberRecipients = useMemo(() => {
    if (!recipients) return [];
    return recipients
      .filter((r) => r.alert_severity === 'amber')
      .map((r) => r.notification_contact_id);
  }, [recipients]);

  const computedRedRecipients = useMemo(() => {
    if (!recipients) return [];
    return recipients
      .filter((r) => r.alert_severity === 'red')
      .map((r) => r.notification_contact_id);
  }, [recipients]);

  // Local state for user modifications (only updates on user interaction)
  const [localAmberRecipients, setLocalAmberRecipients] = useState<string[] | null>(null);
  const [localRedRecipients, setLocalRedRecipients] = useState<string[] | null>(null);

  // Use local settings if user has made changes, otherwise use computed from DB
  const amberRecipients = localAmberRecipients ?? computedAmberRecipients;
  const redRecipients = localRedRecipients ?? computedRedRecipients;

  const setAmberRecipients = (ids: string[]) => setLocalAmberRecipients(ids);
  const setRedRecipients = (ids: string[]) => setLocalRedRecipients(ids);

  // Local state for form
  const [localConfig, setLocalConfig] = useState<Partial<BowelCareConfig>>({});
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [newMed, setNewMed] = useState<Partial<PrnMedication>>({
    medication_name: '',
    dose_instructions: '',
    route: 'oral',
    notes: '',
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleSaveConfig = () => {
    updateConfig(localConfig);
  };

  const handleAddMedication = () => {
    if (!newMed.medication_name || !newMed.dose_instructions) return;
    addMedication(newMed, {
      onSuccess: () => {
        setShowMedDialog(false);
        setNewMed({
          medication_name: '',
          dose_instructions: '',
          route: 'oral',
          notes: '',
        });
      },
    });
  };

  const handleSaveRecipients = () => {
    const allRecipients: { contactId: string; severity: AlertSeverity }[] = [
      ...amberRecipients.map((id) => ({ contactId: id, severity: 'amber' as AlertSeverity })),
      ...redRecipients.map((id) => ({ contactId: id, severity: 'red' as AlertSeverity })),
    ];
    setRecipients.mutate({
      moduleName: MODULE_NAME,
      clientId: clientId || null,
      recipients: allRecipients,
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Important</p>
          <p className="text-sm text-amber-700">
            Thresholds and PRN use should be defined by a GP or health practitioner.
          </p>
        </div>
      </div>

      {/* Documentation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Documentation Controls
          </CardTitle>
          <CardDescription>
            Configure logging options for staff documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestrictedSection requiredRole="admin">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label htmlFor="enable_log_on_behalf" className="font-medium">
                  Enable "Log on Behalf of Another Staff Member"
                </Label>
                <p className="text-xs text-muted-foreground max-w-md">
                  Use this option only when a staff member cannot log in themselves. 
                  All entries will be clearly marked as recorded on behalf of another person.
                </p>
              </div>
              <Switch
                id="enable_log_on_behalf"
                checked={localConfig.enable_log_on_behalf ?? false}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, enable_log_on_behalf: checked })
                }
                disabled={!isAdmin}
              />
            </div>
            {isAdmin && (
              <Button onClick={handleSaveConfig} disabled={isUpdating} className="mt-4">
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Documentation Settings
              </Button>
            )}
          </RestrictedSection>
        </CardContent>
      </Card>




      {/* Alert Notification Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alert Notification Recipients
          </CardTitle>
          <CardDescription>
            Select who should receive email notifications when alerts occur for this module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RestrictedSection requiredRole="admin">
            <AlertRecipientSelector
              moduleName={MODULE_NAME}
              severity="amber"
              selectedContactIds={amberRecipients}
              onSelectionChange={setAmberRecipients}
              clientId={clientId}
            />

            <AlertRecipientSelector
              moduleName={MODULE_NAME}
              severity="red"
              selectedContactIds={redRecipients}
              onSelectionChange={setRedRecipients}
              clientId={clientId}
              className="mt-6"
            />

            {isAdmin && (
              <Button
                onClick={handleSaveRecipients}
                disabled={setRecipients.isPending}
                variant="outline"
                className="w-full mt-4"
              >
                {setRecipients.isPending ? 'Saving...' : 'Save Alert Recipients'}
              </Button>
            )}
          </RestrictedSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Other Recommended Related Modules</CardTitle>
          <CardDescription>
            Comprehensive care involves monitoring multiple aspects of health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RELATED_MODULES.map((module) => (
              <Link 
                key={module.id} 
                to={module.path}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="p-2 rounded-md bg-primary/10">
                  <module.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{module.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Always consult a healthcare professional to ensure modules are clinically valid and set according to individual need.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
