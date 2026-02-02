/**
 * RedZoneConfirmationDialog - Confirmation dialog for RED zone values
 * Prevents accidental submission of critical readings
 */

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
import { AlertTriangle, Phone } from 'lucide-react';
import { VITAL_THRESHOLDS, type VitalType } from '@/types/healthMonitoring';

interface RedZoneConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  vitalType: VitalType;
  value: number;
}

export function RedZoneConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  vitalType,
  value,
}: RedZoneConfirmationDialogProps) {
  const threshold = VITAL_THRESHOLDS[vitalType];
  
  // Don't show confirmation for temperature (per spec: "Emergency modal for Red alerts (except temperature)")
  const isTemperature = vitalType === 'temperature';

  return (
    <AlertDialog open={open && !isTemperature} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-2 border-red-500 bg-red-50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Critical Reading - RED Zone
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-red-700">
              <p>
                You are recording a <strong className="text-red-800">{threshold.label}</strong> of{' '}
                <strong className="text-red-800">{value}{threshold.unit}</strong>, 
                which is in the <strong className="text-red-800">RED (critical) zone</strong>.
              </p>

              <div className="bg-white/80 rounded-lg p-3 space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  If this reading is accurate:
                </p>
                <ul className="text-sm space-y-1 ml-6 list-disc">
                  <li>Call 000 immediately if life-threatening</li>
                  <li>Keep the person safe and comfortable</li>
                  <li>Follow emergency operator instructions</li>
                  <li>Document all actions taken</li>
                </ul>
              </div>

              <p className="text-sm">
                Click "Confirm Reading" only if you have verified this measurement is correct.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-red-200">
            Go Back & Recheck
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirm Reading
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
