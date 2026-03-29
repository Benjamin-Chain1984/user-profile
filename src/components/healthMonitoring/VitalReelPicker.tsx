/**
 * VitalReelPicker - iOS-style scroll wheel picker for vital signs
 * Features: drag/scroll interaction, dynamic color zones, zone labels
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { VITAL_THRESHOLDS, type VitalType, type VitalStatus, type AlteredCriteria } from '@/types/healthMonitoring';
import { calculateVitalStatus, getEffectiveThresholds, type PartialThresholdOverride } from '@/utils/vitalSignStatusCalculator';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface VitalReelPickerProps {
  vitalType: VitalType;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  alteredCriteria?: AlteredCriteria | PartialThresholdOverride | null;
  showAlteredBanner?: boolean;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;

export function VitalReelPicker({
  vitalType,
  value,
  onChange,
  disabled = false,
  alteredCriteria,
  showAlteredBanner = false,
}: VitalReelPickerProps) {
  const threshold = VITAL_THRESHOLDS[vitalType];
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  // Determine if altered criteria is active and should be used
  const isAlteredActive = useMemo(() => {
    if (!alteredCriteria) return false;
    // Check if it's a full AlteredCriteria object with is_active flag
    if ('is_active' in alteredCriteria) {
      return alteredCriteria.is_active && alteredCriteria.confirmed_by_medical_professional;
    }
    // For PartialThresholdOverride, check if any custom values are set
    return alteredCriteria.green_min !== undefined || alteredCriteria.green_max !== undefined;
  }, [alteredCriteria]);

  // Get effective thresholds (either altered or standard)
  const effectiveThresholds = useMemo(() => {
    if (isAlteredActive && alteredCriteria && 'is_active' in alteredCriteria) {
      return getEffectiveThresholds(vitalType, alteredCriteria);
    }
    // Use standard thresholds
    return {
      green: threshold.green,
      amberLow: threshold.amberLow,
      amberHigh: threshold.amberHigh,
    };
  }, [vitalType, threshold, alteredCriteria, isAlteredActive]);

  // Generate values for the reel based on effective thresholds
  const values = useMemo(() => {
    const greenMin = effectiveThresholds.green.min;
    const greenMax = effectiveThresholds.green.max;
    
    // Extend range for red zones
    let min = greenMin;
    let max = greenMax;
    
    if (effectiveThresholds.amberLow) {
      min = Math.min(min, effectiveThresholds.amberLow.min - 10 * threshold.step);
    } else {
      min = greenMin - 20 * threshold.step;
    }
    
    if (effectiveThresholds.amberHigh) {
      max = Math.max(max, effectiveThresholds.amberHigh.max + 10 * threshold.step);
    } else {
      max = greenMax + 20 * threshold.step;
    }
    
    // SpO2 cannot exceed 100%
    if (vitalType === 'oxygen') {
      max = Math.min(max, 100);
    }
    
    const result: number[] = [];
    for (let v = min; v <= max; v += threshold.step) {
      result.push(Math.round(v * 10) / 10);
    }
    return result;
  }, [threshold, effectiveThresholds]);
  
  // Initialize scroll position to value or default
  const currentValue = value ?? threshold.defaultValue;
  const currentIndex = values.findIndex(v => Math.abs(v - currentValue) < threshold.step / 2);
  
  useEffect(() => {
    if (!isDragging && currentIndex >= 0) {
      setScrollOffset(currentIndex * ITEM_HEIGHT);
    }
  }, [currentIndex, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.clientY + scrollOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = startY - e.clientY;
    const newOffset = Math.max(0, Math.min(delta, (values.length - 1) * ITEM_HEIGHT));
    setScrollOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap to nearest value
    const index = Math.round(scrollOffset / ITEM_HEIGHT);
    const snappedIndex = Math.max(0, Math.min(index, values.length - 1));
    setScrollOffset(snappedIndex * ITEM_HEIGHT);
    onChange(values[snappedIndex]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? ITEM_HEIGHT : -ITEM_HEIGHT;
    const newOffset = Math.max(0, Math.min(scrollOffset + delta, (values.length - 1) * ITEM_HEIGHT));
    setScrollOffset(newOffset);
    const newIndex = Math.round(newOffset / ITEM_HEIGHT);
    onChange(values[newIndex]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY + scrollOffset);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = startY - e.touches[0].clientY;
    const newOffset = Math.max(0, Math.min(delta, (values.length - 1) * ITEM_HEIGHT));
    setScrollOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const index = Math.round(scrollOffset / ITEM_HEIGHT);
    const snappedIndex = Math.max(0, Math.min(index, values.length - 1));
    setScrollOffset(snappedIndex * ITEM_HEIGHT);
    onChange(values[snappedIndex]);
  };

  // Get status for a value
  const getValueStatus = (val: number): VitalStatus | null => {
    return calculateVitalStatus(val, vitalType, alteredCriteria);
  };

  const selectedValue = values[Math.round(scrollOffset / ITEM_HEIGHT)] ?? currentValue;
  const status = getValueStatus(selectedValue);

  // Zone label based on status
  const getZoneLabel = (s: VitalStatus | null) => {
    switch (s) {
      case 'red':
        return 'RED – Call 000';
      case 'amber':
        return 'AMBER – Recheck in 2 hours';
      case 'ideal':
        return 'IDEAL – No action';
      default:
        return '';
    }
  };

  const getStatusBgColor = (s: VitalStatus | null) => {
    switch (s) {
      case 'red': return 'bg-red-500';
      case 'amber': return 'bg-amber-500';
      case 'ideal': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getStatusBorderColor = (s: VitalStatus | null) => {
    switch (s) {
      case 'red': return 'border-red-500';
      case 'amber': return 'border-amber-500';
      case 'ideal': return 'border-green-500';
      default: return 'border-border';
    }
  };

  const getStatusTextColor = (s: VitalStatus | null) => {
    switch (s) {
      case 'red': return 'text-red-700';
      case 'amber': return 'text-amber-700';
      case 'ideal': return 'text-green-700';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {/* Altered Criteria Banner */}
      {showAlteredBanner && alteredCriteria && (
        <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Using altered criteria for this individual</span>
        </div>
      )}

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{threshold.label}</span>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getStatusBgColor(status), 'text-white')}>
          {selectedValue} {threshold.unit}
        </span>
      </div>

      {/* Reel Container */}
      <div 
        ref={containerRef}
        className={cn(
          'relative h-60 overflow-hidden rounded-xl border-2 select-none cursor-ns-resize transition-colors',
          getStatusBorderColor(status),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Selection indicator */}
        <div className={cn(
          'absolute left-0 right-0 h-12 top-1/2 -translate-y-1/2 z-5 border-y-2 pointer-events-none',
          status === 'red' && 'bg-red-100 border-red-400',
          status === 'amber' && 'bg-amber-100 border-amber-400',
          status === 'ideal' && 'bg-green-100 border-green-400',
          !status && 'bg-muted/50 border-border',
        )} />
        
        {/* Values */}
        <div
          className="absolute left-0 right-0 transition-transform"
          style={{
            transform: `translateY(${VISIBLE_ITEMS * ITEM_HEIGHT / 2 - scrollOffset - ITEM_HEIGHT / 2}px)`,
          }}
        >
          {values.map((v, idx) => {
            const valueStatus = getValueStatus(v);
            const isSelected = idx === Math.round(scrollOffset / ITEM_HEIGHT);
            
            return (
              <div
                key={v}
                className={cn(
                  'h-12 flex items-center justify-center text-lg font-mono transition-all',
                  isSelected ? 'text-2xl font-bold' : 'text-muted-foreground opacity-60',
                  isSelected && getStatusTextColor(valueStatus),
                )}
              >
                {v.toFixed(vitalType === 'temperature' ? 1 : 0)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Label */}
      <div className={cn(
        'flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium',
        status === 'red' && 'bg-red-100 text-red-800',
        status === 'amber' && 'bg-amber-100 text-amber-800',
        status === 'ideal' && 'bg-green-100 text-green-800',
        !status && 'bg-muted text-muted-foreground',
      )}>
        {status === 'red' && <AlertTriangle className="h-4 w-4" />}
        {status === 'amber' && <AlertCircle className="h-4 w-4" />}
        {status === 'ideal' && <CheckCircle className="h-4 w-4" />}
        <span>{getZoneLabel(status)}</span>
      </div>

      {/* Range hint */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-green-600">
          IDEAL: {effectiveThresholds.green.min}–{effectiveThresholds.green.max} {threshold.unit}
          {isAlteredActive && ' (altered)'}
        </span>
      </div>
    </div>
  );
}
