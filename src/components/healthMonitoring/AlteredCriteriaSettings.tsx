/**
 * AlteredCriteriaSettings - Admin UI for customizing vital sign thresholds
 * Allows setting Green (IDEAL), Amber, and Red ranges per vital type
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  User,
  Thermometer,
  Heart,
  Activity,
  Wind,
  Droplets
} from 'lucide-react';
import { useAlteredCriteria } from '@/hooks/useHealthMonitoring';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { 
  VitalType, 
  VITAL_THRESHOLDS, 
  MEDICAL_PROFESSIONAL_ROLES,
  AlteredCriteria 
} from '@/types/healthMonitoring';

const vitalTypeConfig: Record<VitalType, { 
  label: string; 
  icon: React.ReactNode; 
  unit: string;
  step: number;
}> = {
  temperature: { 
    label: 'Temperature', 
    icon: <Thermometer className="h-4 w-4" />, 
    unit: '°C',
    step: 0.1 
  },
  bp_systolic: { 
    label: 'Systolic BP', 
    icon: <Heart className="h-4 w-4" />, 
    unit: 'mmHg',
    step: 1 
  },
  bp_diastolic: { 
    label: 'Diastolic BP', 
    icon: <Heart className="h-4 w-4" />, 
    unit: 'mmHg',
    step: 1 
  },
  oxygen: { 
    label: 'Oxygen Saturation', 
    icon: <Droplets className="h-4 w-4" />, 
    unit: '%',
    step: 1 
  },
  heart_rate: { 
    label: 'Heart Rate', 
    icon: <Activity className="h-4 w-4" />, 
    unit: 'bpm',
    step: 1 
  },
  respiratory: { 
    label: 'Respiratory Rate', 
    icon: <Wind className="h-4 w-4" />, 
    unit: 'breaths/min',
    step: 1 
  },
};

const criteriaSchema = z.object({
  green_min: z.number().nullable(),
  green_max: z.number().nullable(),
  amber_low_min: z.number().nullable(),
  amber_low_max: z.number().nullable(),
  amber_high_min: z.number().nullable(),
  amber_high_max: z.number().nullable(),
  clinical_reason: z.string().min(10, 'Please provide a clinical reason (min 10 characters)'),
  medical_professional_name: z.string().min(2, 'Medical professional name is required'),
  medical_professional_role: z.string().min(1, 'Please select a role'),
  confirmed_by_medical_professional: z.boolean().refine(val => val === true, {
    message: 'Must confirm medical professional approval',
  }),
});

type CriteriaFormData = z.infer<typeof criteriaSchema>;

interface VitalCriteriaFormProps {
  vitalType: VitalType;
  existingCriteria?: AlteredCriteria | null;
  onSave: (data: Partial<AlteredCriteria> & { vital_type: VitalType }) => void;
  isUpdating: boolean;
}

function VitalCriteriaForm({ vitalType, existingCriteria, onSave, isUpdating }: VitalCriteriaFormProps) {
  const config = vitalTypeConfig[vitalType];
  const standardThresholds = VITAL_THRESHOLDS[vitalType];

  const form = useForm<CriteriaFormData>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      green_min: existingCriteria?.green_min ?? standardThresholds.green.min,
      green_max: existingCriteria?.green_max ?? standardThresholds.green.max,
      amber_low_min: existingCriteria?.amber_low_min ?? standardThresholds.amberLow?.min ?? null,
      amber_low_max: existingCriteria?.amber_low_max ?? standardThresholds.amberLow?.max ?? null,
      amber_high_min: existingCriteria?.amber_high_min ?? standardThresholds.amberHigh?.min ?? null,
      amber_high_max: existingCriteria?.amber_high_max ?? standardThresholds.amberHigh?.max ?? null,
      clinical_reason: existingCriteria?.clinical_reason ?? '',
      medical_professional_name: existingCriteria?.medical_professional_name ?? '',
      medical_professional_role: existingCriteria?.medical_professional_role ?? '',
      confirmed_by_medical_professional: existingCriteria?.confirmed_by_medical_professional ?? false,
    },
  });

  const onSubmit = (data: CriteriaFormData) => {
    onSave({
      vital_type: vitalType,
      ...data,
      confirmation_date: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="text-amber-800">Safety Warning</AlertTitle>
        <AlertDescription className="text-amber-700">
          You are changing standard clinical safety thresholds. This should only be done 
          with documented approval from a qualified medical professional.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Threshold Ranges */}
          <div className="grid gap-4">
              {/* Green (IDEAL) Range */}
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium text-green-800">IDEAL Range (Green)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="green_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-700">Minimum</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step={config.step}
                              className="bg-white"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                            <span className="text-sm text-muted-foreground">{config.unit}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="green_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-700">Maximum</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step={config.step}
                              className="bg-white"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                            <span className="text-sm text-muted-foreground">{config.unit}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Standard: {standardThresholds.green.min}–{standardThresholds.green.max} {config.unit}
                </p>
              </div>

              {/* Amber Low Range */}
              {standardThresholds.amberLow && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-medium text-amber-800">AMBER Range (Low)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amber_low_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-amber-700">Minimum</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step={config.step}
                                className="bg-white"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                              <span className="text-sm text-muted-foreground">{config.unit}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amber_low_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-amber-700">Maximum</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step={config.step}
                                className="bg-white"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                              <span className="text-sm text-muted-foreground">{config.unit}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    Standard: {standardThresholds.amberLow.min}–{standardThresholds.amberLow.max} {config.unit}
                  </p>
                </div>
              )}

              {/* Amber High Range */}
              {standardThresholds.amberHigh && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-medium text-amber-800">AMBER Range (High)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amber_high_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-amber-700">Minimum</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step={config.step}
                                className="bg-white"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                              <span className="text-sm text-muted-foreground">{config.unit}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amber_high_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-amber-700">Maximum</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step={config.step}
                                className="bg-white"
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              />
                              <span className="text-sm text-muted-foreground">{config.unit}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    Standard: {standardThresholds.amberHigh.min}–{standardThresholds.amberHigh.max} {config.unit}
                  </p>
                </div>
              )}

              {/* Red Zone Info */}
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium text-red-800">RED Zone (Critical)</span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Any value outside the Green and Amber ranges will trigger a RED alert. 
                  Values below Amber Low minimum or above Amber High maximum are considered critical.
                </p>
              </div>
            </div>

            {/* Medical Professional Confirmation */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Medical Professional Confirmation</span>
              </div>

              <FormField
                control={form.control}
                name="medical_professional_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Professional Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical_professional_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDICAL_PROFESSIONAL_ROLES.map((role) => (
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
                name="clinical_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Reason for Altered Criteria</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document the clinical justification for these custom thresholds..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed clinical reason for these personalized thresholds
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmed_by_medical_professional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-background">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">
                        I confirm these thresholds have been approved by the named medical professional
                      </FormLabel>
                      <FormDescription>
                        This confirmation will be recorded in the audit trail
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : existingCriteria ? 'Update Criteria' : 'Save Criteria'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
              >
                Reset to Defaults
              </Button>
            </div>
          </form>
        </Form>
      </div>
  );
}

