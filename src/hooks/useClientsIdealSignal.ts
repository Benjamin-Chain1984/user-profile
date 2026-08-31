/**
 * useClientsIdealSignal
 * ---------------------
 * Reads the global IDEAL signal (traffic light) per client.
 *
 * SINGLE SOURCE OF TRUTH: the person's profile computes the signal (via
 * ProfileContext, using each module's clinical calculators) and publishes it to
 * `client_ideal_signals`. This hook only reads that published signal so the
 * Admin > Clients list can never disagree with the profile.
 *
 * Hierarchy (highest severity wins — never optimistic):
 *   Paused  → monitoring suspended (Amber)
 *   Red     → any module in "action"
 *   Amber   → any module in "monitor", OR no modules configured (setup required)
 *   IDEAL   → configured, monitored, no active alerts
 *
 * Clients whose profile has not been opened yet have no published signal — they
 * are shown as Amber ("Not yet calculated"), never IDEAL.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TrafficLightStatus } from '@/types/trafficLight';
import { useProfile } from '@/contexts/ProfileContext';

export interface ClientIdealSignal {
  status: TrafficLightStatus;
  isPaused: boolean;
  redCount: number;
  amberCount: number;
  needsSetup: boolean;
  /** True when the profile has never published a signal for this client. */
  notCalculated?: boolean;
  topAlertModule?: string | null;
  topAlertMessage?: string | null;
}

interface SignalRow {
  client_id: string;
  status: string;
  red_count: number;
  amber_count: number;
  is_paused: boolean;
  needs_setup: boolean;
  top_alert_module: string | null;
  top_alert_message: string | null;
}

const toStatus = (value: string): TrafficLightStatus => {
  const v = (value || '').toLowerCase();
  if (v === 'red' || v === 'action') return 'red';
  if (v === 'green' || v === 'ideal' || v === 'stable') return 'green';
  return 'amber';
};

export function useClientsIdealSignal(clientIds: string[]) {
  const [signals, setSignals] = useState<Record<string, ClientIdealSignal>>({});
  const [isLoading, setIsLoading] = useState(true);
  const key = clientIds.slice().sort().join(',');

  // Live signal for the client currently loaded in the profile — always fresh.
  const { profile, globalAlertState, isMonitoringPaused, enabledModules } = useProfile();

  const fetchSignals = useCallback(async () => {
    if (!key) {
      setSignals({});
      setIsLoading(false);
      return;
    }
    const ids = key.split(',');
    setIsLoading(true);

    const base: Record<string, ClientIdealSignal> = {};
    ids.forEach((id) => {
      base[id] = {
        status: 'amber',
        isPaused: false,
        redCount: 0,
        amberCount: 0,
        needsSetup: false,
        notCalculated: true,
      };
    });

    try {
      const { data, error } = await supabase
        .from('client_ideal_signals')
        .select(
          'client_id, status, red_count, amber_count, is_paused, needs_setup, top_alert_module, top_alert_message'
        )
        .in('client_id', ids);

      if (error) throw error;

      (data as SignalRow[] | null)?.forEach((row) => {
        if (!base[row.client_id]) return;
        base[row.client_id] = {
          status: toStatus(row.status),
          isPaused: row.is_paused,
          redCount: row.red_count ?? 0,
          amberCount: row.amber_count ?? 0,
          needsSetup: row.needs_setup,
          notCalculated: false,
          topAlertModule: row.top_alert_module,
          topAlertMessage: row.top_alert_message,
        };
      });

      setSignals(base);
    } catch (err) {
      console.error('Error loading client IDEAL signals:', err);
      setSignals(base);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Overlay the live profile-computed signal for the active client so the Admin
  // list reflects the profile immediately, before the published row round-trips.
  const merged = useMemo(() => {
    const clientId = profile?.id;
    if (!clientId || clientId === '1' || !signals[clientId]) return signals;

    const alerts = isMonitoringPaused ? [] : globalAlertState.alerts;
    const noModulesEnabled = !enabledModules.some((m) => m.enabled);
    const status: TrafficLightStatus = isMonitoringPaused
      ? 'amber'
      : globalAlertState.currentStatus === 'action'
        ? 'red'
        : globalAlertState.currentStatus === 'monitor' || noModulesEnabled
          ? 'amber'
          : 'green';
    const top = alerts[0];

    return {
      ...signals,
      [clientId]: {
        status,
        isPaused: isMonitoringPaused,
        redCount: alerts.filter((a) => a.status === 'red').length,
        amberCount: alerts.filter((a) => a.status === 'amber').length,
        needsSetup: noModulesEnabled,
        notCalculated: false,
        topAlertModule: top?.moduleName ?? null,
        topAlertMessage: top?.message ?? null,
      },
    };
  }, [signals, profile?.id, globalAlertState, isMonitoringPaused, enabledModules]);

  return { signals: merged, isLoading, refresh: fetchSignals };
}
