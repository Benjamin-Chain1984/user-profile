/**
 * Enteral Nutrition Dashboard - Main module view
 */

import { useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, TrendingUp, Settings, Plus, Droplets, Pill, CheckCircle2, Armchair, Waves, Activity } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { useEnteralConfig, useEnteralFeedLogs, useEnteralMedicationLogs, useEnteralStomaChecks, useEnteralMedications, useEnteralFlushLogs } from '@/hooks/useEnteral';
import { calculateEnteralStatus } from '@/utils/enteralStatusCalculator';
import { tubeRequiresStomaCheck, TUBE_TYPES, calculateEnteralStomaStatus } from '@/types/enteral';
import type { EnteralStomaFinding, EnteralStomaPainLevel } from '@/types/enteral';
import { differenceInHours, parseISO } from 'date-fns';

import { EnteralTrafficLightCard } from './EnteralTrafficLightCard';
import { EnteralFeedLogForm } from './EnteralFeedLogForm';
import { EnteralStomaCheckForm } from './EnteralStomaCheckForm';
import { EnteralMedicationLogForm } from './EnteralMedicationLogForm';
import { EnteralFlushLogForm } from './EnteralFlushLogForm';
import { EnteralConfigSettings } from './EnteralConfigSettings';
import { EnteralHistory } from './EnteralHistory';
import { EnteralLevelInfographic } from './EnteralLevelInfographic';
import { EnteralFeedingSchedule, getScheduleTotals, migrateScheduleFormat } from './EnteralFeedingSchedule';
import { EnteralNutritionTips } from './EnteralNutritionTips';
import { EnteralDailySchedule } from './EnteralDailySchedule';
import { PositioningCheckPanel } from '@/components/iddsi/PositioningCheckPanel';

interface EnteralDashboardProps {
  clientId?: string;
}

