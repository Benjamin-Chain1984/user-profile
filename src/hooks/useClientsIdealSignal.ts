/**
 * useClientsIdealSignal
 * ---------------------
 * Aggregates a single global IDEAL signal (traffic light) per client so admins
 * can review every client at a glance.
 *
 * Hierarchy (highest severity wins — never optimistic):
 *   Paused  → monitoring suspended
 *   Red     → any unresolved red/critical module alert
 *   Amber   → any unresolved amber alert, OR no modules configured (setup required)
 *   IDEAL   → configured, monitored, no unresolved alerts
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TrafficLightStatus } from '@/types/trafficLight';

export interface ClientIdealSignal {
  status: TrafficLightStatus;
  isPaused: boolean;
  redCount: number;
  amberCount: number;
  needsSetup: boolean;
}

const ALERT_TABLES = [
  'bowel_care_alerts',
  'catheter_alerts',
  'continence_alerts',
  'enteral_alerts',
  'epilepsy_alerts',
  'fluid_balance_alerts',
  'health_prevention_alerts',
  'iddsi_alerts',
  'oral_health_alerts',
  'pressure_area_alerts',
  'sleep_alerts',
  'vital_sign_alerts',
  'weight_bmi_alerts',
] as const;

const isRed = (severity: string) =>
  ['red', 'critical', 'action', 'high'].includes((severity || '').toLowerCase());
const isAmber = (severity: string) =>
  ['amber', 'warning', 'monitor', 'medium'].includes((severity || '').toLowerCase());

export function useClientsIdealSignal(clientIds: string[]) {
  const [signals, setSignals] = useState<Record<string, ClientIdealSignal>>({});
  const [isLoading, setIsLoading] = useState(true);
  const key = clientIds.slice().sort().join(',');

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
      base[id] = { status: 'green', isPaused: false, redCount: 0, amberCount: 0, needsSetup: false };
    });

    try {
      const [modulesRes, pauseRes, ...alertResults] = await Promise.all([
        supabase.from('clients').select('id, enabled_modules').in('id', ids),
        supabase.from('profile_monitoring_status').select('client_id, is_paused').in('client_id', ids),
        ...ALERT_TABLES.map((table) =>
          supabase
            .from(table)
            .select('client_id, severity')
            .in('client_id', ids)
            .is('resolved_at', null)
        ),
      ]);

      // Setup state — a client with no enabled modules is Amber, never IDEAL
      (modulesRes.data || []).forEach((row: { id: string; enabled_modules: unknown }) => {
        const modules = Array.isArray(row.enabled_modules) ? row.enabled_modules : [];
        if (base[row.id] && modules.length === 0) {
          base[row.id].needsSetup = true;
        }
      });

      // Unresolved alerts
      alertResults.forEach((res) => {
        (res.data || []).forEach((row: { client_id: string | null; severity: string }) => {
          if (!row.client_id || !base[row.client_id]) return;
          if (isRed(row.severity)) base[row.client_id].redCount += 1;
          else if (isAmber(row.severity)) base[row.client_id].amberCount += 1;
        });
      });

      // Global monitoring pause suppresses alerts
      (pauseRes.data || []).forEach((row: { client_id: string; is_paused: boolean }) => {
        if (base[row.client_id] && row.is_paused) base[row.client_id].isPaused = true;
      });

      ids.forEach((id) => {
        const s = base[id];
        if (s.isPaused) {
          s.redCount = 0;
          s.amberCount = 0;
          s.status = 'amber';
        } else if (s.redCount > 0) {
          s.status = 'red';
        } else if (s.amberCount > 0 || s.needsSetup) {
          s.status = 'amber';
        } else {
          s.status = 'green';
        }
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

  return { signals, isLoading, refresh: fetchSignals };
}
