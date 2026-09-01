/**
 * Bowel Care Dashboard - Main tracking and monitoring view
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BowelCareStatusCard } from './BowelCareStatusCard';
import { BowelLogForm } from './BowelLogForm';
import { BowelCareHistory } from './BowelCareHistory';
import { BowelCareTrends } from './BowelCareTrends';
import { PrnWorkflowCard } from './PrnWorkflowCard';
import { BowelCareConfigSettings } from './BowelCareConfigSettings';
import { BowelCareExportReports } from './BowelCareExportReports';
import { useBowelCareStatus } from '@/hooks/useBowelCare';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Clock, 
  AlertCircle,
  Activity,
  FileDown
} from 'lucide-react';

interface BowelCareDashboardProps {
  clientId?: string;
}

const SYMPTOMS_LIST = [
  'Bloated or enlarged stomach',
  'Signs of pain',
  'Abdominal pain or discomfort',
  'Vomiting',
  'Changes in usual bowel pattern',
  'Signs of distress during toileting',
  'You have concerns'
];

const BOWEL_CARE_TIPS = [
  'Encourage regular fluid intake and hydration',
  'Include high-fibre foods where appropriate',
  'Support regular movement and activity',
  'Maintain consistent toileting routines',
  'Consult a dietitian or health professional if concerns persist'
];

export function BowelCareDashboard({ clientId }: BowelCareDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const statusInfo = useBowelCareStatus(clientId);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  // Show export view
  if (showExport) {
    return <BowelCareExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bowel Care</h2>
          <p className="text-muted-foreground">
            Track bowel movements and manage PRN laxatives
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowLogForm(true)} disabled={isMonitoringPaused}>
            <Plus className="h-4 w-4 mr-2" />
            Log Bowel Entry
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
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> The Bristol Stool Chart is a screening and monitoring tool only. 
              Stool type thresholds, interventions, and escalation pathways should be determined by a GP or qualified health professional.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <BowelCareStatusCard clientId={clientId} />

      {/* Tabs - PRN tab removed, accessed via settings only */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tracking" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="competency" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Competency</span>
            {(overdueCount > 0 || expiringSoonCount > 0) && (
              <Badge variant={overdueCount > 0 ? 'destructive' : 'secondary'} className="ml-1 h-5 px-1.5 text-xs">
                {overdueCount + expiringSoonCount}
              </Badge>
            )}
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
            <BowelCareHistory clientId={clientId} />
            <PrnWorkflowCard clientId={clientId} />
          </div>

          {/* Symptoms to Be Aware Of */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Symptoms to Be Aware Of and Seek Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-2">
                {SYMPTOMS_LIST.map((symptom, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="text-sm text-muted-foreground">{symptom}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Good Bowel Care Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Good Bowel Care Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {BOWEL_CARE_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <BowelCareTrends clientId={clientId} />
        </TabsContent>

        <TabsContent value="competency" className="space-y-6">
          <CompetencyStatusPanel
            clientId={clientId}
            onStartCheck={() => setShowCompetencyCheck(true)}
          />
          <CompetencyTrendsView clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-6">
            <BowelCareConfigSettings clientId={clientId} />
            <CompetencyConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Plan Status Banners */}
      {plan?.status === 'published' && !hasCurrentUserAcknowledged && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-800">Plan acknowledgement required</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowPlanViewer(true)}>
                View & Acknowledge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {planStatus.reviewStatus === 'review_overdue' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{planStatus.reviewMessage}</p>
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowPlanEditor(true)}>Review Now</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {planStatus.reviewStatus === 'review_due_soon' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800">{planStatus.reviewMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bristol Stool Chart Citation */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p className="font-medium">Bristol Stool Chart</p>
        <p>Developed by Heaton KW & Lewis SJ, University of Bristol.</p>
        <p className="italic">
          Lewis SJ, Heaton KW. Stool Form Scale as a Useful Guide to Intestinal Transit Time. 
          Scandinavian Journal of Gastroenterology, 1997;32(9):920–924.
        </p>
      </div>

      {/* Dialogs */}
      <BowelLogForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />
    </div>
  );
}
