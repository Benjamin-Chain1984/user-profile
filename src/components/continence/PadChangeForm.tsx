/**
 * Pad Change Form - Log pad changes with optional on-behalf-of
 */

import { useState } from 'react';
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

  const [padType, setPadType] = useState<PadType>('pull_up');
  const [padCondition, setPadCondition] = useState<PadCondition>('dry');
  const [changeReason, setChangeReason] = useState<ChangeReason>('scheduled');
  const [notes, setNotes] = useState('');
  
  // Event occurred at
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));
  const [showEventTime, setShowEventTime] = useState(false);

  // On behalf of
  const [onBehalfOpen, setOnBehalfOpen] = useState(false);
  const [onBehalfName, setOnBehalfName] = useState('');
  const [onBehalfRole, setOnBehalfRole] = useState('');
  const [onBehalfReason, setOnBehalfReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enableOnBehalf = config?.enable_uti_testing !== undefined; // Placeholder - should check enable_log_on_behalf

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
      const eventOccurredAt = showEventTime || isOnBehalfUsed
        ? new Date(`${eventDate}T${eventTime}`).toISOString()
        : new Date().toISOString();

      await addChange.mutateAsync({
        pad_type: padType,
        pad_condition: padCondition,
        change_reason: changeReason,
        notes: notes || undefined,
        event_occurred_at: eventOccurredAt,
        recorded_on_behalf_of_name: isOnBehalfUsed ? onBehalfName : undefined,
        recorded_on_behalf_of_role: isOnBehalfUsed ? onBehalfRole : undefined,
        recorded_on_behalf_of_reason: isOnBehalfUsed 
          ? (onBehalfReason === 'other' ? otherReason : onBehalfReason) 
          : undefined,
      });

      resetForm();
      onOpenChange(false);
      onComplete?.();
      
      // Prompt skin check after pad change
      if (promptSkinCheck) {
        promptSkinCheck();
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const resetForm = () => {
    setPadType('pull_up');
    setPadCondition('dry');
    setChangeReason('scheduled');
    setNotes('');
    setEventDate(format(new Date(), 'yyyy-MM-dd'));
    setEventTime(format(new Date(), 'HH:mm'));
    setShowEventTime(false);
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

                  {/* Event Occurred At (shown when on behalf is used) */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Event Occurred At</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use the time the pad change actually occurred. This will update the monitoring timeline and alerts.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Late Entry Option (when not using on behalf) */}
            {!onBehalfOpen && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setShowEventTime(!showEventTime)}
                >
                  <Clock className="h-4 w-4" />
                  {showEventTime ? 'Hide' : 'Log'} Late Entry
                </Button>
                {showEventTime && (
                  <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Use the time the pad change actually occurred.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
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
                    variant={changeReason === reason.value ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setChangeReason(reason.value)}
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
