/**
 * Enteral Stoma Check Form
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useLogEnteralStomaCheck } from '@/hooks/useEnteral';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import {
  ENTERAL_STOMA_FINDINGS,
  ENTERAL_STOMA_PAIN_LEVELS,
  ENTERAL_ESCALATION_TYPES,
  calculateEnteralStomaStatus,
  type EnteralStomaFinding,
  type EnteralStomaPainLevel,
  type EnteralEscalationType,
} from '@/types/enteral';

interface EnteralStomaCheckFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnteralStomaCheckForm({ clientId, open, onOpenChange }: EnteralStomaCheckFormProps) {
  const { staffName } = useCurrentStaff();
  const logStoma = useLogEnteralStomaCheck(clientId);

  const [findings, setFindings] = useState<EnteralStomaFinding[]>([]);
  const [painLevel, setPainLevel] = useState<EnteralStomaPainLevel>('none');
  const [escalationType, setEscalationType] = useState<EnteralEscalationType | ''>('');
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');

  const statusLevel = calculateEnteralStomaStatus(findings, painLevel, null);

  const toggleFinding = (f: EnteralStomaFinding) => {
    setFindings(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const resetForm = () => {
    setFindings([]);
    setPainLevel('none');
    setEscalationType('');
    setActionTaken('');
    setNotes('');
  };

  const handleSubmit = () => {
    logStoma.mutate({
      findings,
      pain_level: painLevel,
      status_level: statusLevel,
      escalation_type: escalationType || null,
      action_taken: actionTaken || null,
      notes: notes || null,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stoma Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Logged by: <strong>{staffName}</strong>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <Label>Findings</Label>
            <div className="grid grid-cols-1 gap-2">
              {ENTERAL_STOMA_FINDINGS.map(f => (
                <label key={f.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={findings.includes(f.value)}
                    onCheckedChange={() => toggleFinding(f.value)}
                  />
                  <span className={
                    f.severity === 'red' ? 'text-destructive' :
                    f.severity === 'amber' ? 'text-warning' : ''
                  }>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pain Level */}
          <div className="space-y-2">
            <Label>Pain Level</Label>
            <Select value={painLevel} onValueChange={v => setPainLevel(v as EnteralStomaPainLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTERAL_STOMA_PAIN_LEVELS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status indicator */}
          {statusLevel !== 'green' && (
            <Alert className={statusLevel === 'red' ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}>
              <AlertTriangle className={`h-4 w-4 ${statusLevel === 'red' ? 'text-destructive' : 'text-warning'}`} />
              <AlertDescription className={statusLevel === 'red' ? 'text-destructive' : 'text-warning'}>
                {statusLevel === 'red' ? 'Red alert – escalation required.' : 'Amber – monitor closely.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Escalation (required if Red) */}
          {statusLevel === 'red' && (
            <div className="space-y-2">
              <Label>Action Taken *</Label>
              <Select value={escalationType} onValueChange={v => setEscalationType(v as EnteralEscalationType)}>
                <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                <SelectContent>
                  {ENTERAL_ESCALATION_TYPES.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={findings.length === 0 || (statusLevel === 'red' && !escalationType) || logStoma.isPending}
            className="w-full"
          >
            {logStoma.isPending ? 'Saving...' : 'Log Stoma Check'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
