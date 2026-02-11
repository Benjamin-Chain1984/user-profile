/**
 * Oral Health Dashboard - Main module view
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { useOralHealthConfig } from '@/hooks/useOralHealth';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { OralHealthStatusCard } from './OralHealthStatusCard';
import { OralHealthPlanView } from './OralHealthPlanView';
import { OralHealthTaskLogging } from './OralHealthTaskLogging';
import { OralHealthAssessmentForm } from './OralHealthAssessmentForm';
import { OralHealthHistory } from './OralHealthHistory';
import { OralHealthTrends } from './OralHealthTrends';
import { OralHealthConfigSettings } from './OralHealthConfigSettings';
import { OralHealthExportReports } from './OralHealthExportReports';
import {
  Plus, Settings, BarChart3, Clock, AlertCircle, FileDown, Smile, ClipboardCheck,
} from 'lucide-react';

interface OralHealthDashboardProps {
  clientId?: string;
}

export function OralHealthDashboard({ clientId }: OralHealthDashboardProps) {
  const [showAssessment, setShowAssessment] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  const { config } = useOralHealthConfig(clientId);

  if (showExport) {
    return <OralHealthExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Oral Health Care</h2>
          <p className="text-muted-foreground">Care plan, screening & compliance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAssessment(true)} disabled={isMonitoringPaused}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Oral Health Assessment
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
              <strong>Important:</strong> This module supports preventive oral health planning and screening.
              If concerns are identified, escalate to a dentist or health practitioner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <OralHealthStatusCard clientId={clientId} />

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
          {/* Care Plan - always visible */}
          <OralHealthPlanView clientId={clientId} />

          {/* Compliance Logging - only if enabled */}
          {config?.enable_compliance_monitoring && (
            <OralHealthTaskLogging clientId={clientId} />
          )}

          {/* Assessment History */}
          <OralHealthHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <OralHealthTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <OralHealthConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Footer Safety Language */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p>This module supports preventive oral health planning and screening. If concerns are identified, escalate to a dentist or health practitioner.</p>
        <p className="font-medium mt-2">Clinical Reference</p>
        <p className="italic">
          Pradhan, A. (2013). Oral health impact on quality of life among adults with disabilities: Carer perceptions. 
          Australian Dental Journal, 58(4), 526–530. https://doi.org/10.1111/adj.12124. Used with permission.
        </p>
      </div>

      {/* Assessment Dialog */}
      <OralHealthAssessmentForm
        clientId={clientId}
        open={showAssessment}
        onOpenChange={setShowAssessment}
      />
    </div>
  );
}
