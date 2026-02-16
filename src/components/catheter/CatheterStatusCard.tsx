/**
 * Catheter Status Tiles - Four separate indicator tiles for the catheter dashboard.
 * Pulls configuration from the Digital Care Plan as single source of truth.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Droplets, Activity, Package, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { useCatheterStatus, useBagChanges, useStomaChecks, useCatheterBagConfig } from '@/hooks/useCatheter';
import { useCatheterCarePlan } from '@/hooks/useCatheterCarePlan';
import { CATHETER_TYPE_CONFIG, BAG_TYPES, type CatheterType } from '@/types/catheter';
import { format, parseISO } from 'date-fns';
import type { HealthStatus } from '@/types/ideal';

/* ──────────────────────────────────────────────
 * 1. Catheter Change Tile
 * ────────────────────────────────────────────── */
function CatheterChangeTile({
  daysUntilChange,
  isChangeOverdue,
  changeFrequencyDays,
  changeInterval,
  onLog,
}: {
  daysUntilChange: number | null;
  isChangeOverdue: boolean;
  changeFrequencyDays: number;
  changeInterval?: string | null;
  onLog: () => void;
}) {
  const changeProgress =
    changeFrequencyDays > 0 && daysUntilChange !== null
      ? Math.max(0, Math.min(100, ((changeFrequencyDays - Math.max(0, daysUntilChange)) / changeFrequencyDays) * 100))
      : 0;

  const status: HealthStatus = isChangeOverdue ? 'action' : daysUntilChange !== null && daysUntilChange <= 3 ? 'monitor' : 'stable';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            Catheter Change
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {daysUntilChange !== null ? (
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${isChangeOverdue ? 'text-destructive' : ''}`}>
              {isChangeOverdue ? `${Math.abs(daysUntilChange)} days overdue` : `${daysUntilChange} days`}
            </div>
            {changeProgress > 0 && daysUntilChange !== null && daysUntilChange < 50 && (
              <Progress value={changeProgress} className="h-2" />
            )}
            {changeInterval && (
              <p className="text-xs text-muted-foreground">Interval: {changeInterval}</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Not scheduled</div>
        )}

        <Button onClick={onLog} className="w-full gap-2" size="sm">
          <Clock className="h-4 w-4" />
          Log Catheter Change
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 2. Catheter Flush Tile
 * ────────────────────────────────────────────── */
function CatheterFlushTile({
  daysUntilFlush,
  isFlushOverdue,
  flushFrequencyLabel,
  onLog,
}: {
  daysUntilFlush: number | null;
  isFlushOverdue: boolean;
  flushFrequencyLabel?: string;
  onLog: () => void;
}) {
  const status: HealthStatus = isFlushOverdue ? 'action' : daysUntilFlush !== null && daysUntilFlush <= 1 ? 'monitor' : 'stable';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="h-4 w-4 text-primary" />
            Catheter Flush
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {daysUntilFlush !== null ? (
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${isFlushOverdue ? 'text-destructive' : ''}`}>
              {isFlushOverdue ? `${Math.abs(daysUntilFlush)} days overdue` : `${daysUntilFlush} days`}
            </div>
            {flushFrequencyLabel && (
              <p className="text-xs text-muted-foreground">Frequency: {flushFrequencyLabel}</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No flushes logged</div>
        )}

        <Button onClick={onLog} className="w-full gap-2" size="sm">
          <Droplets className="h-4 w-4" />
          Log Catheter Flush
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 3. Bag Change Tile (with stock overview)
 * ────────────────────────────────────────────── */
function BagChangeTile({
  clientId,
  monthlyBagUsage,
  onLog,
}: {
  clientId?: string;
  monthlyBagUsage: number;
  onLog: () => void;
}) {
  const { stockItems, hasLowStock } = useCatheterBagConfig(clientId);
  const { lastBagChange } = useBagChanges(clientId);

  const tileStatus: HealthStatus = hasLowStock ? 'monitor' : 'stable';

  const getStockColor = (status: 'good' | 'medium' | 'low') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-destructive';
    }
  };

  const getStockIcon = (status: 'good' | 'medium' | 'low') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case 'low': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  const getBagLabel = (bagType: string) =>
    BAG_TYPES.find(bt => bt.value === bagType)?.label || bagType;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-primary" />
            Bag Changes
          </div>
          <StatusBadge status={tileStatus} size="sm" />
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-2xl font-bold">{monthlyBagUsage}</div>
            <p className="text-xs text-muted-foreground">Changes this month</p>
          </div>

          {lastBagChange && (
            <p className="text-xs text-muted-foreground">
              Last: {format(parseISO(lastBagChange.event_occurred_at), 'dd MMM, HH:mm')} — {getBagLabel(lastBagChange.bag_type)}
            </p>
          )}

          {stockItems.length > 0 && (
            <div className="space-y-1 pt-1 border-t">
              {stockItems.map(item => (
                <div key={item.bag_type} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{getBagLabel(item.bag_type)}</span>
                  <div className="flex items-center gap-1.5">
                    {getStockIcon(item.status)}
                    <span className={`font-medium ${getStockColor(item.status)}`}>
                      {item.stock_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={onLog} className="w-full gap-2" size="sm">
          <Package className="h-4 w-4" />
          Log Bag Change
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 4. Stoma Check Tile
 * ────────────────────────────────────────────── */
function StomaCheckTile({
  clientId,
  onLog,
}: {
  clientId?: string;
  onLog: () => void;
}) {
  const { lastCheck, hasConcern } = useStomaChecks(clientId);

  const status: HealthStatus = hasConcern ? 'action' : 'stable';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4 text-primary" />
            Daily Stoma Check
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {lastCheck ? (
          <div className="space-y-1">
            <div className={`text-lg font-semibold ${hasConcern ? 'text-warning' : ''}`}>
              {lastCheck.stoma_condition === 'healthy' ? 'Healthy' : 'Concern Noted'}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(lastCheck.event_occurred_at), 'dd MMM, HH:mm')}
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No checks logged</div>
        )}

        <Button onClick={onLog} variant="outline" className="w-full gap-2" size="sm">
          <Activity className="h-4 w-4" />
          Log Stoma Check
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * Main Grid Component
 * ────────────────────────────────────────────── */
interface CatheterStatusCardProps {
  clientId?: string;
  onLogChange: () => void;
  onLogFlush?: () => void;
  onLogBagChange?: () => void;
  onLogStomaCheck?: () => void;
}

export function CatheterStatusCard({
  clientId,
  onLogChange,
  onLogFlush,
  onLogBagChange,
  onLogStomaCheck,
}: CatheterStatusCardProps) {
  const { plan } = useCatheterCarePlan(clientId);
  const {
    daysUntilChange,
    isChangeOverdue,
    daysUntilFlush,
    isFlushOverdue,
    changeFrequencyDays,
    monthlyBagUsage,
    loading,
  } = useCatheterStatus(clientId);

  const planCatheterType = plan?.catheter_type as CatheterType | undefined;
  const typeConfig = planCatheterType ? CATHETER_TYPE_CONFIG[planCatheterType] : null;

  const flushFrequencyLabel = plan?.flush_prescribed
    ? plan.flush_frequency === 'daily'
      ? 'Daily'
      : plan.flush_frequency === 'twice_daily'
        ? 'Twice Daily'
        : plan.flush_frequency === 'prn'
          ? 'PRN (As Needed)'
          : plan.flush_custom_interval || plan.flush_frequency || undefined
    : undefined;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-8 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const showFlush = !!onLogFlush && plan?.flush_prescribed;
  const showBag = !!onLogBagChange;
  const showStoma = !!onLogStomaCheck && typeConfig?.enableStomaChecks;

  const tileCount = 1 + (showFlush ? 1 : 0) + (showBag ? 1 : 0) + (showStoma ? 1 : 0);
  const gridCols =
    tileCount === 1
      ? 'grid-cols-1'
      : tileCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : tileCount === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      <CatheterChangeTile
        daysUntilChange={daysUntilChange}
        isChangeOverdue={isChangeOverdue}
        changeFrequencyDays={changeFrequencyDays}
        changeInterval={plan?.change_interval}
        onLog={onLogChange}
      />

      {showFlush && onLogFlush && (
        <CatheterFlushTile
          daysUntilFlush={daysUntilFlush}
          isFlushOverdue={isFlushOverdue}
          flushFrequencyLabel={flushFrequencyLabel}
          onLog={onLogFlush}
        />
      )}

      {showBag && onLogBagChange && (
        <BagChangeTile clientId={clientId} monthlyBagUsage={monthlyBagUsage} onLog={onLogBagChange} />
      )}

      {showStoma && onLogStomaCheck && (
        <StomaCheckTile clientId={clientId} onLog={onLogStomaCheck} />
      )}
    </div>
  );
}
