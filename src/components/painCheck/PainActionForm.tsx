import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSeverityLabel, getSeverityColor, getSeverityDotColor, PainSeverity, SEVERITY_ACTION_PROMPTS } from '@/types/painAssessment';
import { AlertTriangle, Check } from 'lucide-react';

interface PainActionFormProps {
  score: number;
  severity: PainSeverity;
  onSubmit: (actionTaken: string) => void;
  onCancel: () => void;
}

// Default suggested actions based on pain severity
const DEFAULT_ACTIONS = [
  { id: 'prn', label: 'PRN pain medication administered (if prescribed)' },
  { id: 'gp', label: 'GP contacted / review requested' },
  { id: 'nurse', label: 'Nurse notified' },
  { id: 'supervisor', label: 'Supervisor / Team Leader notified' },
  { id: 'family', label: 'Family / Next of Kin informed' },
  { id: 'monitor', label: 'Monitor closely' },
  { id: 'reposition', label: 'Repositioning / comfort measures' },
  { id: 'no_action', label: 'No action taken (reason required)' },
];

export function PainActionForm({ score, severity, onSubmit, onCancel }: PainActionFormProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [noActionReason, setNoActionReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleActionToggle = (actionId: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(a => a !== actionId);
      }
      // If selecting "no_action", clear other selections
      if (actionId === 'no_action') {
        return ['no_action'];
      }
      // If selecting any other action, remove "no_action"
      return [...prev.filter(a => a !== 'no_action'), actionId];
    });
  };

  const handleSubmit = () => {
    const actionLabels = selectedActions.map(id => {
      const action = DEFAULT_ACTIONS.find(a => a.id === id);
      return action?.label || id;
    });

    let finalAction = actionLabels.join('; ');
    
    if (selectedActions.includes('no_action') && noActionReason) {
      finalAction = `No action taken - Reason: ${noActionReason}`;
    }
    
    if (additionalNotes) {
      finalAction += `. Additional notes: ${additionalNotes}`;
    }

    if (finalAction.trim()) {
      onSubmit(finalAction.trim());
    }
  };

  const isNoActionSelected = selectedActions.includes('no_action');
  const canSubmit = selectedActions.length > 0 && (!isNoActionSelected || noActionReason.trim());

  // Get severity-specific prompts
  const severityPrompts = SEVERITY_ACTION_PROMPTS[severity] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
          <div>
            <CardTitle className="text-lg">Action Required</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Pain score of {score} ({getSeverityLabel(severity)}) requires documenting actions taken
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className={`p-4 rounded-lg text-center ${
          severity === 'mild' ? 'bg-orange-400/10' :
          severity === 'moderate' ? 'bg-orange-600/10' :
          'bg-destructive/10'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-4 h-4 rounded-full ${getSeverityDotColor(severity)}`} />
            <p className={`text-2xl font-bold ${getSeverityColor(severity)}`}>
              Score: {score}/18
            </p>
          </div>
          <p className={`text-sm font-medium ${getSeverityColor(severity)}`}>
            {getSeverityLabel(severity)}
          </p>
        </div>

        {/* Severity-specific action prompts */}
        {severityPrompts.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Recommended actions for {getSeverityLabel(severity).toLowerCase()}:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {severityPrompts.map((prompt, idx) => (
                <li key={idx}>• {prompt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Selection */}
        <div className="space-y-2">
          <Label>Select Actions Taken *</Label>
          <div className="grid grid-cols-1 gap-2">
            {DEFAULT_ACTIONS.map((action) => (
              <div 
                key={action.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  selectedActions.includes(action.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  id={`action-${action.id}`}
                  checked={selectedActions.includes(action.id)}
                  onCheckedChange={() => handleActionToggle(action.id)}
                />
                <Label 
                  htmlFor={`action-${action.id}`} 
                  className="flex-1 cursor-pointer text-sm"
                >
                  {action.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* No Action Reason */}
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
            placeholder="Any additional details about the action taken..."
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
          Save Action
        </Button>
      </CardFooter>
    </Card>
  );
}
