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

      {/* Constipation Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Constipation Triggers
          </CardTitle>
          <CardDescription>
            Define when PRN laxatives should be recommended
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestrictedSection requiredRole="admin">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="no_bm_days">Days without bowel movement</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="no_bm_days"
                    type="number"
                    min={1}
                    max={14}
                    value={localConfig.no_bm_days_threshold || 3}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, no_bm_days_threshold: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alert if no bowel movement for this many days
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type1_days">Consecutive hard stools (Type 1)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="type1_days"
                    type="number"
                    min={1}
                    max={7}
                    value={localConfig.type1_consecutive_days_threshold || 2}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, type1_consecutive_days_threshold: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">consecutive</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Type 1 = hard pellets, difficult to pass
                </p>
              </div>
            </div>
          </RestrictedSection>
        </CardContent>
      </Card>

      {/* PRN Monitoring & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>PRN Monitoring & Limits</CardTitle>
          <CardDescription>
            Configure monitoring periods and dose limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestrictedSection requiredRole="admin">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Monitor after PRN for</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={localConfig.monitor_hours_after_prn || 6}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, monitor_hours_after_prn: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Escalate if no BM after PRN</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={48}
                    value={localConfig.no_bm_after_prn_hours_escalation || 12}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, no_bm_after_prn_hours_escalation: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max PRN per 24 hours</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={localConfig.max_prn_doses_per_24h || 2}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, max_prn_doses_per_24h: Number(e.target.value) })
                  }
                  disabled={!isAdmin}
                  className="w-20"
                />
              </div>

              <div className="space-y-2">
                <Label>Lookback window</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={12}
                    max={72}
                    value={localConfig.prn_dose_lookback_window_hours || 48}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, prn_dose_lookback_window_hours: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max doses in window</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={localConfig.max_prn_doses_in_window || 3}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, max_prn_doses_in_window: Number(e.target.value) })
                  }
                  disabled={!isAdmin}
                  className="w-20"
                />
              </div>
            </div>

            {isAdmin && (
              <Button onClick={handleSaveConfig} disabled={isUpdating} className="mt-4">
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Configuration
              </Button>
            )}
          </RestrictedSection>
        </CardContent>
      </Card>

      {/* Diarrhoea Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Diarrhoea Monitoring</CardTitle>
          <CardDescription>
            Alert thresholds for loose stools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestrictedSection requiredRole="admin">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type 6-7 stools count</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={localConfig.diarrhoea_type67_count_threshold || 3}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, diarrhoea_type67_count_threshold: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">occurrences</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Within time window</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={12}
                    max={96}
                    value={localConfig.diarrhoea_hours_window || 48}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, diarrhoea_hours_window: Number(e.target.value) })
                    }
                    disabled={!isAdmin}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
            </div>
          </RestrictedSection>
        </CardContent>
      </Card>

      {/* PRN Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                PRN Medications
              </CardTitle>
              <CardDescription>
                Configure available laxative medications
              </CardDescription>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowMedDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No PRN medications configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{med.medication_name}</div>
                    <div className="text-sm text-muted-foreground">{med.dose_instructions}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {med.route && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {med.route}
                        </Badge>
                      )}
                      {med.notes && (
                        <span className="text-xs text-muted-foreground">{med.notes}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeMedication(med.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      <Dialog open={showMedDialog} onOpenChange={setShowMedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add PRN Medication</DialogTitle>
            <DialogDescription>
              Configure a new laxative medication for this person
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Medication Name *</Label>
              <Input
                value={newMed.medication_name}
                onChange={(e) => setNewMed({ ...newMed, medication_name: e.target.value })}
                placeholder="e.g., Movicol, Lactulose"
              />
            </div>

            <div className="space-y-2">
              <Label>Dose Instructions *</Label>
              <Input
                value={newMed.dose_instructions}
                onChange={(e) => setNewMed({ ...newMed, dose_instructions: e.target.value })}
                placeholder="e.g., 1 sachet in 125ml water"
              />
            </div>

            <div className="space-y-2">
              <Label>Route</Label>
              <Select
                value={newMed.route || 'oral'}
                onValueChange={(v) => setNewMed({ ...newMed, route: v as PrnMedication['route'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="peg">PEG (Tube)</SelectItem>
                  <SelectItem value="rectal">Rectal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={newMed.notes || ''}
                onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                placeholder="Any additional instructions..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMedication}
              disabled={!newMed.medication_name || !newMed.dose_instructions || isAdding}
            >
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        </CardContent>
      </Card>
    </div>
  );
}
