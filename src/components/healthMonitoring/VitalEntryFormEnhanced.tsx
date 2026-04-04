/**
 * VitalEntryFormEnhanced - Enhanced form with iOS-style reel pickers
 */

import { useState, useEffect } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, User, Thermometer, Heart, Wind, Activity, Gauge, ChevronUp, ChevronDown } from 'lucide-react';
import { VitalReelPicker } from './VitalReelPicker';
import { BloodPressureReelPicker } from './BloodPressureReelPicker';
import { ObservationContextSelector, type ObservationContext } from './ObservationContextSelector';
import { RedZoneConfirmationDialog } from './RedZoneConfirmationDialog';
import { useVitalSignEntries, useVitalSignConfig, useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { calculateEntryStatuses } from '@/utils/vitalSignStatusCalculator';
import { VITAL_SYMPTOMS, ON_BEHALF_REASONS, STAFF_ROLES, VITAL_THRESHOLDS, type VitalType } from '@/types/healthMonitoring';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  temperature_celsius: z.number().nullable(),
  bp_systolic: z.number().nullable(),
  bp_diastolic: z.number().nullable(),
  oxygen_saturation: z.number().max(100, 'SpO₂ cannot exceed 100%').nullable(),
  heart_rate: z.number().nullable(),
  respiratory_rate: z.number().nullable(),
  symptoms: z.array(z.string()),
  observation_context: z.string().nullable(),
  notes: z.string().optional(),
  event_occurred_at: z.string(),
  recorded_on_behalf_of_name: z.string().optional(),
  recorded_on_behalf_of_role: z.string().optional(),
  recorded_on_behalf_of_reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VitalEntryFormEnhancedProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVitalType?: VitalType;
}

// Map VitalType to tab ID (bp_systolic and bp_diastolic both map to 'bp')
const vitalTypeToTabId = (vitalType: VitalType | undefined): string => {
  if (!vitalType) return 'temperature';
  if (vitalType === 'bp_systolic' || vitalType === 'bp_diastolic') return 'bp';
  return vitalType;
};

