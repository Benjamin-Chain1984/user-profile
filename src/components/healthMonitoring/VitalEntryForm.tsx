/**
 * VitalEntryForm - Form for logging vital signs
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Clock, User } from 'lucide-react';
import { VitalInput } from './VitalInput';
import { BloodPressureInput } from './BloodPressureInput';
import { useVitalSignEntries, useVitalSignConfig } from '@/hooks/useHealthMonitoring';
import { calculateEntryStatuses } from '@/utils/vitalSignStatusCalculator';
import { VITAL_SYMPTOMS, ON_BEHALF_REASONS, STAFF_ROLES, type VitalSignEntry } from '@/types/healthMonitoring';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  temperature_celsius: z.number().nullable(),
  bp_systolic: z.number().nullable(),
  bp_diastolic: z.number().nullable(),
  oxygen_saturation: z.number().nullable(),
  heart_rate: z.number().nullable(),
  respiratory_rate: z.number().nullable(),
  symptoms: z.array(z.string()),
  notes: z.string().optional(),
  event_occurred_at: z.string(),
  recorded_on_behalf_of_name: z.string().optional(),
  recorded_on_behalf_of_role: z.string().optional(),
  recorded_on_behalf_of_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VitalEntryFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VitalEntryForm({ clientId, open, onOpenChange }: VitalEntryFormProps) {
  const { addEntry, isAdding } = useVitalSignEntries(clientId);
  const { config } = useVitalSignConfig(clientId);
  const [showOnBehalf, setShowOnBehalf] = useState(false);
  const [showBackdated, setShowBackdated] = useState(false);

  // Get current local time for default
  const now = new Date();
  const localISOString = format(now, "yyyy-MM-dd'T'HH:mm");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature_celsius: null,
      bp_systolic: null,
      bp_diastolic: null,
      oxygen_saturation: null,
      heart_rate: null,
      respiratory_rate: null,
      symptoms: [],
      notes: '',
      event_occurred_at: localISOString,
      recorded_on_behalf_of_name: '',
      recorded_on_behalf_of_role: '',
      recorded_on_behalf_of_reason: '',
    },
  });

  const watchedValues = form.watch();
  const calculatedStatuses = calculateEntryStatuses(watchedValues);

  const onSubmit = (data: FormData) => {
    addEntry({
      temperature_celsius: data.temperature_celsius,
      bp_systolic: data.bp_systolic,
      bp_diastolic: data.bp_diastolic,
      oxygen_saturation: data.oxygen_saturation,
      heart_rate: data.heart_rate,
      respiratory_rate: data.respiratory_rate,
      symptoms: data.symptoms,
      notes: data.notes || null,
      event_occurred_at: new Date(data.event_occurred_at).toISOString(),
      recorded_on_behalf_of_name: showOnBehalf ? data.recorded_on_behalf_of_name || null : null,
      recorded_on_behalf_of_role: showOnBehalf ? data.recorded_on_behalf_of_role || null : null,
      recorded_on_behalf_of_reason: showOnBehalf ? data.recorded_on_behalf_of_reason || null : null,
    });

    form.reset();
    setShowOnBehalf(false);
    setShowBackdated(false);
    onOpenChange(false);
  };

  const hasAnyVital = 
    watchedValues.temperature_celsius !== null ||
    watchedValues.bp_systolic !== null ||
    watchedValues.bp_diastolic !== null ||
    watchedValues.oxygen_saturation !== null ||
    watchedValues.heart_rate !== null ||
    watchedValues.respiratory_rate !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            Record Vital Signs
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 pt-2">
              {/* Overall Status Preview */}
              {hasAnyVital && (
                <Card className={cn(
                  'border-2',
                  calculatedStatuses.overall_status === 'red' && 'border-red-500 bg-red-50',
                  calculatedStatuses.overall_status === 'amber' && 'border-amber-500 bg-amber-50',
                  calculatedStatuses.overall_status === 'ideal' && 'border-green-500 bg-green-50',
                )}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={cn(
                        'h-5 w-5',
                        calculatedStatuses.overall_status === 'red' && 'text-red-600',
                        calculatedStatuses.overall_status === 'amber' && 'text-amber-600',
                        calculatedStatuses.overall_status === 'ideal' && 'text-green-600',
                      )} />
                      <span className="font-medium">
                        {calculatedStatuses.overall_status === 'red' && 'Red – Action Needed'}
                        {calculatedStatuses.overall_status === 'amber' && 'Amber – Attention Required'}
                        {calculatedStatuses.overall_status === 'ideal' && 'IDEAL'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vital Inputs */}
              <div className="space-y-6">
                {config.temperature_enabled && (
                  <FormField
                    control={form.control}
                    name="temperature_celsius"
                    render={({ field }) => (
                      <FormItem>
                        <VitalInput
                          vitalType="temperature"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {config.bp_enabled && (
                  <div>
                    <BloodPressureInput
                      systolic={form.watch('bp_systolic')}
                      diastolic={form.watch('bp_diastolic')}
                      onSystolicChange={(val) => form.setValue('bp_systolic', val)}
                      onDiastolicChange={(val) => form.setValue('bp_diastolic', val)}
                    />
                  </div>
                )}

                {config.oxygen_enabled && (
                  <FormField
                    control={form.control}
                    name="oxygen_saturation"
                    render={({ field }) => (
                      <FormItem>
                        <VitalInput
                          vitalType="oxygen"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {config.heart_rate_enabled && (
                  <FormField
                    control={form.control}
                    name="heart_rate"
                    render={({ field }) => (
                      <FormItem>
                        <VitalInput
                          vitalType="heart_rate"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {config.respiratory_enabled && (
                  <FormField
                    control={form.control}
                    name="respiratory_rate"
                    render={({ field }) => (
                      <FormItem>
                        <VitalInput
                          vitalType="respiratory"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Symptoms */}
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Associated Symptoms (optional)</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {VITAL_SYMPTOMS.map((symptom) => (
                        <label
                          key={symptom.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                            field.value.includes(symptom.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Checkbox
                            checked={field.value.includes(symptom.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, symptom.id]);
                              } else {
                                field.onChange(field.value.filter(s => s !== symptom.id));
                              }
                            }}
                          />
                          <span className="text-sm">{symptom.label}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional observations..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Time and Attribution Options */}
              <div className="space-y-4">
                {/* Backdated Entry Toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="backdated"
                    checked={showBackdated}
                    onCheckedChange={(checked) => setShowBackdated(!!checked)}
                  />
                  <label htmlFor="backdated" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    <Clock className="h-4 w-4" />
                    Adjust time (backdated entry)
                  </label>
                </div>

                {showBackdated && (
                  <FormField
                    control={form.control}
                    name="event_occurred_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>When did this occur?</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* On Behalf Toggle */}
                {config.enable_log_on_behalf && (
                  <>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="onBehalf"
                        checked={showOnBehalf}
                        onCheckedChange={(checked) => setShowOnBehalf(!!checked)}
                      />
                      <label htmlFor="onBehalf" className="text-sm flex items-center gap-1.5 cursor-pointer">
                        <User className="h-4 w-4" />
                        Log on behalf of another staff member
                      </label>
                    </div>

                    {showOnBehalf && (
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Staff Attribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <FormField
                            control={form.control}
                            name="recorded_on_behalf_of_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Staff Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter staff name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="recorded_on_behalf_of_role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STAFF_ROLES.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        {role.label}
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
                            name="recorded_on_behalf_of_reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ON_BEHALF_REASONS.map((reason) => (
                                      <SelectItem key={reason.value} value={reason.value}>
                                        {reason.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding || !hasAnyVital}>
                  {isAdding ? 'Saving...' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
