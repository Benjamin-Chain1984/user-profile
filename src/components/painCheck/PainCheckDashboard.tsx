import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePainAssessments } from '@/hooks/usePainAssessments';
import { PainAssessmentForm } from './PainAssessmentForm';
import { PainAssessmentHistory } from './PainAssessmentHistory';
import { PainTrendChart } from './PainTrendChart';
import { getSeverityLabel, getSeverityColor, getSeverityBgColor } from '@/types/painAssessment';
import { Plus, TrendingUp, ClipboardList, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Assessment
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
                <div className="flex justify-between items-center p-2 bg-success/10 rounded">
                  <span>No Pain</span>
                  <span className="font-medium text-success">0-2</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-warning/10 rounded">
                  <span>Mild</span>
                  <span className="font-medium text-warning">3-7</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                  <span>Moderate</span>
                  <span className="font-medium text-orange-500">8-13</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-destructive/10 rounded">
                  <span>Severe</span>
                  <span className="font-medium text-destructive">14+</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && <PainAssessmentHistory assessments={assessments} loading={loading} />}

      {activeTab === 'trends' && <PainTrendChart assessments={assessments} />}
    </div>
  );
}
