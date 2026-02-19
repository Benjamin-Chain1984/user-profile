import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePainAssessments } from '@/hooks/usePainAssessments';
import { usePainadAssessments } from '@/hooks/usePainadAssessments';
import { usePainConfig } from '@/hooks/usePainConfig';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { PainToolSelector, PainTool } from './PainToolSelector';
import { PainAssessmentForm } from './PainAssessmentForm';
import { PainadAssessmentForm } from './PainadAssessmentForm';
import { PainAssessmentHistory } from './PainAssessmentHistory';
import { PainTrendChart } from './PainTrendChart';
import { PainConfigSettings } from './PainConfigSettings';
import { PainQuickStatus } from './PainQuickStatus';
import { PainExportReports } from './PainExportReports';
import { getSeverityLabel, getSeverityColor, ASSESSMENT_FREQUENCY_OPTIONS, AssessmentFrequency } from '@/types/painAssessment';
import { getPainadSeverityLabel, getPainadSeverityColor } from '@/types/painad';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { Plus, TrendingUp, ClipboardList, AlertTriangle, Info, Settings, FileDown, Clock, CalendarClock, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow, addHours, isPast } from 'date-fns';

const SCREENING_WARNING = "Pain assessment tools are screening tools only. If pain is suspected or scores increase, seek advice from a medical professional immediately.";

const ABBEY_CLINICAL_INSTRUCTIONS = `The Abbey Pain Scale is an instrument designed to assist in the assessment of pain in patients who are unable to clearly articulate their needs, for example, patients with dementia, cognition or communication issues.

The scale does not differentiate between distress and pain, so measuring the effectiveness of pain-relieving interventions is essential.

The Australian Pain Society recommends the pain scale should be used as a movement-based assessment. Therefore observe the person while they are being moved, during pressure area care, while showering, etc.

Complete the scale immediately following the procedure and record the results on the Abbey Pain tool chart.`;

const PAINAD_CLINICAL_INSTRUCTIONS = `The PAINAD (Pain Assessment in Advanced Dementia) scale is a reliable observational tool for assessing pain in people with advanced dementia who cannot self-report pain.

Observe the person for 5 minutes before scoring. Score each of the five items (Breathing, Negative Vocalisation, Facial Expression, Body Language, Consolability) from 0 to 2.

The total score ranges from 0 to 10. Higher scores indicate greater pain intensity and should prompt clinical review and appropriate pain management interventions.`;

const ABBEY_CITATION = "Abbey Pain Scale – Abbey, J., Piller, N., De Bellis, A., Esterman, A., Parker, D., Giles, L., & Lowcay, B. (2004). The Abbey pain scale: a 1-minute numerical indicator for people with end-stage dementia. International Journal of Palliative Nursing, 10(1), 6–13.";
const PAINAD_CITATION = "Warden, V., Hurley, A. C., & Volicer, L. (2003). Development and psychometric evaluation of the Pain Assessment in Advanced Dementia (PAINAD) scale. Journal of the American Medical Directors Association, 4(1), 9–15.";

