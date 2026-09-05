/**
 * Pad Change Form - Log pad changes with scheduled time dropdown
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, UserPlus, Clock } from 'lucide-react';
import { usePadChanges, useContinenceConfig } from '@/hooks/useContinence';
import {
  PAD_TYPES,
  PAD_CONDITIONS,
  CHANGE_REASONS,
  ON_BEHALF_REASONS,
  STAFF_ROLES,
  PadType,
  PadCondition,
  ChangeReason,
} from '@/types/continence';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { format } from 'date-fns';

interface PadChangeFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  promptSkinCheck?: () => void;
}

export function PadChangeForm({
  clientId,
  open,
  onOpenChange,
  onComplete,
  promptSkinCheck,
}: PadChangeFormProps) {
  const { addChange } = usePadChanges(clientId);
  const { config } = useContinenceConfig(clientId);
  const { staffName } = useCurrentStaff();

  const [scheduledTime, setScheduledTime] = useState('');
  const [unscheduledTime, setUnscheduledTime] = useState(format(new Date(), 'HH:mm'));
  const [padType, setPadType] = useState<PadType>('pull_up');
  const [padCondition, setPadCondition] = useState<PadCondition>('dry');
  const [changeReasons, setChangeReasons] = useState<ChangeReason[]>(['scheduled']);
  const [notes, setNotes] = useState('');

  // On behalf of
  const [onBehalfOpen, setOnBehalfOpen] = useState(false);
  const [onBehalfName, setOnBehalfName] = useState('');
  const [onBehalfRole, setOnBehalfRole] = useState('');
  const [onBehalfReason, setOnBehalfReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enableOnBehalf = config?.enable_uti_testing !== undefined;

  const intervalStart = (config as any)?.interval_start_time || '07:00';
  const intervalEnd = (config as any)?.interval_end_time || '22:00';
  const isAsRequired = !config || config.schedule_type === 'as_required';

  // Build schedule time dropdown strictly from the configured schedule
  const scheduleTimes = useMemo(() => {
    const items: { value: string; label: string }[] = [];

    if (config?.schedule_type === 'fixed_times' && Array.isArray(config.fixed_times)) {
      for (const time of config.fixed_times) {
        items.push({ value: time, label: `Scheduled Pad Change — ${time}` });
      }
    } else if (config?.schedule_type === 'hourly' && config.interval_hours) {
      // Generate slots only inside the configured active window
      const [sh, sm] = intervalStart.split(':').map(Number);
      const [eh, em] = intervalEnd.split(':').map(Number);
      const startMins = sh * 60 + (sm || 0);
      const endMins = eh * 60 + (em || 0);
      const step = Math.max(1, config.interval_hours) * 60;
      for (let m = startMins; m <= endMins; m += step) {
        const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        items.push({ value: t, label: `Scheduled Pad Change — ${t}` });
      }
    }

    items.sort((a, b) => a.value.localeCompare(b.value));
    // Always allow an unscheduled (as required) change
    items.push({
      value: 'unscheduled',
      label: isAsRequired ? 'Pad Change (as required)' : 'Unscheduled Pad Change',
    });
    return items;
  }, [config?.schedule_type, config?.fixed_times, config?.interval_hours, intervalStart, intervalEnd, isAsRequired]);

  // When no schedule is configured, default to an as-required change
  useEffect(() => {
    if (!open) return;
    if (isAsRequired) {
      setScheduledTime('unscheduled');
      setChangeReasons((prev) => prev.filter((r) => r !== 'scheduled'));
    }
  }, [open, isAsRequired]);


  // Auto-set change reason based on schedule selection
  const handleScheduleTimeChange = (value: string) => {
    setScheduledTime(value);
    if (value === 'unscheduled') {
      setChangeReasons(prev => prev.filter(r => r !== 'scheduled'));
    } else if (!changeReasons.includes('scheduled')) {
      setChangeReasons(prev => [...prev, 'scheduled']);
    }
  };

  const toggleChangeReason = (reason: ChangeReason) => {
    setChangeReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const isOnBehalfUsed = onBehalfName.trim() !== '' || onBehalfReason !== '';
  const isOnBehalfValid = !isOnBehalfUsed || (onBehalfName.trim() !== '' && onBehalfReason !== '');

  const handleSubmit = () => {
    if (isOnBehalfUsed) {
      setShowConfirmation(true);
    } else {
      submitEntry();
    }
  };

  const submitEntry = async () => {
    setIsSubmitting(true);
    try {
      const isScheduled = scheduledTime && scheduledTime !== 'unscheduled';

      // Build a full ISO timestamp for unscheduled entries from the HH:mm input
      let eventOccurredAt: string | undefined;
      if (scheduledTime === 'unscheduled' && unscheduledTime) {
        const today = format(new Date(), 'yyyy-MM-dd');
        eventOccurredAt = new Date(`${today}T${unscheduledTime}:00`).toISOString();
      }

      await addChange.mutateAsync({
        pad_type: padType,
        pad_condition: padCondition,
        change_reason: changeReasons.join(',') as ChangeReason,
        scheduled_time: isScheduled ? scheduledTime : null,
        event_occurred_at: eventOccurredAt,
        notes: notes || undefined,
        recorded_on_behalf_of_name: isOnBehalfUsed ? onBehalfName : undefined,
        recorded_on_behalf_of_role: isOnBehalfUsed ? onBehalfRole : undefined,
        recorded_on_behalf_of_reason: isOnBehalfUsed
          ? (onBehalfReason === 'other' ? otherReason : onBehalfReason)
          : undefined,
      });

      resetForm();
      onOpenChange(false);
      onComplete?.();

      if (promptSkinCheck) {
        promptSkinCheck();
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const resetForm = () => {
    setScheduledTime('');
    setUnscheduledTime(format(new Date(), 'HH:mm'));
    setPadType('pull_up');
    setPadCondition('dry');
    setChangeReasons(['scheduled']);
    setNotes('');
    setOnBehalfOpen(false);
    setOnBehalfName('');
    setOnBehalfRole('');
    setOnBehalfReason('');
    setOtherReason('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Pad Change</DialogTitle>
            <DialogDescription>
              Record a continence pad change
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Logged by */}
            <div className="text-sm text-muted-foreground">
              Logged by: <strong>{staffName}</strong>
            </div>

            {/* On Behalf Of Section */}
            {enableOnBehalf && (
              <Collapsible open={onBehalfOpen} onOpenChange={setOnBehalfOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Recorded on Behalf Of</span>
                    </div>
                    {onBehalfOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="onBehalfName">
                      Staff Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="onBehalfName"
                      placeholder="Enter staff member's name"
                      value={onBehalfName}
                      onChange={(e) => setOnBehalfName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onBehalfRole">Staff Role (Optional)</Label>
                    <Select value={onBehalfRole} onValueChange={setOnBehalfRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onBehalfReason">
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Select value={onBehalfReason} onValueChange={setOnBehalfReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ON_BEHALF_REASONS.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {onBehalfReason === 'other' && (
                    <div className="space-y-2">
                      <Label htmlFor="otherReason">Specify Reason</Label>
                      <Input
                        id="otherReason"
                        placeholder="Enter reason..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Scheduled Time Dropdown */}
            <div className="space-y-2">
              <Label>Pad Change Schedule</Label>
              <Select value={scheduledTime} onValueChange={handleScheduleTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheduled time" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTimes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time entry for unscheduled changes */}
            {scheduledTime === 'unscheduled' && (
              <div className="space-y-2">
                <Label htmlFor="unscheduledTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Occurred
                </Label>
                <Input
                  id="unscheduledTime"
                  type="time"
                  value={unscheduledTime}
                  onChange={(e) => setUnscheduledTime(e.target.value)}
                />
              </div>
            )}


            {/* Pad Type */}
            <div className="space-y-2">
              <Label>Pad Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAD_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={padType === type.value ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setPadType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Pad Condition */}
            <div className="space-y-2">
              <Label>Pad Condition</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAD_CONDITIONS.map((condition) => (
                  <Button
                    key={condition.value}
                    type="button"
                    variant={padCondition === condition.value ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setPadCondition(condition.value)}
                  >
                    {condition.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Change Reason */}
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHANGE_REASONS.map((reason) => (
                  <Button
                    key={reason.value}
                    type="button"
                    variant={changeReasons.includes(reason.value) ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => toggleChangeReason(reason.value)}
                  >
                    {reason.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isOnBehalfValid}
            >
              {isSubmitting ? 'Saving...' : 'Log Pad Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Entry on Behalf of Another</AlertDialogTitle>
            <AlertDialogDescription>
              You are recording this entry on behalf of <strong>{onBehalfName}</strong>.
              Confirm this information is accurate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitEntry}>
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
