/**
 * Epilepsy Dashboard - Main module entry
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EpilepsyStatusCard } from './EpilepsyStatusCard';
import { KnownSeizuresSummary } from './KnownSeizuresSummary';
import { SeizureLogForm } from './SeizureLogForm';
import { EpilepsyHistory } from './EpilepsyHistory';
import { EpilepsyTrends } from './EpilepsyTrends';
import { EpilepsyConfigSettings } from './EpilepsyConfigSettings';
import { EpilepsyExportReports } from './EpilepsyExportReports';
import { EmergencySeizurePanel } from './EmergencySeizurePanel';
import { useEpilepsyConfig } from '@/hooks/useEpilepsy';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { ModuleHeader, ModuleDisclaimer, ModuleTabs, ModuleCitation } from '@/components/module';
import { Plus, FileDown, AlertCircle, Info, Zap } from 'lucide-react';

interface EpilepsyDashboardProps {
  clientId?: string;
}

export function EpilepsyDashboard({ clientId }: EpilepsyDashboardProps) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const { config } = useEpilepsyConfig(clientId);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  if (showExport) {
    return <EpilepsyExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModuleHeader
        title="Epilepsy & Seizure Monitoring"
        subtitle="Record seizure events, detect patterns, and guide escalation"
        icon={<Zap className="h-6 w-6 text-primary" />}
        onExport={() => setShowExport(true)}
        primaryAction={{
          label: 'Log Seizure',
          onClick: () => setShowLogForm(true),
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      >
        <Button
          variant="destructive"
          onClick={() => setShowEmergencyPanel(!showEmergencyPanel)}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Emergency Action
        </Button>
      </ModuleHeader>

      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Known Seizure Patterns */}
      <KnownSeizuresSummary clientId={clientId} />

      {/* Clinical Info Panel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Accurate seizure monitoring and reporting helps neurologists and GPs identify patterns, 
              adjust medications safely, and improve treatment outcomes. Detailed records can directly 
              influence treatment outcomes and quality of life.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Safety Disclaimer */}
      <ModuleDisclaimer 
        message="This tool supports recording and pattern recognition. Always follow the person's Epilepsy Management Plan and seek medical advice if concerned."
      />

      {/* Emergency Panel */}
      {showEmergencyPanel && (
        <EmergencySeizurePanel 
          clientId={clientId} 
          onComplete={() => setShowEmergencyPanel(false)} 
        />
      )}

      {/* Status Card */}
      <EpilepsyStatusCard clientId={clientId} />

      {/* Tabs */}
      <ModuleTabs
        trackingContent={
          <div className="grid lg:grid-cols-1 gap-4">
            <EpilepsyHistory clientId={clientId} />
          </div>
        }
        trendsContent={<EpilepsyTrends clientId={clientId} />}
        settingsContent={<EpilepsyConfigSettings clientId={clientId} />}
      />

      {/* Citation */}
      <ModuleCitation
        title="Epilepsy & Seizure Classification"
        source="International League Against Epilepsy (ILAE)"
        citation="Fisher RS, et al. Operational classification of seizure types by the ILAE. Epilepsia, 2017;58(4):522–530."
      />

      {/* Log Form Dialog */}
      <SeizureLogForm
        clientId={clientId}
        open={showLogForm}
        onOpenChange={setShowLogForm}
      />
    </div>
  );
}
