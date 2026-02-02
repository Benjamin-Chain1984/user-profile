/**
 * Blood Pressure Input - Combined systolic/diastolic input with worst-wins logic
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { VITAL_THRESHOLDS, type VitalStatus } from '@/types/healthMonitoring';
import { calculateBpStatus, getStatusColor, getStatusLabel } from '@/utils/vitalSignStatusCalculator';

interface BloodPressureInputProps {
  systolic: number | null;
  diastolic: number | null;
  onSystolicChange: (value: number | null) => void;
  onDiastolicChange: (value: number | null) => void;
  disabled?: boolean;
}

export function BloodPressureInput({
  systolic,
  diastolic,
  onSystolicChange,
  onDiastolicChange,
  disabled = false,
}: BloodPressureInputProps) {
  const systolicThreshold = VITAL_THRESHOLDS.bp_systolic;
  const diastolicThreshold = VITAL_THRESHOLDS.bp_diastolic;
  
  const [systolicInput, setSystolicInput] = useState<string>(systolic?.toString() || '');
  const [diastolicInput, setDiastolicInput] = useState<string>(diastolic?.toString() || '');
  
  const overallStatus = calculateBpStatus(systolic, diastolic);

  useEffect(() => {
    setSystolicInput(systolic?.toString() || '');
  }, [systolic]);

  useEffect(() => {
    setDiastolicInput(diastolic?.toString() || '');
  }, [diastolic]);

  const handleSystolicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSystolicInput(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onSystolicChange(parsed);
    } else if (value === '') {
      onSystolicChange(null);
    }
  };

  const handleDiastolicInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiastolicInput(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onDiastolicChange(parsed);
    } else if (value === '') {
      onDiastolicChange(null);
    }
  };

  const handleSystolicSliderChange = (values: number[]) => {
    onSystolicChange(values[0]);
    setSystolicInput(values[0].toString());
  };

  const handleDiastolicSliderChange = (values: number[]) => {
    onDiastolicChange(values[0]);
    setDiastolicInput(values[0].toString());
  };

  const getInputStyle = (status: VitalStatus | null) => {
    if (status === 'red') return 'border-red-500 bg-red-50 text-red-700';
    if (status === 'amber') return 'border-amber-500 bg-amber-50 text-amber-700';
    if (status === 'ideal') return 'border-green-500 bg-green-50 text-green-700';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Blood Pressure</Label>
        {(systolic !== null || diastolic !== null) && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            getStatusColor(overallStatus)
          )}>
            {getStatusLabel(overallStatus)}
          </span>
        )}
      </div>

      {/* Combined display */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Input
          type="number"
          value={systolicInput}
          onChange={handleSystolicInputChange}
          placeholder="120"
          disabled={disabled}
          className={cn(
            'w-20 text-center text-lg font-mono',
            getInputStyle(overallStatus)
          )}
        />
        <span className="text-xl font-bold text-muted-foreground">/</span>
        <Input
          type="number"
          value={diastolicInput}
          onChange={handleDiastolicInputChange}
          placeholder="80"
          disabled={disabled}
          className={cn(
            'w-20 text-center text-lg font-mono',
            getInputStyle(overallStatus)
          )}
        />
        <span className="text-sm text-muted-foreground">mmHg</span>
      </div>

      {/* Systolic slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Systolic</span>
          <span className="text-green-600">
            {systolicThreshold.green.min}–{systolicThreshold.green.max}
          </span>
        </div>
        <Slider
          value={systolic !== null ? [systolic] : [systolicThreshold.defaultValue]}
          onValueChange={handleSystolicSliderChange}
          min={70}
          max={200}
          step={1}
          disabled={disabled}
        />
      </div>

      {/* Diastolic slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Diastolic</span>
          <span className="text-green-600">
            {diastolicThreshold.green.min}–{diastolicThreshold.green.max}
          </span>
        </div>
        <Slider
          value={diastolic !== null ? [diastolic] : [diastolicThreshold.defaultValue]}
          onValueChange={handleDiastolicSliderChange}
          min={40}
          max={120}
          step={1}
          disabled={disabled}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        If either value is concerning, the overall status uses the worst reading
      </p>
    </div>
  );
}