export function VitalEntryFormEnhanced({ 
  clientId, 
  open, 
  onOpenChange,
  initialVitalType 
}: VitalEntryFormEnhancedProps) {
  const { addEntry, isAdding } = useVitalSignEntries(clientId);
  const { config } = useVitalSignConfig(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);
  
  const [showOnBehalf, setShowOnBehalf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);
  const [showOnBehalfConfirm, setShowOnBehalfConfirm] = useState(false);
  const [showBackdated, setShowBackdated] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => vitalTypeToTabId(initialVitalType));
  const [redZoneDialog, setRedZoneDialog] = useState<{ open: boolean; vitalType: VitalType; value: number } | null>(null);

  const isOnBehalfOfActive = showOnBehalf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);
  
  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };

  // Update activeTab when initialVitalType changes (e.g., clicking different tiles)
  useEffect(() => {
    if (open && initialVitalType) {
      setActiveTab(vitalTypeToTabId(initialVitalType));
    }
  }, [open, initialVitalType]);

  // Get default tab based on enabled vitals
  const getDefaultTab = () => {
    if (initialVitalType) return vitalTypeToTabId(initialVitalType);
    if (config.temperature_enabled) return 'temperature';
    if (config.bp_enabled) return 'bp';
    if (config.oxygen_enabled) return 'oxygen';
    if (config.heart_rate_enabled) return 'heart_rate';
    if (config.respiratory_enabled) return 'respiratory';
    return 'temperature';
  };

  const now = new Date();
  const localISOString = format(now, "yyyy-MM-dd'T'HH:mm");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature_celsius: config.temperature_enabled ? VITAL_THRESHOLDS.temperature.defaultValue : null,
      bp_systolic: config.bp_enabled ? VITAL_THRESHOLDS.bp_systolic.defaultValue : null,
      bp_diastolic: config.bp_enabled ? VITAL_THRESHOLDS.bp_diastolic.defaultValue : null,
      oxygen_saturation: config.oxygen_enabled ? VITAL_THRESHOLDS.oxygen.defaultValue : null,
      heart_rate: config.heart_rate_enabled ? VITAL_THRESHOLDS.heart_rate.defaultValue : null,
      respiratory_rate: config.respiratory_enabled ? VITAL_THRESHOLDS.respiratory.defaultValue : null,
      symptoms: [],
      observation_context: null,
      notes: '',
      event_occurred_at: localISOString,
      recorded_on_behalf_of_name: '',
      recorded_on_behalf_of_role: '',
      recorded_on_behalf_of_reason: '',
    },
  });

  const watchedValues = form.watch();
  const calculatedStatuses = calculateEntryStatuses(watchedValues, criteriaMap);

  // Check if any altered criteria is active
  const hasAlteredCriteria = Object.values(criteriaMap).some(c => c?.is_active);

  const onSubmit = (data: FormData) => {
    // Validate on-behalf fields
    if (isOnBehalfOfActive && !validateOnBehalfOf()) return;

    // Check for red zone values that need confirmation (except temperature)
    const redVitals: { type: VitalType; value: number }[] = [];
    
    if (calculatedStatuses.bp_status === 'red' && data.bp_systolic) {
      redVitals.push({ type: 'bp_systolic', value: data.bp_systolic });
    }
    if (calculatedStatuses.oxygen_status === 'red' && data.oxygen_saturation) {
      redVitals.push({ type: 'oxygen', value: data.oxygen_saturation });
    }
    if (calculatedStatuses.heart_rate_status === 'red' && data.heart_rate) {
      redVitals.push({ type: 'heart_rate', value: data.heart_rate });
    }
    if (calculatedStatuses.respiratory_status === 'red' && data.respiratory_rate) {
      redVitals.push({ type: 'respiratory', value: data.respiratory_rate });
    }

    if (redVitals.length > 0 && !redZoneDialog) {
      setRedZoneDialog({ open: true, vitalType: redVitals[0].type, value: redVitals[0].value });
      return;
    }

    // If logging on behalf of someone, show confirmation dialog
    if (isOnBehalfOfActive) {
      setShowOnBehalfConfirm(true);
      return;
    }

    submitEntry(data);
  };

  const submitEntry = (data: FormData) => {
    addEntry({
      temperature_celsius: config.temperature_enabled ? data.temperature_celsius : null,
      bp_systolic: config.bp_enabled ? data.bp_systolic : null,
      bp_diastolic: config.bp_enabled ? data.bp_diastolic : null,
      oxygen_saturation: config.oxygen_enabled ? data.oxygen_saturation : null,
      heart_rate: config.heart_rate_enabled ? data.heart_rate : null,
      respiratory_rate: config.respiratory_enabled ? data.respiratory_rate : null,
      symptoms: data.symptoms,
      notes: data.observation_context 
        ? `Context: ${data.observation_context}. ${data.notes || ''}`.trim() 
        : data.notes || null,
      event_occurred_at: new Date(data.event_occurred_at).toISOString(),
      recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : null,
      recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole : null,
      recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason : null,
    });

    form.reset();
    setShowOnBehalf(false);
    setOnBehalfOfName('');
    setOnBehalfOfRole(null);
    setOnBehalfOfReason(null);
    setShowOnBehalfConfirm(false);
    setShowBackdated(false);
    setRedZoneDialog(null);
    onOpenChange(false);
  };

  const hasAnyVital = 
    (config.temperature_enabled && watchedValues.temperature_celsius !== null) ||
    (config.bp_enabled && (watchedValues.bp_systolic !== null || watchedValues.bp_diastolic !== null)) ||
    (config.oxygen_enabled && watchedValues.oxygen_saturation !== null) ||
    (config.heart_rate_enabled && watchedValues.heart_rate !== null) ||
    (config.respiratory_enabled && watchedValues.respiratory_rate !== null);

  // Get tab list based on enabled vitals
  const enabledVitals: { id: string; label: string; icon: React.ReactNode }[] = [];
  if (config.temperature_enabled) enabledVitals.push({ id: 'temperature', label: 'Temp', icon: <Thermometer className="h-4 w-4" /> });
  if (config.bp_enabled) enabledVitals.push({ id: 'bp', label: 'BP', icon: <Heart className="h-4 w-4" /> });
  if (config.oxygen_enabled) enabledVitals.push({ id: 'oxygen', label: 'SpO₂', icon: <Gauge className="h-4 w-4" /> });
  if (config.heart_rate_enabled) enabledVitals.push({ id: 'heart_rate', label: 'HR', icon: <Activity className="h-4 w-4" /> });
  if (config.respiratory_enabled) enabledVitals.push({ id: 'respiratory', label: 'RR', icon: <Wind className="h-4 w-4" /> });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              Record Vital Signs
            </DialogTitle>
            {hasAlteredCriteria && (
              <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg mt-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Using altered criteria for this individual</span>
              </div>
            )}
          </DialogHeader>

          <ScrollArea className="max-h-[calc(95vh-160px)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6 pt-2">
                {/* Recorded on Behalf Of - Top of form (matches Bowel Care pattern) */}
                {config.enable_log_on_behalf && (
                  <Collapsible open={showOnBehalf} onOpenChange={setShowOnBehalf}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
                          showOnBehalf 
                            ? "bg-blue-50 border-blue-200" 
                            : "bg-muted/30 border-muted hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Recorded on Behalf Of</span>
                        </div>
                        {showOnBehalf ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="onBehalfName">Staff Name *</Label>
                          <Input
                            id="onBehalfName"
                            placeholder="e.g., Jamie Brown"
                            value={onBehalfOfName}
                            onChange={(e) => setOnBehalfOfName(e.target.value)}
                            disabled={isAdding}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Staff Role / Relationship</Label>
                          <Select
                            value={onBehalfOfRole || ''}
                            onValueChange={(v) => setOnBehalfOfRole(v || null)}
                            disabled={isAdding}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {STAFF_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason for Recording on Behalf *</Label>
                        <Select
                          value={onBehalfOfReason || ''}
                          onValueChange={(v) => setOnBehalfOfReason(v || null)}
                          disabled={isAdding}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {ON_BEHALF_REASONS.map((reason) => (
                              <SelectItem key={reason.value} value={reason.value}>
                                {reason.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Overall Status Preview */}
                {hasAnyVital && (
                  <Card className={cn(
                    'border-2',
                    calculatedStatuses.overall_status === 'red' && 'border-red-500 bg-red-50',
                    calculatedStatuses.overall_status === 'amber' && 'border-amber-500 bg-amber-50',
                    calculatedStatuses.overall_status === 'ideal' && 'border-green-500 bg-green-50',
                  )}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
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
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vital Sign Tabs with Reel Pickers */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${enabledVitals.length}, 1fr)` }}>
                    {enabledVitals.map((vital) => (
                      <TabsTrigger key={vital.id} value={vital.id} className="gap-1.5 text-xs sm:text-sm">
                        {vital.icon}
                        <span className="hidden sm:inline">{vital.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {config.temperature_enabled && (
                    <TabsContent value="temperature" className="mt-4">
                      <FormField
                        control={form.control}
                        name="temperature_celsius"
                        render={({ field }) => (
                          <FormItem>
                            <VitalReelPicker
                              vitalType="temperature"
                              value={field.value}
                              onChange={field.onChange}
                              alteredCriteria={criteriaMap.temperature}
                              showAlteredBanner={!!criteriaMap.temperature?.is_active}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}

                  {config.bp_enabled && (
                    <TabsContent value="bp" className="mt-4">
                      <BloodPressureReelPicker
                        systolic={form.watch('bp_systolic')}
                        diastolic={form.watch('bp_diastolic')}
                        onSystolicChange={(val) => form.setValue('bp_systolic', val)}
                        onDiastolicChange={(val) => form.setValue('bp_diastolic', val)}
                        alteredCriteria={{
                          systolic: criteriaMap.bp_systolic || undefined,
                          diastolic: criteriaMap.bp_diastolic || undefined,
                        }}
                        showAlteredBanner={!!criteriaMap.bp_systolic?.is_active || !!criteriaMap.bp_diastolic?.is_active}
                      />
                    </TabsContent>
                  )}

                  {config.oxygen_enabled && (
                    <TabsContent value="oxygen" className="mt-4">
                      <FormField
                        control={form.control}
                        name="oxygen_saturation"
                        render={({ field }) => (
                          <FormItem>
                            <VitalReelPicker
                              vitalType="oxygen"
                              value={field.value}
                              onChange={field.onChange}
                              alteredCriteria={criteriaMap.oxygen}
                              showAlteredBanner={!!criteriaMap.oxygen?.is_active}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}

                  {config.heart_rate_enabled && (
                    <TabsContent value="heart_rate" className="mt-4">
                      <FormField
                        control={form.control}
                        name="heart_rate"
                        render={({ field }) => (
                          <FormItem>
                            <VitalReelPicker
                              vitalType="heart_rate"
                              value={field.value}
                              onChange={field.onChange}
                              alteredCriteria={criteriaMap.heart_rate}
                              showAlteredBanner={!!criteriaMap.heart_rate?.is_active}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}

                  {config.respiratory_enabled && (
                    <TabsContent value="respiratory" className="mt-4">
                      <FormField
                        control={form.control}
                        name="respiratory_rate"
                        render={({ field }) => (
                          <FormItem>
                            <VitalReelPicker
                              vitalType="respiratory"
                              value={field.value}
                              onChange={field.onChange}
                              alteredCriteria={criteriaMap.respiratory}
                              showAlteredBanner={!!criteriaMap.respiratory?.is_active}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}
                </Tabs>

                <Separator />

                {/* Observation Context */}
                <FormField
                  control={form.control}
                  name="observation_context"
                  render={({ field }) => (
                    <FormItem>
                      <ObservationContextSelector
                        value={field.value as ObservationContext | null}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                                  field.onChange(field.value.filter((s: string) => s !== symptom.id));
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

                </div>

                {/* Safety Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Important:</strong> This tool supports monitoring only. It does not replace 
                    clinical assessment. Follow the person's health plan and seek medical advice if concerned.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
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

      {/* Red Zone Confirmation */}
      {redZoneDialog && (
        <RedZoneConfirmationDialog
          open={redZoneDialog.open}
          onOpenChange={(open) => {
            if (!open) setRedZoneDialog(null);
          }}
          onConfirm={() => {
            submitEntry(form.getValues());
          }}
          vitalType={redZoneDialog.vitalType}
          value={redZoneDialog.value}
        />
      )}

      {/* On Behalf Confirmation Dialog */}
      <AlertDialog open={showOnBehalfConfirm} onOpenChange={setShowOnBehalfConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm On-Behalf Entry</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>You are recording this vital signs entry on behalf of another staff member:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Name:</strong> {onBehalfOfName}</li>
                  {onBehalfOfRole && <li><strong>Role:</strong> {onBehalfOfRole}</li>}
                  {onBehalfOfReason && <li><strong>Reason:</strong> {onBehalfOfReason}</li>}
                </ul>
                <p>Please confirm this is correct before saving.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitEntry(form.getValues())}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
