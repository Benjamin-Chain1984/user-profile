/**
 * Mealtime Observation Form
 * Staff identity is auto-stamped from authenticated session.
 * "Recorded on Behalf Of" matches the Bowel Care module pattern.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMealtimeObservations } from '@/hooks/useIddsi';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { calculateObservationSeverity } from '@/types/iddsi';
import { AlertCircle, AlertTriangle, CheckCircle2, User, Phone, ChevronDown, ChevronUp, Users, CalendarIcon, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ON_BEHALF_REASONS, STAFF_ROLES } from '@/types/bowelCare';

interface Props {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CoughingOption = 'none' | 'occasional' | 'frequent';

function ToggleOption({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`p-2.5 rounded-lg border text-sm font-medium text-center transition-all ${
            !value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/30 text-muted-foreground'
          }`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`p-2.5 rounded-lg border text-sm font-medium text-center transition-all ${
            value
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-border hover:border-primary/30 text-muted-foreground'
          }`}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

export function MealtimeObservationForm({ clientId, open, onOpenChange }: Props) {
  const { logObservation } = useMealtimeObservations(clientId);
  const { staffName } = useCurrentStaff();
  const [coughing, setCoughing] = useState<CoughingOption>('none');
  const [wetVoice, setWetVoice] = useState(false);
  const [throatClearing, setThroatClearing] = useState(false);
  const [pocketing, setPocketing] = useState(false);
  const [fatigue, setFatigue] = useState(false);
  const [mealPct, setMealPct] = useState([100]);
  const [refusal, setRefusal] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Recorded on Behalf Of state (matches Bowel Care)
  const [showOnBehalfOf, setShowOnBehalfOf] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');
  const [onBehalfOfRole, setOnBehalfOfRole] = useState<string | null>(null);
  const [onBehalfOfReason, setOnBehalfOfReason] = useState<string | null>(null);

  // Event Occurred At (backdated entry)
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isOnBehalfOfActive = showOnBehalfOf && (onBehalfOfName || onBehalfOfRole || onBehalfOfReason);

  const severity = calculateObservationSeverity({
    coughing,
    wetVoice,
    throatClearing,
    pocketing,
    fatigue,
    refusal,
  });

  const validateOnBehalfOf = () => {
    if (!isOnBehalfOfActive) return true;
    if (!onBehalfOfName.trim()) return false;
    if (!onBehalfOfReason) return false;
    return true;
  };

  const reset = () => {
    setCoughing('none');
    setWetVoice(false);
    setThroatClearing(false);
    setPocketing(false);
    setFatigue(false);
    setMealPct([100]);
    setRefusal(false);
    setNotes('');
    setShowOnBehalfOf(false);
    setOnBehalfOfName('');
    setOnBehalfOfRole(null);
    setOnBehalfOfReason(null);
    setEventDate(new Date());
    setEventTime(format(new Date(), 'HH:mm'));
    setShowConfirmDialog(false);
  };

  const submitEntry = async () => {
    setSaving(true);

    // Combine date and time for event_occurred_at
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventOccurredAt = new Date(eventDate);
    eventOccurredAt.setHours(hours, minutes, 0, 0);

    const ok = await logObservation({
      coughing,
      wet_voice: wetVoice,
      throat_clearing: throatClearing,
      pocketing,
      fatigue,
      meal_completion_pct: mealPct[0],
      refusal,
      severity,
      notes: notes.trim(),
      completed_by_name: staffName,
      event_occurred_at: eventOccurredAt.toISOString(),
      recorded_on_behalf_of_name: isOnBehalfOfActive ? onBehalfOfName.trim() : null,
      recorded_on_behalf_of_role: isOnBehalfOfActive ? onBehalfOfRole : null,
      recorded_on_behalf_of_reason: isOnBehalfOfActive ? onBehalfOfReason : null,
    });
    setSaving(false);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  };

  const handleSubmitClick = () => {
    if (!validateOnBehalfOf()) return;
    if (isOnBehalfOfActive) {
      setShowConfirmDialog(true);
    } else {
      submitEntry();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mealtime Observation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recorded on Behalf Of - Collapsible Section (matches Bowel Care) */}
            <Collapsible open={showOnBehalfOf} onOpenChange={setShowOnBehalfOf}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-lg border text-left transition-colors",
                    showOnBehalfOf
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
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
              <CollapsibleContent className="mt-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/10 space-y-4">
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
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Staff Role / Relationship</Label>
                    <Select
                      value={onBehalfOfRole || ''}
                      onValueChange={(v) => setOnBehalfOfRole(v || null)}
                      disabled={saving}
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
                    disabled={saving}
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
                    Use the time the observation actually occurred.
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
                          disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Auto-stamped staff identity */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Logged by:</span>
              <span className="text-sm font-medium">{staffName}</span>
            </div>

            {/* Coughing */}
            <div>
              <Label className="mb-2 block">Coughing?</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'occasional', 'frequent'] as CoughingOption[]).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCoughing(opt)}
                    className={`p-3 rounded-lg border text-center text-sm font-medium transition-all capitalize ${
                      coughing === opt
                        ? opt === 'frequent'
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : opt === 'occasional'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle options */}
            <div className="space-y-4">
              <ToggleOption label="Wet voice?" value={wetVoice} onChange={setWetVoice} />
              <ToggleOption label="Clearing throat?" value={throatClearing} onChange={setThroatClearing} />
              <ToggleOption label="Storing food inside the mouth without swallowing it?" value={pocketing} onChange={setPocketing} />
              <ToggleOption label="Fatigue?" value={fatigue} onChange={setFatigue} />
              <ToggleOption label="Not wanting to eat / drink?" value={refusal} onChange={setRefusal} />
            </div>

            {/* Meal Completion */}
            <div>
              <Label>Meal Completion: {mealPct[0]}%</Label>
              <Slider
                value={mealPct}
                onValueChange={setMealPct}
                min={0}
                max={100}
                step={10}
                className="mt-2"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="obs-notes">Notes (optional)</Label>
              <Textarea
                id="obs-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional observations..."
                rows={2}
              />
            </div>

            {/* Severity Indicator */}
            <Card className={`border ${
              severity === 'red' ? 'border-destructive bg-destructive/5' :
              severity === 'amber' ? 'border-amber-300 bg-amber-50/50' :
              'border-success bg-success/5'
            }`}>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  {severity === 'red' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : severity === 'amber' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  <p className={`text-sm font-medium ${
                    severity === 'red' ? 'text-destructive' :
                    severity === 'amber' ? 'text-amber-700' : 'text-success'
                  }`}>
                    {severity === 'red' ? 'RED – Action Needed' :
                     severity === 'amber' ? 'Amber – Attention Required' :
                     'IDEAL – No Concerns'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Instructions */}
            {(severity === 'red' || severity === 'amber') && (
              <div className="space-y-3">
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm font-semibold text-destructive">
                      ⚠️ Swallowing Concerns Detected – Follow These Steps:
                    </p>
                    {severity === 'red' && (
                      <ul className="space-y-1 text-sm text-destructive">
                        <li>• Choking or gagging</li>
                        <li>• Repeated coughing during meals</li>
                        <li>• Wet or gurgly voice after swallowing</li>
                        <li>• Food or fluid coming out of the nose</li>
                        <li>• Difficulty breathing during or after eating</li>
                        <li>• Colour changes (blue lips/face)</li>
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-sm font-semibold">Immediate Actions:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="font-bold text-foreground">1.</span>
                        <strong>Stop the meal immediately</strong>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-foreground">2.</span>
                        Keep the person upright
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-foreground">3.</span>
                        If choking — follow choking protocol
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-foreground">4.</span>
                        Call 000 if the person is in distress
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-foreground">5.</span>
                        Notify Team Leader and document the event
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                <Button variant="destructive" size="lg" className="w-full" asChild>
                  <a href="tel:000">
                    <Phone className="h-4 w-4 mr-2" />
                    Call 000
                  </a>
                </Button>
              </div>
            )}

            {/* Validation errors */}
            {isOnBehalfOfActive && !validateOnBehalfOf() && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                When recording on behalf of another staff member, Staff Name and Reason are required.
              </div>
            )}

            <Button
              onClick={handleSubmitClick}
              disabled={saving || (isOnBehalfOfActive && !validateOnBehalfOf())}
              className="w-full"
              size="lg"
            >
              {saving ? 'Saving...' : 'Save Observation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for On Behalf Of entries (matches Bowel Care) */}
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
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitEntry} disabled={saving}>
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
