/**
 * IDDSI & Safe Swallowing Dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIddsiConfig, useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { formatDistanceToNow, addDays, addWeeks, addMonths, differenceInSeconds, isPast } from 'date-fns';
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
import { IddsiStatusCard } from './IddsiStatusCard';
import {
  AlertCircle, Settings, Clock, BarChart3,
  Eye, Armchair, Brain, Plus,
} from 'lucide-react';

interface IddsiDashboardProps {
  clientId?: string;
}

/** Format seconds into a human-friendly countdown string */
function formatCountdown(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
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

  const lastObs = observations.length > 0 ? observations[0] : null;
  const lastSeverity = lastObs?.severity || 'green';

  // Calculate next observation due time
  const nextDueAt = useMemo(() => {
    if (!lastObs || !config?.enableObservations) return null;
    const lastTime = new Date(lastObs.eventOccurredAt || lastObs.createdAt);
    const freq = config.observationFrequency;
    if (freq === 'daily') return addDays(lastTime, 1);
    if (freq === 'weekly') return addWeeks(lastTime, 1);
    if (freq === 'monthly') return addMonths(lastTime, 1);
    return addDays(lastTime, 1);
  }, [lastObs, config?.enableObservations, config?.observationFrequency]);

  const [countdown, setCountdown] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!nextDueAt) { setCountdown(''); setIsOverdue(false); return; }

    const tick = () => {
      const now = new Date();
      if (isPast(nextDueAt)) {
        setIsOverdue(true);
        const secs = differenceInSeconds(now, nextDueAt);
        setCountdown(formatCountdown(secs) + ' overdue');
      } else {
        setIsOverdue(false);
        const secs = differenceInSeconds(nextDueAt, now);
        setCountdown(formatCountdown(secs));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDueAt]);

  // Sub-views
  if (showLevelDisplay) {
    return <IddsiLevelDisplay clientId={clientId} onClose={() => setShowLevelDisplay(false)} />;
  }
  if (showPositioning) {
    return <PositioningCheckPanel clientId={clientId} onClose={() => setShowPositioning(false)} />;
  }
  if (showStrategies) {
    return <SafeSwallowingStrategies onClose={() => setShowStrategies(false)} />;
  }

  const severityConfig = {
    red: {
      border: 'border-destructive',
      bg: 'bg-destructive/10',
      icon: <AlertCircle className="h-7 w-7 text-destructive" />,
      label: 'RED – Action Needed',
      labelClass: 'text-destructive',
      dotClass: 'bg-destructive',
    },
    amber: {
      border: 'border-amber-400',
      bg: 'bg-amber-50',
      icon: <AlertTriangle className="h-7 w-7 text-amber-600" />,
      label: 'Amber – Attention Required',
      labelClass: 'text-amber-700',
      dotClass: 'bg-amber-500',
    },
    green: {
      border: 'border-emerald-400',
      bg: 'bg-emerald-50/60',
      icon: <Eye className="h-7 w-7 text-emerald-600" />,
      label: 'IDEAL – No Concerns',
      labelClass: 'text-emerald-700',
      dotClass: 'bg-emerald-500',
    },
  };

  const sev = severityConfig[lastSeverity as keyof typeof severityConfig] || severityConfig.green;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">IDDSI & Safe Swallowing</h2>
        <p className="text-sm text-muted-foreground">
          Food and fluid texture management & swallowing monitoring
        </p>
      </div>

      {/* Monitoring Paused */}
      {isMonitoringPaused && monitoringStatus && (
        <MonitoringPausedBanner
          pauseReason={monitoringStatus.pauseReason}
          pauseStartDatetime={monitoringStatus.pauseStartDatetime}
          pauseEndDatetime={monitoringStatus.pauseEndDatetime}
        />
      )}

      {/* Safety Disclaimer — compact */}
      <div className="flex gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> Food and fluid levels must be prescribed by a qualified
          Speech Pathologist. This tool supports safe implementation only.
        </p>
      </div>

      {/* ── Status Card ── */}
      <Card className={`${sev.border} ${sev.bg} shadow-sm`}>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {sev.icon}
                <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${sev.dotClass} ring-2 ring-white animate-pulse`} />
              </div>
              <div className="space-y-0.5">
                <p className={`text-sm font-bold ${sev.labelClass}`}>
                  {sev.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastObs
                    ? `Last observation ${formatDistanceToNow(new Date(lastObs.eventOccurredAt || lastObs.createdAt), { addSuffix: true })}`
                    : 'No observations recorded yet'}
                </p>
                {config?.enableObservations && countdown && (
                  <p className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <Clock className="h-3 w-3" />
                    {isOverdue ? `⚠ ${countdown}` : `Next due in ${countdown}`}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowObservation(true)}
              disabled={isMonitoringPaused}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Prescribed Levels ── */}
      {config && (config.foodLevel !== null || config.drinkLevel !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {config.foodLevel !== null && (
            <Card className="overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Food Level</p>
                <div className="flex items-center justify-center h-32 w-full">
                  <img
                    src={config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew'
                      ? '/food-level-7etc.png'
                      : `/food-level-${config.foodLevel}.png`}
                    alt={`Food Level ${config.foodLevel}`}
                    className="max-h-28 w-auto object-contain"
                  />
                </div>
                <p className="font-bold text-base">
                  Level {config.foodLevel}
                  {config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew' && ' – Easy to Chew'}
                </p>
              </CardContent>
            </Card>
          )}
          {config.drinkLevel !== null && (
            <Card className="overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Drink Level</p>
                <div className="flex items-center justify-center h-32 w-full">
                  <img
                    src={`/drink-level-${config.drinkLevel}.png`}
                    alt={`Drink Level ${config.drinkLevel}`}
                    className="max-h-28 w-auto object-contain"
                  />
                </div>
                <p className="font-bold text-base">
                  Level {config.drinkLevel}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Eye, label: 'IDDSI Levels', onClick: () => setShowLevelDisplay(true) },
          { icon: Armchair, label: 'Positioning', onClick: () => setShowPositioning(true) },
          { icon: Brain, label: 'Strategies', onClick: () => setShowStrategies(true) },
        ].map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98] min-h-[90px]"
          >
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="tracking" className="space-y-3">
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

      {/* IDDSI Citation */}
      <div className="text-[10px] text-muted-foreground border-t pt-3 space-y-1">
        <p>
          Intended for general information only. Consult your health care professional for specific advice.
        </p>
        <p className="italic">
          © The International Dysphagia Diet Standardisation Initiative 2019{' '}
          <a href="https://iddsi.org/standards/framework" target="_blank" rel="noopener noreferrer" className="underline">
            iddsi.org/standards/framework
          </a>
          . Licensed under CC BY-SA 4.0. Derivative works beyond language translation are NOT PERMITTED.
        </p>
      </div>

      {/* Observation Dialog */}
      <MealtimeObservationForm
        clientId={clientId}
        open={showObservation}
        onOpenChange={setShowObservation}
      />
    </div>
  );
}
