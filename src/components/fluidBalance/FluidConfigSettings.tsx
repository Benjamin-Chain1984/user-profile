import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Settings, AlertTriangle, Info, Heart, Scale, Bell } from 'lucide-react';
import { FluidConfig } from '@/types/fluidBalance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { Separator } from '@/components/ui/separator';
import { AlertRecipientSelector } from '@/components/profile';
import { useModuleAlertRecipients, useSetModuleAlertRecipients } from '@/hooks/useNotificationContacts';
import type { AlertSeverity } from '@/types/notificationContacts';

interface FluidConfigSettingsProps {
  config: FluidConfig | null;
  onSave: (config: Partial<FluidConfig>) => Promise<void>;
  clientId?: string;
}

const MODULE_NAME = 'fluid-balance';

export const FluidConfigSettings: React.FC<FluidConfigSettingsProps> = ({
  config,
  onSave,
  clientId
}) => {
  // Module alert recipients state
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
  const form = useForm({
    defaultValues: {
      target_daily_intake_ml: config?.target_daily_intake_ml || 2000,
      enable_output_logging: config?.enable_output_logging ?? true,
      day_boundary_time: config?.day_boundary_time || '00:00',
      dehydration_threshold_ml: config?.dehydration_threshold_ml ?? 0,
      enable_balance_thresholds: config?.enable_balance_thresholds ?? true,
      overhydration_threshold_ml: config?.overhydration_threshold_ml || 1000,
      dehydration_warning_percent: config?.dehydration_warning_percent || 30,
      overhydration_warning_percent: config?.overhydration_warning_percent || 120,
      time_checkpoint_for_warning: config?.time_checkpoint_for_warning || '12:00',
      fluid_restriction_enabled: config?.fluid_restriction_enabled || false,
      max_fluid_allowance_ml: config?.max_fluid_allowance_ml || null,
      hard_stop_on_limit_exceeded: config?.hard_stop_on_limit_exceeded || false,
      escalation_recipients: config?.escalation_recipients || []
    }
  });
  
  const isRestricted = form.watch('fluid_restriction_enabled');
  const enableOutput = form.watch('enable_output_logging');
  
  const handleSubmit = async (data: any) => {
    await onSave(data);
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
    <RestrictedSection requiredRole="admin" message="Only administrators can modify fluid balance settings.">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium mb-1">Who can help set up this module?</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
              <li>Registered Nurse</li>
              <li>General Practitioner (GP)</li>
              <li>Dietitian</li>
            </ul>
          </CardContent>
        </Card>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Clinical Guidance</AlertTitle>
          <AlertDescription>
            Targets and thresholds should be set by a clinician, dietitian, or GP based on the individual's care plan.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Daily Intake Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="target_daily_intake_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Daily Intake (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 2000)}
                        />
                      </FormControl>
                      <FormDescription>
                        Recommended daily fluid intake. Default is 2000ml.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="day_boundary_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day Boundary Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the "day" starts for calculations. Default is midnight (00:00).
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Status Thresholds (Percentage-Based)
                </CardTitle>
                <CardDescription>
                  Configure when status indicators change to Amber or Red based on hydration percentage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dehydration_warning_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dehydration Warning (%) – Amber</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Trigger Amber status when intake falls below this % of target. Default: 30%
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="overhydration_warning_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhydration Warning (%) – Red</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 120)}
                        />
                      </FormControl>
                      <FormDescription>
                        Trigger Red status when intake exceeds this % of target. Default: 120%
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time_checkpoint_for_warning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dehydration Warning Time Checkpoint</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Low hydration warnings (Amber) only trigger after this time. Default: 12:00 (midday)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Output Logging</CardTitle>
                <CardDescription>
                  Enable to track fluid output and calculate balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enable_output_logging"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Enable Output Logging</FormLabel>
                        <FormDescription>
                          Track urine, vomit, drainage, and other fluid losses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {!enableOutput && (
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      With output logging disabled, only intake will be tracked. 
                      Fluid balance calculations will not be available.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {enableOutput && (
              <Card>
                <CardHeader>
                  <CardTitle>Balance Thresholds</CardTitle>
                  <CardDescription>
                    Set thresholds for dehydration and overhydration alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dehydration_threshold_ml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dehydration Threshold (ml)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => {
                              const val = e.target.value;
                              field.onChange(val === '' ? 0 : parseInt(val));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when balance falls below this value. Default: 0ml
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="overhydration_threshold_ml"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overhydration Threshold (ml)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 1000)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when balance exceeds this (positive value). Default: +1000ml
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
            
            <Card className={isRestricted ? 'border-amber-200' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={isRestricted ? 'h-5 w-5 text-amber-500' : 'h-5 w-5'} />
                  Fluid Restriction
                </CardTitle>
                <CardDescription>
                  Enable for individuals with medical fluid limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fluid_restriction_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Enable Fluid Restriction</FormLabel>
                        <FormDescription>
                          Limit daily fluid intake to a maximum allowance
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {isRestricted && (
                  <>
                    <FormField
                      control={form.control}
                      name="max_fluid_allowance_ml"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Daily Allowance (ml)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ''}
                              onChange={e => field.onChange(parseInt(e.target.value) || null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Daily fluid cap set by clinician
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </Form>
        
        <Separator />

        {/* Alert Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Alert Notification Recipients
            </CardTitle>
            <CardDescription>
              Select who should receive email notifications when alerts occur for this module.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            />

            <Button
              onClick={handleSaveRecipients}
              disabled={setRecipients.isPending}
              variant="outline"
              className="w-full"
            >
              {setRecipients.isPending ? 'Saving...' : 'Save Alert Recipients'}
            </Button>
          </CardContent>
        </Card>
        
        <Separator />
        
        {/* Related Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Modules</CardTitle>
            <CardDescription>
              Consider enabling these modules for comprehensive care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Scale className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Weight & BMI Monitoring</p>
                  <p className="text-xs text-muted-foreground">
                    Track weight changes alongside hydration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Continence Management</p>
                  <p className="text-xs text-muted-foreground">
                    Link hydration with continence care patterns
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RestrictedSection>
  );
};
