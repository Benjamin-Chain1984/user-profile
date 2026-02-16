/**
 * Bag Change Form - Enhanced with condition, tubing, and stock tracking
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBagChanges, useCatheterBagConfig } from '@/hooks/useCatheter';
import {
  BAG_TYPES,
  BAG_CHANGE_REASONS,
  BAG_CONDITIONS,
  type BagType,
  type BagChangeReason,
  type BagCondition,
} from '@/types/catheter';

interface BagChangeFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BagChangeForm({ clientId, open, onOpenChange }: BagChangeFormProps) {
  const { configs } = useCatheterBagConfig(clientId);
  const { addChange } = useBagChanges(clientId);

  // Only show bag types that are configured as active
  const activeBagTypes = configs.filter(c => c.is_active).map(c => c.bag_type);
  const filteredBagTypes = activeBagTypes.length > 0
    ? BAG_TYPES.filter(bt => activeBagTypes.includes(bt.value))
    : BAG_TYPES;

  const [bagType, setBagType] = useState<BagType>(filteredBagTypes[0]?.value || 'leg_bag');
  const [changeReason, setChangeReason] = useState<BagChangeReason>('routine');
  const [condition, setCondition] = useState<BagCondition>('clear_urine');
  const [tubingChanged, setTubingChanged] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await addChange.mutateAsync({
      bag_type: bagType,
      change_reason: changeReason,
      condition,
      tubing_changed: tubingChanged,
      notes: notes || undefined,
    });

    // Reset form
    setNotes('');
    setChangeReason('routine');
    setCondition('clear_urine');
    setTubingChanged(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Condition of Removed Bag */}
          <div className="space-y-2">
            <Label>Condition of Removed Bag</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as BagCondition)}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {BAG_CONDITIONS.map((cond) => (
                  <SelectItem key={cond.value} value={cond.value}>
                    {cond.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tubing Changed */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="tubing-changed" className="cursor-pointer">
              Was tubing also changed?
            </Label>
            <Switch
              id="tubing-changed"
              checked={tubingChanged}
              onCheckedChange={setTubingChanged}
            />
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
