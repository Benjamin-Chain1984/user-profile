/**
 * Competency Check Page - Full quiz flow with progress and feedback
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getAllQuestions } from './CompetencyQuestionGenerator';
import { useBowelCareConfig, usePrnMedications } from '@/hooks/useBowelCare';
import { useBowelCompetencyConfig, useBowelCompetencyAttempts } from '@/hooks/useBowelCompetency';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import type { CompetencyQuestion, CompetencyAnswer } from '@/types/bowelCompetency';

interface CompetencyCheckPageProps {
  clientId?: string;
  onClose: () => void;
}

export function CompetencyCheckPage({ clientId, onClose }: CompetencyCheckPageProps) {
  const { config: bowelConfig } = useBowelCareConfig(clientId);
  const { medications } = usePrnMedications(clientId);
  const { config: compConfig } = useBowelCompetencyConfig(clientId);
  const { submitAttempt, isSubmitting } = useBowelCompetencyAttempts(clientId);

  const questionsRef = useRef<CompetencyQuestion[]>([]);
  const [questionsReady, setQuestionsReady] = useState(false);

  useEffect(() => {
    if (!questionsReady && bowelConfig !== undefined && medications !== undefined) {
      questionsRef.current = getAllQuestions(bowelConfig, medications);
      setQuestionsReady(true);
    }
  }, [bowelConfig, medications, questionsReady]);

  const questions = questionsRef.current;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<CompetencyAnswer[]>([]);
  const [completed, setCompleted] = useState(false);

  const current = questions[currentIdx];
  const totalQuestions = questions.length;
  const progress = ((currentIdx + (showFeedback ? 1 : 0)) / totalQuestions) * 100;
  const passThreshold = compConfig?.pass_threshold_percent ?? 80;

  const handleSelectAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIndex);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (selectedAnswer === null || !current) return;
    const answer: CompetencyAnswer = {
      questionId: current.id,
      question: current.question,
      selectedIndex: selectedAnswer,
      correctIndex: current.correctIndex,
      correct: selectedAnswer === current.correctIndex,
      category: current.category,
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Complete
      const score = newAnswers.filter(a => a.correct).length;
      const passed = (score / totalQuestions) * 100 >= passThreshold;
      setCompleted(true);
      submitAttempt({
        answers: newAnswers,
        score,
        totalQuestions,
        passed,
        validityMonths: compConfig?.validity_months ?? 12,
      });
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setCompleted(false);
  };

  // Results screen
  if (completed) {
    const score = answers.filter(a => a.correct).length;
    const percent = Math.round((score / totalQuestions) * 100);
    const passed = percent >= passThreshold;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-2xl font-bold">Competency Result</h2>
        </div>

        <Card className={passed ? 'border-green-300 bg-green-50/50' : 'border-destructive/50 bg-destructive/5'}>
          <CardContent className="py-8 text-center space-y-4">
            {passed ? (
              <Trophy className="h-16 w-16 mx-auto text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
            )}
            <h3 className="text-2xl font-bold">
              {passed ? 'Competency Achieved!' : 'Not Yet Competent'}
            </h3>
            <p className="text-lg">
              Score: <strong>{score}/{totalQuestions}</strong> ({percent}%)
            </p>
            <p className="text-sm text-muted-foreground">
              {passed
                ? `Valid for ${compConfig?.validity_months ?? 12} months.`
                : `You need ${passThreshold}% to pass. Please review and try again.`}
            </p>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Answer Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {answers.map((a, idx) => (
              <div key={a.questionId} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-0.5">
                  {a.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Q{idx + 1}. {a.question}</p>
                  {!a.correct && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Correct answer: {questions[idx]?.options[a.correctIndex]}
                    </p>
                  )}
                </div>
                <Badge variant={a.category === 'individual' ? 'secondary' : 'outline'} className="text-xs shrink-0">
                  {a.category === 'individual' ? 'Individual' : 'General'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {!passed && (
            <Button onClick={handleRetake}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Return to Bowel Care
          </Button>
        </div>
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Competency Check</h2>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
          <Badge variant="outline">
            {current?.category === 'individual' ? 'Individual-Specific' : 'General Knowledge'}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      {current && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{current.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {current.options.map((option, idx) => {
              let variant: 'outline' | 'default' | 'destructive' = 'outline';
              let extraClass = '';

              if (showFeedback) {
                if (idx === current.correctIndex) {
                  extraClass = 'border-green-500 bg-green-50 text-green-900';
                } else if (idx === selectedAnswer && idx !== current.correctIndex) {
                  extraClass = 'border-destructive bg-destructive/10 text-destructive';
                }
              } else if (idx === selectedAnswer) {
                variant = 'default';
              }

              return (
                <Button
                  key={idx}
                  variant={variant}
                  className={`w-full justify-start text-left h-auto py-4 px-4 whitespace-normal ${extraClass}`}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={showFeedback}
                >
                  <span className="font-semibold mr-3 shrink-0">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{option}</span>
                  {showFeedback && idx === current.correctIndex && (
                    <CheckCircle2 className="h-5 w-5 ml-auto text-green-600 shrink-0" />
                  )}
                  {showFeedback && idx === selectedAnswer && idx !== current.correctIndex && (
                    <XCircle className="h-5 w-5 ml-auto text-destructive shrink-0" />
                  )}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!showFeedback ? (
          <Button onClick={handleConfirm} disabled={selectedAnswer === null}>
            Confirm Answer
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={isSubmitting}>
            {currentIdx < totalQuestions - 1 ? (
              <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
            ) : (
              'Finish'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
