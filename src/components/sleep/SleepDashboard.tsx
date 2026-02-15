/**
 * Sleep Chart Dashboard - Main tracking and monitoring view
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { useSleepEntries } from '@/hooks/useSleep';
import { isMissingPreviousNight } from '@/utils/sleepStatusCalculator';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { SleepStatusCard } from './SleepStatusCard';
import { SleepLogForm } from './SleepLogForm';
import { SleepHistory } from './SleepHistory';
import { SleepTrends } from './SleepTrends';
import { SleepConfigSettings } from './SleepConfigSettings';
import { SleepExportReports } from './SleepExportReports';
import {
  Plus, Settings, BarChart3, Clock, AlertCircle, FileDown, Moon, AlertTriangle,
} from 'lucide-react';

interface SleepDashboardProps {
  clientId?: string;
}

export function SleepDashboard({ clientId }: SleepDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  const { entries } = useSleepEntries(clientId, 50);
  const missingNight = isMissingPreviousNight(entries);

  if (showExport) {
    return <SleepExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Sleep Chart</h2>
          <p className="text-muted-foreground">Track sleep patterns and quality</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowLogForm(true)} disabled={isMonitoringPaused}>
            <Plus className="h-4 w-4 mr-2" />
            Log Sleep
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
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Sleep monitoring supports care planning only.
              If sleep disruption persists or there are behavioural or health concerns,
              consult a GP or health professional.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Missing Night Banner */}
      {missingNight && !isMonitoringPaused && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Last night's sleep has not been logged</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please log the previous night's sleep to keep records accurate.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => setShowLogForm(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Log Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      <SleepStatusCard clientId={clientId} />

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
          <SleepHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <SleepTrends clientId={clientId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <SleepConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Log Form Dialog */}
      <SleepLogForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />
    </div>
  );
}
