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
import { IddsiExportReports } from './IddsiExportReports';
import { IddsiPlacematBuilder } from './placemat/IddsiPlacematBuilder';
import {
  AlertCircle, Settings, Clock, BarChart3,
  Eye, Armchair, Brain, Plus, FileDown, LayoutTemplate,
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
  const [showExport, setShowExport] = useState(false);
  const [showPlacemat, setShowPlacemat] = useState(false);

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
  if (showExport) {
    return <IddsiExportReports clientId={clientId} onClose={() => setShowExport(false)} />;
  }
  if (showPlacemat) {
    return <IddsiPlacematBuilder clientId={clientId} onClose={() => setShowPlacemat(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions - matches Bowel Care layout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">IDDSI & Safe Swallowing</h2>
          <p className="text-muted-foreground">
            Food and fluid texture management & swallowing monitoring
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          {config?.enableObservations && (
            <Button onClick={() => setShowObservation(true)} disabled={isMonitoringPaused}>
              <Plus className="h-4 w-4 mr-2" />
              Log Mealtime Observation
            </Button>
          )}
        </div>
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
      <div className="flex gap-2.5 p-3 rounded-lg border border-warning/30 bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-warning">
          <strong>Important:</strong> Food and fluid levels must be prescribed by a qualified
          Speech Pathologist. This tool supports safe implementation only.
        </p>
      </div>

      {/* ── Status Card ── */}
      <IddsiStatusCard
        lastSeverity={lastSeverity}
        lastObservationTime={lastObs ? (lastObs.eventOccurredAt || lastObs.createdAt) : null}
        countdown={countdown}
        isOverdue={isOverdue}
        enableObservations={config?.enableObservations ?? false}
      />

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Eye, label: 'IDDSI Levels', onClick: () => setShowLevelDisplay(true) },
          { icon: Armchair, label: 'Positioning', onClick: () => setShowPositioning(true) },
          { icon: Brain, label: 'Strategies', onClick: () => setShowStrategies(true) },
          { icon: LayoutTemplate, label: 'Placemat Builder', onClick: () => setShowPlacemat(true) },
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
