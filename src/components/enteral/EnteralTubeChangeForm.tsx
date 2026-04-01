/**
 * EnteralTubeChangeForm - Log a tube change event
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TUBE_TYPES } from '@/types/enteral';
import { useLogEnteralTubeChange } from '@/hooks/useEnteral';

interface EnteralTubeChangeFormProps {
  clientId?: string;
  currentTubeType?: string | null;
  currentTubeSizeFr?: string | null;
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
  open,
  onOpenChange,
}: EnteralTubeChangeFormProps) {
  const [tubeType, setTubeType] = useState(currentTubeType || '');
  const [tubeSizeFr, setTubeSizeFr] = useState(currentTubeSizeFr || '');
  const [changeReason, setChangeReason] = useState('');
  const [changedByProfessional, setChangedByProfessional] = useState('');
  const [notes, setNotes] = useState('');

  const logMutation = useLogEnteralTubeChange(clientId);

  const handleSubmit = () => {
    if (!tubeType || !changeReason || !changedByProfessional) return;

    logMutation.mutate(
      {
        tube_type: tubeType,
        tube_size_fr: tubeSizeFr || null,
        change_reason: changeReason,
        changed_by_professional: changedByProfessional,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTubeType(currentTubeType || '');
          setTubeSizeFr(currentTubeSizeFr || '');
          setChangeReason('');
          setChangedByProfessional('');
          setNotes('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Tube Change</DialogTitle>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 text-xs">
            Tube changes must be performed by a Health Professional only.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tube Type *</Label>
            <Select value={tubeType} onValueChange={setTubeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select tube type" />
              </SelectTrigger>
              <SelectContent>
                {TUBE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tube Size (Fr)</Label>
            <Input
              value={tubeSizeFr}
              onChange={(e) => setTubeSizeFr(e.target.value)}
              placeholder="e.g. 14"
            />
          </div>

          <div className="space-y-2">
            <Label>Reason for Change *</Label>
            <Select value={changeReason} onValueChange={setChangeReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Changed by (Health Professional Name) *</Label>
            <Input
              value={changedByProfessional}
              onChange={(e) => setChangedByProfessional(e.target.value)}
              placeholder="Name of professional who changed the tube"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!tubeType || !changeReason || !changedByProfessional || logMutation.isPending}
            className="w-full"
          >
            {logMutation.isPending ? 'Saving...' : 'Log Tube Change'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
