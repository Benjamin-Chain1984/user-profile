/**
 * EnteralTubeChangeForm - Log a tube change event
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TUBE_TYPES } from '@/types/enteral';
import { useLogEnteralTubeChange } from '@/hooks/useEnteral';
import { format } from 'date-fns';

interface EnteralTubeChangeFormProps {
  clientId?: string;
  currentTubeType?: string | null;
  currentTubeSizeFr?: string | null;
  currentTubeChangeIntervalDays?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHANGE_REASONS = [
  'Scheduled replacement',
  'Blocked / obstructed tube',
  'Dislodged tube',
  'Leaking tube',
  'Damaged tube',
  'Infection at site',
  'Upsized / downsized',
  'Other',
];

export function EnteralTubeChangeForm({
  clientId,
  currentTubeType,
  currentTubeSizeFr,
  currentTubeChangeIntervalDays,
  open,
  onOpenChange,
}: EnteralTubeChangeFormProps) {
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [changeReason, setChangeReason] = useState('');
  const [changedByProfessional, setChangedByProfessional] = useState('');
  const [notes, setNotes] = useState('');

  const logMutation = useLogEnteralTubeChange(clientId);

  useEffect(() => {
    if (open) {
      setEventDate(format(new Date(), 'yyyy-MM-dd'));
      setChangeReason('');
      setChangedByProfessional('');
      setNotes('');
    }
  }, [open]);

  const tubeLabel = TUBE_TYPES.find((t) => t.value === currentTubeType)?.label || currentTubeType || 'Not configured';
  const intervalLabel = currentTubeChangeIntervalDays
    ? currentTubeChangeIntervalDays % 7 === 0
      ? `${currentTubeChangeIntervalDays / 7} week(s)`
      : `${currentTubeChangeIntervalDays} day(s)`
    : 'Not configured';

  const handleSubmit = async () => {
    if (!currentTubeType || !changeReason || !changedByProfessional || !eventDate) return;

    const eventOccurredAt = new Date(`${eventDate}T12:00:00`).toISOString();

    await logMutation.mutateAsync({
      event_occurred_at: eventOccurredAt,
      tube_type: currentTubeType,
      tube_size_fr: currentTubeSizeFr || null,
      change_reason: changeReason,
      changed_by_professional: changedByProfessional,
      notes: notes || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Tube Change</DialogTitle>
          <DialogDescription>
            Record a tube change completed by a health professional and automatically recalculate the next due date from the configured schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-destructive/50 bg-destructive/5">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              Tube changes must only be performed by a qualified health professional.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Tube Type</Label>
            <Input value={tubeLabel} readOnly disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Taken from the saved Enteral Nutrition settings.</p>
          </div>

          {currentTubeSizeFr && (
            <div className="space-y-2">
              <Label>Tube Size</Label>
              <Input value={`${currentTubeSizeFr} Fr`} readOnly disabled className="bg-muted" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Configured Change Interval</Label>
            <Input value={intervalLabel} readOnly disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Date Changed</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason for Change</Label>
            <Select value={changeReason} onValueChange={setChangeReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Changed by (Health Professional Name)</Label>
            <Input
              value={changedByProfessional}
              onChange={(e) => setChangedByProfessional(e.target.value)}
              placeholder="Name of professional who changed the tube"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or concerns..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!currentTubeType || !changeReason || !changedByProfessional || !eventDate || logMutation.isPending}
          >
            {logMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
