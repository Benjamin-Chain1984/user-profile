/**
 * HealthMonitoringConfigSettings - Admin settings for health monitoring module
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  User, Bell, AlertTriangle, Activity, Settings, ShieldAlert, 
  Thermometer, Heart, Wind, Gauge, Clock, Scale, Droplets, Moon, Stethoscope
} from 'lucide-react';
import { useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { AlteredCriteriaSettings } from './AlteredCriteriaSettings';
import { MONITORING_FREQUENCIES } from '@/types/ideal';
import { cn } from '@/lib/utils';

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

interface VitalConfigCardProps {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  frequencyHours: number | null;
  onFrequencyChange: (hours: number | null) => void;
  enableAlteredCriteria?: boolean;
  hasAlteredCriteria?: boolean;
}

function VitalConfigCard({ 
  title, 
  icon, 
  enabled, 
  onEnabledChange, 
  frequencyHours, 
  onFrequencyChange,
  hasAlteredCriteria 
}: VitalConfigCardProps) {
  // Convert hours to frequency value
  const getFrequencyValue = (hours: number | null): string => {
    if (hours === null) return 'as_needed';
    const freq = MONITORING_FREQUENCIES.find(f => f.hours === hours);
    return freq?.value || 'daily';
  };

  // Convert frequency value to hours
  const getHoursFromFrequency = (value: string): number | null => {
    const freq = MONITORING_FREQUENCIES.find(f => f.value === value);
    return freq?.hours ?? null;
  };

  return (
    <Card className={cn(
      'transition-all',
      enabled ? 'border-primary/30 bg-primary/5' : 'opacity-60'
    )}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {icon}
            </div>
            <div>
              <p className="font-medium">{title}</p>
              {hasAlteredCriteria && (
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                  Altered Criteria Active
                </Badge>
              )}
            </div>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={onEnabledChange}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {enabled && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monitoring Frequency</span>
            </div>
            <Select
              value={getFrequencyValue(frequencyHours)}
              onValueChange={(value) => onFrequencyChange(getHoursFromFrequency(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {MONITORING_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface HealthMonitoringConfigSettingsProps {
  clientId?: string;
}

export function HealthMonitoringConfigSettings({ clientId }: HealthMonitoringConfigSettingsProps) {
  const { config, updateConfig, isUpdating } = useVitalSignConfig(clientId);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      temperature_enabled: config.temperature_enabled ?? true,
      bp_enabled: config.bp_enabled ?? true,
      oxygen_enabled: config.oxygen_enabled ?? true,
      heart_rate_enabled: config.heart_rate_enabled ?? true,
      respiratory_enabled: config.respiratory_enabled ?? true,
      temperature_frequency_hours: config.temperature_frequency_hours ?? 24,
      bp_frequency_hours: config.bp_frequency_hours ?? 24,
      oxygen_frequency_hours: config.oxygen_frequency_hours ?? 24,
      heart_rate_frequency_hours: config.heart_rate_frequency_hours ?? 24,
      respiratory_frequency_hours: config.respiratory_frequency_hours ?? 24,
      amber_recheck_hours: config.amber_recheck_hours ?? 2,
      enable_log_on_behalf: config.enable_log_on_behalf ?? false,
    },
  });

  // Reset form when config changes
  useEffect(() => {
    form.reset({
      temperature_enabled: config.temperature_enabled ?? true,
      bp_enabled: config.bp_enabled ?? true,
      oxygen_enabled: config.oxygen_enabled ?? true,
      heart_rate_enabled: config.heart_rate_enabled ?? true,
      respiratory_enabled: config.respiratory_enabled ?? true,
      temperature_frequency_hours: config.temperature_frequency_hours ?? 24,
      bp_frequency_hours: config.bp_frequency_hours ?? 24,
      oxygen_frequency_hours: config.oxygen_frequency_hours ?? 24,
      heart_rate_frequency_hours: config.heart_rate_frequency_hours ?? 24,
      respiratory_frequency_hours: config.respiratory_frequency_hours ?? 24,
      amber_recheck_hours: config.amber_recheck_hours ?? 2,
      enable_log_on_behalf: config.enable_log_on_behalf ?? false,
    });
  }, [config, form]);

  const watchedValues = form.watch();

  const onSubmit = (data: ConfigFormData) => {
    updateConfig(data);
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          General Settings
        </TabsTrigger>
        <TabsTrigger value="altered-criteria" className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Altered Criteria
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vitals Configuration with Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vital Signs Configuration
                </CardTitle>
                <CardDescription>
                  Enable or disable vital signs and set monitoring frequency for each
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <VitalConfigCard
                  title="Temperature"
                  icon={<Thermometer className="h-5 w-5" />}
                  enabled={watchedValues.temperature_enabled}
                  onEnabledChange={(val) => form.setValue('temperature_enabled', val)}
                  frequencyHours={watchedValues.temperature_frequency_hours}
                  onFrequencyChange={(val) => form.setValue('temperature_frequency_hours', val)}
                />

                <VitalConfigCard
                  title="Blood Pressure"
                  icon={<Heart className="h-5 w-5" />}
                  enabled={watchedValues.bp_enabled}
                  onEnabledChange={(val) => form.setValue('bp_enabled', val)}
                  frequencyHours={watchedValues.bp_frequency_hours}
                  onFrequencyChange={(val) => form.setValue('bp_frequency_hours', val)}
                />

                <VitalConfigCard
                  title="Oxygen Saturation (SpO₂)"
                  icon={<Gauge className="h-5 w-5" />}
                  enabled={watchedValues.oxygen_enabled}
                  onEnabledChange={(val) => form.setValue('oxygen_enabled', val)}
                  frequencyHours={watchedValues.oxygen_frequency_hours}
                  onFrequencyChange={(val) => form.setValue('oxygen_frequency_hours', val)}
                />

                <VitalConfigCard
                  title="Heart Rate"
                  icon={<Activity className="h-5 w-5" />}
                  enabled={watchedValues.heart_rate_enabled}
                  onEnabledChange={(val) => form.setValue('heart_rate_enabled', val)}
                  frequencyHours={watchedValues.heart_rate_frequency_hours}
                  onFrequencyChange={(val) => form.setValue('heart_rate_frequency_hours', val)}
                />

                <VitalConfigCard
                  title="Respiratory Rate"
                  icon={<Wind className="h-5 w-5" />}
                  enabled={watchedValues.respiratory_enabled}
                  onEnabledChange={(val) => form.setValue('respiratory_enabled', val)}
                  frequencyHours={watchedValues.respiratory_frequency_hours}
                  onFrequencyChange={(val) => form.setValue('respiratory_frequency_hours', val)}
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
      </TabsContent>

      <TabsContent value="altered-criteria">
        <AlteredCriteriaSettings clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
}