import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePainAssessments } from '@/hooks/usePainAssessments';
import { usePainConfig } from '@/hooks/usePainConfig';
import { 
  ABBEY_QUESTIONS, 
  calculateSeverity, 
  getSeverityLabel, 
  getSeverityColor, 
  getSeverityBgColor, 
  getSeverityDotColor,
  PainType, 
  getPainTypeLabel,
  ASSESSMENT_TRIGGER_LABELS,
  AssessmentTrigger
} from '@/types/painAssessment';
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { PainActionForm } from './PainActionForm';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

interface PainAssessmentFormProps {
  onComplete: () => void;
  onCancel: () => void;
  clientId?: string;
  preselectedTrigger?: AssessmentTrigger;
}

export function PainAssessmentForm({ onComplete, onCancel, clientId, preselectedTrigger }: PainAssessmentFormProps) {
  clientId = useClientIdOrActive(clientId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({
    q1_vocalization: -1,
    q2_facial_expression: -1,
    q3_body_language: -1,
    q4_behavioral_change: -1,
    q5_physiological_change: -1,
    q6_physical_change: -1,
  });
  const [painType, setPainType] = useState<PainType | ''>('');
  const [triggerReason, setTriggerReason] = useState<string>(preselectedTrigger || '');
  const [notes, setNotes] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);

  const { createAssessment, addActionRecord } = usePainAssessments(clientId);
  const { getEffectiveConfig } = usePainConfig(clientId);
  const config = getEffectiveConfig();

  const totalSteps = ABBEY_QUESTIONS.length + 1; // Questions + Summary
  const currentQuestion = ABBEY_QUESTIONS[step];
  const isLastQuestion = step === ABBEY_QUESTIONS.length - 1;
  const isSummaryStep = step === ABBEY_QUESTIONS.length;

  const calculateCurrentScore = () => {
    return Object.values(answers).reduce((sum, val) => sum + (val >= 0 ? val : 0), 0);
  };

  const allQuestionsAnswered = Object.values(answers).every((v) => v >= 0);
  const currentScore = calculateCurrentScore();
  const currentSeverity = calculateSeverity(currentScore);
  const requiresAction = currentScore >= 3;

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!painType) return;

    const assessment = await createAssessment({
      client_id: clientId,
      q1_vocalization: answers.q1_vocalization,
      q2_facial_expression: answers.q2_facial_expression,
      q3_body_language: answers.q3_body_language,
      q4_behavioral_change: answers.q4_behavioral_change,
      q5_physiological_change: answers.q5_physiological_change,
      q6_physical_change: answers.q6_physical_change,
      pain_type: painType,
      trigger_reason: triggerReason || undefined,
      notes: notes || undefined,
    });

    if (assessment) {
      if (requiresAction) {
        setSavedAssessmentId(assessment.id);
        setShowActionForm(true);
      } else {
        onComplete();
      }
    }
  };

  const handleActionSubmit = async (actionTaken: string) => {
    if (savedAssessmentId) {
      await addActionRecord({
        assessment_id: savedAssessmentId,
        action_taken: actionTaken,
      });
    }
    onComplete();
  };

  if (showActionForm && savedAssessmentId) {
    return (
      <PainActionForm
        score={currentScore}
        severity={currentSeverity}
        onSubmit={handleActionSubmit}
        onCancel={() => onComplete()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Step {step + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Question Card */}
      {!isSummaryStep && currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Q{currentQuestion.number}: {currentQuestion.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            <p className="text-sm text-primary italic">{currentQuestion.examples}</p>
          </CardHeader>
          <CardContent>
            {/* Large visual tile buttons for 0-3 scale */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    answers[currentQuestion.id] === option.value
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <span className={`text-2xl font-bold block ${
                    answers[currentQuestion.id] === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {option.value}
                  </span>
                  <span className={`text-sm ${
                    answers[currentQuestion.id] === option.value ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={answers[currentQuestion.id] < 0}>
              {isLastQuestion ? 'Review' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Summary Step */}
      {isSummaryStep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className={`p-4 rounded-lg text-center ${getSeverityBgColor(currentSeverity)}`}>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className={`text-4xl font-bold ${getSeverityColor(currentSeverity)}`}>
                {currentScore}
              </p>
              <p className={`text-lg font-medium ${getSeverityColor(currentSeverity)}`}>
                {getSeverityLabel(currentSeverity)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 18</p>
            </div>

            {requiresAction && (
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Action Required</p>
                  <p className="text-sm text-muted-foreground">
                    Score ≥ 3 requires documenting actions taken
                  </p>
                </div>
              </div>
            )}

            {/* Question Breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Question Breakdown:</p>
              {ABBEY_QUESTIONS.map((q) => (
                <div key={q.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{q.title}</span>
                  <span className="font-medium">{answers[q.id]}/3</span>
                </div>
              ))}
            </div>

            {/* Trigger Reason */}
            <div className="space-y-2">
              <Label>Reason for Assessment</Label>
              <Select value={triggerReason} onValueChange={setTriggerReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {config.assessment_triggers.map((trigger) => (
                    <SelectItem key={trigger} value={trigger}>
                      {ASSESSMENT_TRIGGER_LABELS[trigger]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pain Type */}
            <div className="space-y-2">
              <Label>Pain Type *</Label>
              <Select value={painType} onValueChange={(val) => setPainType(val as PainType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pain type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acute">{getPainTypeLabel('acute')}</SelectItem>
                  <SelectItem value="chronic">{getPainTypeLabel('chronic')}</SelectItem>
                  <SelectItem value="acute_on_chronic">{getPainTypeLabel('acute_on_chronic')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Observations (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations or context..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={!painType}>
              <Check className="w-4 h-4 mr-2" />
              {requiresAction ? 'Save & Add Action' : 'Save Assessment'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Running Score Display */}
      <Card className={`${getSeverityBgColor(currentSeverity)} border-l-4 ${
        currentSeverity === 'no_pain' ? 'border-l-success' :
        currentSeverity === 'mild' ? 'border-l-orange-400' :
        currentSeverity === 'moderate' ? 'border-l-orange-600' :
        'border-l-destructive'
      }`}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getSeverityDotColor(currentSeverity)}`} />
            <span className="text-sm text-muted-foreground">Running Score:</span>
          </div>
          <span className={`font-bold text-lg ${getSeverityColor(currentSeverity)}`}>
            {currentScore}/18 • {getSeverityLabel(currentSeverity)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
