/**
 * Mealtime Observation Form
 * Staff identity is auto-stamped from authenticated session.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useMealtimeObservations } from '@/hooks/useIddsi';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import { calculateObservationSeverity } from '@/types/iddsi';
import { AlertCircle, AlertTriangle, CheckCircle2, User, Phone } from 'lucide-react';
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
import { OnBehalfSelector, OnBehalfData, isOnBehalfActive, isOnBehalfValid } from '@/components/shared/OnBehalfSelector';

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

const EMPTY_ON_BEHALF: OnBehalfData = {
  onBehalfUserId: null,
  onBehalfName: null,
  onBehalfRole: null,
  onBehalfReason: null,
};

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
  const [onBehalf, setOnBehalf] = useState<OnBehalfData>(EMPTY_ON_BEHALF);
  const [showConfirm, setShowConfirm] = useState(false);

  const severity = calculateObservationSeverity({
    coughing,
    wetVoice,
    throatClearing,
    pocketing,
    fatigue,
    refusal,
  });

  const reset = () => {
    setCoughing('none');
    setWetVoice(false);
    setThroatClearing(false);
    setPocketing(false);
    setFatigue(false);
    setMealPct([100]);
    setRefusal(false);
    setNotes('');
    setOnBehalf(EMPTY_ON_BEHALF);
  };

  const doSubmit = async () => {
    setSaving(true);
    const behalfActive = isOnBehalfActive(onBehalf);
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
      recorded_on_behalf_of_name: behalfActive ? onBehalf.onBehalfName : null,
      recorded_on_behalf_of_role: behalfActive ? onBehalf.onBehalfRole : null,
      recorded_on_behalf_of_reason: behalfActive ? onBehalf.onBehalfReason : null,
    });
    setSaving(false);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  };

  const handleSubmit = () => {
    if (isOnBehalfActive(onBehalf)) {
      if (!isOnBehalfValid(onBehalf)) return;
      setShowConfirm(true);
    } else {
      doSubmit();
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
            {/* On Behalf Selector */}
            <OnBehalfSelector value={onBehalf} onChange={setOnBehalf} disabled={saving} />

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

            <Button
              onClick={handleSubmit}
              disabled={saving || (isOnBehalfActive(onBehalf) && !isOnBehalfValid(onBehalf))}
              className="w-full"
              size="lg"
            >
              {saving ? 'Saving...' : 'Save Observation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* On-behalf confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm On-Behalf Entry</AlertDialogTitle>
            <AlertDialogDescription>
              You are logging this mealtime observation on behalf of{' '}
              <strong>{onBehalf.onBehalfName}</strong>
              {onBehalf.onBehalfRole && ` (${onBehalf.onBehalfRole})`}.
              Both identities will be recorded in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSubmit}>Confirm & Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
