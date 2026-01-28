/**
 * Weight & BMI Config Settings - Admin configuration panel
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { RestrictedSection } from '@/components/ui/restricted-section';
import { useWeightBmi } from '@/hooks/useWeightBmi';
import { calculateHeightFromKneeHeight } from '@/utils/weightBmiCalculator';
import { 
  HEIGHT_METHOD_LABELS, 
  FREQUENCY_LABELS,
  type HeightMethod,
  type MonitoringFrequency 
} from '@/types/weightBmi';
import { Settings, HelpCircle, Scale, Ruler, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const configSchema = z.object({
  baseline_weight_kg: z.number().optional().nullable(),
  monitoring_frequency: z.enum(['weekly', 'fortnightly', 'monthly']),
  min_target_weight_kg: z.number().optional().nullable(),
  max_target_weight_kg: z.number().optional().nullable(),
  target_range_alert_severity: z.enum(['amber', 'red']),
  enable_rapid_change_alert: z.boolean(),
  rapid_change_threshold_kg: z.number().min(0.5).max(10),
  rapid_change_window_days: z.number().min(1).max(30),
  height_cm: z.number().optional().nullable(),
  height_method: z.enum(['standing', 'arm_span', 'knee_height', 'demispan', 'historical', 'unknown']),
  height_is_estimate: z.boolean(),
  height_method_notes: z.string().optional().nullable(),
  knee_height_cm: z.number().optional().nullable(),
  knee_height_sex: z.enum(['male', 'female', 'unknown']).optional().nullable(),
  enable_trend_graph: z.boolean(),
  overdue_escalation_cycles: z.number().min(1).max(5)
});

type ConfigFormData = z.infer<typeof configSchema>;

interface WeightBmiConfigSettingsProps {
  clientId?: string;
}

// Related modules for holistic care
const RELATED_MODULES = [
  { id: 'enteral', name: 'Enteral Nutrition', description: 'Tube feeding tracking affects weight' },
  { id: 'constipation', name: 'Bowel Care', description: 'Weight changes can indicate bowel issues' },
  { id: 'health-prevention', name: 'Health Prevention', description: 'Preventative weight management' },
  { id: 'health-monitoring', name: 'Health Monitoring', description: 'Track vitals alongside weight' }
];

export function WeightBmiConfigSettings({ clientId }: WeightBmiConfigSettingsProps) {
  const { config, saveConfig, loading } = useWeightBmi(clientId);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      baseline_weight_kg: null,
      monitoring_frequency: 'weekly',
      min_target_weight_kg: null,
      max_target_weight_kg: null,
      target_range_alert_severity: 'amber',
      enable_rapid_change_alert: true,
      rapid_change_threshold_kg: 2.0,
      rapid_change_window_days: 7,
      height_cm: null,
      height_method: 'standing',
      height_is_estimate: false,
      height_method_notes: null,
      knee_height_cm: null,
      knee_height_sex: null,
      enable_trend_graph: true,
      overdue_escalation_cycles: 2
    }
  });

  // Load config into form
  useEffect(() => {
    if (config) {
      form.reset({
        baseline_weight_kg: config.baseline_weight_kg,
        monitoring_frequency: config.monitoring_frequency,
        min_target_weight_kg: config.min_target_weight_kg,
        max_target_weight_kg: config.max_target_weight_kg,
        target_range_alert_severity: config.target_range_alert_severity,
        enable_rapid_change_alert: config.enable_rapid_change_alert,
        rapid_change_threshold_kg: config.rapid_change_threshold_kg,
        rapid_change_window_days: config.rapid_change_window_days,
        height_cm: config.height_cm,
        height_method: config.height_method,
        height_is_estimate: config.height_is_estimate,
        height_method_notes: config.height_method_notes,
        knee_height_cm: config.knee_height_cm,
        knee_height_sex: config.knee_height_sex,
        enable_trend_graph: config.enable_trend_graph,
        overdue_escalation_cycles: config.overdue_escalation_cycles
      });
    }
  }, [config, form]);

  const heightMethod = form.watch('height_method');
  const kneeHeightCm = form.watch('knee_height_cm');
  const kneeHeightSex = form.watch('knee_height_sex');

  // Auto-calculate height from knee height
  useEffect(() => {
    if (heightMethod === 'knee_height' && kneeHeightCm && kneeHeightSex) {
      const calculatedHeight = calculateHeightFromKneeHeight(kneeHeightCm, kneeHeightSex);
      form.setValue('height_cm', Math.round(calculatedHeight * 10) / 10);
      form.setValue('height_is_estimate', true);
    }
  }, [heightMethod, kneeHeightCm, kneeHeightSex, form]);

  // Update height_is_estimate based on method
  useEffect(() => {
    if (heightMethod !== 'standing') {
      form.setValue('height_is_estimate', true);
    }
  }, [heightMethod, form]);

  async function onSubmit(data: ConfigFormData) {
    setIsSaving(true);
    try {
      await saveConfig(data);
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <RestrictedSection requiredRole="admin" message="Admin access required to modify settings">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Baseline & Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Weight Monitoring Setup
              </CardTitle>
              <CardDescription>
                Configure baseline weight and monitoring schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseline_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baseline Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 68.5"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Starting reference weight
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monitoring_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monitoring Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(FREQUENCY_LABELS) as MonitoringFrequency[]).map(freq => (
                            <SelectItem key={freq} value={freq}>
                              {FREQUENCY_LABELS[freq]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often weight should be recorded
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Target Range */}
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Target Weight Range (Optional)
                </Label>
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="min_target_weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 60"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_target_weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 75"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target_range_alert_severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="amber">Amber (Monitor)</SelectItem>
                            <SelectItem value="red">Red (Action Needed)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Height & BMI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Height & BMI Configuration
              </CardTitle>
              <CardDescription>
                Configure height measurement for BMI calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="height_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Height Measurement Method *
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium mb-1">Wheelchair-Friendly Methods:</p>
                              <ul className="text-xs space-y-1">
                                <li><strong>Arm Span:</strong> Measure fingertip to fingertip with arms extended</li>
                                <li><strong>Knee Height:</strong> Uses clinical formula based on sex</li>
                                <li><strong>Demispan:</strong> Sternum to fingertip × 2</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(HEIGHT_METHOD_LABELS) as HeightMethod[]).map(method => (
                            <SelectItem key={method} value={method}>
                              {HEIGHT_METHOD_LABELS[method]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Height (cm)
                        {form.watch('height_is_estimate') && (
                          <span className="text-xs text-amber-600 ml-1">(Estimated)</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 165"
                          disabled={heightMethod === 'knee_height'}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Knee Height Fields */}
              {heightMethod === 'knee_height' && (
                <div className="p-3 bg-muted/50 rounded-md space-y-3">
                  <p className="text-sm font-medium">Knee Height Calculation</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="knee_height_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Knee Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="e.g. 52"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormDescription>
                            Measure from heel to top of knee
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="knee_height_sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex (for formula)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formula: Male = 64.19 + (2.02 × knee height), Female = 84.88 + (1.83 × knee height)
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="height_method_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height Method Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any notes about height measurement..."
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('height_is_estimate') && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Height is estimated. BMI should be interpreted with caution. 
                    Posture changes, spinal curvature, and age-related height loss may affect accuracy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts & Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enable_rapid_change_alert"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Rapid Weight Change Alert</FormLabel>
                      <FormDescription>
                        Alert when weight changes significantly in a short period
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('enable_rapid_change_alert') && (
                <div className="grid sm:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                  <FormField
                    control={form.control}
                    name="rapid_change_threshold_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Change Threshold (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rapid_change_window_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="overdue_escalation_cycles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escalation After Missed Cycles</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Escalate to RED after this many missed measurement cycles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enable_trend_graph"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Trend Graph</FormLabel>
                      <FormDescription>
                        Show weight trends visualization
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Related Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Other Recommended Related Modules
              </CardTitle>
              <CardDescription>
                Consider enabling these modules for holistic care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {RELATED_MODULES.map(module => (
                  <Button
                    key={module.id}
                    variant="outline"
                    className="h-auto py-3 justify-start text-left"
                    onClick={() => navigate(`/module/${module.id}`)}
                  >
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </RestrictedSection>
  );
}
