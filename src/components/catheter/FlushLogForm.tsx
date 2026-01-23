/**
 * Flush Log Form - Log catheter flushes
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlushLogs } from '@/hooks/useCatheter';
import { FLUSH_SOLUTIONS, type FlushSolution } from '@/types/catheter';

interface FlushLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlushLogForm({ clientId, open, onOpenChange }: FlushLogFormProps) {
  const { addFlush } = useFlushLogs(clientId);

  const [flushVolume, setFlushVolume] = useState<string>('');
  const [flushSolution, setFlushSolution] = useState<FlushSolution>('saline');
  const [outputDescription, setOutputDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await addFlush.mutateAsync({
      flush_volume_ml: flushVolume ? parseInt(flushVolume, 10) : undefined,
      flush_solution: flushSolution,
      output_description: outputDescription || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setFlushVolume('');
    setFlushSolution('saline');
    setOutputDescription('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Catheter Flush</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Flush Solution */}
          <div className="space-y-2">
            <Label>Flush Solution</Label>
            <Select value={flushSolution} onValueChange={(v) => setFlushSolution(v as FlushSolution)}>
              <SelectTrigger>
                <SelectValue placeholder="Select solution" />
              </SelectTrigger>
              <SelectContent>
                {FLUSH_SOLUTIONS.map((sol) => (
                  <SelectItem key={sol.value} value={sol.value}>
                    {sol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <Label>Volume (ml) - optional</Label>
            <Input
              type="number"
              value={flushVolume}
              onChange={(e) => setFlushVolume(e.target.value)}
              placeholder="e.g. 30"
              min={0}
            />
          </div>

          {/* Output Description */}
          <div className="space-y-2">
            <Label>Output Observation</Label>
            <Textarea
              value={outputDescription}
              onChange={(e) => setOutputDescription(e.target.value)}
              placeholder="Describe what came out (clear, cloudy, debris, etc.)"
              rows={2}
            />
          </div>

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
          <Button onClick={handleSubmit} disabled={addFlush.isPending}>
            {addFlush.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
