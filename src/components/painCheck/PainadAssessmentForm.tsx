import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePainadAssessments } from '@/hooks/usePainadAssessments';
import { usePainConfig } from '@/hooks/usePainConfig';
import {
  PAINAD_QUESTIONS,
  calculatePainadSeverity,
  getPainadSeverityLabel,
  getPainadSeverityColor,
  getPainadSeverityBgColor,
  getPainadSeverityDotColor,
  PAINAD_SEVERE_PROMPTS,
} from '@/types/painad';
import { ASSESSMENT_TRIGGER_LABELS } from '@/types/painAssessment';
import { PainActionForm } from './PainActionForm';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

interface PainadAssessmentFormProps {
  onComplete: () => void;
  onCancel: () => void;
  clientId?: string;
}

export function PainadAssessmentForm({ onComplete, onCancel, clientId }: PainadAssessmentFormProps) {
  clientId = useClientIdOrActive(clientId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({
    q1_breathing: -1,
    q2_negative_vocalization: -1,
    q3_facial_expression: -1,
    q4_body_language: -1,
    q5_consolability: -1,
  });
  const [triggerReason, setTriggerReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showActionForm, setShowActionForm] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);

  const { createAssessment } = usePainadAssessments(clientId);
  const { getEffectiveConfig } = usePainConfig(clientId);
  const config = getEffectiveConfig();

  const totalSteps = PAINAD_QUESTIONS.length + 1;
  const currentQuestion = PAINAD_QUESTIONS[step];
  const isLastQuestion = step === PAINAD_QUESTIONS.length - 1;
  const isSummaryStep = step === PAINAD_QUESTIONS.length;

  const currentScore = Object.values(answers).reduce((sum, val) => sum + (val >= 0 ? val : 0), 0);
  const currentSeverity = calculatePainadSeverity(currentScore);
  const allAnswered = Object.values(answers).every((v) => v >= 0);
  const requiresAction = currentScore >= 1;

  const handleSubmit = async () => {
    const assessment = await createAssessment({
      client_id: clientId,
      q1_breathing: answers.q1_breathing,
      q2_negative_vocalization: answers.q2_negative_vocalization,
      q3_facial_expression: answers.q3_facial_expression,
      q4_body_language: answers.q4_body_language,
      q5_consolability: answers.q5_consolability,
      pain_type: 'acute',
      trigger_reason: triggerReason || undefined,
      notes: notes || undefined,
    });

    if (assessment) {
      if (currentScore >= 4) {
        setSavedAssessmentId(assessment.id);
        setShowActionForm(true);
      } else {
        onComplete();
      }
    }
  };

  const handleActionSubmit = async (actionTaken: string) => {
    // PAINAD actions are saved as notes on the assessment for now
    onComplete();
  };

  if (showActionForm && savedAssessmentId) {
    return (
      <PainActionForm
        score={currentScore}
        severity={currentSeverity as any}
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

      {/* Running Score - Always visible */}
      <Card className={`${getPainadSeverityBgColor(currentSeverity)} border-l-4 ${
        currentSeverity === 'no_pain' ? 'border-l-success' :
        currentSeverity === 'mild' ? 'border-l-amber-500' :
        currentSeverity === 'moderate' ? 'border-l-orange-500' :
        'border-l-destructive'
      }`}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getPainadSeverityDotColor(currentSeverity)}`} />
            <span className="text-sm text-muted-foreground">Running Score:</span>
          </div>
          <span className={`font-bold text-lg ${getPainadSeverityColor(currentSeverity)}`}>
            {currentScore}/10 • {getPainadSeverityLabel(currentSeverity)}
          </span>
        </CardContent>
      </Card>

      {/* Question Card */}
      {!isSummaryStep && currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Q{currentQuestion.number}: {currentQuestion.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            {currentQuestion.tooltip && (
              <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-md mt-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary">{currentQuestion.tooltip}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option.value }))}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  answers[currentQuestion.id] === option.value
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-2xl font-bold ${
                    answers[currentQuestion.id] === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {option.value}
                  </span>
                  <div>
                    <span className={`font-medium block ${
                      answers[currentQuestion.id] === option.value ? 'text-primary' : ''
                    }`}>
                      {option.label}
                    </span>
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                        <ChevronDown className="w-3 h-3" />
                        Clinical detail
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <p className="text-xs text-muted-foreground mt-1">{option.detail}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep(s => s + 1)} disabled={answers[currentQuestion.id] < 0}>
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
            <CardTitle className="text-lg">PAINAD Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className={`p-4 rounded-lg text-center ${getPainadSeverityBgColor(currentSeverity)}`}>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className={`text-4xl font-bold ${getPainadSeverityColor(currentSeverity)}`}>{currentScore}</p>
              <p className={`text-lg font-medium ${getPainadSeverityColor(currentSeverity)}`}>
                {getPainadSeverityLabel(currentSeverity)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 10</p>
            </div>

            {currentScore >= 7 && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Severe Pain Detected</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    {PAINAD_SEVERE_PROMPTS.map((p, i) => <li key={i}>• {p}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Question Breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Question Breakdown:</p>
              {PAINAD_QUESTIONS.map((q) => (
                <div key={q.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{q.title}</span>
                  <span className="font-medium">{answers[q.id]}/2</span>
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
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleSubmit} disabled={!allAnswered}>
              <Check className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* PAINAD Safety Note */}
      <p className="text-xs text-muted-foreground italic text-center px-4">
        PAINAD is an observational tool and does not replace clinical judgement. Persistent elevated scores require escalation and medical advice.
      </p>
    </div>
  );
}
