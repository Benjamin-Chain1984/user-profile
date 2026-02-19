import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AbbeyPainAssessment, getSeverityLabel, getSeverityColor, getSeverityBgColor, getSeverityBorderColor, getSeverityDotColor, getPainTypeLabel, ABBEY_QUESTIONS, PainActionRecord, ASSESSMENT_TRIGGER_LABELS, AssessmentTrigger } from '@/types/painAssessment';
import { PainadAssessment, PAINAD_QUESTIONS, getPainadSeverityLabel, getPainadSeverityColor, getPainadSeverityBgColor, getPainadSeverityBorderColor, getPainadSeverityDotColor } from '@/types/painad';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, FileText, User, Clock, Activity, ArrowUpDown } from 'lucide-react';

interface PainAssessmentHistoryProps {
  assessments: AbbeyPainAssessment[];
  painadAssessments?: PainadAssessment[];
  loading: boolean;
}

type CombinedAssessment = 
  | (AbbeyPainAssessment & { tool: 'abbey' })
  | (PainadAssessment & { tool: 'painad' });

function AbbeyAssessmentCard({ assessment, actions, createdByName }: { 
  assessment: AbbeyPainAssessment; 
  actions: PainActionRecord[];
  createdByName?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionScores = ABBEY_QUESTIONS.map((q, i) => ({
    question: q,
    score: assessment[q.id as keyof AbbeyPainAssessment] as number,
  }));

  const hasPain = assessment.total_score >= 3;

  return (
    <Card className={`${getSeverityBgColor(assessment.severity)} border-l-4 ${getSeverityBorderColor(assessment.severity)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getSeverityDotColor(assessment.severity)}`} />
              <span className={`text-2xl font-bold ${getSeverityColor(assessment.severity)}`}>
                {assessment.total_score}/18
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-success/20 text-success">Abbey</span>
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

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{createdByName || 'Staff Member'}</span>
              <span>•</span>
              <span>Type: {getPainTypeLabel(assessment.pain_type)}</span>
              {assessment.trigger_reason && (
                <><span>•</span><span>Trigger: {ASSESSMENT_TRIGGER_LABELS[assessment.trigger_reason as AssessmentTrigger] || assessment.trigger_reason}</span></>
              )}
            </div>

            {hasPain && actions.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">{actions.length} action{actions.length !== 1 ? 's' : ''} recorded</span>
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Question Scores:</p>
              {questionScores.map(({ question, score }) => (
                <div key={question.id} className="flex justify-between text-sm py-1 px-2 bg-background/50 rounded">
                  <span className="text-muted-foreground">{question.title}</span>
                  <span className="font-medium">{score}/3</span>
                </div>
              ))}
            </div>
            {actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4" />Actions Taken:</p>
                {actions.map((action) => (
                  <div key={action.id} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium">{action.action_taken}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(action.action_time), 'PPp')}</p>
                    {action.outcome && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">Outcome:</p>
                        <p className="text-sm">{action.outcome}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {assessment.notes && (
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Notes</span></div>
                <p className="text-sm text-muted-foreground">{assessment.notes}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {format(new Date(assessment.created_at), 'PPpp')}</p>
              {assessment.edited_at && <p className="italic">Edited: {format(new Date(assessment.edited_at), 'PPpp')}{assessment.edit_reason && ` - ${assessment.edit_reason}`}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PainadAssessmentCard({ assessment, createdByName }: { assessment: PainadAssessment; createdByName?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`${getPainadSeverityBgColor(assessment.severity)} border-l-4 ${getPainadSeverityBorderColor(assessment.severity)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getPainadSeverityDotColor(assessment.severity)}`} />
              <span className={`text-2xl font-bold ${getPainadSeverityColor(assessment.severity)}`}>
                {assessment.total_score}/10
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-primary/20 text-primary">PAINAD</span>
              <div>
                <p className={`font-medium ${getPainadSeverityColor(assessment.severity)}`}>
                  {getPainadSeverityLabel(assessment.severity)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(assessment.created_at), 'PPp')}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{createdByName || 'Staff Member'}</span>
              {assessment.trigger_reason && (
                <><span>•</span><span>Trigger: {ASSESSMENT_TRIGGER_LABELS[assessment.trigger_reason as AssessmentTrigger] || assessment.trigger_reason}</span></>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Question Scores:</p>
              {PAINAD_QUESTIONS.map((q) => (
                <div key={q.id} className="flex justify-between text-sm py-1 px-2 bg-background/50 rounded">
                  <span className="text-muted-foreground">{q.title}</span>
                  <span className="font-medium">{assessment[q.id as keyof PainadAssessment] as number}/2</span>
                </div>
              ))}
            </div>
            {assessment.notes && (
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">Notes</span></div>
                <p className="text-sm text-muted-foreground">{assessment.notes}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {format(new Date(assessment.created_at), 'PPpp')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PainAssessmentHistory({ assessments, painadAssessments = [], loading }: PainAssessmentHistoryProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterTool, setFilterTool] = useState<'all' | 'abbey' | 'painad'>('all');
  const [actionsMap, setActionsMap] = useState<Record<string, PainActionRecord[]>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [loadingActions, setLoadingActions] = useState(true);

  const combined: CombinedAssessment[] = [
    ...assessments.map(a => ({ ...a, tool: 'abbey' as const })),
    ...painadAssessments.map(a => ({ ...a, tool: 'painad' as const })),
  ];

  const filtered = combined.filter(a => filterTool === 'all' || a.tool === filterTool);

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  useEffect(() => {
    async function fetchActionsAndProfiles() {
      if (assessments.length === 0 && painadAssessments.length === 0) {
        setLoadingActions(false);
        return;
      }

      try {
        const assessmentIds = assessments.map((a) => a.id);
        if (assessmentIds.length > 0) {
          const { data: actions } = await supabase.from('pain_action_records').select('*').in('assessment_id', assessmentIds);
          if (actions) {
            const grouped: Record<string, PainActionRecord[]> = {};
            actions.forEach((action) => {
              if (!grouped[action.assessment_id]) grouped[action.assessment_id] = [];
              grouped[action.assessment_id].push(action as PainActionRecord);
            });
            setActionsMap(grouped);
          }
        }

        const allCreatorIds = [
          ...assessments.map(a => a.created_by),
          ...painadAssessments.map(a => a.created_by),
        ].filter(Boolean);
        const creatorIds = [...new Set(allCreatorIds)];

        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds);
          if (profiles) {
            const map: Record<string, string> = {};
            profiles.forEach((p) => { map[p.id] = p.full_name || 'Unknown'; });
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
  }, [assessments, painadAssessments]);

  if (loading || loadingActions) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (<Card key={i} className="animate-pulse"><CardContent className="p-4 h-20 bg-muted" /></Card>))}
      </div>
    );
  }

  if (combined.length === 0) {
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{sorted.length} assessment{sorted.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          <Select value={filterTool} onValueChange={(val) => setFilterTool(val as any)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              <SelectItem value="abbey">Abbey</SelectItem>
              <SelectItem value="painad">PAINAD</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="space-y-3">
        {sorted.map((assessment) => {
          if (assessment.tool === 'abbey') {
            return (
              <AbbeyAssessmentCard
                key={assessment.id}
                assessment={assessment}
                actions={actionsMap[assessment.id] || []}
                createdByName={assessment.created_by ? profilesMap[assessment.created_by] : undefined}
              />
            );
          }
          return (
            <PainadAssessmentCard
              key={assessment.id}
              assessment={assessment}
              createdByName={assessment.created_by ? profilesMap[assessment.created_by] : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
