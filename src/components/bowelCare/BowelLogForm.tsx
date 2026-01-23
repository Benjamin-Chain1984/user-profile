/**
 * Bowel Log Entry Form - Main form for logging bowel movements
 * Includes optional "Recorded on Behalf Of" and backdated entry support
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BristolSelector } from './BristolSelector';
import { StoolSizeSelector } from './StoolSizeSelector';
import { IndicatorsForm } from './IndicatorsForm';
import { useBowelLogs, useBowelCareConfig } from '@/hooks/useBowelCare';
import { Loader2, ChevronDown, ChevronUp, Users, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { BowelIndicators } from '@/types/bowelCare';
import { ON_BEHALF_REASONS, STAFF_ROLES } from '@/types/bowelCare';

interface BowelLogFormProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BowelLogForm({ clientId, open, onOpenChange }: BowelLogFormProps) {
  const { addLog, isAdding } = useBowelLogs(clientId);
  const { config } = useBowelCareConfig(clientId);
  
  // Core form state
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [stoolSize, setStoolSize] = useState<string | null>(null);
  const [observedStatus, setObservedStatus] = useState<'observed' | 'self_reported' | 'not_observed'>('observed');
  const [indicators, setIndicators] = useState<BowelIndicators>({});
  const [notes, setNotes] = useState('');
  const [showIndicators, setShowIndicators] = useState(false);
  
  // "Recorded on Behalf Of" state
  const [showOnBehalfOf, setShowOnBehalfOf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);
  
  // Event occurred at (backdated entry)
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));
  
  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isOnBehalfOfActive = showOnBehalfOf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);
  const requiresEventTime = isOnBehalfOfActive;

  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };

  const handleSubmitClick = () => {
    if (bristolType === null) return;
    if (!validateOnBehalfOf()) return;

    // If logging on behalf of someone, show confirmation
    if (isOnBehalfOfActive) {
      setShowConfirmDialog(true);
    } else {
      submitEntry();
    }
  };

  const submitEntry = () => {
    if (bristolType === null) return;

    // Combine date and time for event_occurred_at
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventOccurredAt = new Date(eventDate);
    eventOccurredAt.setHours(hours, minutes, 0, 0);

    addLog(
      {
        bristol_type: bristolType,
        stool_size: stoolSize as 'small' | 'normal' | 'large' | 'unknown' | null,
        observed_status: observedStatus,
        indicators,
        notes: notes.trim() || null,
        event_occurred_at: eventOccurredAt.toISOString(),
        recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : null,
        recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole : null,
        recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason : null,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const resetForm = () => {
    setBristolType(null);
    setStoolSize(null);
    setObservedStatus('observed');
    setIndicators({});
    setNotes('');
    setShowIndicators(false);
    setShowOnBehalfOf(false);
    setOnBehalfOfName('');
    setOnBehalfOfRole(null);
    setOnBehalfOfReason(null);
    setEventDate(new Date());
    setEventTime(format(new Date(), 'HH:mm'));
    setShowConfirmDialog(false);
  };

  const isNoMovement = bristolType === 0;
  const enableOnBehalfOf = config?.enable_log_on_behalf ?? false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Bowel Entry</DialogTitle>
            <DialogDescription>
              Record a bowel movement or note that bowel has not been opened
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Recorded on Behalf Of - Collapsible Section */}
            {enableOnBehalfOf && (
              <Collapsible open={showOnBehalfOf} onOpenChange={setShowOnBehalfOf}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
                      showOnBehalfOf 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-muted/30 border-muted hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Recorded on Behalf Of</span>
                    </div>
                    {showOnBehalfOf ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-blue-50/50 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Use this option only when a staff member cannot log in themselves. 
                    All entries will be clearly marked as recorded on behalf of another person.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="onBehalfName">Staff Name *</Label>
                      <Input
                        id="onBehalfName"
                        placeholder="e.g., Jamie Brown"
                        value={onBehalfOfName}
                        onChange={(e) => setOnBehalfOfName(e.target.value)}
                        disabled={isAdding}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Staff Role / Relationship</Label>
                      <Select
                        value={onBehalfOfRole || ''}
                        onValueChange={(v) => setOnBehalfOfRole(v || null)}
                        disabled={isAdding}
                      >
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
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Recording on Behalf *</Label>
                    <Select
                      value={onBehalfOfReason || ''}
                      onValueChange={(v) => setOnBehalfOfReason(v || null)}
                      disabled={isAdding}
                    >
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

                  {/* Event Occurred At - shown when logging on behalf */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Event Occurred At *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Use the time the bowel motion actually occurred. This will update the bowel monitoring timeline and alerts.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !eventDate && "text-muted-foreground"
                            )}
                            disabled={isAdding}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? format(eventDate, 'PP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={eventDate}
                            onSelect={(date) => date && setEventDate(date)}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-[130px]"
                        disabled={isAdding}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

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

            {/* Validation errors */}
            {isOnBehalfOfActive && !validateOnBehalfOf() && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                When recording on behalf of another staff member, Staff Name and Reason are required.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitClick} 
              disabled={bristolType === null || isAdding || (isOnBehalfOfActive && !validateOnBehalfOf())}
            >
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for On Behalf Of entries */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Entry on Behalf of Another Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              You are recording this entry on behalf of <strong>{onBehalfOfName}</strong>
              {onBehalfOfRole && (
                <> ({STAFF_ROLES.find(r => r.value === onBehalfOfRole)?.label})</>
              )}.
              <br /><br />
              This entry will be clearly marked in the timeline and audit records. 
              Please confirm this information is accurate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAdding}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitEntry} disabled={isAdding}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Log Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