interface AlteredCriteriaSettingsProps {
  clientId?: string;
}

export function AlteredCriteriaSettings({ clientId }: AlteredCriteriaSettingsProps) {
  const { isAdmin } = useRoleAccess();
  const { criteria, criteriaMap, upsertCriteria, approveCriteria, deactivateCriteria, isUpdating } = useAlteredCriteria(clientId);
  const [enabledVitals, setEnabledVitals] = useState<Record<VitalType, boolean>>({
    temperature: !!criteriaMap['temperature'],
    bp_systolic: !!criteriaMap['bp_systolic'],
    bp_diastolic: !!criteriaMap['bp_diastolic'],
    oxygen: !!criteriaMap['oxygen'],
    heart_rate: !!criteriaMap['heart_rate'],
    respiratory: !!criteriaMap['respiratory'],
  });

  const vitalTypes: VitalType[] = ['temperature', 'bp_systolic', 'bp_diastolic', 'oxygen', 'heart_rate', 'respiratory'];

  const pendingApproval = criteria.filter(c => !c.approved_at);
  const activeCriteria = criteria.filter(c => c.approved_at);

  const toggleAlteredCriteria = (vitalType: VitalType) => {
    const isCurrentlyEnabled = enabledVitals[vitalType] || !!criteriaMap[vitalType];
    if (isCurrentlyEnabled && criteriaMap[vitalType]) {
      // Deactivate in DB
      deactivateCriteria(vitalType);
    }
    setEnabledVitals(prev => ({
      ...prev,
      [vitalType]: !isCurrentlyEnabled,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Altered Criteria
          </CardTitle>
          <CardDescription>
            Customize vital sign thresholds for this individual based on their specific health needs. 
            Changes require documentation and admin approval.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Admin Actions - Pending Approvals */}
      {isAdmin && pendingApproval.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <Clock className="h-5 w-5" />
              Pending Approval ({pendingApproval.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApproval.map((criterion) => (
              <div 
                key={criterion.id} 
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {vitalTypeConfig[criterion.vital_type].icon}
                    <span className="font-medium">{vitalTypeConfig[criterion.vital_type].label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confirmed by: {criterion.medical_professional_name} ({MEDICAL_PROFESSIONAL_ROLES.find(r => r.value === criterion.medical_professional_role)?.label})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reason: {criterion.clinical_reason}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => approveCriteria(criterion.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Criteria Summary */}
      {activeCriteria.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              Active Altered Criteria ({activeCriteria.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {activeCriteria.map((criterion) => (
                <div 
                  key={criterion.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    {vitalTypeConfig[criterion.vital_type].icon}
                    <span>{vitalTypeConfig[criterion.vital_type].label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {criterion.green_min}–{criterion.green_max} {vitalTypeConfig[criterion.vital_type].unit} (IDEAL)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vital Type Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configure Altered Criteria by Vital Type</h3>
        <p className="text-sm text-muted-foreground">
          Enable altered criteria for specific vital signs to set custom Green (IDEAL), Amber (Monitor), and Red (Call Triple 0) ranges.
        </p>
        
        {vitalTypes.map((vitalType) => {
          const config = vitalTypeConfig[vitalType];
          const standardThresholds = VITAL_THRESHOLDS[vitalType];
          const isEnabled = enabledVitals[vitalType] || !!criteriaMap[vitalType];
          const hasCriteria = !!criteriaMap[vitalType];
          
          return (
            <Card key={vitalType} className={isEnabled ? 'border-primary/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {config.icon}
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Standard: {standardThresholds.green.min}–{standardThresholds.green.max} {config.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {criteriaMap[vitalType]?.approved_at && (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    {hasCriteria && !criteriaMap[vitalType]?.approved_at && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enable Altered Criteria</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleAlteredCriteria(vitalType)}
                        variant="success"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isEnabled && (
                <CardContent className="pt-0">
                  <VitalCriteriaForm
                    vitalType={vitalType}
                    existingCriteria={criteriaMap[vitalType]}
                    onSave={upsertCriteria}
                    isUpdating={isUpdating}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Safety Notice */}
      <Alert className="border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Important Clinical Notice</AlertTitle>
        <AlertDescription className="text-amber-700">
          Altered criteria override standard clinical thresholds. All changes are recorded in the audit trail 
          and require admin approval before becoming active. Ensure any changes are documented and approved 
          by the individual's treating medical professional.
        </AlertDescription>
      </Alert>
    </div>
  );
}
