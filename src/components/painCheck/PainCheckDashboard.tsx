import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePainAssessments } from '@/hooks/usePainAssessments';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { PainAssessmentForm } from './PainAssessmentForm';
import { PainAssessmentHistory } from './PainAssessmentHistory';
import { PainTrendChart } from './PainTrendChart';
import { PainConfigSettings } from './PainConfigSettings';
import { PainQuickStatus } from './PainQuickStatus';
import { PainExportReports } from './PainExportReports';
import { getSeverityLabel, getSeverityColor } from '@/types/painAssessment';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { Plus, TrendingUp, ClipboardList, AlertTriangle, Info, Settings, FileDown, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SCREENING_WARNING = "The Abbey Pain Scale is a screening tool only. If pain is suspected or scores increase, seek advice from a medical professional immediately.";

const CLINICAL_INSTRUCTIONS = `The Abbey Pain Scale is an instrument designed to assist in the assessment of pain in patients who are unable to clearly articulate their needs, for example, patients with dementia, cognition or communication issues.

The scale does not differentiate between distress and pain, so measuring the effectiveness of pain-relieving interventions is essential.

The Australian Pain Society recommends the pain scale should be used as a movement-based assessment. Therefore observe the person while they are being moved, during pressure area care, while showering, etc.

Complete the scale immediately following the procedure and record the results on the Abbey Pain tool chart.`;

const ABBEY_CITATION = "Abbey Pain Scale – Abbey, J., Piller, N., De Bellis, A., Esterman, A., Parker, D., Giles, L., & Lowcay, B. (2004). The Abbey pain scale: a 1-minute numerical indicator for people with end-stage dementia. International Journal of Palliative Nursing, 10(1), 6–13.";

export function PainCheckDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { assessments, loading, getLatestAssessment, getTrendDirection, refresh } = usePainAssessments();
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const latestAssessment = getLatestAssessment();
  const trendDirection = getTrendDirection();

  const handleAssessmentComplete = () => {
    setShowForm(false);
    refresh();
  };

  if (showForm) {
    return (
      <PainAssessmentForm
        onComplete={handleAssessmentComplete}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showExport) {
    return (
      <PainExportReports assessments={assessments} onClose={() => setShowExport(false)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Pain Assessment</h2>
          <p className="text-muted-foreground">
            Abbey Pain Scale (Non-Verbal Pain Assessment)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={isMonitoringPaused}>
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

      {/* Quick Status Card */}
      <PainQuickStatus 
        latestAssessment={latestAssessment} 
        trendDirection={trendDirection}
        loading={loading}
        onStartAssessment={() => setShowForm(true)}
      />

      {/* Tabs - Consistent with Bowel Care */}
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
                ) : assessments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No assessments yet</p>
                ) : (
                  <div className="space-y-3">
                    {assessments.slice(0, 5).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className={`font-medium ${getSeverityColor(assessment.severity)}`}>
                            {getSeverityLabel(assessment.severity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(assessment.created_at), 'PP')}
                          </p>
                        </div>
                        <span className="text-lg font-bold">{assessment.total_score}/18</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-success/10 rounded border-l-4 border-l-success">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>No Pain</span>
                    </div>
                    <span className="font-medium text-success">0-2</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-400/10 rounded border-l-4 border-l-orange-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400" />
                      <span>Mild Pain</span>
                    </div>
                    <span className="font-medium text-orange-400">3-7</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-600/10 rounded border-l-4 border-l-orange-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-600" />
                      <span>Moderate Pain</span>
                    </div>
                    <span className="font-medium text-orange-600">8-13</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-destructive/10 rounded border-l-4 border-l-destructive">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span>Severe Pain</span>
                    </div>
                    <span className="font-medium text-destructive">14-18</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assessment History */}
          <PainAssessmentHistory assessments={assessments} loading={loading} />
        </TabsContent>

        <TabsContent value="trends">
          <PainTrendChart assessments={assessments} />
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
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {CLINICAL_INSTRUCTIONS}
          </p>
        </CardContent>
      </Card>

      {/* Footer Citation */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p className="font-medium">Abbey Pain Scale</p>
        <p className="italic">
          {ABBEY_CITATION}
        </p>
      </div>
    </div>
  );
}
