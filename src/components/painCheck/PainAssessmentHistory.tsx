import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AbbeyPainAssessment, getSeverityLabel, getSeverityColor, getSeverityBgColor, getPainTypeLabel, ABBEY_QUESTIONS } from '@/types/painAssessment';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface PainAssessmentHistoryProps {
  assessments: AbbeyPainAssessment[];
  loading: boolean;
}

function AssessmentCard({ assessment }: { assessment: AbbeyPainAssessment }) {
  const [expanded, setExpanded] = useState(false);

  const questionScores = [
    { question: ABBEY_QUESTIONS[0], score: assessment.q1_vocalization },
    { question: ABBEY_QUESTIONS[1], score: assessment.q2_facial_expression },
    { question: ABBEY_QUESTIONS[2], score: assessment.q3_body_language },
    { question: ABBEY_QUESTIONS[3], score: assessment.q4_behavioral_change },
    { question: ABBEY_QUESTIONS[4], score: assessment.q5_physiological_change },
    { question: ABBEY_QUESTIONS[5], score: assessment.q6_physical_change },
  ];

  return (
    <Card className={`${getSeverityBgColor(assessment.severity)} border-l-4 ${
      assessment.severity === 'no_pain' ? 'border-l-success' :
      assessment.severity === 'mild' ? 'border-l-warning' :
      assessment.severity === 'moderate' ? 'border-l-orange-500' :
      'border-l-destructive'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${getSeverityColor(assessment.severity)}`}>
                {assessment.total_score}
              </span>
              <div>
                <p className={`font-medium ${getSeverityColor(assessment.severity)}`}>
                  {getSeverityLabel(assessment.severity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(assessment.created_at), 'PPp')}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Type: {getPainTypeLabel(assessment.pain_type)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            {/* Question breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Question Scores:</p>
              {questionScores.map(({ question, score }) => (
                <div key={question.id} className="flex justify-between text-sm py-1 px-2 bg-background/50 rounded">
                  <span className="text-muted-foreground">{question.title}</span>
                  <span className="font-medium">{score}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            {assessment.notes && (
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-sm text-muted-foreground">{assessment.notes}</p>
              </div>
            )}

            {/* Edit info */}
            {assessment.edited_at && (
              <p className="text-xs text-muted-foreground italic">
                Edited: {format(new Date(assessment.edited_at), 'PPp')}
                {assessment.edit_reason && ` - ${assessment.edit_reason}`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PainAssessmentHistory({ assessments, loading }: PainAssessmentHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-20 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assessment history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}
