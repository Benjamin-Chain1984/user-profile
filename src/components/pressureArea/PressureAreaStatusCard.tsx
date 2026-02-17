/**
 * Pressure Area Prevention Status Tiles
 * Two separate indicator tiles: Pressure Relief + Skin Check
 * Follows the Catheter module's tile pattern with StatusBadge indicators.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ideal/StatusBadge';
import { usePressureReliefEvents, useSkinChecks, usePressureAreaConfig } from '@/hooks/usePressureArea';
import { usePressureReliefPlan } from '@/hooks/usePressureReliefPlan';
import { RotateCcw, Eye } from 'lucide-react';
import { differenceInHours, differenceInDays, formatDistanceToNow } from 'date-fns';
import type { HealthStatus } from '@/types/ideal';

interface Props {
  clientId?: string;
  onLogPressureRelief: () => void;
  onLogSkinCheck: () => void;
  disabled?: boolean;
}

/* ──────────────────────────────────────────────
 * 1. Pressure Relief Tile
 * ────────────────────────────────────────────── */
function PressureReliefTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { plan } = usePressureReliefPlan(clientId);
  const { events } = usePressureReliefEvents(clientId);
  const { config } = usePressureAreaConfig(clientId);

  const latestEvent = events[0];

  // Determine status
  let status: HealthStatus = 'stable';
  let statusLabel = 'On track';
  let detail: string | null = null;

  if (plan?.status === 'published' && plan.schedule_type !== 'as_required' && plan.interval_minutes > 0) {
    if (latestEvent) {
      const minutesSince = differenceInHours(new Date(), new Date(latestEvent.event_occurred_at)) * 60;
      const overdueRed = plan.overdue_red_minutes + plan.interval_minutes;
      const overdueAmber = plan.overdue_amber_minutes + plan.interval_minutes;

      if (minutesSince >= overdueRed) {
        status = 'action';
        statusLabel = 'Overdue';
      } else if (minutesSince >= overdueAmber) {
        status = 'monitor';
        statusLabel = 'Due soon';
      }
    } else {
      status = 'monitor';
      statusLabel = 'Not yet logged';
    }

    // Compliance
    if (config?.enable_compliance_scoring && events.length > 0) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEvents = events.filter(e => new Date(e.event_occurred_at) >= todayStart);
      const dayMinutes = 16 * 60;
      const expectedCount = Math.floor(dayMinutes / plan.interval_minutes);
      if (expectedCount > 0) {
        const compliance = Math.round((todayEvents.length / expectedCount) * 100);
        detail = `Today: ${todayEvents.length}/${expectedCount} (${compliance}%)`;
        if (compliance < 70 && status !== 'action') {
          status = 'action';
          statusLabel = 'Low compliance';
        } else if (compliance < 90 && status === 'stable') {
          status = 'monitor';
          statusLabel = 'Monitor compliance';
        }
      }
    }
  } else if (!plan || plan.status === 'draft') {
    detail = 'No plan published';
  }

  const lastTime = latestEvent
    ? formatDistanceToNow(new Date(latestEvent.event_occurred_at), { addSuffix: true })
    : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RotateCcw className="h-4 w-4 text-primary" />
            Pressure Relief
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div className={`text-lg font-semibold ${
            status === 'action' ? 'text-destructive' :
            status === 'monitor' ? 'text-amber-600' : ''
          }`}>
            {statusLabel}
          </div>
          {lastTime && (
            <p className="text-xs text-muted-foreground">
              Last: {latestEvent?.position_completed} • {lastTime}
            </p>
          )}
          {detail && (
            <p className="text-xs text-muted-foreground">{detail}</p>
          )}
        </div>

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
          Log Pressure Relief
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * 2. Skin Check Tile
 * ────────────────────────────────────────────── */
function SkinCheckTile({
  clientId,
  onLog,
  disabled,
}: {
  clientId?: string;
  onLog: () => void;
  disabled?: boolean;
}) {
  const { sessions } = useSkinChecks(clientId);
  const { config } = usePressureAreaConfig(clientId);

  const latestCheck = sessions[0];

  let status: HealthStatus = 'stable';
  let statusLabel = 'Healthy';
  let statusMessage: string | null = null;

  if (latestCheck) {
    if (latestCheck.overall_status === 'red') {
      status = 'action';
      statusLabel = 'Action Required';
      statusMessage = 'Active concern – seek medical advice';
    } else if (latestCheck.overall_status === 'amber') {
      status = 'monitor';
      statusLabel = 'Monitor';
      statusMessage = 'Skin changes identified – monitor closely';
    }

    // Check overdue
    if (config) {
      const daysSince = differenceInDays(new Date(), new Date(latestCheck.event_occurred_at));
      if (daysSince > config.skin_check_frequency_days) {
        if (status === 'stable') {
          status = 'monitor';
          statusLabel = 'Overdue';
          statusMessage = `Last check ${daysSince} days ago`;
        }
      }
    }
  } else {
    status = 'monitor';
    statusLabel = 'Not yet logged';
    statusMessage = 'No skin checks recorded';
  }

  const lastTime = latestCheck
    ? formatDistanceToNow(new Date(latestCheck.event_occurred_at), { addSuffix: true })
    : null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4 text-primary" />
            Skin Check
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-1">
          <div className={`text-lg font-semibold ${
            status === 'action' ? 'text-destructive' :
            status === 'monitor' ? 'text-amber-600' : ''
          }`}>
            {statusLabel}
          </div>
          {statusMessage && (
            <p className="text-xs text-muted-foreground">{statusMessage}</p>
          )}
          {lastTime && (
            <p className="text-xs text-muted-foreground">Last checked: {lastTime}</p>
          )}
        </div>

        <Button onClick={onLog} className="w-full gap-2" size="sm" disabled={disabled}>
          <Eye className="h-4 w-4" />
          Log Skin Check
        </Button>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────
 * Main Grid Component
 * ────────────────────────────────────────────── */
export function PressureAreaStatusCard({ clientId, onLogPressureRelief, onLogSkinCheck, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <PressureReliefTile clientId={clientId} onLog={onLogPressureRelief} disabled={disabled} />
      <SkinCheckTile clientId={clientId} onLog={onLogSkinCheck} disabled={disabled} />
    </div>
  );
}