export function PainCheckDashboard() {
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [showAbbeyForm, setShowAbbeyForm] = useState(false);
  const [showPainadForm, setShowPainadForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { assessments: abbeyAssessments, loading: abbeyLoading, getLatestAssessment: getLatestAbbey, getTrendDirection: getAbbeyTrend, refresh: refreshAbbey } = usePainAssessments();
  const { assessments: painadAssessments, loading: painadLoading, getLatestAssessment: getLatestPainad, getTrendDirection: getPainadTrend, refresh: refreshPainad } = usePainadAssessments();
  const { config: painConfig, loading: configLoading } = usePainConfig();
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const enabledTools: PainTool[] = (painConfig?.enabled_tools as PainTool[]) || ['abbey', 'painad'];

  const latestAbbey = getLatestAbbey();
  const latestPainad = getLatestPainad();

  // Compute next assessment due based on configured frequency
  const nextDueInfo = useMemo(() => {
    const triggers = painConfig?.assessment_triggers || ['daily'];
    const freq = triggers.find(t => ['daily', 'weekly', 'fortnightly'].includes(t)) as AssessmentFrequency | undefined;
    if (!freq) return null;
    
    const freqOption = ASSESSMENT_FREQUENCY_OPTIONS.find(o => o.value === freq);
    if (!freqOption) return null;

    // Find the most recent assessment across both tools
    const latestTime = [
      latestAbbey ? new Date(latestAbbey.created_at).getTime() : 0,
      latestPainad ? new Date(latestPainad.created_at).getTime() : 0,
    ].filter(t => t > 0);

    if (latestTime.length === 0) {
      return { dueDate: null, isOverdue: true, label: freqOption.label, hasAssessments: false };
    }

    const mostRecent = new Date(Math.max(...latestTime));
    const dueDate = addHours(mostRecent, freqOption.hours);
    const isOverdue = isPast(dueDate);

    return { dueDate, isOverdue, label: freqOption.label, hasAssessments: true };
  }, [painConfig, latestAbbey, latestPainad]);

  // Combine assessments for history/trends
  const allAssessments = [
    ...abbeyAssessments.map(a => ({ ...a, tool: 'abbey' as const, maxScore: 18 })),
    ...painadAssessments.map(a => ({ ...a, tool: 'painad' as const, maxScore: 10 })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const loading = abbeyLoading || painadLoading || configLoading;

  const handleToolSelect = (tool: PainTool) => {
    setShowToolSelector(false);
    if (tool === 'abbey') setShowAbbeyForm(true);
    else setShowPainadForm(true);
  };

  const handleAssessmentComplete = () => {
    setShowAbbeyForm(false);
    setShowPainadForm(false);
    refreshAbbey();
    refreshPainad();
  };

  const handleBeginAssessment = () => {
    if (enabledTools.length === 1) {
      handleToolSelect(enabledTools[0]);
    } else {
      setShowToolSelector(true);
    }
  };

  if (showToolSelector) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setShowToolSelector(false)} className="mb-2">
          ← Back
        </Button>
        <PainToolSelector enabledTools={enabledTools} onSelect={handleToolSelect} />
      </div>
    );
  }

  if (showAbbeyForm) {
    return <PainAssessmentForm onComplete={handleAssessmentComplete} onCancel={() => setShowAbbeyForm(false)} />;
  }

  if (showPainadForm) {
    return <PainadAssessmentForm onComplete={handleAssessmentComplete} onCancel={() => setShowPainadForm(false)} />;
  }

  if (showExport) {
    return <PainExportReports assessments={abbeyAssessments} painadAssessments={painadAssessments} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">🩺 Pain Assessment Tools</h2>
          <p className="text-muted-foreground">
            Abbey Pain Scale & PAINAD (Non-Verbal Pain Assessment)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleBeginAssessment} disabled={isMonitoringPaused}>
            <Plus className="h-4 w-4 mr-2" />
            Begin Assessment
          </Button>
        </div>
      </div>

      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Mandatory Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> {SCREENING_WARNING}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Assessment Due Card */}
      {nextDueInfo && (
        <Card className={`border-l-4 ${nextDueInfo.isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-success bg-success/5'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {nextDueInfo.isOverdue ? (
                <CalendarClock className="h-6 w-6 text-destructive" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-success" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {nextDueInfo.isOverdue ? 'Assessment Overdue' : 'Next Assessment Due'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Schedule: {nextDueInfo.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              {!nextDueInfo.hasAssessments ? (
                <p className="text-sm font-semibold text-destructive">No assessments recorded</p>
              ) : nextDueInfo.dueDate ? (
                <>
                  <p className={`text-sm font-semibold ${nextDueInfo.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                    {nextDueInfo.isOverdue
                      ? `Overdue by ${formatDistanceToNow(nextDueInfo.dueDate)}`
                      : `Due in ${formatDistanceToNow(nextDueInfo.dueDate)}`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(nextDueInfo.dueDate, 'PPp')}
                  </p>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Status Cards - Side by side for both tools */}
      <div className="grid sm:grid-cols-2 gap-4">
        {enabledTools.includes('abbey') && (
          <Card className="border-l-4 border-l-success">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Abbey Pain Scale (Last)</p>
              {latestAbbey ? (
                <>
                  <p className={`text-xl font-bold ${getSeverityColor(latestAbbey.severity)}`}>
                    {latestAbbey.total_score}/18 – {getSeverityLabel(latestAbbey.severity)}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(latestAbbey.created_at), 'PPp')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No assessments yet</p>
              )}
            </CardContent>
          </Card>
        )}
        {enabledTools.includes('painad') && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">PAINAD Scale (Last)</p>
              {latestPainad ? (
                <>
                  <p className={`text-xl font-bold ${getPainadSeverityColor(latestPainad.severity)}`}>
                    {latestPainad.total_score}/10 – {getPainadSeverityLabel(latestPainad.severity)}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(latestPainad.created_at), 'PPp')}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No assessments yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tracking" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <RoleTabsTrigger
            value="settings"
            requiresAdmin
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Recent Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : allAssessments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No assessments yet</p>
                ) : (
                  <div className="space-y-3">
                    {allAssessments.slice(0, 5).map((assessment) => {
                      const isAbbey = assessment.tool === 'abbey';
                      const sevLabel = isAbbey ? getSeverityLabel(assessment.severity) : getPainadSeverityLabel(assessment.severity as any);
                      const sevColor = isAbbey ? getSeverityColor(assessment.severity) : getPainadSeverityColor(assessment.severity as any);
                      return (
                        <div key={assessment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isAbbey ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                                {isAbbey ? 'Abbey' : 'PAINAD'}
                              </span>
                              <p className={`font-medium ${sevColor}`}>{sevLabel}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(assessment.created_at), 'PP')}
                            </p>
                          </div>
                          <span className="text-lg font-bold">{assessment.total_score}/{assessment.maxScore}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown for both */}
            <div className="space-y-4">
              {enabledTools.includes('abbey') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-success">Abbey Pain Scale (0–18)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center p-1.5 bg-success/10 rounded"><span>🟢 No Pain</span><span className="font-medium">0-2</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-orange-400/10 rounded"><span>🟠 Mild</span><span className="font-medium">3-7</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-orange-600/10 rounded"><span>🟠 Moderate</span><span className="font-medium">8-13</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-destructive/10 rounded"><span>🔴 Severe</span><span className="font-medium">14-18</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {enabledTools.includes('painad') && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-primary">PAINAD Scale (0–10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center p-1.5 bg-success/10 rounded"><span>🟢 No Pain</span><span className="font-medium">0</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-amber-500/10 rounded"><span>🟡 Mild</span><span className="font-medium">1-3</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-orange-500/10 rounded"><span>🟠 Moderate</span><span className="font-medium">4-6</span></div>
                      <div className="flex justify-between items-center p-1.5 bg-destructive/10 rounded"><span>🔴 Severe</span><span className="font-medium">7-10</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Assessment History */}
          <PainAssessmentHistory assessments={abbeyAssessments} painadAssessments={painadAssessments} loading={loading} />
        </TabsContent>

        <TabsContent value="trends">
          <PainTrendChart assessments={abbeyAssessments} painadAssessments={painadAssessments} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <PainConfigSettings />
          </TabsContent>
        )}
      </Tabs>

      {/* Clinical Instructions */}
      <Card className="bg-muted/30 border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Assessment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabledTools.includes('abbey') && (
            <div>
              <p className="text-sm font-medium text-success mb-1">Abbey Pain Scale</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ABBEY_CLINICAL_INSTRUCTIONS}</p>
            </div>
          )}
          {enabledTools.includes('painad') && (
            <div>
              <p className="text-sm font-medium text-primary mb-1">PAINAD Scale</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{PAINAD_CLINICAL_INSTRUCTIONS}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Citations */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-2">
        {enabledTools.includes('abbey') && (
          <div>
            <p className="font-medium">Abbey Pain Scale</p>
            <p className="italic">{ABBEY_CITATION}</p>
          </div>
        )}
        {enabledTools.includes('painad') && (
          <div>
            <p className="font-medium">PAINAD Scale</p>
            <p className="italic">{PAINAD_CITATION}</p>
          </div>
        )}
      </div>

      {/* PAINAD Safety Note */}
      <Card className="border-muted bg-muted/20">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground italic text-center">
            PAINAD is an observational tool and does not replace clinical judgement. Persistent elevated scores require escalation and medical advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
