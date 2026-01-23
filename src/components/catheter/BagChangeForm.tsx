/**
 * Bag Change Form - Log drainage bag changes
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBagChanges, useCatheterConfig } from '@/hooks/useCatheter';
import {
  BAG_TYPES,
  BAG_CHANGE_REASONS,
  type BagType,
  type BagChangeReason,
} from '@/types/catheter';

interface BagChangeFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BagChangeForm({ clientId, open, onOpenChange }: BagChangeFormProps) {
  const { config } = useCatheterConfig(clientId);
  const { addChange } = useBagChanges(clientId);

  const allowedBagTypes = config?.bag_types || [];
  const filteredBagTypes = BAG_TYPES.filter(bt => allowedBagTypes.includes(bt.value));

  const [bagType, setBagType] = useState<BagType>(filteredBagTypes[0]?.value || 'night_bag');
  const [changeReason, setChangeReason] = useState<BagChangeReason>('routine');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await addChange.mutateAsync({
      bag_type: bagType,
      change_reason: changeReason,
      notes: notes || undefined,
    });

    // Reset form
    setNotes('');
    setChangeReason('routine');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Bag Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bag Type */}
          <div className="space-y-2">
            <Label>Bag Type</Label>
            <Select value={bagType} onValueChange={(v) => setBagType(v as BagType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bag type" />
              </SelectTrigger>
              <SelectContent>
                {filteredBagTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Reason */}
          <div className="space-y-2">
            <Label>Reason for Change</Label>
            <Select value={changeReason} onValueChange={(v) => setChangeReason(v as BagChangeReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {BAG_CHANGE_REASONS.map((reason) => (
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
              placeholder="Any observations..."
              rows={2}
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
