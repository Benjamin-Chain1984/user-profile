/**
 * Catheter Change Form - Log catheter changes
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
import { useCatheterChanges, useCatheterConfig } from '@/hooks/useCatheter';
import {
  CATHETER_TYPES,
  CHANGE_REASONS,
  CATHETER_TYPE_CONFIG,
  type CatheterType,
  type ChangeReason,
} from '@/types/catheter';

interface CatheterChangeFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatheterChangeForm({ clientId, open, onOpenChange }: CatheterChangeFormProps) {
  const { config } = useCatheterConfig(clientId);
  const { addChange } = useCatheterChanges(clientId);

  const [catheterType, setCatheterType] = useState<CatheterType>(config?.catheter_type || 'idc');
  const [catheterSize, setCatheterSize] = useState<string>(config?.catheter_size || '');
  const [changeReason, setChangeReason] = useState<ChangeReason>('routine');
  const [notes, setNotes] = useState('');

  const typeConfig = CATHETER_TYPE_CONFIG[catheterType];

  const handleSubmit = async () => {
    await addChange.mutateAsync({
      catheter_type: catheterType,
      catheter_size: catheterSize || undefined,
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
          <DialogTitle>Log Catheter Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Catheter Type */}
          <div className="space-y-2">
            <Label>Catheter Type</Label>
            <Select
              value={catheterType}
              onValueChange={(v) => {
                setCatheterType(v as CatheterType);
                setCatheterSize('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CATHETER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catheter Size - Dynamic based on type */}
          {typeConfig.sizeOptions.length > 0 && (
            <div className="space-y-2">
              <Label>{typeConfig.sizeLabel}</Label>
              <Select value={catheterSize} onValueChange={setCatheterSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {typeConfig.sizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
