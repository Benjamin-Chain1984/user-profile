/**
 * Urinary Catheter Management Dashboard - Main module view
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileDown, Plus, Droplets, Package, Clock, TrendingUp, Settings, FileText, AlertCircle } from 'lucide-react';
import { CatheterStatusCard } from './CatheterStatusCard';
import { CatheterTrafficLightCard } from './CatheterTrafficLightCard';
import { CatheterHistory } from './CatheterHistory';
import { CatheterTrends } from './CatheterTrends';
import { CatheterConfigSettings } from './CatheterConfigSettings';
import { CatheterExportReports } from './CatheterExportReports';
import { CatheterChangeForm } from './CatheterChangeForm';
import { FlushLogForm } from './FlushLogForm';
import { StomaCheckForm } from './StomaCheckForm';
import { BagChangeForm } from './BagChangeForm';
import { AutonomicDysreflexiaPanel } from './AutonomicDysreflexiaPanel';
import { CatheterCarePlanViewer } from './CatheterCarePlanViewer';
import { CatheterCarePlanEditor } from './CatheterCarePlanEditor';
import { UrineColourChart } from './UrineColourChart';
import { useCatheterCarePlan, useCatheterCarePlanAcknowledgements, useCatheterCarePlanStatus } from '@/hooks/useCatheterCarePlan';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { CATHETER_TYPE_CONFIG, normalizeCatheterType } from '@/types/catheter';

interface CatheterDashboardProps {
  clientId?: string;
}

export function CatheterDashboard({ clientId }: CatheterDashboardProps) {
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showFlushForm, setShowFlushForm] = useState(false);
  const [showStomaForm, setShowStomaForm] = useState(false);
  const [showBagForm, setShowBagForm] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const { plan } = useCatheterCarePlan(clientId);

  const planCatheterType = normalizeCatheterType(plan?.catheter_type);
  const typeConfig = planCatheterType ? CATHETER_TYPE_CONFIG[planCatheterType] : null;


  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Urinary Catheter Management</h1>
          <p className="text-muted-foreground">Track catheter care, flushes, and bag changes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
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

      {/* Clinical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Clinical Guidance Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          Catheter type selection, change schedules, and flush protocols should be determined 
          by a qualified health professional. Always follow prescribed care plans.
        </AlertDescription>
      </Alert>

      {/* Traffic Light Status */}
      <CatheterTrafficLightCard clientId={clientId} />

      {/* Status Tiles */}
      <CatheterStatusCard
        clientId={clientId}
        onLogChange={() => setShowChangeForm(true)}
        onLogFlush={plan?.flush_prescribed ? () => setShowFlushForm(true) : undefined}
        onLogBagChange={plan?.leg_bag_change_frequency || plan?.night_bag_change_frequency ? () => setShowBagForm(true) : undefined}
        onLogStomaCheck={typeConfig?.enableStomaChecks ? () => setShowStomaForm(true) : undefined}
      />


      {/* Main Tabs */}
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
          <CatheterHistory clientId={clientId} />
          <UrineColourChart />
        </TabsContent>

        <TabsContent value="trends">
          <CatheterTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <CatheterConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>




      {/* Forms */}
      <CatheterChangeForm
        clientId={clientId}
        open={showChangeForm}
        onOpenChange={setShowChangeForm}
      />

      <FlushLogForm
        clientId={clientId}
        open={showFlushForm}
        onOpenChange={setShowFlushForm}
      />

      <StomaCheckForm
        clientId={clientId}
        open={showStomaForm}
        onOpenChange={setShowStomaForm}
      />

      <BagChangeForm
        clientId={clientId}
        open={showBagForm}
        onOpenChange={setShowBagForm}
      />

      <CatheterExportReports
        clientId={clientId}
        open={showExport}
        onOpenChange={setShowExport}
      />

      {/* Clinical Citation */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        Catheter care protocols based on NHS England Best Practice Guidelines and ANZUNS recommendations.
      </p>
    </div>
  );
}
