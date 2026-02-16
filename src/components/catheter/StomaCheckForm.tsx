/**
 * Stoma Check Form - Enhanced daily stoma site assessment
 * Traffic-light status logic: Green (healthy), Amber (monitor), Red (escalate)
 */

import { useState, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useStomaChecks, calculateStomaStatusLevel } from '@/hooks/useCatheter';
import {
  STOMA_FINDINGS,
  STOMA_PAIN_LEVELS,
  STOMA_DRESSING_OPTIONS,
  STOMA_ESCALATION_TYPES,
  type StomaFinding,
  type StomaPainLevel,
  type StomaDressingStatus,
  type StomaEscalationType,
  type StomaStatusLevel,
} from '@/types/catheter';

interface StomaCheckFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StomaCheckForm({ clientId, open, onOpenChange }: StomaCheckFormProps) {
  const { addCheck } = useStomaChecks(clientId);

  const [findings, setFindings] = useState<StomaFinding[]>([]);
  const [painLevel, setPainLevel] = useState<StomaPainLevel>('none');
  const [dressingStatus, setDressingStatus] = useState<StomaDressingStatus>('not_applicable');
  const [notes, setNotes] = useState('');
  const [escalationType, setEscalationType] = useState<StomaEscalationType | ''>('');
  const [actionTaken, setActionTaken] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');

  const statusLevel = useMemo<StomaStatusLevel>(() => {
    return calculateStomaStatusLevel(findings, painLevel, null);
  }, [findings, painLevel]);

  const isRed = statusLevel === 'red';
  const isAmber = statusLevel === 'amber';
  const needsEscalation = isRed;

  const toggleFinding = (finding: StomaFinding) => {
    setFindings(prev =>
      prev.includes(finding) ? prev.filter(f => f !== finding) : [...prev, finding]
    );
  };

  // Derive legacy boolean fields from findings
  const deriveCondition = () => {
    if (isRed) return findings.includes('leakage_around_catheter') ? 'leaking' as const : 'swelling' as const;
    if (isAmber) return findings.includes('mild_redness') ? 'redness' as const : 'pain' as const;
    return 'healthy' as const;
  };

  const canSubmit = needsEscalation
    ? escalationType !== '' && (escalationType !== 'not_yet' || escalationNotes.trim() !== '')
    : true;

  const handleSubmit = async () => {
    await addCheck.mutateAsync({
      stoma_condition: deriveCondition(),
      findings,
      pain_level: painLevel,
      dressing_status: dressingStatus,
      status_level: statusLevel,
      redness: findings.includes('mild_redness'),
      swelling: findings.includes('swelling'),
      pain: painLevel !== 'none',
      leaking: findings.includes('leakage_around_catheter'),
      maceration: findings.includes('moisture_around_site'),
      granulation: false,
      notes: notes || undefined,
      escalated_to_clinician: needsEscalation && escalationType !== '' && escalationType !== 'not_yet',
      escalation_notes: escalationNotes || undefined,
      escalation_type: escalationType as StomaEscalationType || undefined,
      action_taken: actionTaken || undefined,
    });

    // Reset
    setFindings([]);
    setPainLevel('none');
    setDressingStatus('not_applicable');
    setNotes('');
    setEscalationType('');
    setActionTaken('');
    setEscalationNotes('');
    onOpenChange(false);
  };

  const getFindingSeverityColor = (severity: 'green' | 'amber' | 'red') => {
    switch (severity) {
      case 'green': return 'border-green-200 bg-green-50 data-[state=on]:bg-green-100 data-[state=on]:border-green-500';
      case 'amber': return 'border-amber-200 bg-amber-50 data-[state=on]:bg-amber-100 data-[state=on]:border-amber-500';
      case 'red': return 'border-red-200 bg-red-50 data-[state=on]:bg-red-100 data-[state=on]:border-red-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Stoma Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Safety Note */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-xs">
              Monitor the suprapubic site daily. Escalate to a Registered Nurse or GP if concerning changes are identified.
            </AlertDescription>
          </Alert>

          {/* Appearance Checklist */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Appearance</Label>
            <div className="grid grid-cols-2 gap-2">
              {STOMA_FINDINGS.map((item) => {
                const isSelected = findings.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleFinding(item.value)}
                    className={`text-left text-sm p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? item.severity === 'green'
                          ? 'border-green-500 bg-green-100'
                          : item.severity === 'amber'
                            ? 'border-amber-500 bg-amber-100'
                            : 'border-red-500 bg-red-100'
                        : 'border-muted bg-background hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.severity === 'green' ? 'bg-green-500' :
                        item.severity === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Level */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Pain</Label>
            <div className="grid grid-cols-2 gap-2">
              {STOMA_PAIN_LEVELS.map((item) => {
                const isSelected = painLevel === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPainLevel(item.value)}
                    className={`text-left text-sm p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? item.severity === 'green'
                          ? 'border-green-500 bg-green-100'
                          : item.severity === 'amber'
                            ? 'border-amber-500 bg-amber-100'
                            : 'border-red-500 bg-red-100'
                        : 'border-muted bg-background hover:bg-muted/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.severity === 'green' ? 'bg-green-500' :
                        item.severity === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dressing Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Dressing</Label>
            <div className="grid grid-cols-3 gap-2">
              {STOMA_DRESSING_OPTIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDressingStatus(item.value)}
                  className={`text-sm p-3 rounded-lg border-2 transition-all ${
                    dressingStatus === item.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted bg-background hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Preview */}
          {statusLevel === 'green' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 text-sm">IDEAL – Site healthy</AlertTitle>
              <AlertDescription className="text-green-700 text-xs">
                No concerns identified.
              </AlertDescription>
            </Alert>
          )}
          {isAmber && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-sm">Monitor – Attention Required</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs">
                Monitor closely. Recheck within 24 hours. Escalate if symptoms worsen.
              </AlertDescription>
            </Alert>
          )}
          {isRed && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 text-sm">Action Required – Escalate Now</AlertTitle>
              <AlertDescription className="text-red-700 text-xs">
                Concerning stoma findings. Escalate to Registered Nurse or GP immediately.
              </AlertDescription>
            </Alert>
          )}

          {/* Mandatory Escalation for Red */}
          {needsEscalation && (
            <div className="space-y-3 border-2 border-red-200 rounded-lg p-4 bg-red-50/30">
              <Label className="text-sm font-semibold text-red-800">Escalation Documentation (Required)</Label>
              <div className="space-y-2">
                <Label className="text-xs">Escalated to</Label>
                <Select value={escalationType} onValueChange={(v) => setEscalationType(v as StomaEscalationType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who was contacted" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOMA_ESCALATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {escalationType === 'not_yet' && (
                <Textarea
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="Reason why escalation has not yet occurred..."
                  rows={2}
                />
              )}

              <div className="space-y-2">
                <Label className="text-xs">Action Taken</Label>
                <Textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe the action taken..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">Notes (optional)</Label>
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
          <Button onClick={handleSubmit} disabled={addCheck.isPending || !canSubmit}>
            {addCheck.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
