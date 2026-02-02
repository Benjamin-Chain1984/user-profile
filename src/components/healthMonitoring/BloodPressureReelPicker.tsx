/**
 * BloodPressureReelPicker - Dual reel picker for systolic/diastolic BP
 * Uses "worst value wins" logic for overall status
 */

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { VITAL_THRESHOLDS, type VitalStatus, type AlteredCriteria } from '@/types/healthMonitoring';
import { calculateBpStatus, calculateVitalStatus, getEffectiveThresholds, type PartialThresholdOverride } from '@/utils/vitalSignStatusCalculator';
import { AlertTriangle, CheckCircle, AlertCircle, Heart } from 'lucide-react';
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

interface BloodPressureReelPickerProps {
  systolic: number | null;
  diastolic: number | null;
  onSystolicChange: (value: number) => void;
  onDiastolicChange: (value: number) => void;
  disabled?: boolean;
  alteredCriteria?: {
    systolic?: AlteredCriteria | PartialThresholdOverride;
    diastolic?: AlteredCriteria | PartialThresholdOverride;
  } | null;
  showAlteredBanner?: boolean;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function SingleReel({
  label,
  values,
  currentValue,
  onChange,
  getStatus,
  unit,
  disabled,
}: {
  label: string;
  values: number[];
  currentValue: number;
  onChange: (value: number) => void;
  getStatus: (val: number) => VitalStatus | null;
  unit: string;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const currentIndex = values.findIndex(v => v === currentValue);
  const [scrollOffset, setScrollOffset] = useState(Math.max(0, currentIndex) * ITEM_HEIGHT);

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

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const index = Math.round(scrollOffset / ITEM_HEIGHT);
    const snappedIndex = Math.max(0, Math.min(index, values.length - 1));
    setScrollOffset(snappedIndex * ITEM_HEIGHT);
    onChange(values[snappedIndex]);
  }, [isDragging, scrollOffset, values, onChange]);

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

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const index = Math.round(scrollOffset / ITEM_HEIGHT);
    const snappedIndex = Math.max(0, Math.min(index, values.length - 1));
    setScrollOffset(snappedIndex * ITEM_HEIGHT);
    onChange(values[snappedIndex]);
  }, [isDragging, scrollOffset, values, onChange]);

  const selectedValue = values[Math.round(scrollOffset / ITEM_HEIGHT)] ?? currentValue;
  const status = getStatus(selectedValue);

  const getStatusBorderColor = (s: VitalStatus | null) => {
    switch (s) {
      case 'red': return 'border-red-400';
      case 'amber': return 'border-amber-400';
      case 'ideal': return 'border-green-400';
      default: return 'border-border';
    }
  };

  return (
    <div className="flex-1">
      <div className="text-xs text-muted-foreground text-center mb-1">{label}</div>
      <div
        className={cn(
          'relative h-52 overflow-hidden rounded-lg border-2 select-none cursor-ns-resize',
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
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        <div className={cn(
          'absolute left-0 right-0 h-11 top-1/2 -translate-y-1/2 z-5 border-y-2 pointer-events-none',
          status === 'red' && 'bg-red-100 border-red-300',
          status === 'amber' && 'bg-amber-100 border-amber-300',
          status === 'ideal' && 'bg-green-100 border-green-300',
          !status && 'bg-muted/50 border-border',
        )} />
        
        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${VISIBLE_ITEMS * ITEM_HEIGHT / 2 - scrollOffset - ITEM_HEIGHT / 2}px)`,
          }}
        >
          {values.map((v, idx) => {
            const isSelected = idx === Math.round(scrollOffset / ITEM_HEIGHT);
            const valueStatus = getStatus(v);
            
            return (
              <div
                key={v}
                className={cn(
                  'h-11 flex items-center justify-center font-mono transition-all',
                  isSelected ? 'text-xl font-bold' : 'text-base text-muted-foreground opacity-60',
                  isSelected && valueStatus === 'red' && 'text-red-700',
                  isSelected && valueStatus === 'amber' && 'text-amber-700',
                  isSelected && valueStatus === 'ideal' && 'text-green-700',
                )}
              >
                {v}
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center mt-1">{unit}</div>
    </div>
  );
}

export function BloodPressureReelPicker({
  systolic,
  diastolic,
  onSystolicChange,
  onDiastolicChange,
  disabled = false,
  alteredCriteria,
  showAlteredBanner = false,
}: BloodPressureReelPickerProps) {
  const [showRedConfirm, setShowRedConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState<{ type: 'systolic' | 'diastolic'; value: number } | null>(null);

  const systolicThreshold = VITAL_THRESHOLDS.bp_systolic;
  const diastolicThreshold = VITAL_THRESHOLDS.bp_diastolic;

  // Check if altered criteria is active
  const isAlteredActive = useMemo(() => {
    const checkActive = (criteria?: AlteredCriteria | PartialThresholdOverride) => {
      if (!criteria) return false;
      if ('is_active' in criteria) {
        return criteria.is_active && criteria.confirmed_by_medical_professional;
      }
      return criteria.green_min !== undefined || criteria.green_max !== undefined;
    };
    return checkActive(alteredCriteria?.systolic) || checkActive(alteredCriteria?.diastolic);
  }, [alteredCriteria]);

  // Generate values
  const systolicValues: number[] = [];
  for (let v = 70; v <= 220; v++) systolicValues.push(v);

  const diastolicValues: number[] = [];
  for (let v = 40; v <= 140; v++) diastolicValues.push(v);

  const currentSystolic = systolic ?? systolicThreshold.defaultValue;
  const currentDiastolic = diastolic ?? diastolicThreshold.defaultValue;

  const overallStatus = calculateBpStatus(currentSystolic, currentDiastolic, alteredCriteria?.systolic, alteredCriteria?.diastolic);

  const getSystolicStatus = (val: number): VitalStatus | null => {
    return calculateVitalStatus(val, 'bp_systolic', alteredCriteria?.systolic);
  };

  const getDiastolicStatus = (val: number): VitalStatus | null => {
    return calculateVitalStatus(val, 'bp_diastolic', alteredCriteria?.diastolic);
  };

  const handleSystolicChange = (value: number) => {
    const status = getSystolicStatus(value);
    if (status === 'red') {
      setPendingValue({ type: 'systolic', value });
      setShowRedConfirm(true);
    } else {
      onSystolicChange(value);
    }
  };

  const handleDiastolicChange = (value: number) => {
    const status = getDiastolicStatus(value);
    if (status === 'red') {
      setPendingValue({ type: 'diastolic', value });
      setShowRedConfirm(true);
    } else {
      onDiastolicChange(value);
    }
  };

  const confirmRedValue = () => {
    if (pendingValue) {
      if (pendingValue.type === 'systolic') {
        onSystolicChange(pendingValue.value);
      } else {
        onDiastolicChange(pendingValue.value);
      }
    }
    setShowRedConfirm(false);
    setPendingValue(null);
  };

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
        <span className="text-sm font-medium flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Blood Pressure
        </span>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full text-white',
          overallStatus === 'red' && 'bg-red-500',
          overallStatus === 'amber' && 'bg-amber-500',
          overallStatus === 'ideal' && 'bg-green-500',
          !overallStatus && 'bg-muted text-muted-foreground',
        )}>
          {currentSystolic}/{currentDiastolic} mmHg
        </span>
      </div>

      {/* Dual Reels */}
      <div className="flex gap-3">
        <SingleReel
          label="Systolic"
          values={systolicValues}
          currentValue={currentSystolic}
          onChange={handleSystolicChange}
          getStatus={getSystolicStatus}
          unit="mmHg"
          disabled={disabled}
        />
        <div className="flex items-center text-2xl font-bold text-muted-foreground">/</div>
        <SingleReel
          label="Diastolic"
          values={diastolicValues}
          currentValue={currentDiastolic}
          onChange={handleDiastolicChange}
          getStatus={getDiastolicStatus}
          unit="mmHg"
          disabled={disabled}
        />
      </div>

      {/* Zone Label */}
      <div className={cn(
        'flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium',
        overallStatus === 'red' && 'bg-red-100 text-red-800',
        overallStatus === 'amber' && 'bg-amber-100 text-amber-800',
        overallStatus === 'ideal' && 'bg-green-100 text-green-800',
        !overallStatus && 'bg-muted text-muted-foreground',
      )}>
        {overallStatus === 'red' && <AlertTriangle className="h-4 w-4" />}
        {overallStatus === 'amber' && <AlertCircle className="h-4 w-4" />}
        {overallStatus === 'ideal' && <CheckCircle className="h-4 w-4" />}
        <span>{getZoneLabel(overallStatus)}</span>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Overall status uses the worst reading between systolic and diastolic
        {isAlteredActive && ' (using altered criteria)'}
      </p>

      {/* Red Zone Confirmation Dialog */}
      <AlertDialog open={showRedConfirm} onOpenChange={setShowRedConfirm}>
        <AlertDialogContent className="border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Blood Pressure Reading
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are selecting a value in the <strong className="text-red-600">RED zone</strong>. 
                This indicates a potentially critical blood pressure reading.
              </p>
              <p>
                Value: <strong>{pendingValue?.value} mmHg ({pendingValue?.type})</strong>
              </p>
              <p className="text-red-600 font-medium">
                If this reading is accurate, call 000 immediately.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRedValue}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Reading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
