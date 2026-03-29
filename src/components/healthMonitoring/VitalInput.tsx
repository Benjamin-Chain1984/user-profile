/**
 * VitalInput - Hybrid slider + numeric input for vital signs
 * Shows live color feedback as values change
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { VITAL_THRESHOLDS, type VitalType, type VitalStatus } from '@/types/healthMonitoring';
import { calculateVitalStatus, getStatusColor, getStatusLabel } from '@/utils/vitalSignStatusCalculator';

interface VitalInputProps {
  vitalType: VitalType;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  showStatus?: boolean;
}

export function VitalInput({
  vitalType,
  value,
  onChange,
  disabled = false,
  showStatus = true,
}: VitalInputProps) {
  const threshold = VITAL_THRESHOLDS[vitalType];
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '');
  const status = value !== null ? calculateVitalStatus(value, vitalType) : null;

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  // Calculate slider range (extend beyond thresholds for red zones)
  const getSliderRange = () => {
    const greenMin = threshold.green.min;
    const greenMax = threshold.green.max;
    
    // Extend range to show red zones
    let min = greenMin;
    let max = greenMax;
    
    if (threshold.amberLow) {
      min = Math.min(min, threshold.amberLow.min - (threshold.amberLow.max - threshold.amberLow.min));
    }
    if (threshold.amberHigh) {
      max = Math.max(max, threshold.amberHigh.max + (threshold.amberHigh.max - threshold.amberHigh.min));
    }
    
    // Add some padding for critical zones
    const padding = (max - min) * 0.1;
    let computedMin = Math.floor(min - padding);
    let computedMax = Math.ceil(max + padding);
    
    // SpO2 cannot exceed 100%
    if (vitalType === 'oxygen') {
      computedMax = 100;
    }
    
    return {
      min: computedMin,
      max: computedMax,
    };
  };

  const range = getSliderRange();

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    
    const parsed = parseFloat(newInputValue);
    if (!isNaN(parsed)) {
      // Clamp SpO2 to 100
      const clamped = vitalType === 'oxygen' ? Math.min(parsed, 100) : parsed;
      onChange(clamped);
      if (clamped !== parsed) setInputValue(clamped.toString());
    } else if (newInputValue === '') {
      onChange(null);
    }
  };

  const handleInputBlur = () => {
    if (inputValue === '' || isNaN(parseFloat(inputValue))) {
      setInputValue(value?.toString() || '');
    }
  };

  // Get track color based on status
  const getTrackColor = (status: VitalStatus | null): string => {
    switch (status) {
      case 'red':
        return 'bg-red-500';
      case 'amber':
        return 'bg-amber-500';
      case 'ideal':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{threshold.label}</Label>
        {showStatus && value !== null && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            getStatusColor(status)
          )}>
            {getStatusLabel(status)}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Slider */}
        <div className="flex-1 relative">
          <Slider
            value={value !== null ? [value] : [threshold.defaultValue]}
            onValueChange={handleSliderChange}
            min={range.min}
            max={range.max}
            step={threshold.step}
            disabled={disabled}
            className={cn(
              'w-full',
              status === 'red' && '[&_[role=slider]]:bg-red-500 [&_[role=slider]]:border-red-600',
              status === 'amber' && '[&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-600',
              status === 'ideal' && '[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-600',
            )}
          />
          {/* Range markers */}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{range.min}{threshold.unit}</span>
            <span className="text-green-600 font-medium">
              {threshold.green.min}–{threshold.green.max}
            </span>
            <span>{range.max}{threshold.unit}</span>
          </div>
        </div>
        
        {/* Numeric input */}
        <div className="w-24">
          <div className="relative">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              step={threshold.step}
              disabled={disabled}
              className={cn(
                'pr-8 text-center font-mono',
                status === 'red' && 'border-red-500 bg-red-50 text-red-700',
                status === 'amber' && 'border-amber-500 bg-amber-50 text-amber-700',
                status === 'ideal' && 'border-green-500 bg-green-50 text-green-700',
              )}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {threshold.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
