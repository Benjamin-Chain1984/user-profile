import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getSeverityLabel, getSeverityColor, PainSeverity } from '@/types/painAssessment';
import { AlertTriangle, Check } from 'lucide-react';

interface PainActionFormProps {
  score: number;
  severity: PainSeverity;
  onSubmit: (actionTaken: string) => void;
  onCancel: () => void;
}

const SUGGESTED_ACTIONS = [
  'Administered prescribed pain relief medication',
  'Repositioned the individual',
  'Applied heat/cold therapy',
  'Contacted GP/healthcare professional',
  'Contacted family/next of kin',
  'Provided comfort measures (e.g., massage, distraction)',
  'Escalated to team leader/manager',
  'Requested urgent medical review',
];

export function PainActionForm({ score, severity, onSubmit, onCancel }: PainActionFormProps) {
  const [actionTaken, setActionTaken] = useState('');
  const [customAction, setCustomAction] = useState('');

  const handleQuickAction = (action: string) => {
    setActionTaken(action);
    setCustomAction('');
  };

  const handleSubmit = () => {
    const finalAction = customAction || actionTaken;
    if (finalAction.trim()) {
      onSubmit(finalAction.trim());
    }
  };

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
        <div className={`p-3 rounded-lg text-center ${
          severity === 'mild' ? 'bg-warning/10' :
          severity === 'moderate' ? 'bg-orange-500/10' :
          'bg-destructive/10'
        }`}>
          <p className={`text-2xl font-bold ${getSeverityColor(severity)}`}>
            Score: {score}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2">
          <Label>Quick Actions</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_ACTIONS.map((action) => (
              <Button
                key={action}
                variant={actionTaken === action ? 'default' : 'outline'}
                size="sm"
                className="justify-start text-left h-auto py-2 px-3"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Action */}
        <div className="space-y-2">
          <Label>Or describe action taken</Label>
          <Textarea
            value={customAction}
            onChange={(e) => {
              setCustomAction(e.target.value);
              if (e.target.value) setActionTaken('');
            }}
            placeholder="Describe the action taken in response to the pain assessment..."
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>
          Skip (Not Recommended)
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!actionTaken && !customAction.trim()}
        >
          <Check className="w-4 h-4 mr-2" />
          Save Action
        </Button>
      </CardFooter>
    </Card>
  );
}
