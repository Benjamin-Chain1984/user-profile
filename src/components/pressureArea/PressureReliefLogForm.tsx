/**
 * Pressure Relief Log Form - Fast UX for logging repositioning
 * Staff identity is auto-stamped from authenticated session.
 */

import { useState, useEffect, useMemo } from 'react';
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
import { addMinutes, format } from 'date-fns';

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

  // Build scheduled time slots from plan
  const scheduledSlots = useMemo(() => {
    if (!plan || plan.status !== 'published' || plan.schedule_type === 'as_required' || positions.length === 0) return [];
    const dayStartStr = plan.day_schedule_start || '06:00';
    const [startH, startM] = dayStartStr.split(':').map(Number);
    const now = new Date();
    const todayBase = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
    const intervalMinutes = plan.interval_minutes || 120;

    const slots: { time: string; label: string; position: string }[] = [];
    let cumulativeMinutes = 0;
    for (let i = 0; i < positions.length; i++) {
      const slotTime = addMinutes(todayBase, cumulativeMinutes);
      const timeStr = format(slotTime, 'HH:mm');
      slots.push({
        time: timeStr,
        label: `${timeStr} – ${positions[i].name}`,
        position: positions[i].name,
      });
      cumulativeMinutes += positions[i].target_duration_minutes || intervalMinutes;
    }
    return slots;
  }, [plan, positions]);

  const [selectedScheduledTime, setSelectedScheduledTime] = useState<string>('');
  const [positionCompleted, setPositionCompleted] = useState(recommendedPosition);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [issueDetails, setIssueDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationContact, setEscalationContact] = useState('');
  const [escalationAdvice, setEscalationAdvice] = useState('');

  // Auto-select the most recent due scheduled slot when form opens
  useEffect(() => {
    if (open && scheduledSlots.length > 0 && !selectedScheduledTime) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const dueOrPastSlots = scheduledSlots.filter(s => {
        const [h, m] = s.time.split(':').map(Number);
        return h * 60 + m <= nowMinutes;
      });

      const targetSlot = dueOrPastSlots[dueOrPastSlots.length - 1] || scheduledSlots[0];
      if (targetSlot) {
        setSelectedScheduledTime(targetSlot.time);
        setPositionCompleted(targetSlot.position);
      }
    }
  }, [open, scheduledSlots, selectedScheduledTime]);

  // When scheduled time changes, update recommended position
  useEffect(() => {
    if (selectedScheduledTime && selectedScheduledTime !== 'other') {
      const slot = scheduledSlots.find(s => s.time === selectedScheduledTime);
      if (slot) setPositionCompleted(slot.position);
    }
  }, [selectedScheduledTime, scheduledSlots]);

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
      scheduled_time: selectedScheduledTime && selectedScheduledTime !== 'other' ? selectedScheduledTime : null,
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
    setSelectedScheduledTime('');
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

          {/* Scheduled Time Selector */}
          {scheduledSlots.length > 0 && (
            <div>
              <Label>Which scheduled reposition is this for?</Label>
              <Select value={selectedScheduledTime} onValueChange={setSelectedScheduledTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select scheduled time" />
                </SelectTrigger>
                <SelectContent>
                  {scheduledSlots.map(slot => (
                    <SelectItem key={slot.time} value={slot.time}>{slot.label}</SelectItem>
                  ))}
                  <SelectItem value="other">Other (outside schedule)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}


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
