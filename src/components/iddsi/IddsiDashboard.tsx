/**
 * IDDSI & Safe Swallowing Dashboard
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIddsiConfig, useMealtimeObservations, usePositioningChecks } from '@/hooks/useIddsi';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useProfile } from '@/contexts/ProfileContext';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { MonitoringPausedBanner } from '@/components/monitoring';
import { IddsiLevelDisplay } from './IddsiLevelDisplay';
import { MealtimeObservationForm } from './MealtimeObservationForm';
import { PositioningCheckPanel } from './PositioningCheckPanel';
import { SafeSwallowingStrategies } from './SafeSwallowingStrategies';
import { EscalateSwallowingDialog } from './EscalateSwallowingDialog';
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
  const { isAdmin } = useRoleAccess();
  const { isMonitoringPaused, monitoringStatus } = useProfile();

  const [showLevelDisplay, setShowLevelDisplay] = useState(false);
  const [showPositioning, setShowPositioning] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showObservation, setShowObservation] = useState(false);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">IDDSI & Safe Swallowing</h2>
          <p className="text-muted-foreground">
            Food and fluid texture management & swallowing monitoring
          </p>
        </div>
        <Button onClick={() => setShowObservation(true)} disabled={isMonitoringPaused}>
          <Plus className="h-4 w-4 mr-2" />
          Log Mealtime Observation
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
              <CardContent className="py-5 flex flex-col items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prescribed Food Level</p>
                <img
                  src={config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew'
                    ? '/food-level-7etc.png'
                    : `/food-level-${config.foodLevel}.png`}
                  alt={`Food Level ${config.foodLevel}`}
                  className="h-28 w-28 object-contain"
                />
                <p className="font-semibold text-base text-foreground">
                  Level {config.foodLevel}
                  {config.foodLevel === 7 && config.foodLevelVariant === 'easy_to_chew' && ' – Easy to Chew'}
                </p>
              </CardContent>
            </Card>
          )}
          {config.drinkLevel !== null && (
            <Card>
              <CardContent className="py-5 flex flex-col items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prescribed Drink Level</p>
                <img
                  src={`/drink-level-${config.drinkLevel}.png`}
                  alt={`Drink Level ${config.drinkLevel}`}
                  className="h-28 w-28 object-contain"
                />
                <p className="font-semibold text-base text-foreground">
                  Level {config.drinkLevel}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowLevelDisplay(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-center">View IDDSI Level & Testing</span>
        </button>

        <button
          onClick={() => setShowPositioning(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Armchair className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-center">Check Positioning</span>
          <span className="text-[10px] text-muted-foreground">(Guide only)</span>
        </button>

        <button
          onClick={() => setShowStrategies(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-center">Safe Swallowing Strategies</span>
        </button>

        <button
          onClick={() => setShowEscalate(true)}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-card rounded-xl border border-destructive/30 hover:border-destructive hover:shadow-md transition-all active:scale-[0.98] min-h-[120px]"
        >
          <div className="p-3 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <span className="text-sm font-medium text-center text-destructive">Escalate Swallowing Concerns</span>
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
      <EscalateSwallowingDialog
        open={showEscalate}
        onOpenChange={setShowEscalate}
      />
    </div>
  );
}
