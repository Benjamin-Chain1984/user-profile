/**
 * HealthMonitoringConfigSettings - Admin settings for health monitoring module
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Bell, AlertTriangle, Activity } from 'lucide-react';
import { useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { ModuleNotificationsCard, type ModuleNotificationSettings } from '@/components/module/ModuleNotificationsCard';

const configSchema = z.object({
  temperature_enabled: z.boolean(),
  bp_enabled: z.boolean(),
  oxygen_enabled: z.boolean(),
  heart_rate_enabled: z.boolean(),
  respiratory_enabled: z.boolean(),
  temperature_frequency_hours: z.number().nullable(),
  bp_frequency_hours: z.number().nullable(),
  oxygen_frequency_hours: z.number().nullable(),
  heart_rate_frequency_hours: z.number().nullable(),
  respiratory_frequency_hours: z.number().nullable(),
  amber_recheck_hours: z.number().min(1).max(24),
  enable_log_on_behalf: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface HealthMonitoringConfigSettingsProps {
  clientId?: string;
}

export function HealthMonitoringConfigSettings({ clientId }: HealthMonitoringConfigSettingsProps) {
  const { config, updateConfig, isUpdating } = useVitalSignConfig(clientId);
  const [showFrequency, setShowFrequency] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      temperature_enabled: config.temperature_enabled ?? true,
      bp_enabled: config.bp_enabled ?? true,
      oxygen_enabled: config.oxygen_enabled ?? true,
      heart_rate_enabled: config.heart_rate_enabled ?? true,
      respiratory_enabled: config.respiratory_enabled ?? true,
      temperature_frequency_hours: config.temperature_frequency_hours ?? null,
      bp_frequency_hours: config.bp_frequency_hours ?? null,
      oxygen_frequency_hours: config.oxygen_frequency_hours ?? null,
      heart_rate_frequency_hours: config.heart_rate_frequency_hours ?? null,
      respiratory_frequency_hours: config.respiratory_frequency_hours ?? null,
      amber_recheck_hours: config.amber_recheck_hours ?? 2,
      enable_log_on_behalf: config.enable_log_on_behalf ?? false,
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateConfig(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vitals Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Enabled Vital Signs
              </CardTitle>
              <CardDescription>
                Choose which vital signs to track for this individual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="temperature_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bp_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Blood Pressure</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oxygen_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Oxygen Saturation (SpO₂)</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heart_rate_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Heart Rate</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="respiratory_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Respiratory Rate</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="amber_recheck_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amber Alert Recheck Time</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          className="w-24"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                        />
                        <span className="text-sm text-muted-foreground">hours</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      When a vital enters Amber range, remind staff to recheck after this many hours
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Documentation Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Documentation Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="enable_log_on_behalf"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Log on Behalf of Another Staff Member</FormLabel>
                      <FormDescription>
                        Allow staff to record entries on behalf of other team members
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Form>

      {/* Note: Email notifications managed via Profile → Notification Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure alert recipients in Profile → Notification Contacts.
            Recipients will receive email alerts when vital signs enter Amber or Red ranges.
          </p>
        </CardContent>
      </Card>

      {/* Related Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Works Well With</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Pain Assessment</Badge>
            <Badge variant="outline">Fluid Balance</Badge>
            <Badge variant="outline">Weight & BMI</Badge>
            <Badge variant="outline">Health Prevention</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Safety Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">Clinical Safety Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                Standard clinical thresholds are pre-configured based on medical guidelines. 
                If this individual has Altered Criteria (custom thresholds) approved by a medical professional, 
                those will be applied automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
