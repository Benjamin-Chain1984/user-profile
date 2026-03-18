import React from 'react';
import { Droplets, AlertTriangle, CheckCircle } from 'lucide-react';
import { FluidStatus } from '@/types/fluidBalance';
import { getHydrationLevel } from '@/utils/fluidBalanceCalculator';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TrafficLightStatusCard } from '@/components/shared/TrafficLightStatusCard';
import { toTrafficLight } from '@/types/trafficLight';

interface FluidStatusCardProps {
  status: FluidStatus;
  statusMessage: string;
  statusLabel: string;
  todayIntake: number;
  todayOutput: number;
  todayBalance: number;
  percentOfTarget: number;
  targetOrCap: number;
  enableOutputLogging: boolean;
  isRestricted: boolean;
}

export const FluidStatusCard: React.FC<FluidStatusCardProps> = ({
  status,
  statusMessage,
  statusLabel,
  todayIntake,
  todayOutput,
  todayBalance,
  percentOfTarget,
  targetOrCap,
  enableOutputLogging,
  isRestricted
}) => {
  const hydrationLevel = getHydrationLevel(percentOfTarget);
  const trafficLight = toTrafficLight(status);

  const progressColors = {
    critical: 'bg-destructive',
    low: 'bg-warning',
    moderate: 'bg-warning',
    good: 'bg-success',
    full: 'bg-success'
  };

  return (
    <TrafficLightStatusCard
      status={trafficLight}
      reason={statusMessage}
    >
      {/* Progress bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>{isRestricted ? 'Fluid Limit' : 'Target'}: {targetOrCap}ml</span>
          <span className="font-medium">{percentOfTarget}%</span>
        </div>
        <div className="relative">
          <Progress value={Math.min(percentOfTarget, 100)} className="h-4" />
          <div
            className={cn(
              'absolute top-0 left-0 h-full rounded-full transition-all',
              progressColors[hydrationLevel]
            )}
            style={{ width: `${Math.min(percentOfTarget, 100)}%` }}
          />
        </div>
        {isRestricted && percentOfTarget > 90 && percentOfTarget <= 100 && (
          <p className="text-sm text-warning font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Approaching fluid limit
          </p>
        )}
        {isRestricted && percentOfTarget > 100 && (
          <p className="text-sm text-destructive font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Fluid restriction exceeded
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className={cn('grid gap-4', enableOutputLogging ? 'grid-cols-3' : 'grid-cols-1')}>
        <div className="text-center p-3 bg-background rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs">Intake</span>
          </div>
          <p className="text-xl font-bold text-primary">{todayIntake}ml</p>
        </div>

        {enableOutputLogging && (
          <>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4 text-warning" />
                <span className="text-xs">Output</span>
              </div>
              <p className="text-xl font-bold text-warning">{todayOutput}ml</p>
            </div>

            <div className="text-center p-3 bg-background rounded-lg">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Droplets className="h-4 w-4" />
                <span className="text-xs">Balance</span>
              </div>
              <p className={cn(
                'text-xl font-bold',
                todayBalance >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {todayBalance >= 0 ? '+' : ''}{todayBalance}ml
              </p>
            </div>
          </>
        )}
      </div>

      {isRestricted && (
        <div className="mt-3 p-2 bg-destructive/5 rounded-lg border-2 border-destructive/20">
          <p className="text-xs text-destructive font-medium">
            ⚠️ Fluid Restriction Active — Max {targetOrCap}ml/day
          </p>
        </div>
      )}
    </TrafficLightStatusCard>
  );
};
