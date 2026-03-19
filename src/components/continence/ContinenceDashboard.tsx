/**
 * Continence Management Dashboard - Main module view
 */

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileDown, Clock, TrendingUp, Settings } from 'lucide-react';
import { ContinenceStatusCard } from './ContinenceStatusCard';
import { ContinenceStatusTiles } from './ContinenceStatusTiles';
import { ContinenceHistory } from './ContinenceHistory';
import { ContinenceTrends } from './ContinenceTrends';
import { ContinenceConfigSettings } from './ContinenceConfigSettings';
import { ContinenceExportReports } from './ContinenceExportReports';
import { PadChangeForm } from './PadChangeForm';
import { SkinCheckForm } from './SkinCheckForm';
import { ConsumablesCheckForm } from './ConsumablesCheckForm';
import { UTITestForm } from './UTITestForm';
import { useContinenceConfig } from '@/hooks/useContinence';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';

interface ContinenceDashboardProps {
  clientId?: string;
}

export function ContinenceDashboard({ clientId }: ContinenceDashboardProps) {
  const { config } = useContinenceConfig(clientId);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  
  const [showPadChangeForm, setShowPadChangeForm] = useState(false);
  const [showSkinCheckForm, setShowSkinCheckForm] = useState(false);
  const [showConsumablesForm, setShowConsumablesForm] = useState(false);
  const [showUTIForm, setShowUTIForm] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handlePadChangeComplete = () => {
    setShowSkinCheckForm(true);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Continence Management</h1>
          <p className="text-muted-foreground">Monitor pad changes, skin integrity, and supplies</p>
        </div>
        <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
          <FileDown className="h-4 w-4" />
          Export
        </Button>
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
          Continence care schedules, skin treatment protocols, and escalation pathways should be 
          determined by a qualified health professional.
        </AlertDescription>
      </Alert>

      {/* Traffic Light Status Card */}
      <ContinenceStatusCard
        clientId={clientId}
        onLogPadChange={() => setShowPadChangeForm(true)}
      />

      {/* Status Tiles — 4 individual tiles */}
      <ContinenceStatusTiles
        clientId={clientId}
        onLogPadChange={() => setShowPadChangeForm(true)}
        onLogSkinCheck={() => setShowSkinCheckForm(true)}
        onLogConsumables={() => setShowConsumablesForm(true)}
        onLogUTI={() => setShowUTIForm(true)}
        disabled={isMonitoringPaused}
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

        <TabsContent value="tracking">
          <ContinenceHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <ContinenceTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <ContinenceConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Forms */}
      <PadChangeForm
        clientId={clientId}
        open={showPadChangeForm}
        onOpenChange={setShowPadChangeForm}
        onComplete={handlePadChangeComplete}
        promptSkinCheck={() => setShowSkinCheckForm(true)}
      />

      <SkinCheckForm
        clientId={clientId}
        open={showSkinCheckForm}
        onOpenChange={setShowSkinCheckForm}
      />

      <ConsumablesCheckForm
        clientId={clientId}
        open={showConsumablesForm}
        onOpenChange={setShowConsumablesForm}
      />

      <UTITestForm
        clientId={clientId}
        open={showUTIForm}
        onOpenChange={setShowUTIForm}
      />

      <ContinenceExportReports
        clientId={clientId}
        open={showExport}
        onOpenChange={setShowExport}
      />
    </div>
  );
}