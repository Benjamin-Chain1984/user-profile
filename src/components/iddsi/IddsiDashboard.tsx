/**
 * IDDSI & Safe Swallowing Dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIddsiConfig, useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { formatDistanceToNow, addDays, addHours, addWeeks, addMonths, differenceInSeconds, isPast } from 'date-fns';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { IddsiLevelDisplay } from './IddsiLevelDisplay';
import { MealtimeObservationForm } from './MealtimeObservationForm';
import { PositioningCheckPanel } from './PositioningCheckPanel';
import { SafeSwallowingStrategies } from './SafeSwallowingStrategies';

import { IddsiHistory } from './IddsiHistory';
import { IddsiConfigSettings } from './IddsiConfigSettings';
import {
  AlertCircle, Settings, Clock, BarChart3,
  Eye, Armchair, Brain, AlertTriangle, Plus,
} from 'lucide-react';

interface IddsiDashboardProps {
  clientId?: string;
}

export function IddsiDashboard({ clientId }: IddsiDashboardProps) {
  const { config, loading: configLoading } = useIddsiConfig(clientId);
  const { observations } = useMealtimeObservations(clientId);
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const [showLevelDisplay, setShowLevelDisplay] = useState(false);
  const [showPositioning, setShowPositioning] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showObservation, setShowObservation] = useState(false);

  // Latest observation for status indicator
  const lastObs = observations.length > 0 ? observations[0] : null;
  const lastSeverity = lastObs?.severity || 'green';

  // Calculate next observation due time based on frequency
  const nextDueAt = useMemo(() => {
    if (!lastObs || !config?.enableObservations) return null;
    const lastTime = new Date(lastObs.eventOccurredAt || lastObs.createdAt);
    const freq = config.observationFrequency;
    if (freq === 'daily') return addDays(lastTime, 1);
    if (freq === 'weekly') return addWeeks(lastTime, 1);
    if (freq === 'monthly') return addMonths(lastTime, 1);
    return addDays(lastTime, 1);
  }, [lastObs, config?.enableObservations, config?.observationFrequency]);

  // Live countdown state
  const [countdown, setCountdown] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!nextDueAt) { setCountdown(''); setIsOverdue(false); return; }

    const tick = () => {
      const now = new Date();
      if (isPast(nextDueAt)) {
        setIsOverdue(true);
        const overdueSecs = differenceInSeconds(now, nextDueAt);
        const h = Math.floor(overdueSecs / 3600);
        const m = Math.floor((overdueSecs % 3600) / 60);
        setCountdown(h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`);
      } else {
        setIsOverdue(false);
        const secs = differenceInSeconds(nextDueAt, now);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setCountdown(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDueAt]);

  if (showLevelDisplay) {
    return <IddsiLevelDisplay clientId={clientId} onClose={() => setShowLevelDisplay(false)} />;
  }

  if (showPositioning) {
    return <PositioningCheckPanel clientId={clientId} onClose={() => setShowPositioning(false)} />;
  }

  if (showStrategies) {
    return <SafeSwallowingStrategies onClose={() => setShowStrategies(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h2 className="text-2xl font-bold">IDDSI & Safe Swallowing</h2>
          <p className="text-muted-foreground">
            Food and fluid texture management & swallowing monitoring
          </p>
        </div>

      {/* Monitoring Paused Banner */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Safety Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Food and fluid levels must be prescribed by a qualified
              Speech Pathologist or medical professional. This tool supports safe implementation only.
              If you are concerned about swallowing safety, escalate immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Level Summary */}
      {config && (config.foodLevel !== null || config.drinkLevel !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.foodLevel !== null && (
            <Card>
              <CardContent className="py-6 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Prescribed Food Level</p>
                <img
                  src={config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew'
                    ? '/food-level-7etc.png'
                    : `/food-level-${config.foodLevel}.png`}
                  alt={`Food Level ${config.foodLevel}`}
                  className="h-44 w-44 object-contain"
                />
                <p className="font-semibold text-lg text-foreground">
                  Level {config.foodLevel}
                  {config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew' && ' – Easy to Chew'}
                </p>
              </CardContent>
            </Card>
          )}
          {config.drinkLevel !== null && (
            <Card>
              <CardContent className="py-6 flex flex-col items-center gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Prescribed Drink Level</p>
                <img
                  src={`/drink-level-${config.drinkLevel}.png`}
                  alt={`Drink Level ${config.drinkLevel}`}
                  className="h-44 w-44 object-contain"
                />
                <p className="font-semibold text-lg text-foreground">
                  Level {config.drinkLevel}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mealtime Observation Status */}
      <Card className={`border ${
        lastSeverity === 'red' ? 'border-destructive bg-destructive/5' :
        lastSeverity === 'amber' ? 'border-amber-300 bg-amber-50/50' :
        'border-success/50 bg-success/5'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lastSeverity === 'red' ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : lastSeverity === 'amber' ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <Eye className="h-6 w-6 text-success" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  lastSeverity === 'red' ? 'text-destructive' :
                  lastSeverity === 'amber' ? 'text-amber-700' : 'text-success'
                }`}>
                  {lastSeverity === 'red' ? 'RED – Action Needed' :
                   lastSeverity === 'amber' ? 'Amber – Attention Required' :
                   'IDEAL – No Concerns'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastObs
                    ? `Last observation ${formatDistanceToNow(new Date(lastObs.eventOccurredAt || lastObs.createdAt), { addSuffix: true })}`
                    : 'No observations recorded yet'}
                </p>
                {config?.enableObservations && countdown && (
                  <p className={`text-xs font-medium mt-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isOverdue ? (
                      <><Clock className="h-3 w-3 inline mr-1" />⚠ {countdown}</>
                    ) : (
                      <><Clock className="h-3 w-3 inline mr-1" />Next due in {countdown}</>
                    )}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowObservation(true)}
              disabled={isMonitoringPaused}
            >
              <Plus className="h-4 w-4 mr-1" />
              Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setShowLevelDisplay(true)}
          className="flex flex-col items-center justify-center gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[110px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-center">IDDSI Levels</span>
        </button>

        <button
          onClick={() => setShowPositioning(true)}
          className="flex flex-col items-center justify-center gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[110px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Armchair className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-center">Positioning</span>
        </button>

        <button
          onClick={() => setShowStrategies(true)}
          className="flex flex-col items-center justify-center gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[110px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-center">Strategies</span>
        </button>
      </div>

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
          <IddsiHistory clientId={clientId} />
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Trend analysis coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <IddsiConfigSettings clientId={clientId} />
          </TabsContent>
        )}
      </Tabs>

      {/* IDDSI Citation Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <p>
          Intended for general information only. Please consult with your health care professional
          for specific advice for your needs.
        </p>
        <p className="italic">
          © The International Dysphagia Diet Standardisation Initiative 2019{' '}
          <a href="https://iddsi.org/standards/framework" target="_blank" rel="noopener noreferrer" className="underline">
            https://iddsi.org/standards/framework
          </a>
          . Licensed under the CreativeCommons Attribution Sharealike 4.0 License{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" target="_blank" rel="noopener noreferrer" className="underline">
            https://creativecommons.org/licenses/by-sa/4.0/legalcode
          </a>
          . Derivative works extending beyond language translation are NOT PERMITTED.
        </p>
      </div>

      {/* Dialogs */}
      <MealtimeObservationForm
        clientId={clientId}
        open={showObservation}
        onOpenChange={setShowObservation}
      />
    </div>
  );
}
