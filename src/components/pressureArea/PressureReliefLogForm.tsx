/**
 * Pressure Relief Log Form - Fast UX for logging repositioning
 * Staff identity is auto-stamped from authenticated session.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { usePressureReliefEvents } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { RELIEF_ISSUES, type RotationPosition, getPositionsForDay } from '@/types/pressureArea';
import { Loader2, CheckCircle2, AlertTriangle, User } from 'lucide-react';

interface Props {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PressureReliefLogForm({ clientId, open, onOpenChange }: Props) {
  const { logEvent, isLogging } = usePressureReliefEvents(clientId);
  const { plan } = usePressureReliefPlan(clientId);
  const { staffName } = useCurrentStaff();

  const positions = plan?.rotation_sequence ? getPositionsForDay(plan.rotation_sequence) : [] as RotationPosition[];
  const recommendedPosition = positions.length > 0 ? positions[0].name : '';

  const [positionCompleted, setPositionCompleted] = useState(recommendedPosition);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [issueDetails, setIssueDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationContact, setEscalationContact] = useState('');
  const [escalationAdvice, setEscalationAdvice] = useState('');

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => {
      const next = prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue];
      if (next.includes('Unsafe to move')) setShowEscalation(true);
      return next;
    });
  };

  const handleSubmit = () => {
    logEvent({
      position_completed: positionCompleted || recommendedPosition || 'Not specified',
      position_recommended: recommendedPosition || null,
      event_occurred_at: new Date().toISOString(),
      issues: selectedIssues,
      issue_details: issueDetails || null,
      escalation_required: showEscalation,
      escalation_contact: escalationContact || null,
      escalation_advice: escalationAdvice || null,
      notes: notes || null,
      completed_by_name: staffName,
    });
    // Reset
    setPositionCompleted(recommendedPosition);
    setSelectedIssues([]);
    setIssueDetails('');
    setNotes('');
    setShowEscalation(false);
    setEscalationContact('');
    setEscalationAdvice('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Pressure Relief Completed</DialogTitle>
          <DialogDescription>Record the repositioning event</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-stamped staff identity */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Logged by:</span>
            <span className="text-sm font-medium">{staffName}</span>
          </div>

          <div>
            <Label>Position Completed</Label>
            {positions.length > 0 ? (
              <Select value={positionCompleted} onValueChange={setPositionCompleted}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {[...new Map(positions.map(p => [p.name, p])).values()].map((p, i) => (
                    <SelectItem key={p.id || `pos-${i}`} value={p.name}>{p.name}</SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={positionCompleted} onChange={e => setPositionCompleted(e.target.value)} placeholder="Position completed" />
            )}
            {recommendedPosition && (
              <p className="text-xs text-muted-foreground mt-1">Recommended: {recommendedPosition}</p>
            )}
          </div>

          {/* Issues */}
          <div>
            <Label className="mb-2 block">Any Issues?</Label>
            <div className="grid grid-cols-2 gap-2">
              {RELIEF_ISSUES.map(issue => (
                <div key={issue} className="flex items-center gap-2">
                  <Checkbox checked={selectedIssues.includes(issue)} onCheckedChange={() => toggleIssue(issue)} />
                  <Label className="text-sm">{issue}</Label>
                </div>
              ))}
            </div>
          </div>

          {selectedIssues.includes('Other') && (
            <div>
              <Label>Issue Details</Label>
              <Input value={issueDetails} onChange={e => setIssueDetails(e.target.value)} placeholder="Describe the issue" />
            </div>
          )}

          {/* Escalation */}
          {showEscalation && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium text-destructive">Escalation Required</p>
                </div>
                <div>
                  <Label>Who was contacted?</Label>
                  <Input value={escalationContact} onChange={e => setEscalationContact(e.target.value)} placeholder="Name and role" />
                </div>
                <div>
                  <Label>Advice Received</Label>
                  <Textarea value={escalationAdvice} onChange={e => setEscalationAdvice(e.target.value)} rows={2} placeholder="What was the advice?" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional observations" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLogging || !positionCompleted}>
            {isLogging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Log Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
