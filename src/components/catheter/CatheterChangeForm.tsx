/**
 * Catheter Change Form - Log catheter changes
 * Pulls catheter type/size from the Digital Care Plan as the single source of truth.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldAlert } from 'lucide-react';
import { useCatheterChanges } from '@/hooks/useCatheter';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';
import {
  CATHETER_TYPES,
  CHANGE_REASONS,
  type CatheterType,
  type ChangeReason,
} from '@/types/catheter';
import { format } from 'date-fns';

interface CatheterChangeFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatheterChangeForm({ clientId, open, onOpenChange }: CatheterChangeFormProps) {
  const { plan } = useCatheterCarePlan(clientId);
  const { addChange } = useCatheterChanges(clientId);

  // Derive catheter details from plan (read-only)
  const planCatheterType = (plan?.catheter_type as CatheterType) || 'idc';
  const planCatheterSize = plan?.catheter_size_fr || '';
  const catheterTypeLabel = CATHETER_TYPES.find(t => t.value === planCatheterType)?.label || planCatheterType;

  const [changeReason, setChangeReason] = useState<ChangeReason>('routine');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    const eventOccurredAt = new Date(eventDate + 'T' + format(new Date(), 'HH:mm:ss')).toISOString();

    await addChange.mutateAsync({
      catheter_type: planCatheterType,
      catheter_size: planCatheterSize || undefined,
      change_reason: changeReason,
      notes: notes || undefined,
      event_occurred_at: eventOccurredAt,
    });

    // Reset form
    setNotes('');
    setChangeReason('routine');
    setEventDate(format(new Date(), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Catheter Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Clinical Safety Flag */}
          <Alert className="border-destructive/50 bg-destructive/5">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              Urinary catheter changes must only be performed by a qualified health professional.
            </AlertDescription>
          </Alert>

          {/* Catheter Type - Read-only from Care Plan */}
          <div className="space-y-2">
            <Label>Catheter Type</Label>
            <Input
              value={catheterTypeLabel}
              readOnly
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">As per Digital Urinary Catheter Care Plan</p>
          </div>

          {/* Catheter Size - Read-only from Care Plan */}
          {planCatheterSize && (
            <div className="space-y-2">
              <Label>Catheter Size</Label>
              <Input
                value={planCatheterSize}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Change Interval - Read-only from Care Plan */}
          {plan?.change_interval && (
            <div className="space-y-2">
              <Label>Change Interval</Label>
              <Input
                value={plan.change_interval}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Date Changed */}
          <div className="space-y-2">
            <Label>Date Changed</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Change Reason */}
          <div className="space-y-2">
            <Label>Reason for Change</Label>
            <Select value={changeReason} onValueChange={(v) => setChangeReason(v as ChangeReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
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
          <Button onClick={handleSubmit} disabled={addChange.isPending}>
            {addChange.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
