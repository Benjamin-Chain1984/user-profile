import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Droplets, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { FluidStatus } from '@/types/fluidBalance';
import { getHydrationLevel } from '@/utils/fluidBalanceCalculator';
import { cn } from '@/lib/utils';

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
  
  const statusColors = {
    ideal: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };
  
  const badgeColors = {
    ideal: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    amber: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    red: 'bg-red-100 text-red-800 hover:bg-red-100'
  };
  
  const progressColors = {
    critical: 'bg-red-500',
    low: 'bg-amber-500',
    moderate: 'bg-yellow-500',
    good: 'bg-emerald-400',
    full: 'bg-emerald-500'
  };
  
  const StatusIcon = status === 'ideal' ? CheckCircle : AlertTriangle;
  
  return (
    <Card className={cn('border-2', statusColors[status])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplets className="h-5 w-5" />
            Today's Hydration
          </CardTitle>
          <Badge className={badgeColors[status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {isRestricted ? 'Fluid Limit' : 'Target'}: {targetOrCap}ml
            </span>
            <span className="font-medium">{percentOfTarget}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(percentOfTarget, 100)} 
              className="h-4"
            />
            <div 
              className={cn(
                'absolute top-0 left-0 h-full rounded-full transition-all',
                progressColors[hydrationLevel]
              )}
              style={{ width: `${Math.min(percentOfTarget, 100)}%` }}
            />
          </div>
          {isRestricted && percentOfTarget > 90 && (
            <p className="text-sm text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Approaching fluid limit
            </p>
          )}
        </div>
        
        {/* Stats grid */}
        <div className={cn('grid gap-4', enableOutputLogging ? 'grid-cols-3' : 'grid-cols-1')}>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Intake</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{todayIntake}ml</p>
          </div>
          
          {enableOutputLogging && (
            <>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <span className="text-xs">Output</span>
                </div>
                <p className="text-xl font-bold text-orange-600">{todayOutput}ml</p>
              </div>
              
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Droplets className="h-4 w-4" />
                  <span className="text-xs">Balance</span>
                </div>
                <p className={cn(
                  'text-xl font-bold',
                  todayBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {todayBalance >= 0 ? '+' : ''}{todayBalance}ml
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Status message */}
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
        
        {isRestricted && (
          <div className="p-2 bg-amber-100 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ Fluid Restriction Active — Max {targetOrCap}ml/day
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
