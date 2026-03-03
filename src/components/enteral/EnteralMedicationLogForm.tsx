/**
 * Enteral Medication Log Form
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLogEnteralMedication } from '@/hooks/useEnteral';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import type { EnteralConfig, EnteralMedicationConfig } from '@/types/enteral';

interface EnteralMedicationLogFormProps {
  clientId?: string;
  config?: EnteralConfig;
  medications: EnteralMedicationConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnteralMedicationLogForm({ clientId, config, medications, open, onOpenChange }: EnteralMedicationLogFormProps) {
  const { staffName } = useCurrentStaff();
  const logMed = useLogEnteralMedication(clientId);

  const [selectedMedId, setSelectedMedId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [positionAngle, setPositionAngle] = useState('');
  const [positionConfirmed, setPositionConfirmed] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const selectedMed = medications.find(m => m.id === selectedMedId);
  const requiresPosition = config?.apply_position_to_medication ?? false;
  const minAngle = config?.position_angle_min ?? 30;
  const angleNum = positionAngle ? parseInt(positionAngle) : null;
  const isBelowThreshold = angleNum !== null && angleNum < minAngle;

  const resetForm = () => {
    setSelectedMedId('');
    setScheduledTime('');
    setNotes('');
    setPositionAngle('');
    setPositionConfirmed(false);
    setOverrideReason('');
  };

  const handleSubmit = () => {
    if (!selectedMed) return;

    logMed.mutate({
      medication_config_id: selectedMed.id,
      medication_name: selectedMed.medication_name,
      dose: selectedMed.dose,
      flush_before_ml: selectedMed.flush_before_ml,
      flush_after_ml: selectedMed.flush_after_ml,
      scheduled_time: scheduledTime || null,
      position_confirmed: positionConfirmed,
      notes: notes || null,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Medication via Tube</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Logged by: <strong>{staffName}</strong>
          </div>

          {/* Medication Select */}
          <div className="space-y-2">
            <Label>Medication *</Label>
            <Select value={selectedMedId} onValueChange={setSelectedMedId}>
              <SelectTrigger><SelectValue placeholder="Select medication..." /></SelectTrigger>
              <SelectContent>
                {medications.filter(m => m.is_active).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.medication_name} — {m.dose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMed && (
            <>
              <div className="text-sm bg-muted/50 p-3 rounded-lg space-y-1">
                <p><strong>Dose:</strong> {selectedMed.dose}</p>
                <p><strong>Flush:</strong> {selectedMed.flush_before_ml}ml before, {selectedMed.flush_after_ml}ml after</p>
                {selectedMed.special_instructions && (
                  <p><strong>Instructions:</strong> {selectedMed.special_instructions}</p>
                )}
              </div>

              {/* Scheduled Time */}
              {selectedMed.scheduled_times?.length > 0 && (
                <div className="space-y-2">
                  <Label>Scheduled Time</Label>
                  <Select value={scheduledTime} onValueChange={setScheduledTime}>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {selectedMed.scheduled_times.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Position Check (if required for meds) */}
              {requiresPosition && (
                <div className="space-y-2">
                  <Label>Position Angle (°)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={90}
                    placeholder={`Minimum ${minAngle}°`}
                    value={positionAngle}
                    onChange={e => {
                      setPositionAngle(e.target.value);
                      const v = parseInt(e.target.value);
                      setPositionConfirmed(!isNaN(v) && v >= minAngle);
                      if (!isNaN(v) && v >= minAngle) setOverrideReason('');
                    }}
                  />
                  {positionConfirmed && (
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Safe positioning confirmed
                    </div>
                  )}
                  {isBelowThreshold && (
                    <Alert className="border-destructive bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive text-sm">
                        Position below safe threshold. Risk of aspiration.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional..." />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedMed || logMed.isPending}
            className="w-full"
          >
            {logMed.isPending ? 'Saving...' : 'Log Medication'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