export function EnteralDashboard({ clientId }: EnteralDashboardProps) {
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showFlushForm, setShowFlushForm] = useState(false);
  const [showStomaForm, setShowStomaForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showPositioning, setShowPositioning] = useState(false);

  const { data: config } = useEnteralConfig(clientId);
  const { data: feedLogs = [] } = useEnteralFeedLogs(clientId);
  const { data: medLogs = [] } = useEnteralMedicationLogs(clientId);
  const { data: stomaChecks = [] } = useEnteralStomaChecks(clientId);
  const { data: medications = [] } = useEnteralMedications(clientId);
  const { data: flushLogs = [] } = useEnteralFlushLogs(clientId);

  const statusResult = useMemo(() => calculateEnteralStatus({
    config: config || null,
    feedLogs,
    flushLogs,
    stomaChecks,
    medLogs,
  }), [config, feedLogs, flushLogs, stomaChecks, medLogs]);
  

  const showStomaSection = config?.enable_stoma_checks && tubeRequiresStomaCheck(config?.tube_type as any);
  const showMedSection = config?.enable_medication_logging && medications.length > 0;

  const tubeLabel = TUBE_TYPES.find(t => t.value === config?.tube_type)?.label || config?.tube_type || 'Not configured';

  // Schedule-based targets
  const schedule = useMemo(() => {
    if (Array.isArray(config?.feeding_schedule) && config.feeding_schedule.length > 0) {
      return migrateScheduleFormat(config.feeding_schedule as any[]);
    }
    return [];
  }, [config?.feeding_schedule]);

  const scheduleTotals = useMemo(() => getScheduleTotals(schedule), [schedule]);

  const graceMinutes = config?.grace_window_mins || 60;

  // Sub-views
  if (showPositioning) {
    return <PositioningCheckPanel clientId={clientId} onClose={() => setShowPositioning(false)} />;
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enteral Nutrition</h1>
          <p className="text-muted-foreground">Tube feeding management and tracking</p>
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

      {/* Nil-by-mouth banner */}
      {config?.nil_by_mouth && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive font-bold">Nil-by-Mouth</AlertTitle>
          <AlertDescription className="text-destructive/90">
            Do not provide oral intake unless specified in plan.
          </AlertDescription>
        </Alert>
      )}

      {/* Clinical Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          <strong>Important:</strong> Follow the person's Enteral Nutrition and Medication Plan. Seek medical advice if concerns arise.
        </AlertDescription>
      </Alert>

      {/* Traffic Light Status Card */}
      <EnteralTrafficLightCard clientId={clientId} />

      {/* Daily Feeding Schedule */}
      {schedule.length > 0 && (
        <EnteralDailySchedule
          schedule={schedule}
          feedLogs={feedLogs}
          flushLogs={flushLogs}
          graceMinutes={graceMinutes}
        />
      )}

      {/* Infographics - Formula & Flush Level */}
      <div className="grid grid-cols-2 gap-4">
        <EnteralLevelInfographic
          type="formula"
          currentMl={statusResult.todayFeedVolume}
          targetMl={scheduleTotals.formulaTotal || config?.prescribed_volume_ml || 1250}
        />
        <EnteralLevelInfographic
          type="flush"
          currentMl={statusResult.todayFlushVolume + statusResult.todayMedFlushVolume}
          targetMl={scheduleTotals.flushTotal || 500}
        />
      </div>

      {/* Secondary tiles row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Tube Change</div>
            {statusResult.tubeChangeDays !== null ? (
              <>
                <div className={`text-lg font-bold ${statusResult.tubeChangeOverdue ? 'text-destructive' : statusResult.tubeChangeDays <= 7 ? 'text-warning' : ''}`}>
                  {statusResult.tubeChangeOverdue ? `${Math.abs(statusResult.tubeChangeDays)}d overdue` : `${statusResult.tubeChangeDays}d`}
                </div>
                <p className="text-xs text-muted-foreground">{tubeLabel}</p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Not configured</div>
            )}
          </CardContent>
        </Card>

        {showStomaSection && (() => {
          const lastStoma = stomaChecks.length > 0 ? stomaChecks[0] : null;
          const hoursSince = lastStoma ? differenceInHours(new Date(), parseISO(lastStoma.event_occurred_at)) : null;
          const stomaStatus = lastStoma
            ? calculateEnteralStomaStatus(lastStoma.findings as EnteralStomaFinding[], lastStoma.pain_level as EnteralStomaPainLevel, hoursSince)
            : 'green';
          const statusLabel = stomaStatus === 'red' ? 'Action Required' : stomaStatus === 'amber' ? 'Monitor' : 'IDEAL';
          const statusMessage = lastStoma
            ? (lastStoma.findings as string[])?.filter(f => f !== 'clean_and_dry').length > 0
              ? `Findings: ${(lastStoma.findings as string[]).filter(f => f !== 'clean_and_dry').join(', ').replace(/_/g, ' ')}`
              : 'No concerns noted'
            : 'No checks logged';
          const hoursAgo = hoursSince !== null
            ? hoursSince < 1 ? 'Just now'
            : hoursSince < 24 ? `${Math.round(hoursSince)}h ago`
            : `${Math.round(hoursSince / 24)}d ago`
            : null;

          return (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    Daily Stoma Check
                  </div>
                  <StatusBadge status={stomaStatus === 'red' ? 'action' : stomaStatus === 'amber' ? 'monitor' : 'stable'} size="sm" />
                </div>
                <div className={`text-lg font-bold ${
                  stomaStatus === 'red' ? 'text-destructive' :
                  stomaStatus === 'amber' ? 'text-warning' : ''
                }`}>
                  {statusLabel}
                </div>
                <p className="text-xs text-muted-foreground">{statusMessage}</p>
                {hoursAgo && (
                  <p className="text-xs text-muted-foreground">Last checked: {hoursAgo}</p>
                )}
                <Button onClick={() => setShowStomaForm(true)} size="sm" className="w-full gap-2 mt-1" variant="outline">
                  <Activity className="h-3.5 w-3.5" />
                  Log Stoma Check
                </Button>
              </CardContent>
            </Card>
          );
        })()}

        {!showStomaSection && (
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Flush / Hydration</div>
              <div className="text-lg font-bold">{statusResult.todayFlushVolume}ml</div>
              <p className="text-xs text-muted-foreground">Feed flushes</p>
            </CardContent>
          </Card>
        )}

        {showMedSection && (
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Pill className="h-3 w-3" /> Med Flush
              </div>
              <div className="text-lg font-bold">{statusResult.todayMedFlushVolume}ml</div>
              <p className="text-xs text-muted-foreground">Medication flushes</p>
            </CardContent>
          </Card>
        )}

        {statusResult.missedFeeds > 0 && (
          <Card className={statusResult.status === 'action' ? 'border-destructive/50' : 'border-warning/50'}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Missed Feeds</div>
              <div className={`text-lg font-bold ${statusResult.status === 'action' ? 'text-destructive' : 'text-warning'}`}>
                {statusResult.missedFeeds}
              </div>
              <p className="text-xs text-muted-foreground">within grace window</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowFeedForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Log Feed
        </Button>
        <Button variant="outline" onClick={() => setShowFlushForm(true)} className="gap-2">
          <Waves className="h-4 w-4" /> Log Flush
        </Button>
        <Button variant="outline" onClick={() => setShowPositioning(true)} className="gap-2">
          <Armchair className="h-4 w-4" /> Check Position
        </Button>
        {showMedSection && (
          <Button variant="outline" onClick={() => setShowMedForm(true)} className="gap-2">
            <Pill className="h-4 w-4" /> Log Medication
          </Button>
        )}
        {showStomaSection && (
          <Button variant="outline" onClick={() => setShowStomaForm(true)} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Stoma Check
          </Button>
        )}
      </div>

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
          <EnteralHistory clientId={clientId} />

          {/* Tips section */}
          <EnteralNutritionTips />
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Feed volume trends will appear after multiple entries.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <EnteralConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Forms */}
      <EnteralFeedLogForm
        clientId={clientId}
        config={config || undefined}
        open={showFeedForm}
        onOpenChange={setShowFeedForm}
      />

      {showStomaSection && (
        <EnteralStomaCheckForm
          clientId={clientId}
          open={showStomaForm}
          onOpenChange={setShowStomaForm}
        />
      )}

      <EnteralFlushLogForm
        clientId={clientId}
        config={config || undefined}
        open={showFlushForm}
        onOpenChange={setShowFlushForm}
      />

      {showMedSection && (
        <EnteralMedicationLogForm
          clientId={clientId}
          config={config || undefined}
          medications={medications}
          open={showMedForm}
          onOpenChange={setShowMedForm}
        />
      )}

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        Follow the person's Enteral Nutrition and Medication Plan. Seek medical advice if concerns arise.
      </p>
    </div>
  );
}
