/**
 * Enteral Nutrition Dashboard - Main module view
 */

import { useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, TrendingUp, Settings, Plus, Droplets, Pill, Apple, Timer, CheckCircle2 } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { useEnteralConfig, useEnteralFeedLogs, useEnteralMedicationLogs, useEnteralStomaChecks, useEnteralMedications } from '@/hooks/useEnteral';
import { calculateEnteralStatus } from '@/utils/enteralStatusCalculator';
import { tubeRequiresStomaCheck, TUBE_TYPES } from '@/types/enteral';
import { format } from 'date-fns';
import { EnteralFeedLogForm } from './EnteralFeedLogForm';
import { EnteralStomaCheckForm } from './EnteralStomaCheckForm';
import { EnteralMedicationLogForm } from './EnteralMedicationLogForm';
import { EnteralConfigSettings } from './EnteralConfigSettings';
import { EnteralHistory } from './EnteralHistory';
import { EnteralLevelInfographic } from './EnteralLevelInfographic';
import { EnteralFeedingSchedule, getScheduleTotals } from './EnteralFeedingSchedule';
import { EnteralNutritionTips } from './EnteralNutritionTips';

interface EnteralDashboardProps {
  clientId?: string;
}

export function EnteralDashboard({ clientId }: EnteralDashboardProps) {
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const [showFeedForm, setShowFeedForm] = useState(false);
  const [showStomaForm, setShowStomaForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  const { data: config } = useEnteralConfig(clientId);
  const { data: feedLogs = [] } = useEnteralFeedLogs(clientId);
  const { data: medLogs = [] } = useEnteralMedicationLogs(clientId);
  const { data: stomaChecks = [] } = useEnteralStomaChecks(clientId);
  const { data: medications = [] } = useEnteralMedications(clientId);

  const statusResult = useMemo(() => calculateEnteralStatus({
    config: config || null,
    feedLogs,
    stomaChecks,
    medLogs,
  }), [config, feedLogs, stomaChecks, medLogs]);

  const showStomaSection = config?.enable_stoma_checks && tubeRequiresStomaCheck(config?.tube_type as any);
  const showMedSection = config?.enable_medication_logging && medications.length > 0;

  const tubeLabel = TUBE_TYPES.find(t => t.value === config?.tube_type)?.label || config?.tube_type || 'Not configured';

  // Schedule-based targets
  const schedule = useMemo(() => {
    if (Array.isArray(config?.feeding_schedule) && config.feeding_schedule.length > 0) {
      return config.feeding_schedule;
    }
    return [];
  }, [config?.feeding_schedule]);

  const scheduleTotals = useMemo(() => getScheduleTotals(schedule), [schedule]);

  // Next feed due
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextFeedTime = useMemo(() => {
    if (!config?.feed_schedule_times?.length) return null;
    const upcoming = config.feed_schedule_times
      .map(t => new Date(`${todayStr}T${t}:00`))
      .filter(d => d > now)
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming[0] || null;
  }, [config?.feed_schedule_times, todayStr]);

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

      {/* Status Overview Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <StatusBadge status={statusResult.status} size="sm" />
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{statusResult.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Timer className="h-3 w-3" /> Next Feed
            </div>
            <div className="text-lg font-bold">
              {nextFeedTime ? format(nextFeedTime, 'HH:mm') : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusResult.feedsToday}/{statusResult.feedsScheduled} feeds today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Feed Volume
            </div>
            <div className="text-lg font-bold">{statusResult.todayFeedVolume}ml</div>
            <p className="text-xs text-muted-foreground">
              of {scheduleTotals.formulaTotal || config?.prescribed_volume_ml || '—'}ml prescribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Enteral Fluid</div>
            <div className="text-lg font-bold">{statusResult.todayTotalEnteral}ml</div>
            <p className="text-xs text-muted-foreground">
              Feed {statusResult.todayFeedVolume} + Flush {statusResult.todayFlushVolume} + Med {statusResult.todayMedFlushVolume}
            </p>
          </CardContent>
        </Card>
      </div>

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

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Flush Today</div>
            <div className="text-lg font-bold">{statusResult.todayFlushVolume}ml</div>
            <p className="text-xs text-muted-foreground">Feed flushes</p>
          </CardContent>
        </Card>

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
          {/* Read-only schedule viewer */}
          {schedule.length > 0 && (
            <EnteralFeedingSchedule schedule={schedule} readOnly />
          )}

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
