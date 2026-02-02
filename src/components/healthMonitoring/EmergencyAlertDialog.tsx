/**
 * EmergencyAlertDialog - Full-screen emergency alert for RED vital signs
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Phone, Clock, CheckCircle } from 'lucide-react';
import { useVitalSignAlerts, useVitalSignActionLogs } from '@/hooks/useHealthMonitoring';
import type { VitalSignAlert } from '@/types/healthMonitoring';
import { format } from 'date-fns';

interface EmergencyAlertDialogProps {
  alert: VitalSignAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

export function EmergencyAlertDialog({
  alert,
  open,
  onOpenChange,
  clientId,
}: EmergencyAlertDialogProps) {
  const { resolveAlert } = useVitalSignAlerts(clientId);
  const { addLog } = useVitalSignActionLogs(clientId, alert?.id);
  
  const [emergencyContacted, setEmergencyContacted] = useState(false);
  const [contactTime, setContactTime] = useState(format(new Date(), "HH:mm"));
  const [actionTaken, setActionTaken] = useState('');
  const [outcome, setOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) return null;

  const handleResolve = async () => {
    setIsSubmitting(true);

    // Log the action
    addLog({
      action_type: emergencyContacted ? 'emergency_call' : 'escalate',
      action_description: actionTaken,
      outcome,
      alert_id: alert.id,
      vital_entry_id: alert.vital_entry_id,
      contact_time: emergencyContacted ? new Date().toISOString() : undefined,
    });

    // Resolve the alert
    resolveAlert({
      id: alert.id,
      resolved_reason: actionTaken,
      action_taken: actionTaken,
      emergency_services_contacted: emergencyContacted,
      emergency_contact_time: emergencyContacted 
        ? new Date(`${format(new Date(), 'yyyy-MM-dd')}T${contactTime}`).toISOString()
        : undefined,
      outcome,
    });

    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-red-50 border-red-500 border-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 text-xl">
            <AlertTriangle className="h-6 w-6" />
            URGENT — Immediate Action Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Message */}
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-lg font-medium text-red-800">{alert.message}</p>
            {alert.recommended_action && (
              <p className="text-sm text-red-700 mt-2">{alert.recommended_action}</p>
            )}
          </div>

          {/* Emergency Instructions */}
          <div className="bg-red-100 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Steps
            </h3>
            <ol className="space-y-2 text-sm text-red-700">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                Call 000 immediately if life-threatening
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                Keep the person safe and comfortable
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                Continue monitoring while waiting for help
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                Follow emergency operator instructions
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                Do not leave the person unattended
              </li>
            </ol>
          </div>

          {/* Documentation Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-red-800">Document Response</h3>
            
            <div className="flex items-start gap-2">
              <Checkbox
                id="emergencyContacted"
                checked={emergencyContacted}
                onCheckedChange={(checked) => setEmergencyContacted(!!checked)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="emergencyContacted" className="text-sm font-medium">
                  Emergency services (000) were contacted
                </Label>
                {emergencyContacted && (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={contactTime}
                      onChange={(e) => setContactTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="actionTaken">Action Taken *</Label>
              <Textarea
                id="actionTaken"
                placeholder="Describe the actions taken..."
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="outcome">Outcome (if known)</Label>
              <Textarea
                id="outcome"
                placeholder="What was the outcome?"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-red-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!actionTaken.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Confirm & Close Alert'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
