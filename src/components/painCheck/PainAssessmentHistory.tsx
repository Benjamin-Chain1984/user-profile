import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AbbeyPainAssessment, getSeverityLabel, getSeverityColor, getSeverityBgColor, getSeverityBorderColor, getPainTypeLabel, ABBEY_QUESTIONS, PainActionRecord } from '@/types/painAssessment';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, FileText, User, Clock, Activity, ArrowUpDown } from 'lucide-react';

interface PainAssessmentHistoryProps {
  assessments: AbbeyPainAssessment[];
  loading: boolean;
}

interface AssessmentWithActions extends AbbeyPainAssessment {
  actions: PainActionRecord[];
  createdByName?: string;
}

function AssessmentCard({ assessment, actions, createdByName }: { 
  assessment: AbbeyPainAssessment; 
  actions: PainActionRecord[];
  createdByName?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionScores = [
    { question: ABBEY_QUESTIONS[0], score: assessment.q1_vocalization },
    { question: ABBEY_QUESTIONS[1], score: assessment.q2_facial_expression },
    { question: ABBEY_QUESTIONS[2], score: assessment.q3_body_language },
    { question: ABBEY_QUESTIONS[3], score: assessment.q4_behavioral_change },
    { question: ABBEY_QUESTIONS[4], score: assessment.q5_physiological_change },
    { question: ABBEY_QUESTIONS[5], score: assessment.q6_physical_change },
  ];

  const hasPain = assessment.total_score >= 3;

  return (
    <Card className={`${getSeverityBgColor(assessment.severity)} border-l-4 ${getSeverityBorderColor(assessment.severity)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {/* Severity color indicator */}
              <div className={`w-3 h-3 rounded-full ${
                assessment.severity === 'no_pain' ? 'bg-success' :
                assessment.severity === 'mild' ? 'bg-orange-400' :
                assessment.severity === 'moderate' ? 'bg-orange-600' :
                'bg-destructive'
              }`} />
              <span className={`text-2xl font-bold ${getSeverityColor(assessment.severity)}`}>
                {assessment.total_score}
              </span>
              <div>
                <p className={`font-medium ${getSeverityColor(assessment.severity)}`}>
                  {getSeverityLabel(assessment.severity)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(assessment.created_at), 'PPp')}
                </div>
              </div>
            </div>
            
            {/* Staff member and type info */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {createdByName || 'Staff Member'}
              </span>
              <span>•</span>
              <span>Type: {getPainTypeLabel(assessment.pain_type)}</span>
            </div>

            {/* Actions summary for pain scores */}
            {hasPain && actions.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">
                  {actions.length} action{actions.length !== 1 ? 's' : ''} recorded
                </span>
              </div>
            )}
            {hasPain && actions.length === 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-warning" />
                <span className="text-warning font-medium">No actions recorded</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
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

            {/* Actions Taken */}
            {actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actions Taken:
                </p>
                {actions.map((action) => (
                  <div key={action.id} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium">{action.action_taken}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(action.action_time), 'PPp')}
                    </p>
                    {action.outcome && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">Outcome:</p>
                        <p className="text-sm">{action.outcome}</p>
                        {action.outcome_recorded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Recorded: {format(new Date(action.outcome_recorded_at), 'PPp')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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

            {/* Audit timestamp info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {format(new Date(assessment.created_at), 'PPpp')}</p>
              {assessment.edited_at && (
                <p className="italic">
                  Edited: {format(new Date(assessment.edited_at), 'PPpp')}
                  {assessment.edit_reason && ` - ${assessment.edit_reason}`}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PainAssessmentHistory({ assessments, loading }: PainAssessmentHistoryProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [actionsMap, setActionsMap] = useState<Record<string, PainActionRecord[]>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [loadingActions, setLoadingActions] = useState(true);

  // Fetch actions and profiles for all assessments
  useEffect(() => {
    async function fetchActionsAndProfiles() {
      if (assessments.length === 0) {
        setLoadingActions(false);
        return;
      }

      try {
        // Fetch all actions for these assessments
        const assessmentIds = assessments.map((a) => a.id);
        const { data: actions } = await supabase
          .from('pain_action_records')
          .select('*')
          .in('assessment_id', assessmentIds);

        if (actions) {
          const grouped: Record<string, PainActionRecord[]> = {};
          actions.forEach((action) => {
            if (!grouped[action.assessment_id]) {
              grouped[action.assessment_id] = [];
            }
            grouped[action.assessment_id].push(action as PainActionRecord);
          });
          setActionsMap(grouped);
        }

        // Fetch profile names for creators
        const creatorIds = [...new Set(assessments.map((a) => a.created_by).filter(Boolean))];
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds);

          if (profiles) {
            const map: Record<string, string> = {};
            profiles.forEach((p) => {
              map[p.id] = p.full_name || 'Unknown';
            });
            setProfilesMap(map);
          }
        }
      } catch (err) {
        console.error('Error fetching actions/profiles:', err);
      } finally {
        setLoadingActions(false);
      }
    }

    fetchActionsAndProfiles();
  }, [assessments]);

  const sortedAssessments = [...assessments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading || loadingActions) {
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
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortOrder} onValueChange={(val) => setSortOrder(val as 'newest' | 'oldest')}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assessment List */}
      <div className="space-y-3">
        {sortedAssessments.map((assessment) => (
          <AssessmentCard 
            key={assessment.id} 
            assessment={assessment} 
            actions={actionsMap[assessment.id] || []}
            createdByName={assessment.created_by ? profilesMap[assessment.created_by] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
