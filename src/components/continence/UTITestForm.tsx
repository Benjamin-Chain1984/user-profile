/**
 * UTI Test Form - Log UTI test results
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { useUTITests } from '@/hooks/useContinence';
import { useCurrentStaff } from '@/hooks/useCurrentStaff';
import {
  UTI_SYMPTOMS,
  ON_BEHALF_REASONS,
  STAFF_ROLES,
  UTISymptom,
  UTIResult,
  EscalatedTo,
} from '@/types/continence';
import {
  AlertTriangle,
  Phone,
  TestTube,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface UTITestFormProps {
  clientId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function UTITestForm({
  clientId,
  open,
  onOpenChange,
  onComplete,
}: UTITestFormProps) {
  const { addTest } = useUTITests(clientId);
  const { staffName } = useCurrentStaff();

  const [symptoms, setSymptoms] = useState<UTISymptom[]>([]);
  const [testResult, setTestResult] = useState<UTIResult | null>(null);
  const [escalatedTo, setEscalatedTo] = useState<EscalatedTo | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // On behalf of
  const [onBehalfOpen, setOnBehalfOpen] = useState(false);
  const [onBehalfName, setOnBehalfName] = useState('');
  const [onBehalfRole, setOnBehalfRole] = useState('');
  const [onBehalfReason, setOnBehalfReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isOnBehalfUsed = onBehalfName.trim() !== '' || onBehalfReason !== '';
  const isOnBehalfValid = !isOnBehalfUsed || (onBehalfName.trim() !== '' && onBehalfReason !== '');

  const toggleSymptom = (symptom: UTISymptom) => {
    if (symptom === 'no_symptoms') {
      setSymptoms(['no_symptoms']);
    } else {
      setSymptoms((prev) => {
        const withoutNoSymptoms = prev.filter((s) => s !== 'no_symptoms');
        return withoutNoSymptoms.includes(symptom)
          ? withoutNoSymptoms.filter((s) => s !== symptom)
          : [...withoutNoSymptoms, symptom];
      });
    }
  };

  const handleSubmit = () => {
    if (!testResult) return;
    if (isOnBehalfUsed) {
      setShowConfirmation(true);
    } else {
      submitEntry();
    }
  };

  const submitEntry = async () => {
    if (!testResult) return;
    setIsSubmitting(true);
    try {
      await addTest.mutateAsync({
        symptoms,
        test_result: testResult,
        escalated_to: escalatedTo || undefined,
        notes: notes || undefined,
        recorded_on_behalf_of_name: isOnBehalfUsed ? onBehalfName : undefined,
        recorded_on_behalf_of_role: isOnBehalfUsed ? onBehalfRole : undefined,
        recorded_on_behalf_of_reason: isOnBehalfUsed
          ? (onBehalfReason === 'other' ? otherReason : onBehalfReason)
          : undefined,
      });

      resetForm();
      onOpenChange(false);
      onComplete?.();
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const resetForm = () => {
    setSymptoms([]);
    setTestResult(null);
    setEscalatedTo(null);
    setNotes('');
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
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              UTI Test Result
            </DialogTitle>
            <DialogDescription>
              Record urinary tract infection test results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Logged by */}
            <div className="text-sm text-muted-foreground">
              Logged by: <strong>{staffName}</strong>
            </div>

            {/* On Behalf Of Section */}
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
                  <Label htmlFor="utiOnBehalfName">
                    Staff Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="utiOnBehalfName"
                    placeholder="Enter staff member's name"
                    value={onBehalfName}
                    onChange={(e) => setOnBehalfName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utiOnBehalfRole">Staff Role (Optional)</Label>
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
                  <Label htmlFor="utiOnBehalfReason">
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
                    <Label htmlFor="utiOtherReason">Specify Reason</Label>
                    <Input
                      id="utiOtherReason"
                      placeholder="Enter reason..."
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label>Symptoms Observed</Label>
              <div className="grid grid-cols-2 gap-2">
                {UTI_SYMPTOMS.map((symptom) => (
                  <div
                    key={symptom.value}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      symptoms.includes(symptom.value)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleSymptom(symptom.value)}
                  >
                    <Checkbox
                      checked={symptoms.includes(symptom.value)}
                      onCheckedChange={() => toggleSymptom(symptom.value)}
                    />
                    <span className="text-sm">{symptom.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Result */}
            <div className="space-y-2">
              <Label>Test Result <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={testResult === 'negative' ? 'default' : 'outline'}
                  className={`h-20 flex-col gap-2 ${
                    testResult === 'negative' ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                  onClick={() => setTestResult('negative')}
                >
                  <CheckCircle className="h-6 w-6" />
                  <span>Negative</span>
                </Button>
                <Button
                  type="button"
                  variant={testResult === 'positive' ? 'default' : 'outline'}
                  className={`h-20 flex-col gap-2 ${
                    testResult === 'positive' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300'
                  }`}
                  onClick={() => setTestResult('positive')}
                >
                  <AlertCircle className="h-6 w-6" />
                  <span>Positive</span>
                </Button>
              </div>
            </div>

            {/* Positive Result Guidance */}
            {testResult === 'positive' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Positive UTI Result</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Nitrites and/or leukocytes detected - possible UTI.
                    GP follow-up is recommended.
                  </p>
                  <p className="text-sm">
                    Consider reviewing hydration and constipation patterns.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Negative Result Note */}
            {testResult === 'negative' && symptoms.length > 0 && !symptoms.includes('no_symptoms') && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Negative with Symptoms</AlertTitle>
                <AlertDescription>
                  A negative result does not rule out UTI if symptoms persist.
                  Consider monitoring and retesting if symptoms continue.
                </AlertDescription>
              </Alert>
            )}

            {/* Escalation */}
            <div className="space-y-2">
              <Label>Follow-up Action</Label>
              <div className="flex gap-2">
                <Badge
                  variant={escalatedTo === 'gp' ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-4"
                  onClick={() => setEscalatedTo(escalatedTo === 'gp' ? null : 'gp')}
                >
                  Referred to GP
                </Badge>
                <Badge
                  variant={escalatedTo === 'monitor_symptoms' ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-4"
                  onClick={() => setEscalatedTo(escalatedTo === 'monitor_symptoms' ? null : 'monitor_symptoms')}
                >
                  Monitor Symptoms
                </Badge>
              </div>
            </div>

            {/* Health Direct Helpline */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Need Advice?</p>
                  <p className="text-sm text-blue-700">
                    If concerned, speak with HealthDirect Helpline on{' '}
                    <strong>1800 022 222</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional observations or actions taken..."
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
            <Button onClick={handleSubmit} disabled={isSubmitting || !testResult || !isOnBehalfValid}>
              {isSubmitting ? 'Saving...' : 'Save Test Result'}
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
