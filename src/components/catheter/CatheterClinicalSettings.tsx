/**
 * Catheter Clinical Settings - Module-level clinical configuration
 * Catheter type, size, change interval and flush protocol are configured here.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Droplets } from 'lucide-react';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';

interface CatheterClinicalSettingsProps {
  clientId?: string;
  disabled?: boolean;
}

const CATHETER_TYPES = [
  { value: 'idc', label: 'Indwelling (IDC / urethral)' },
  { value: 'spc', label: 'Suprapubic (SPC)' },
  { value: 'intermittent', label: 'Intermittent catheterisation' },
  { value: 'urostomy', label: 'Urostomy' },
  { value: 'condom', label: 'Condom / sheath' },
];

const CHANGE_INTERVALS = [
  { value: '4_weeks', label: 'Every 4 weeks' },
  { value: '6_weeks', label: 'Every 6 weeks' },
  { value: '8_weeks', label: 'Every 8 weeks' },
  { value: '12_weeks', label: 'Every 12 weeks' },
  { value: 'as_required', label: 'As clinically required' },
];

const FLUSH_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'prn', label: 'As required (PRN)' },
  { value: 'custom', label: 'Custom interval' },
];

const FLUSH_SOLUTIONS = [
  { value: 'normal_saline', label: 'Normal saline 0.9%' },
  { value: 'sterile_water', label: 'Sterile water' },
  { value: 'citric_acid', label: 'Citric acid solution' },
  { value: 'other', label: 'Other' },
];

const FLUSH_PERFORMERS = [
  { value: 'rn', label: 'Registered Nurse only' },
  { value: 'support_worker', label: 'Trained Support Worker' },
];

interface FormState {
  catheter_type: string;
  catheter_size_fr: string;
  balloon_size_ml: string;
  insertion_date: string;
  change_interval: string;
  responsible_clinician: string;
  prescribing_clinician: string;
  no_urine_hours_threshold: string;
  enable_autonomic_dysreflexia: boolean;
  flush_prescribed: boolean;
  flush_solution_type: string;
  flush_solution_other: string;
  flush_volume_ml: string;
  flush_frequency: string;
  flush_custom_interval: string;
  flush_reason: string;
  flush_performer: string;
  additional_instructions: string;
}

const EMPTY: FormState = {
  catheter_type: '',
  catheter_size_fr: '',
  balloon_size_ml: '',
  insertion_date: '',
  change_interval: '',
  responsible_clinician: '',
  prescribing_clinician: '',
  no_urine_hours_threshold: '4',
  enable_autonomic_dysreflexia: false,
  flush_prescribed: false,
  flush_solution_type: '',
  flush_solution_other: '',
  flush_volume_ml: '',
  flush_frequency: '',
  flush_custom_interval: '',
  flush_reason: '',
  flush_performer: '',
  additional_instructions: '',
};

export function CatheterClinicalSettings({ clientId, disabled }: CatheterClinicalSettingsProps) {
  const { plan, isLoading, savePlan, isSaving } = useCatheterCarePlan(clientId);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setForm({
      catheter_type: plan.catheter_type || '',
      catheter_size_fr: plan.catheter_size_fr || '',
      balloon_size_ml: plan.balloon_size_ml || '',
      insertion_date: plan.insertion_date || '',
      change_interval: plan.change_interval || '',
      responsible_clinician: plan.responsible_clinician || '',
      prescribing_clinician: plan.prescribing_clinician || '',
      no_urine_hours_threshold: String(plan.no_urine_hours_threshold ?? 4),
      enable_autonomic_dysreflexia: !!plan.enable_autonomic_dysreflexia,
      flush_prescribed: !!plan.flush_prescribed,
      flush_solution_type: plan.flush_solution_type || '',
      flush_solution_other: plan.flush_solution_other || '',
      flush_volume_ml: plan.flush_volume_ml != null ? String(plan.flush_volume_ml) : '',
      flush_frequency: plan.flush_frequency || '',
      flush_custom_interval: plan.flush_custom_interval || '',
      flush_reason: plan.flush_reason || '',
      flush_performer: plan.flush_performer || '',
      additional_instructions: plan.additional_instructions || '',
    });
    setDirty(false);
  }, [plan]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    savePlan({
      changeSummary: 'Clinical configuration updated via module settings',
      catheter_type: form.catheter_type || null,
      catheter_size_fr: form.catheter_size_fr || null,
      balloon_size_ml: form.balloon_size_ml || null,
      insertion_date: form.insertion_date || null,
      change_interval: form.change_interval || null,
      responsible_clinician: form.responsible_clinician || null,
      prescribing_clinician: form.prescribing_clinician || null,
      no_urine_hours_threshold: Number(form.no_urine_hours_threshold) || 4,
      enable_autonomic_dysreflexia: form.enable_autonomic_dysreflexia,
      flush_prescribed: form.flush_prescribed,
      flush_solution_type: form.flush_prescribed ? form.flush_solution_type || null : null,
      flush_solution_other: form.flush_prescribed ? form.flush_solution_other || null : null,
      flush_volume_ml: form.flush_prescribed && form.flush_volume_ml ? Number(form.flush_volume_ml) : null,
      flush_frequency: form.flush_prescribed ? form.flush_frequency || null : null,
      flush_custom_interval: form.flush_prescribed ? form.flush_custom_interval || null : null,
      flush_reason: form.flush_prescribed ? form.flush_reason || null : null,
      flush_performer: form.flush_prescribed ? form.flush_performer || null : null,
      additional_instructions: form.additional_instructions || null,
    });
    setDirty(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-4 w-4 text-primary" />
          Catheter Clinical Configuration
        </CardTitle>
        <CardDescription>
          Catheter type, size, change interval and flush protocol. These settings are the source of truth
          for logging forms, due dates and alerts. Set up in consultation with the prescribing clinician
          or Continence Nurse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Catheter type</Label>
            <Select
              value={form.catheter_type}
              onValueChange={(v) => set('catheter_type', v)}
              disabled={disabled || isLoading}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {CATHETER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catheter size (Fr)</Label>
            <Input
              value={form.catheter_size_fr}
              onChange={(e) => set('catheter_size_fr', e.target.value)}
              placeholder="e.g. 16"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Balloon size (mL)</Label>
            <Input
              value={form.balloon_size_ml}
              onChange={(e) => set('balloon_size_ml', e.target.value)}
              placeholder="e.g. 10"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Current insertion date</Label>
            <Input
              type="date"
              value={form.insertion_date}
              onChange={(e) => set('insertion_date', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Change interval</Label>
            <Select
              value={form.change_interval}
              onValueChange={(v) => set('change_interval', v)}
              disabled={disabled}
            >
              <SelectTrigger><SelectValue placeholder="Select interval" /></SelectTrigger>
              <SelectContent>
                {CHANGE_INTERVALS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>No urine drainage alert (hours)</Label>
            <Input
              type="number"
              min={1}
              value={form.no_urine_hours_threshold}
              onChange={(e) => set('no_urine_hours_threshold', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Prescribing clinician</Label>
            <Input
              value={form.prescribing_clinician}
              onChange={(e) => set('prescribing_clinician', e.target.value)}
              placeholder="Name"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Responsible clinician for changes</Label>
            <Input
              value={form.responsible_clinician}
              onChange={(e) => set('responsible_clinician', e.target.value)}
              placeholder="Name / service"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5 pr-4">
            <Label>Autonomic dysreflexia risk</Label>
            <p className="text-xs text-muted-foreground">
              Enables the autonomic dysreflexia emergency panel and risk logging.
            </p>
          </div>
          <Switch
            checked={form.enable_autonomic_dysreflexia}
            onCheckedChange={(v) => set('enable_autonomic_dysreflexia', v)}
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5 pr-4">
              <Label className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                Flush protocol prescribed
              </Label>
              <p className="text-xs text-muted-foreground">
                Turn on to enable catheter flush logging and flush due tracking.
              </p>
            </div>
            <Switch
              checked={form.flush_prescribed}
              onCheckedChange={(v) => set('flush_prescribed', v)}
              disabled={disabled}
            />
          </div>

          {form.flush_prescribed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Flush solution</Label>
                <Select
                  value={form.flush_solution_type}
                  onValueChange={(v) => set('flush_solution_type', v)}
                  disabled={disabled}
                >
                  <SelectTrigger><SelectValue placeholder="Select solution" /></SelectTrigger>
                  <SelectContent>
                    {FLUSH_SOLUTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.flush_solution_type === 'other' && (
                <div className="space-y-2">
                  <Label>Specify solution</Label>
                  <Input
                    value={form.flush_solution_other}
                    onChange={(e) => set('flush_solution_other', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Flush volume (mL)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.flush_volume_ml}
                  onChange={(e) => set('flush_volume_ml', e.target.value)}
                  placeholder="e.g. 30"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Flush frequency</Label>
                <Select
                  value={form.flush_frequency}
                  onValueChange={(v) => set('flush_frequency', v)}
                  disabled={disabled}
                >
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    {FLUSH_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.flush_frequency === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom interval</Label>
                  <Input
                    value={form.flush_custom_interval}
                    onChange={(e) => set('flush_custom_interval', e.target.value)}
                    placeholder="e.g. Every 3 days"
                    disabled={disabled}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Who may perform flushes</Label>
                <Select
                  value={form.flush_performer}
                  onValueChange={(v) => set('flush_performer', v)}
                  disabled={disabled}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {FLUSH_PERFORMERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Clinical reason for flushing</Label>
                <Textarea
                  value={form.flush_reason}
                  onChange={(e) => set('flush_reason', e.target.value)}
                  rows={2}
                  placeholder="e.g. History of blockage / sediment"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Additional clinical instructions</Label>
          <Textarea
            value={form.additional_instructions}
            onChange={(e) => set('additional_instructions', e.target.value)}
            rows={3}
            placeholder="Any other instructions for staff"
            disabled={disabled}
          />
        </div>

        {!disabled && (
          <Button onClick={handleSave} disabled={isSaving || !dirty}>
            {isSaving ? 'Saving...' : 'Save Clinical Configuration'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
