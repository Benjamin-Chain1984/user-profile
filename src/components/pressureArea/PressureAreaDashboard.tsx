/**
 * Pressure Area Prevention Dashboard
 * Module entry point with plan button, tracking, trends, settings
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { usePressureReliefPlan, usePressureReliefPlanAcknowledgements, usePressureReliefPlanStatus } from '@/hooks/usePressureReliefPlan';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { PressureAreaStatusCard } from './PressureAreaStatusCard';
import { PressureReliefPlanViewer } from './PressureReliefPlanViewer';
import { PressureReliefPlanEditor } from './PressureReliefPlanEditor';
import { PressureReliefLogForm } from './PressureReliefLogForm';
import { SkinCheckForm } from './SkinCheckForm';
import { PressureAreaHistory } from './PressureAreaHistory';
import { PressureAreaTrends } from './PressureAreaTrends';
import { PressureAreaConfigSettings } from './PressureAreaConfigSettings';
import { PressureAreaExportReports } from './PressureAreaExportReports';
import {
  Settings, BarChart3, Clock, AlertCircle, FileDown, RotateCcw,
  FileText, AlertTriangle, Eye,
} from 'lucide-react';

interface Props {
  clientId?: string;
}

export function PressureAreaDashboard({ clientId }: Props) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showSkinCheck, setShowSkinCheck] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPlanViewer, setShowPlanViewer] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  const { plan } = usePressureReliefPlan(clientId);
  const planStatus = usePressureReliefPlanStatus(plan);
  const { hasCurrentUserAcknowledged } = usePressureReliefPlanAcknowledgements(plan?.id, plan?.version);

  if (showExport) {
    return <PressureAreaExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  if (showPlanEditor) {
    return <PressureReliefPlanEditor clientId={clientId} onClose={() => setShowPlanEditor(false)} />;
  }

  if (showPlanViewer) {
    return (
      <PressureReliefPlanViewer
        clientId={clientId}
        onClose={() => setShowPlanViewer(false)}
        onEdit={isAdmin ? () => { setShowPlanViewer(false); setShowPlanEditor(true); } : undefined}
      />
    );
  }

  // Plan button status
  const planBadgeColor = !plan || plan.status === 'draft'
    ? 'text-muted-foreground'
    : plan.status === 'published' && hasCurrentUserAcknowledged
    ? 'text-green-600'
    : 'text-amber-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Pressure Area Prevention</h2>
          <p className="text-muted-foreground">Pressure relief scheduling, skin checks & compliance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="outline" onClick={() => setShowSkinCheck(true)} disabled={isMonitoringPaused}>
            <Eye className="h-4 w-4 mr-2" /> Skin Check
          </Button>
          <Button onClick={() => setShowLogForm(true)} disabled={isMonitoringPaused}>
            <RotateCcw className="h-4 w-4 mr-2" /> Log Pressure Relief
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

      {/* Disclaimer */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <strong>Important:</strong> Pressure relief and skin checks support prevention and early identification.
              If concerns are identified, seek advice from a nurse, GP, or health professional.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Button */}
      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setShowPlanViewer(true)}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className={`h-6 w-6 ${planBadgeColor}`} />
              <div>
                <p className="font-semibold">Digital Pressure Area Relief Plan</p>
                <p className="text-sm text-muted-foreground">View the prescribed repositioning / pressure relief schedule</p>
              </div>
            </div>
            <div>
              {!plan || plan.status === 'draft' ? (
                <span className="text-sm text-muted-foreground">Not published</span>
              ) : hasCurrentUserAcknowledged ? (
                <span className="text-sm text-green-600">✓ Acknowledged</span>
              ) : (
                <span className="text-sm text-amber-600">⚠ Acknowledge required</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <PressureAreaStatusCard clientId={clientId} />

      {/* Tabs */}
      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="tracking" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
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
          <PressureAreaHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <PressureAreaTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <PressureAreaConfigSettings clientId={clientId} />
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

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>Pressure relief and skin checks support prevention and early identification. If concerns are identified, seek advice from a nurse, GP, or health professional.</p>
      </div>

      {/* Dialogs */}
      <PressureReliefLogForm clientId={clientId} open={showLogForm} onOpenChange={setShowLogForm} />
      <SkinCheckForm clientId={clientId} open={showSkinCheck} onOpenChange={setShowSkinCheck} />
    </div>
  );
}
