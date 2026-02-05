import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Droplets, FileText, Settings, TrendingUp, Clock } from 'lucide-react';
import { useFluidBalance } from '@/hooks/useFluidBalance';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { FluidStatusCard } from './FluidStatusCard';
import { HydrationInfographic } from './HydrationInfographic';
import { IntakeLogForm } from './IntakeLogForm';
import { OutputLogForm } from './OutputLogForm';
import { FluidHistory } from './FluidHistory';
import { FluidTrends } from './FluidTrends';
import { SignsAndSymptomsPanel } from './SignsAndSymptomsPanel';
import { FluidConfigSettings } from './FluidConfigSettings';
import { FluidExportReports } from './FluidExportReports';
import { Skeleton } from '@/components/ui/skeleton';

interface FluidDashboardProps {
  clientId?: string;
}

export const FluidDashboard: React.FC<FluidDashboardProps> = ({ clientId }) => {
  const {
    config,
    intakeEntries,
    outputEntries,
    symptomChecks,
    alerts,
    currentStatus,
    statusMessage,
    statusLabel,
    percentOfTarget,
    todayIntake,
    todayOutput,
    todayBalance,
    isLoading,
    error,
    saveConfig,
    logIntake,
    logOutput,
    logSymptomCheck
  } = useFluidBalance(clientId);
  
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();
  
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const targetOrCap = config?.fluid_restriction_enabled && config?.max_fluid_allowance_ml
    ? config.max_fluid_allowance_ml
    : config?.target_daily_intake_ml || 2000;
  
  return (
    <div className="space-y-6">
      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Clinical Disclaimer */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Clinical Guidance</AlertTitle>
        <AlertDescription className="text-amber-700">
          This information supports monitoring only. Follow the person's health plan. 
          Targets and thresholds should be set by a clinician, dietitian, or GP.
        </AlertDescription>
      </Alert>
      
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert 
              key={alert.id} 
              variant={alert.severity === 'red' ? 'destructive' : 'default'}
              className={alert.severity === 'amber' ? 'border-amber-200 bg-amber-50' : ''}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
          <RoleTabsTrigger 
            value="settings" 
            requiresAdmin 
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
          />
        </TabsList>
        
        <TabsContent value="tracking" className="space-y-6">
          {/* Status overview */}
          <div className="grid md:grid-cols-2 gap-6">
            <FluidStatusCard
              status={currentStatus}
              statusMessage={statusMessage}
              statusLabel={statusLabel}
              todayIntake={todayIntake}
              todayOutput={todayOutput}
              todayBalance={todayBalance}
              percentOfTarget={percentOfTarget}
              targetOrCap={targetOrCap}
              enableOutputLogging={config?.enable_output_logging ?? true}
              isRestricted={config?.fluid_restriction_enabled ?? false}
            />
            <HydrationInfographic
              percentOfTarget={percentOfTarget}
              isRestricted={config?.fluid_restriction_enabled ?? false}
              targetOrCap={targetOrCap}
              todayIntake={todayIntake}
            />
          </div>
          
          {/* Logging forms */}
          <div className={`grid gap-6 ${config?.enable_output_logging ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl'}`}>
            <IntakeLogForm
              onSubmit={logIntake}
              isRestricted={config?.fluid_restriction_enabled}
              currentTotal={todayIntake}
              maxAllowance={config?.max_fluid_allowance_ml}
            />
            {config?.enable_output_logging && (
              <OutputLogForm onSubmit={logOutput} />
            )}
          </div>
          
            {/* Signs and Symptoms - informational only */}
            <SignsAndSymptomsPanel />
            
            {/* History */}
            <FluidHistory
            intakeEntries={intakeEntries}
            outputEntries={outputEntries}
            enableOutputLogging={config?.enable_output_logging ?? true}
          />
        </TabsContent>
        
        <TabsContent value="trends">
          <FluidTrends
            intakeEntries={intakeEntries}
            outputEntries={outputEntries}
            config={config}
          />
        </TabsContent>
        
        <TabsContent value="export">
          <FluidExportReports
            config={config}
            intakeEntries={intakeEntries}
            outputEntries={outputEntries}
            alerts={alerts}
          />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="settings">
            <FluidConfigSettings config={config} onSave={saveConfig} clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>
      
      {/* Clinical Citations */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p><strong>References:</strong></p>
        <p>• European Hydration Institute. (2024). Daily fluid intake recommendations.</p>
        <p>• National Institute for Health and Care Excellence. (2017). Intravenous fluid therapy in adults in hospital. CG174.</p>
        <p>• Armstrong, L.E. (2012). Challenges of linking chronic dehydration and fluid consumption to health outcomes. Nutrition Reviews.</p>
      </div>
    </div>
  );
};
