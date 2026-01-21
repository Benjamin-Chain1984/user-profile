import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePainAssessments } from '@/hooks/usePainAssessments';
import { PainAssessmentForm } from './PainAssessmentForm';
import { PainAssessmentHistory } from './PainAssessmentHistory';
import { PainTrendChart } from './PainTrendChart';
import { getSeverityLabel, getSeverityColor, getSeverityBgColor } from '@/types/painAssessment';
import { Plus, TrendingUp, ClipboardList, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';

// Safety warning text
const SCREENING_WARNING = "The Abbey Pain Scale is a screening tool only. If pain is suspected or scores increase, seek advice from a medical professional immediately.";

// Clinical instruction text
const CLINICAL_INSTRUCTIONS = `The Abbey Pain Scale is an instrument designed to assist in the assessment of pain in patients who are unable to clearly articulate their needs, for example, patients with dementia, cognition or communication issues.

The scale does not differentiate between distress and pain, so measuring the effectiveness of pain-relieving interventions is essential.

The Australian Pain Society recommends the pain scale should be used as a movement-based assessment. Therefore observe the person while they are being moved, during pressure area care, while showering, etc.

Complete the scale immediately following the procedure and record the results on the Abbey Pain tool chart.`;

// Footer reference citation
const ABBEY_CITATION = "Abbey Pain Scale – Abbey, J., Piller, N., De Bellis, A., Esterman, A., Parker, D., Giles, L., & Lowcay, B. (2004). The Abbey pain scale: a 1-minute numerical indicator for people with end-stage dementia. International Journal of Palliative Nursing, 10(1), 6–13.";

export function PainCheckDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'trends'>('overview');
  const { assessments, loading, getLatestAssessment, refresh } = usePainAssessments();

  const latestAssessment = getLatestAssessment();

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pain Check</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Abbey Pain Scale Assessment
          </p>
        </div>
      </div>

      {/* Screening Warning Banner */}
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm font-medium text-foreground">
          {SCREENING_WARNING}
        </AlertDescription>
      </Alert>

      {/* Clinical Instructions */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-foreground">Assessment Instructions</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {CLINICAL_INSTRUCTIONS}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Begin Assessment Button */}
      <div className="flex justify-center">
        <Button onClick={() => setShowForm(true)} className="gap-2" size="lg">
          <Plus className="w-5 h-5" />
          Begin Assessment
        </Button>
      </div>

      {/* Current Status Card */}
      {latestAssessment && (
        <Card className={`${getSeverityBgColor(latestAssessment.severity)} border-none`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Pain Level</p>
                <p className={`text-2xl sm:text-3xl font-bold ${getSeverityColor(latestAssessment.severity)}`}>
                  {getSeverityLabel(latestAssessment.severity)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Score: {latestAssessment.total_score}/12 • {format(new Date(latestAssessment.created_at), 'PPp')}
                </p>
              </div>
              <div className={`p-3 rounded-full ${getSeverityBgColor(latestAssessment.severity)}`}>
                <AlertCircle className={`w-8 h-8 ${getSeverityColor(latestAssessment.severity)}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!latestAssessment && !loading && (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No assessments recorded yet</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
              Start First Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('history')}
          className="gap-1"
        >
          <ClipboardList className="w-4 h-4" />
          History
        </Button>
        <Button
          variant={activeTab === 'trends' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('trends')}
          className="gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Trends
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Assessments</CardTitle>
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
                      <span className="text-lg font-bold">{assessment.total_score}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                  <span className="font-medium text-destructive">14+</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && <PainAssessmentHistory assessments={assessments} loading={loading} />}

      {activeTab === 'trends' && <PainTrendChart assessments={assessments} />}

      {/* Footer Citation */}
      <div className="pt-6 mt-6 border-t border-border">
        <p className="text-xs text-muted-foreground italic text-center">
          {ABBEY_CITATION}
        </p>
      </div>
    </div>
  );
}
