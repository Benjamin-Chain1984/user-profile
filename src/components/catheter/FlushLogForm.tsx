/**
 * Flush Log Form - Enhanced with role-based procedural guide, training confirmation,
 * and comprehensive data capture per flush procedure specification.
 */

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useFlushLogs } from '@/hooks/useCatheter';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';
import {
  FLUSH_SOLUTIONS, FLUSH_REASONS, URINE_APPEARANCES,
  FLOW_AFTER_FLUSH_OPTIONS, PERSON_RESPONSE_OPTIONS,
  type FlushSolution, type FlushReason, type UrineAppearance,
  type FlowAfterFlush, type PersonResponse,
} from '@/types/catheter';
import { URINE_COLOUR_SCALE } from '@/types/fluidBalance';
import {
  AlertTriangle, ChevronDown, Shield, CheckCircle2, CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Indwelling (Urethral) flush steps
const IDC_FLUSH_STEPS = [
  'Perform hand hygiene.',
  'Put on gloves.',
  'Explain procedure to the person.',
  'Clamp drainage tubing below access port.',
  'Clean access port with alcohol wipe.',
  'Attach sterile saline syringe (as prescribed).',
  'Slowly instil prescribed volume. Do NOT force.',
  'Withdraw fluid gently if instructed in plan.',
  'Remove syringe.',
  'Unclamp tubing.',
  'Ensure urine drains freely.',
  'Dispose of equipment safely.',
  'Perform hand hygiene.',
  'Log Catheter Flush in IDEAL.',
];

const IDC_ESCALATION_PROMPTS = [
  'Resistance felt',
  'Pain occurs',
  'No urine drains',
  'Blood clots present',
  'Person becomes unwell',
];

// Suprapubic flush steps
const SPC_FLUSH_STEPS = [
  'Perform hand hygiene.',
  'Put on gloves.',
  'Explain procedure.',
  'Clamp tubing below access port.',
  'Clean port with alcohol wipe.',
  'Attach sterile saline syringe.',
  'Slowly instil prescribed volume. Stop if resistance or pain.',
  'Withdraw fluid gently if instructed.',
  'Remove syringe.',
  'Unclamp tubing.',
  'Check drainage resumes.',
  'Inspect insertion site for leakage/swelling.',
  'Dispose of equipment safely.',
  'Perform hand hygiene.',
  'Log Catheter Flush in IDEAL.',
];

const SPC_ESCALATION_PROMPTS = [
  'Swelling at site',
  'Leakage around stoma',
  'Pain',
  'No drainage',
  'Fever',
];

interface FlushLogFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlushLogForm({ clientId, open, onOpenChange }: FlushLogFormProps) {
  const { addFlush } = useFlushLogs(clientId);
  const { plan } = useCatheterCarePlan(clientId);

  const [flushVolume, setFlushVolume] = useState('');
  const [returnVolume, setReturnVolume] = useState('');
  const [flushSolution, setFlushSolution] = useState<FlushSolution>('saline');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [flushReason, setFlushReason] = useState<FlushReason | ''>('');
  const [urineAppearances, setUrineAppearances] = useState<UrineAppearance[]>([]);
  const [flowAfterFlush, setFlowAfterFlush] = useState<FlowAfterFlush | ''>('');
  const [personResponse, setPersonResponse] = useState<PersonResponse | ''>('');
  const [outputDescription, setOutputDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [trainingConfirmed, setTrainingConfirmed] = useState(false);
  const [escalationRequired, setEscalationRequired] = useState(false);
  const [urineColour, setUrineColour] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const isRNPerformer = plan?.flush_performer === 'rn';
  const isSupportWorker = plan?.flush_performer === 'support_worker';
  const catheterType = plan?.catheter_type || '';
  const isSuprapubic = catheterType === 'suprapubic' || catheterType === 'spc';
  const isIndwelling = catheterType === 'indwelling_urethral' || catheterType === 'idc';

  const flushSteps = isSuprapubic ? SPC_FLUSH_STEPS : IDC_FLUSH_STEPS;
  const escalationPrompts = isSuprapubic ? SPC_ESCALATION_PROMPTS : IDC_ESCALATION_PROMPTS;

  const canSubmit = isSupportWorker ? trainingConfirmed : true;

  const handleSubmit = async () => {
    const eventOccurredAt = new Date(
      format(eventDate, 'yyyy-MM-dd') + 'T' + format(new Date(), 'HH:mm:ss')
    ).toISOString();

    await addFlush.mutateAsync({
      flush_volume_ml: flushVolume ? parseInt(flushVolume, 10) : undefined,
      flush_solution: flushSolution,
      output_description: outputDescription || undefined,
      notes: notes || undefined,
      return_volume_ml: returnVolume ? parseInt(returnVolume, 10) : undefined,
      flush_reason: flushReason || undefined,
      urine_appearance: urineAppearances.length > 0 ? urineAppearances.join(', ') : undefined,
      flow_after_flush: flowAfterFlush || undefined,
      person_response: personResponse || undefined,
      training_confirmed: trainingConfirmed,
      escalation_required: escalationRequired,
      event_occurred_at: eventOccurredAt,
    });

    // Reset form
    setFlushVolume('');
    setReturnVolume('');
    setFlushSolution('saline');
    setEventDate(new Date());
    setFlushReason('');
    setUrineAppearances([]);
    setFlowAfterFlush('');
    setPersonResponse('');
    setOutputDescription('');
    setNotes('');
    setTrainingConfirmed(false);
    setEscalationRequired(false);
    setGuideOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Catheter Flush</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Persistent Safety Notice */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-xs">
              This procedure must only be performed if prescribed and if the staff member has been trained and delegated.
              If concerned, escalate to a Registered Nurse or GP immediately.
            </AlertDescription>
          </Alert>

          {/* Date of Flush */}
          <div className="space-y-2">
            <Label>Date of Flush</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(eventDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={(d) => d && setEventDate(d)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {isRNPerformer && (
            <Alert className="border-primary/30 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Catheter flush to be completed by Registered Nurse in accordance with clinical scope of practice.
              </AlertDescription>
            </Alert>
          )}

          {/* Support Worker: Procedural Guide */}
          {isSupportWorker && (
            <>
              <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left">
                    <span className="text-sm font-medium">
                      {isSuprapubic ? 'Suprapubic' : 'Indwelling'} Catheter Flush Procedure (If Delegated & Trained)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-3">
                  <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                    {flushSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Escalation Prompts */}
                  <Alert className="border-destructive/30 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-destructive text-sm">🚨 Stop and escalate if:</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-1 mt-1">
                        {escalationPrompts.map((prompt) => (
                          <div key={prompt} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                            <span>{prompt}</span>
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CollapsibleContent>
              </Collapsible>

              {/* Training Confirmation */}
              <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                <Checkbox
                  checked={trainingConfirmed}
                  onCheckedChange={(v) => setTrainingConfirmed(!!v)}
                  id="training-confirm"
                />
                <Label htmlFor="training-confirm" className="text-sm leading-tight cursor-pointer">
                  I confirm I have been trained and delegated to perform catheter flush.
                </Label>
              </div>
            </>
          )}

          {/* Flush Solution */}
          <div className="space-y-2">
            <Label>Flush Solution</Label>
            <Select value={flushSolution} onValueChange={(v) => setFlushSolution(v as FlushSolution)}>
              <SelectTrigger><SelectValue placeholder="Select solution" /></SelectTrigger>
              <SelectContent>
                {FLUSH_SOLUTIONS.map((sol) => (
                  <SelectItem key={sol.value} value={sol.value}>{sol.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume Instilled & Return Volume */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Volume Instilled (mL)</Label>
              <Input
                type="number"
                value={flushVolume}
                onChange={(e) => setFlushVolume(e.target.value)}
                placeholder={plan?.flush_volume_ml ? String(plan.flush_volume_ml) : 'e.g. 30'}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Return Volume (mL) <span className="text-muted-foreground text-xs">optional</span></Label>
              <Input
                type="number"
                value={returnVolume}
                onChange={(e) => setReturnVolume(e.target.value)}
                placeholder="e.g. 25"
                min={0}
              />
            </div>
          </div>

          {/* Reason for Flush */}
          <div className="space-y-2">
            <Label>Reason for Flush</Label>
            <Select value={flushReason} onValueChange={(v) => setFlushReason(v as FlushReason)}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {FLUSH_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urine Appearance */}
          <div className="space-y-2">
            <Label>Urine Appearance</Label>
            <div className="flex flex-wrap gap-2">
              {URINE_APPEARANCES.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={urineAppearances.includes(opt.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUrineAppearances(prev =>
                    prev.includes(opt.value)
                      ? prev.filter(v => v !== opt.value)
                      : [...prev, opt.value]
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Urine Colour Chart */}
          <div className="space-y-2">
            <Label>Urine Colour</Label>
            <div className="grid grid-cols-4 gap-2">
              {URINE_COLOUR_SCALE.map(colour => (
                <button
                  key={colour.value}
                  type="button"
                  onClick={() => setUrineColour(colour.value)}
                  className={cn(
                    'p-2 rounded-lg border-2 transition-all',
                    urineColour === colour.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <div
                    className="w-full h-8 rounded mb-1"
                    style={{ backgroundColor: colour.color }}
                  />
                  <p className="text-xs text-center">{colour.value}</p>
                </button>
              ))}
            </div>
            {urineColour && (
              <p className="text-sm text-muted-foreground mt-2">
                {URINE_COLOUR_SCALE.find(c => c.value === urineColour)?.description}
                {urineColour >= 5 && (
                  <span className="text-amber-600 font-medium ml-1">
                    — Encourage fluids
                  </span>
                )}
              </p>
            )}

          {/* Flow After Flush */}
          <div className="space-y-2">
            <Label>Flow After Flush</Label>
            <div className="flex flex-wrap gap-2">
              {FLOW_AFTER_FLUSH_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={flowAfterFlush === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFlowAfterFlush(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Person Response */}
          <div className="space-y-2">
            <Label>Person Response</Label>
            <div className="flex flex-wrap gap-2">
              {PERSON_RESPONSE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={personResponse === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPersonResponse(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Output Observation */}
          <div className="space-y-2">
            <Label>Output Observation <span className="text-muted-foreground text-xs">optional</span></Label>
            <Textarea
              value={outputDescription}
              onChange={(e) => setOutputDescription(e.target.value)}
              placeholder="Describe what came out (clear, cloudy, debris, etc.)"
              rows={2}
            />
          </div>

          {/* Escalation Required */}
          <div className="flex items-start gap-2 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
            <Checkbox
              checked={escalationRequired}
              onCheckedChange={(v) => setEscalationRequired(!!v)}
              id="escalation-flag"
            />
            <Label htmlFor="escalation-flag" className="text-sm leading-tight cursor-pointer text-destructive">
              Escalation required — concerns identified during flush
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground text-xs">optional</span></Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={addFlush.isPending || !canSubmit}>
            {addFlush.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
