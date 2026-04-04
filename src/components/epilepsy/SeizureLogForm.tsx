/**
 * Seizure Log Form - Rapid entry mode for stressful environments
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSeizureEvents } from '@/hooks/useEpilepsy';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { SEIZURE_TYPES, SEIZURE_TRIGGERS, RECOVERY_OPTIONS } from '@/types/epilepsy';
import { ON_BEHALF_REASONS, STAFF_ROLES } from '@/types/bowelCare';
import { Info, ChevronDown, ChevronUp, Users, CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SeizureLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeizureLogForm({ clientId, open, onOpenChange }: SeizureLogFormProps) {
  const { addEvent, isAdding } = useSeizureEvents(clientId);
  const { staffName } = useCurrentStaff();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [durationMin, setDurationMin] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seizureCategory, setSeizureCategory] = useState('');
  const [seizureType, setSeizureType] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [triggerOther, setTriggerOther] = useState('');
  const [selectedRecovery, setSelectedRecovery] = useState<string[]>([]);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [observationType, setObservationType] = useState('observed');
  const [notes, setNotes] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // On behalf of state (matching Bowel Care)
  const [showOnBehalfOf, setShowOnBehalfOf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);

  // Event occurred at for on-behalf entries
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isOnBehalfOfActive = showOnBehalfOf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);

  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };

  const toggleTrigger = (t: string) => {
    setSelectedTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleRecovery = (r: string) => {
    setSelectedRecovery(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmitClick = () => {
    if (!seizureType) return;
    if (!validateOnBehalfOf()) return;

    if (isOnBehalfOfActive) {
      setShowConfirmDialog(true);
    } else {
      submitEntry();
    }
  };

  const submitEntry = () => {
    let eventOccurredAt: string;
    if (isOnBehalfOfActive) {
      const [hours, minutes] = eventTime.split(':').map(Number);
      const d = new Date(eventDate);
      d.setHours(hours, minutes, 0, 0);
      eventOccurredAt = d.toISOString();
    } else {
      eventOccurredAt = new Date(`${date}T${time}`).toISOString();
    }

    addEvent({
      event_occurred_at: eventOccurredAt,
      duration_minutes: durationMin,
      duration_seconds: durationSec,
      seizure_category: seizureCategory,
      seizure_type: seizureType,
      triggers: selectedTriggers,
      trigger_other: selectedTriggers.includes('Other') ? triggerOther : null,
      recovery: selectedRecovery,
      recovery_notes: recoveryNotes || null,
      observation_type: observationType,
      notes: notes || null,
      recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : null,
      recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole : null,
      recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason : null,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setDurationMin(0);
    setDurationSec(0);
    setSeizureCategory('');
    setSeizureType('');
    setSelectedTriggers([]);
    setTriggerOther('');
    setSelectedRecovery([]);
    setRecoveryNotes('');
    setNotes('');
    setShowOnBehalfOf(false);
    setOnBehalfOfName('');
    setOnBehalfOfRole(null);
    setOnBehalfOfReason(null);
    setEventDate(new Date());
    setEventTime(format(new Date(), 'HH:mm'));
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Seizure Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Logged by */}
            <div className="text-sm text-muted-foreground">
              Logged by: <strong>{staffName}</strong>
            </div>

            {/* Recorded on Behalf Of - Collapsible (matching Bowel Care) */}
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
                    <Label htmlFor="epilepsyOnBehalfName">Staff Name *</Label>
                    <Input
                      id="epilepsyOnBehalfName"
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

                {/* Event Occurred At */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Event Occurred At *
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Use the time the seizure actually occurred.
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

            {/* Date & Time (when NOT on behalf) */}
            {!isOnBehalfOfActive && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <Label>Duration</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} value={durationMin} onChange={e => setDurationMin(parseInt(e.target.value) || 0)} className="w-20" />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={59} value={durationSec} onChange={e => setDurationSec(parseInt(e.target.value) || 0)} className="w-20" />
                  <span className="text-sm text-muted-foreground">sec</span>
                </div>
              </div>
            </div>

            {/* Seizure Type Picker */}
            <div>
              <Label className="mb-2 block">Seizure Type</Label>
              <div className="space-y-2">
                {Object.entries(SEIZURE_TYPES).map(([catKey, category]) => (
                  <Collapsible key={catKey} open={expandedCategory === catKey} onOpenChange={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-left">
                        <span className="font-medium">{category.label}</span>
                        {expandedCategory === catKey ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 space-y-1">
                      {category.types.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => { setSeizureCategory(catKey); setSeizureType(type.value); }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            seizureType === type.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{type.label}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Info className="h-3 w-3" />
                                {type.info}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <Label className="mb-2 block">Possible Triggers</Label>
              <div className="flex flex-wrap gap-2">
                {SEIZURE_TRIGGERS.map(t => (
                  <Badge
                    key={t}
                    variant={selectedTriggers.includes(t) ? 'default' : 'outline'}
                    className="cursor-pointer select-none text-sm py-1.5 px-3"
                    onClick={() => toggleTrigger(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              {selectedTriggers.includes('Other') && (
                <Input
                  className="mt-2"
                  placeholder="Describe other trigger..."
                  value={triggerOther}
                  onChange={e => setTriggerOther(e.target.value)}
                />
              )}
            </div>

            {/* Recovery */}
            <div>
              <Label className="mb-2 block">Recovery & Post-Ictal Phase</Label>
              <div className="flex flex-wrap gap-2">
                {RECOVERY_OPTIONS.map(r => (
                  <Badge
                    key={r}
                    variant={selectedRecovery.includes(r) ? 'default' : 'outline'}
                    className={`cursor-pointer select-none text-sm py-1.5 px-3 ${
                      r === 'Emergency support required' && selectedRecovery.includes(r) ? 'bg-destructive text-destructive-foreground' :
                      r === 'Injured (notes required)' && selectedRecovery.includes(r) ? 'bg-destructive text-destructive-foreground' : ''
                    }`}
                    onClick={() => toggleRecovery(r)}
                  >
                    {r}
                  </Badge>
                ))}
              </div>
              {(selectedRecovery.includes('Injured (notes required)') || selectedRecovery.includes('Other')) && (
                <Textarea
                  className="mt-2"
                  placeholder="Describe recovery details..."
                  value={recoveryNotes}
                  onChange={e => setRecoveryNotes(e.target.value)}
                />
              )}
            </div>

            {/* Observation Type */}
            <div>
              <Label className="mb-2 block">Observation</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={observationType === 'observed' ? 'default' : 'outline'}
                  onClick={() => setObservationType('observed')}
                  size="sm"
                >
                  Observed Directly
                </Button>
                <Button
                  type="button"
                  variant={observationType === 'reported' ? 'default' : 'outline'}
                  onClick={() => setObservationType('reported')}
                  size="sm"
                >
                  Reported After Event
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional observations..." />
            </div>

            {/* Emergency Warning */}
            {selectedRecovery.includes('Emergency support required') && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="py-3">
                  <p className="text-sm text-destructive font-medium">⚠️ Emergency support was required — a Red Alert will be generated and escalation documentation will be needed.</p>
                </CardContent>
              </Card>
            )}

            {/* Validation errors */}
            {isOnBehalfOfActive && !validateOnBehalfOf() && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                When recording on behalf of another staff member, Staff Name and Reason are required.
              </div>
            )}

            <Button 
              onClick={handleSubmitClick} 
              disabled={isAdding || !seizureType || (isOnBehalfOfActive && !validateOnBehalfOf())} 
              className="w-full" 
              size="lg"
            >
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Seizure Event
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
