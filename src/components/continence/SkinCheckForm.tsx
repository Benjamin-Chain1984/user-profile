/**
 * Skin Check Form - Log skin integrity checks
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSkinChecks } from '@/hooks/useContinence';
import {
  SKIN_CONDITIONS,
  MOISTURE_STATUSES,
  DISCOMFORT_LEVELS,
  BARRIER_CREAM_OPTIONS,
  SkinCondition,
  MoistureStatus,
  DiscomfortLevel,
  BarrierCreamStatus,
} from '@/types/continence';
import { AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SkinCheckFormProps {
  clientId?: string;
  padChangeId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function SkinCheckForm({
  clientId,
  padChangeId,
  open,
  onOpenChange,
  onComplete,
}: SkinCheckFormProps) {
  const { addCheck } = useSkinChecks(clientId);

  const [skinCondition, setSkinCondition] = useState<SkinCondition>('clear');
  const [moistureStatus, setMoistureStatus] = useState<MoistureStatus>('dry');
  const [discomfortLevel, setDiscomfortLevel] = useState<DiscomfortLevel>('unknown');
  const [barrierCream, setBarrierCream] = useState<BarrierCreamStatus>('no');
  const [escalated, setEscalated] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEventTime, setShowEventTime] = useState(false);
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));

  const requiresEscalation = ['broken_skin', 'fungal_signs'].includes(skinCondition);
  const requiresMonitoring = ['rash', 'redness', 'moisture_damage', 'bruising'].includes(skinCondition);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let eventOccurredAt: string | undefined;
      if (showEventTime) {
        const [hours, minutes] = eventTime.split(':').map(Number);
        const d = new Date(eventDate);
        d.setHours(hours, minutes, 0, 0);
        eventOccurredAt = d.toISOString();
      }

      await addCheck.mutateAsync({
        pad_change_id: padChangeId,
        areas_checked: ['perineum'],
        skin_condition: skinCondition,
        moisture_status: moistureStatus,
        discomfort_level: discomfortLevel,
        barrier_cream_applied: barrierCream,
        escalated_to_clinician: escalated,
        escalation_notes: escalated ? escalationNotes : undefined,
        notes: notes || undefined,
        event_occurred_at: eventOccurredAt,
      });

      resetForm();
      onOpenChange(false);
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSkinCondition('clear');
    setMoistureStatus('dry');
    setDiscomfortLevel('unknown');
    setBarrierCream('no');
    setEscalated(false);
    setEscalationNotes('');
    setNotes('');
    setShowEventTime(false);
    setEventDate(format(new Date(), 'yyyy-MM-dd'));
    setEventTime(format(new Date(), 'HH:mm'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skin Integrity Check</DialogTitle>
          <DialogDescription>
            Record skin condition during pad change
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Skin Condition */}
          <div className="space-y-2">
            <Label>Skin Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              {SKIN_CONDITIONS.map((condition) => {
                const isRed = ['broken_skin', 'fungal_signs'].includes(condition.value);
                const isAmber = ['rash', 'redness', 'moisture_damage', 'bruising'].includes(condition.value);
                return (
                  <Button
                    key={condition.value}
                    type="button"
                    variant={skinCondition === condition.value ? 'default' : 'outline'}
                    className={`justify-start ${
                      isRed ? 'border-destructive/50' :
                      isAmber ? 'border-orange-400/60' : ''
                    }`}
                    onClick={() => setSkinCondition(condition.value)}
                  >
                    {condition.label}
                    {isRed && <AlertTriangle className="h-3 w-3 ml-auto text-destructive" />}
                    {isAmber && <AlertTriangle className="h-3 w-3 ml-auto text-orange-500" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Alert for amber conditions */}
          {requiresMonitoring && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-700">Monitor Closely</p>
                  <p className="text-sm text-orange-600">
                    If no improvement or you have concerns, seek advice from GP or Nurse.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alert for serious conditions */}
          {requiresEscalation && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Action Required</p>
                  <p className="text-sm text-muted-foreground">
                    This condition requires medical review. Seek advice from GP or Nurse.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Moisture Status */}
          <div className="space-y-2">
            <Label>Moisture Status</Label>
            <Select value={moistureStatus} onValueChange={(v) => setMoistureStatus(v as MoistureStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOISTURE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discomfort Level */}
          <div className="space-y-2">
            <Label>Discomfort / Pain</Label>
            <div className="flex flex-wrap gap-2">
              {DISCOMFORT_LEVELS.map((level) => (
                <Badge
                  key={level.value}
                  variant={discomfortLevel === level.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setDiscomfortLevel(level.value)}
                >
                  {level.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Barrier Cream */}
          <div className="space-y-2">
            <Label>Barrier Cream Applied</Label>
            <div className="flex flex-wrap gap-2">
              {BARRIER_CREAM_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={barrierCream === option.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setBarrierCream(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Skin Check'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
