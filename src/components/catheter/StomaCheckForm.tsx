/**
 * Stoma Check Form - Log stoma site assessments
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useStomaChecks } from '@/hooks/useCatheter';
import { STOMA_CONDITIONS, type StomaCondition } from '@/types/catheter';

interface StomaCheckFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StomaCheckForm({ clientId, open, onOpenChange }: StomaCheckFormProps) {
  const { addCheck } = useStomaChecks(clientId);

  const [stomaCondition, setStomaCondition] = useState<StomaCondition>('healthy');
  const [redness, setRedness] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [pain, setPain] = useState(false);
  const [leaking, setLeaking] = useState(false);
  const [maceration, setMaceration] = useState(false);
  const [granulation, setGranulation] = useState(false);
  const [notes, setNotes] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [escalationNotes, setEscalationNotes] = useState('');

  const hasConcerns = redness || swelling || pain || leaking || maceration || granulation || stomaCondition !== 'healthy';

  const handleSubmit = async () => {
    await addCheck.mutateAsync({
      stoma_condition: stomaCondition,
      redness,
      swelling,
      pain,
      leaking,
      maceration,
      granulation,
      notes: notes || undefined,
      escalated_to_clinician: escalated,
      escalation_notes: escalationNotes || undefined,
    });

    // Reset form
    setStomaCondition('healthy');
    setRedness(false);
    setSwelling(false);
    setPain(false);
    setLeaking(false);
    setMaceration(false);
    setGranulation(false);
    setNotes('');
    setEscalated(false);
    setEscalationNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Stoma Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overall Condition */}
          <div className="space-y-2">
            <Label>Overall Stoma Condition</Label>
            <Select value={stomaCondition} onValueChange={(v) => setStomaCondition(v as StomaCondition)}>
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {STOMA_CONDITIONS.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific Observations */}
          <div className="space-y-3">
            <Label>Specific Observations</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="redness" checked={redness} onCheckedChange={(c) => setRedness(!!c)} />
                <Label htmlFor="redness" className="font-normal">Redness</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="swelling" checked={swelling} onCheckedChange={(c) => setSwelling(!!c)} />
                <Label htmlFor="swelling" className="font-normal">Swelling</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pain" checked={pain} onCheckedChange={(c) => setPain(!!c)} />
                <Label htmlFor="pain" className="font-normal">Pain</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="leaking" checked={leaking} onCheckedChange={(c) => setLeaking(!!c)} />
                <Label htmlFor="leaking" className="font-normal">Leaking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="maceration" checked={maceration} onCheckedChange={(c) => setMaceration(!!c)} />
                <Label htmlFor="maceration" className="font-normal">Maceration</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="granulation" checked={granulation} onCheckedChange={(c) => setGranulation(!!c)} />
                <Label htmlFor="granulation" className="font-normal">Granulation</Label>
              </div>
            </div>
          </div>

          {/* Concern Alert */}
          {hasConcerns && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Concerns noted. Consider escalating to a clinician.
              </AlertDescription>
            </Alert>
          )}

          {/* Escalation */}
          {hasConcerns && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="escalated" checked={escalated} onCheckedChange={(c) => setEscalated(!!c)} />
                <Label htmlFor="escalated" className="font-normal">Escalated to clinician</Label>
              </div>
              {escalated && (
                <Textarea
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="Who was contacted and what advice was given..."
                  rows={2}
                />
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addCheck.isPending}>
            {addCheck.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
