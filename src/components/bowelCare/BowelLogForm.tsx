/**
 * Bowel Log Entry Form - Main form for logging bowel movements
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BristolSelector } from './BristolSelector';
import { StoolSizeSelector } from './StoolSizeSelector';
import { IndicatorsForm } from './IndicatorsForm';
import { useBowelLogs } from '@/hooks/useBowelCare';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { BowelIndicators } from '@/types/bowelCare';

interface BowelLogFormProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BowelLogForm({ clientId, open, onOpenChange }: BowelLogFormProps) {
  const { addLog, isAdding } = useBowelLogs(clientId);
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [stoolSize, setStoolSize] = useState<string | null>(null);
  const [observedStatus, setObservedStatus] = useState<'observed' | 'self_reported' | 'not_observed'>('observed');
  const [indicators, setIndicators] = useState<BowelIndicators>({});
  const [notes, setNotes] = useState('');
  const [showIndicators, setShowIndicators] = useState(false);

  const handleSubmit = () => {
    if (bristolType === null) return;

    addLog(
      {
        bristol_type: bristolType,
        stool_size: stoolSize as 'small' | 'normal' | 'large' | 'unknown' | null,
        observed_status: observedStatus,
        indicators,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          // Reset form
          setBristolType(null);
          setStoolSize(null);
          setObservedStatus('observed');
          setIndicators({});
          setNotes('');
          setShowIndicators(false);
          onOpenChange(false);
        },
      }
    );
  };

  const isNoMovement = bristolType === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Bowel Entry</DialogTitle>
          <DialogDescription>
            Record a bowel movement or note that bowel has not been opened
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bristol Type */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Stool Type (Bristol Chart)</Label>
            <BristolSelector
              value={bristolType}
              onChange={setBristolType}
              disabled={isAdding}
            />
          </div>

          {/* Only show size and indicators if not "no movement" */}
          {bristolType !== null && !isNoMovement && (
            <>
              {/* Stool Size */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Stool Size</Label>
                <StoolSizeSelector
                  value={stoolSize}
                  onChange={setStoolSize}
                  disabled={isAdding}
                />
              </div>

              {/* Observation Status */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">How was this observed?</Label>
                <Select
                  value={observedStatus}
                  onValueChange={(v) => setObservedStatus(v as typeof observedStatus)}
                  disabled={isAdding}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observed">Directly observed</SelectItem>
                    <SelectItem value="self_reported">Self-reported by person</SelectItem>
                    <SelectItem value="not_observed">Not directly observed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expandable Indicators */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  {showIndicators ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showIndicators ? 'Hide' : 'Show'} additional indicators
                </button>
                {showIndicators && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <IndicatorsForm
                      value={indicators}
                      onChange={setIndicators}
                      disabled={isAdding}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Notes (optional)</Label>
            <Textarea
              placeholder="Any additional observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isAdding}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={bristolType === null || isAdding}>
            {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Log Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
