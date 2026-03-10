import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSeverityLabel, getSeverityColor, getSeverityDotColor, PainSeverity } from '@/types/painAssessment';
import { usePainConfig } from '@/hooks/usePainConfig';
import { AlertTriangle, Check, ClipboardCheck, ArrowRight } from 'lucide-react';

interface PainActionFormProps {
  score: number;
  severity: PainSeverity;
  maxScore?: number;
  onSubmit: (actionTaken: string) => void;
  onCancel: () => void;
}

const PREDEFINED_ACTION_LABELS: Record<string, string> = {
  administer_pain_relief: 'Administer Pain Relief medication (if prescribed)',
  recheck_pain: 'Recheck pain again at next scheduled time',
  reposition: 'Reposition the person',
  contact_gp: 'Contact the GP',
  call_ambulance: 'Call Ambulance (000)',
};

const SEVERITY_URGENCY: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  mild: { label: 'Monitor & Respond', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
  moderate: { label: 'Action Required', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-400' },
  severe: { label: 'Urgent — Escalate Immediately', color: 'text-destructive', bgColor: 'bg-destructive/5', borderColor: 'border-destructive/40' },
};

export function PainActionForm({ score, severity, maxScore = 18, onSubmit, onCancel }: PainActionFormProps) {
  const { config } = usePainConfig();
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [noActionReason, setNoActionReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const urgency = SEVERITY_URGENCY[severity] || SEVERITY_URGENCY.mild;

  // Build action steps from config based on severity
  const actionSteps = useMemo(() => {
    const cfg = config as any;
    let configuredActions: string[] = [];
    let customActions: string[] = [];

    if (severity === 'mild') {
      configuredActions = cfg?.mild_actions ?? ['reposition', 'recheck_pain'];
      customActions = (cfg?.mild_custom_actions ?? []).filter((s: string) => s.trim());
    } else if (severity === 'moderate') {
      configuredActions = cfg?.moderate_actions ?? ['administer_pain_relief', 'recheck_pain', 'contact_gp'];
      customActions = (cfg?.moderate_custom_actions ?? []).filter((s: string) => s.trim());
    } else if (severity === 'severe') {
      configuredActions = cfg?.severe_actions ?? ['administer_pain_relief', 'contact_gp', 'call_ambulance'];
      customActions = (cfg?.severe_custom_actions ?? []).filter((s: string) => s.trim());
    }

    const steps = configuredActions.map((id, idx) => ({
      id,
      stepNumber: idx + 1,
      label: PREDEFINED_ACTION_LABELS[id] || id,
    }));

    customActions.forEach((label, idx) => {
      steps.push({ id: `custom_${idx}`, stepNumber: steps.length + 1, label });
    });

    return steps;
  }, [config, severity]);

  const handleActionToggle = (actionId: string) => {
    setCompletedActions(prev => {
      if (actionId === 'no_action') {
        return prev.includes('no_action') ? [] : ['no_action'];
      }
      const without = prev.filter(a => a !== 'no_action');
      return without.includes(actionId) ? without.filter(a => a !== actionId) : [...without, actionId];
    });
  };

  const handleSubmit = () => {
    if (isNoActionSelected) {
      onSubmit(`No action taken - Reason: ${noActionReason}${additionalNotes ? `. Notes: ${additionalNotes}` : ''}`);
      return;
    }

    const actionLabels = completedActions.map(id => {
      const step = actionSteps.find(a => a.id === id);
      return step?.label || id;
    });

    let finalAction = actionLabels.join('; ');
    if (additionalNotes) {
      finalAction += `. Additional notes: ${additionalNotes}`;
    }

    if (finalAction.trim()) {
      onSubmit(finalAction.trim());
    }
  };

  const isNoActionSelected = completedActions.includes('no_action');
  const canSubmit = completedActions.length > 0 && (!isNoActionSelected || noActionReason.trim());

  return (
    <Card className={`border-2 ${urgency.borderColor}`}>
      <CardHeader className={`${urgency.bgColor} rounded-t-lg`}>
        <div className="flex items-start gap-3">
          <ClipboardCheck className={`w-6 h-6 ${urgency.color} shrink-0`} />
          <div>
            <CardTitle className={`text-lg ${urgency.color}`}>
              {urgency.label}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Assessment result: <strong>{getSeverityLabel(severity)}</strong> (Score: {score}/{maxScore})
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {/* Protocol Steps — Clear instructional guidance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className={`h-4 w-4 ${urgency.color}`} />
            <p className={`text-sm font-semibold ${urgency.color}`}>
              Follow these steps for {getSeverityLabel(severity).toLowerCase()}:
            </p>
          </div>
          <div className="space-y-2">
            {actionSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  completedActions.includes(step.id)
                    ? 'border-success bg-success/5'
                    : `${urgency.bgColor} ${urgency.borderColor}`
                }`}
              >
                <Checkbox
                  id={`step-${step.id}`}
                  checked={completedActions.includes(step.id)}
                  onCheckedChange={() => handleActionToggle(step.id)}
                  disabled={isNoActionSelected}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`step-${step.id}`}
                  className="flex-1 cursor-pointer text-sm leading-relaxed"
                >
                  <span className={`font-semibold mr-2 ${urgency.color}`}>
                    Step {step.stepNumber}:
                  </span>
                  {step.label}
                </Label>
                {completedActions.includes(step.id) && (
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completion summary */}
        {actionSteps.length > 0 && !isNoActionSelected && (
          <div className="text-xs text-muted-foreground text-center">
            {completedActions.length} of {actionSteps.length} steps confirmed
          </div>
        )}

        {/* Divider */}
        <div className="border-t" />

        {/* No action option */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            isNoActionSelected
              ? 'border-warning bg-warning/5'
              : 'border-border hover:border-warning/50'
          }`}
        >
          <Checkbox
            id="step-no-action"
            checked={isNoActionSelected}
            onCheckedChange={() => handleActionToggle('no_action')}
          />
          <Label htmlFor="step-no-action" className="flex-1 cursor-pointer text-sm text-warning">
            No action taken (reason required)
          </Label>
        </div>

        {isNoActionSelected && (
          <div className="space-y-2">
            <Label className="text-warning">Reason for No Action *</Label>
            <Textarea
              value={noActionReason}
              onChange={(e) => setNoActionReason(e.target.value)}
              placeholder="You must provide a reason if no action was taken..."
              rows={2}
              className="border-warning/50"
            />
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Additional Notes (optional)</Label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional details about the actions completed..."
            rows={2}
          />
        </div>

        {/* Escalation Warning */}
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            If you are concerned about pain or the person deteriorates, escalate to a medical professional immediately.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Skip (Not Recommended)
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          <Check className="w-4 h-4 mr-2" />
          Confirm Actions
        </Button>
      </CardFooter>
    </Card>
  );
}