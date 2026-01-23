/**
 * Autonomic Dysreflexia Action Plan Panel
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Phone, Heart } from 'lucide-react';
import { useAutonomicRiskLogs } from '@/hooks/useCatheter';
import { AD_SYMPTOMS, AD_ACTIONS, type ADSymptom, type ADAction } from '@/types/catheter';

interface AutonomicDysreflexiaPanelProps {
  clientId?: string;
}

export function AutonomicDysreflexiaPanel({ clientId }: AutonomicDysreflexiaPanelProps) {
  const { addLog } = useAutonomicRiskLogs(clientId);
  const [showLogDialog, setShowLogDialog] = useState(false);

  const [symptoms, setSymptoms] = useState<ADSymptom[]>([]);
  const [actionsTaken, setActionsTaken] = useState<ADAction[]>([]);
  const [outcome, setOutcome] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState('');

  const toggleSymptom = (symptom: ADSymptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleAction = (action: ADAction) => {
    setActionsTaken((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleSubmit = async () => {
    await addLog.mutateAsync({
      symptoms,
      actions_taken: actionsTaken,
      outcome: outcome || undefined,
      escalated,
      escalated_to: escalatedTo || undefined,
    });

    // Reset
    setSymptoms([]);
    setActionsTaken([]);
    setOutcome('');
    setEscalated(false);
    setEscalatedTo('');
    setShowLogDialog(false);
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-800">
            <Heart className="h-5 w-5" />
            Autonomic Dysreflexia - Immediate Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-300 bg-white">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Emergency Response</AlertTitle>
            <AlertDescription className="text-red-700 space-y-2">
              <p className="font-medium">If you notice any of these symptoms, act immediately:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Pounding headache</li>
                <li>Flushing or sweating above injury level</li>
                <li>Blurred vision</li>
                <li>Nasal congestion</li>
                <li>Slow heart rate</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-red-800">What to do:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Sit the person upright</strong> immediately</li>
              <li><strong>Loosen tight clothing</strong> - belts, straps, clothing around waist</li>
              <li><strong>Check the catheter</strong> - look for blockages, kinks, or twists</li>
              <li><strong>Drain the bladder</strong> if required</li>
              <li><strong>Seek urgent medical help</strong> if symptoms persist</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => window.location.href = 'tel:000'}
            >
              <Phone className="h-4 w-4" />
              Call 000
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLogDialog(true)}
            >
              Log AD Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Autonomic Dysreflexia Event</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Symptoms */}
            <div className="space-y-3">
              <Label>Symptoms Observed</Label>
              <div className="grid grid-cols-2 gap-2">
                {AD_SYMPTOMS.map((symptom) => (
                  <div key={symptom.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom.value}
                      checked={symptoms.includes(symptom.value)}
                      onCheckedChange={() => toggleSymptom(symptom.value)}
                    />
                    <Label htmlFor={symptom.value} className="font-normal text-sm">
                      {symptom.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Taken */}
            <div className="space-y-3">
              <Label>Actions Taken</Label>
              <div className="grid grid-cols-1 gap-2">
                {AD_ACTIONS.map((action) => (
                  <div key={action.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={action.value}
                      checked={actionsTaken.includes(action.value)}
                      onCheckedChange={() => toggleAction(action.value)}
                    />
                    <Label htmlFor={action.value} className="font-normal text-sm">
                      {action.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="escalated"
                  checked={escalated}
                  onCheckedChange={(c) => setEscalated(!!c)}
                />
                <Label htmlFor="escalated" className="font-normal">
                  Emergency services or clinician contacted
                </Label>
              </div>
              {escalated && (
                <Textarea
                  value={escalatedTo}
                  onChange={(e) => setEscalatedTo(e.target.value)}
                  placeholder="Who was contacted..."
                  rows={2}
                />
              )}
            </div>

            {/* Outcome */}
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Describe the outcome and how the person responded..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addLog.isPending || symptoms.length === 0}
            >
              {addLog.isPending ? 'Saving...' : 'Save Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
