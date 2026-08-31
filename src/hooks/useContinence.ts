/**
 * Continence Management Module - Hooks
 */
import { resolveHighestStatus, type TrafficLightStatus } from '@/types/trafficLight';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  ContinenceConfig,
  PadChangeLog,
  SkinCheck,
  ConsumablesCheck,
  UTITest,
  ContinenceAlert,
  PadType,
  PadCondition,
  ChangeReason,
  SkinArea,
  SkinCondition,
  MoistureStatus,
  DiscomfortLevel,
  BarrierCreamStatus,
  ConsumableLevel,
  UTISymptom,
  UTIResult,
  EscalatedTo,
  BodyMapMarker,
} from '@/types/continence';
import { differenceInHours, parseISO, format } from 'date-fns';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

type HealthStatus = 'stable' | 'monitor' | 'action';

interface ContinenceStatus {
  status: HealthStatus;
  lastPadChange: PadChangeLog | null;
  nextScheduledChange: Date | null;
  minutesUntilNext: number | null;
  isOverdue: boolean;
  overdueMinutes: number;
  skinAlerts: ContinenceAlert[];
  consumableAlerts: ContinenceAlert[];
  utiAlerts: ContinenceAlert[];
  performanceScore: number;
}

export function useContinenceConfig(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['continence-config', clientId],
    queryFn: async () => {
      const query = supabase.from('continence_config').select('*');
      if (clientId) {
        query.eq('client_id', clientId);
      } else {
        query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as ContinenceConfig | null;
    },
    enabled: true,
  });

  const updateConfig = useMutation({
    mutationFn: async (config: Partial<ContinenceConfig>) => {
      const payload = {
        ...config,
        client_id: clientId || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (configQuery.data?.id) {
        const { error } = await supabase
          .from('continence_config')
          .update(payload)
          .eq('id', configQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('continence_config')
          .insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continence-config', clientId] });
      toast({ title: 'Settings saved', description: 'Continence configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: configQuery.data,
    loading: configQuery.isLoading,
    updateConfig,
  };
}

export function usePadChanges(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const changesQuery = useQuery({
    queryKey: ['pad-changes', clientId],
    queryFn: async () => {
      const query = supabase
        .from('continence_pad_changes')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PadChangeLog[];
    },
  });

  const addChange = useMutation({
    mutationFn: async (entry: {
      pad_type: PadType;
      pad_condition: PadCondition;
      change_reason: ChangeReason;
      scheduled_time?: string | null;
      notes?: string;
      event_occurred_at?: string;
      recorded_on_behalf_of_name?: string;
      recorded_on_behalf_of_role?: string;
      recorded_on_behalf_of_reason?: string;
    }) => {
      const { error } = await supabase.from('continence_pad_changes').insert({
        client_id: clientId || null,
        pad_type: entry.pad_type,
        pad_condition: entry.pad_condition,
        change_reason: entry.change_reason,
        scheduled_time: entry.scheduled_time || null,
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name || null,
        recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role || null,
        recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pad-changes', clientId] });
      queryClient.invalidateQueries({ queryKey: ['skin-checks', clientId] });
      queryClient.invalidateQueries({ queryKey: ['continence-status', clientId] });
      toast({ title: 'Pad change logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    changes: changesQuery.data || [],
    loading: changesQuery.isLoading,
    addChange,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['pad-changes', clientId] }),
  };
}

export function useSkinChecks(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checksQuery = useQuery({
    queryKey: ['skin-checks', clientId],
    queryFn: async () => {
      const query = supabase
        .from('continence_skin_checks')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      // Map DB response to typed interface
      return (data || []).map(row => ({
        ...row,
        areas_checked: row.areas_checked as SkinArea[],
        skin_condition: row.skin_condition as SkinCondition,
        moisture_status: row.moisture_status as MoistureStatus,
        discomfort_level: row.discomfort_level as DiscomfortLevel,
        barrier_cream_applied: row.barrier_cream_applied as BarrierCreamStatus,
        body_map_markers: (Array.isArray(row.body_map_markers) ? row.body_map_markers : []) as unknown as BodyMapMarker[],
      })) as SkinCheck[];
    },
  });

  const addCheck = useMutation({
    mutationFn: async (entry: {
      pad_change_id?: string;
      areas_checked: SkinArea[];
      skin_condition: SkinCondition;
      moisture_status: MoistureStatus;
      discomfort_level: DiscomfortLevel;
      barrier_cream_applied: BarrierCreamStatus;
      escalated_to_clinician?: boolean;
      escalation_notes?: string;
      body_map_markers?: BodyMapMarker[];
      notes?: string;
      event_occurred_at?: string;
      recorded_on_behalf_of_name?: string;
      recorded_on_behalf_of_role?: string;
      recorded_on_behalf_of_reason?: string;
    }) => {
      const payload = {
        client_id: clientId || null,
        pad_change_id: entry.pad_change_id || null,
        areas_checked: entry.areas_checked as string[],
        skin_condition: entry.skin_condition,
        moisture_status: entry.moisture_status,
        discomfort_level: entry.discomfort_level,
        barrier_cream_applied: entry.barrier_cream_applied,
        escalated_to_clinician: entry.escalated_to_clinician || false,
        escalation_notes: entry.escalation_notes || null,
        body_map_markers: JSON.parse(JSON.stringify(entry.body_map_markers || [])),
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name || null,
        recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role || null,
        recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason || null,
        created_by: user?.id,
      };
      const { error } = await supabase.from('continence_skin_checks').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skin-checks', clientId] });
      queryClient.invalidateQueries({ queryKey: ['continence-status', clientId] });
      toast({ title: 'Skin check logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const lastCheck = checksQuery.data?.[0] || null;
  const hoursSinceLastCheck = lastCheck
    ? differenceInHours(new Date(), parseISO(lastCheck.event_occurred_at))
    : null;
  const isOverdue = hoursSinceLastCheck !== null && hoursSinceLastCheck > 48;

  return {
    checks: checksQuery.data || [],
    loading: checksQuery.isLoading,
    addCheck,
    lastCheck,
    hoursSinceLastCheck,
    isOverdue,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['skin-checks', clientId] }),
  };
}

export function useConsumablesChecks(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checksQuery = useQuery({
    queryKey: ['consumables-checks', clientId],
    queryFn: async () => {
      const query = supabase
        .from('continence_consumables_checks')
        .select('*')
        .eq('is_undone', false)
        .order('check_date', { ascending: false })
        .limit(50);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ConsumablesCheck[];
    },
  });

  const addCheck = useMutation({
    mutationFn: async (entry: {
      continence_pads_level: ConsumableLevel;
      barrier_creams_level: ConsumableLevel;
      gloves_wipes_level: ConsumableLevel;
      cleansing_products_level: ConsumableLevel;
      disposable_sheets_level: ConsumableLevel;
      notes?: string;
    }) => {
      const { error } = await supabase.from('continence_consumables_checks').insert({
        client_id: clientId || null,
        check_date: format(new Date(), 'yyyy-MM-dd'),
        continence_pads_level: entry.continence_pads_level,
        barrier_creams_level: entry.barrier_creams_level,
        gloves_wipes_level: entry.gloves_wipes_level,
        cleansing_products_level: entry.cleansing_products_level,
        disposable_sheets_level: entry.disposable_sheets_level,
        notes: entry.notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumables-checks', clientId] });
      toast({ title: 'Consumables check logged', description: 'Stock levels recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const lastCheck = checksQuery.data?.[0] || null;
  const hasLowStock = lastCheck
    ? [
        lastCheck.continence_pads_level,
        lastCheck.barrier_creams_level,
        lastCheck.gloves_wipes_level,
        lastCheck.cleansing_products_level,
        lastCheck.disposable_sheets_level,
      ].includes('low')
    : false;

  return {
    checks: checksQuery.data || [],
    loading: checksQuery.isLoading,
    addCheck,
    lastCheck,
    hasLowStock,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['consumables-checks', clientId] }),
  };
}

export function useUTITests(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const testsQuery = useQuery({
    queryKey: ['uti-tests', clientId],
    queryFn: async () => {
      const query = supabase
        .from('continence_uti_tests')
        .select('*')
        .eq('is_undone', false)
        .order('test_date', { ascending: false })
        .limit(50);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as UTITest[];
    },
  });

  const addTest = useMutation({
    mutationFn: async (entry: {
      symptoms: UTISymptom[];
      test_result: UTIResult;
      escalated_to?: EscalatedTo;
      notes?: string;
      recorded_on_behalf_of_name?: string;
      recorded_on_behalf_of_role?: string;
      recorded_on_behalf_of_reason?: string;
    }) => {
      const { error } = await supabase.from('continence_uti_tests').insert({
        client_id: clientId || null,
        test_date: format(new Date(), 'yyyy-MM-dd'),
        test_time: format(new Date(), 'HH:mm:ss'),
        symptoms: entry.symptoms,
        test_result: entry.test_result,
        escalated_to: entry.escalated_to || null,
        notes: entry.notes || null,
        recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name || null,
        recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role || null,
        recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uti-tests', clientId] });
      toast({ title: 'UTI test logged', description: 'Test result recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const lastTest = testsQuery.data?.[0] || null;
  const hasPositiveUTI = lastTest?.test_result === 'positive';

  return {
    tests: testsQuery.data || [],
    loading: testsQuery.isLoading,
    addTest,
    lastTest,
    hasPositiveUTI,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['uti-tests', clientId] }),
  };
}

export function useContinenceAlerts(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['continence-alerts', clientId],
    queryFn: async () => {
      const query = supabase
        .from('continence_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContinenceAlert[];
    },
  });

  return {
    alerts: alertsQuery.data || [],
    loading: alertsQuery.isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['continence-alerts', clientId] }),
  };
}

export function useContinenceStatus(clientId?: string): ContinenceStatus {
  clientId = useClientIdOrActive(clientId);
  const { config } = useContinenceConfig(clientId);
  const { changes } = usePadChanges(clientId);
  const { checks: skinChecks, isOverdue: skinCheckOverdue } = useSkinChecks(clientId);
  const { hasLowStock } = useConsumablesChecks(clientId);
  const { hasPositiveUTI } = useUTITests(clientId);
  const { alerts } = useContinenceAlerts(clientId);

  const lastPadChange = changes[0] || null;
  const now = new Date();

  // Calculate next scheduled change
  let nextScheduledChange: Date | null = null;
  let minutesUntilNext: number | null = null;
  let isOverdue = false;
  let overdueMinutes = 0;

  if (config && lastPadChange) {
    const lastChangeTime = parseISO(lastPadChange.event_occurred_at);

    if (config.schedule_type === 'hourly' && config.interval_hours) {
      nextScheduledChange = new Date(lastChangeTime.getTime() + config.interval_hours * 60 * 60 * 1000);
    } else if (config.schedule_type === 'fixed_times' && config.fixed_times.length > 0) {
      // Find next scheduled time
      const today = format(now, 'yyyy-MM-dd');
      const times = config.fixed_times.map(t => parseISO(`${today}T${t}`)).sort((a, b) => a.getTime() - b.getTime());
      nextScheduledChange = times.find(t => t > now) || null;
      if (!nextScheduledChange && times.length > 0) {
        // Next day first time
        const tomorrow = format(new Date(now.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        nextScheduledChange = parseISO(`${tomorrow}T${config.fixed_times[0]}`);
      }
    }

    if (nextScheduledChange) {
      const diffMs = nextScheduledChange.getTime() - now.getTime();
      minutesUntilNext = Math.round(diffMs / 60000);
      isOverdue = minutesUntilNext < 0;
      overdueMinutes = isOverdue ? Math.abs(minutesUntilNext) : 0;
    }
  }

  // Calculate performance score (0-100)
  const recentChanges = changes.filter(c => {
    const changeTime = parseISO(c.event_occurred_at);
    return differenceInHours(now, changeTime) <= 168; // Last 7 days
  });
  const scheduledCount = recentChanges.filter(c => c.change_reason === 'scheduled').length;
  const expectedChangesPerWeek = config?.schedule_type === 'hourly' && config.interval_hours
    ? Math.floor(168 / config.interval_hours)
    : config?.schedule_type === 'fixed_times'
    ? config.fixed_times.length * 7
    : 0;
  const performanceScore = expectedChangesPerWeek > 0
    ? Math.min(100, Math.round((scheduledCount / expectedChangesPerWeek) * 100))
    : 100;

  // Determine overall status by aggregating tile-level statuses (Red > Amber > Green)
  // This mirrors the exact logic used in ContinenceStatusTiles for each card.

  // 1. Pad Change tile status
  let padStatus: TrafficLightStatus = 'green';
  if (!lastPadChange) {
    padStatus = 'amber';
  } else if (isOverdue) {
    padStatus = 'amber'; // Late (tiles only go to monitor for late)
  }

  // 2. Skin Check tile status
  let skinStatus: TrafficLightStatus = 'green';
  const latestSkinCheck = skinChecks[0] || null;
  if (!latestSkinCheck) {
    skinStatus = 'amber';
  } else if (['broken_skin', 'fungal_signs'].includes(latestSkinCheck.skin_condition)) {
    skinStatus = 'red';
  } else if (['redness', 'rash', 'moisture_damage'].includes(latestSkinCheck.skin_condition)) {
    skinStatus = 'amber';
  }
  if (skinCheckOverdue && skinStatus === 'green') {
    skinStatus = 'amber';
  }

  // 3. Supplies tile status (only if enabled)
  let suppliesStatus: TrafficLightStatus = 'green';
  if (config?.enable_consumables_monitoring) {
    if (hasLowStock) {
      suppliesStatus = 'red'; // Low stock = action in tile
    }
    // Note: medium stock check requires consumables data not available here,
    // but hasLowStock covers the critical path
  }

  // 4. UTI tile status (only if enabled)
  let utiStatus: TrafficLightStatus = 'green';
  if (config?.enable_uti_testing) {
    if (hasPositiveUTI) {
      utiStatus = 'red';
    }
  }

  // Resolve highest priority across all tiles
  const resolvedTrafficLight = resolveHighestStatus(padStatus, skinStatus, suppliesStatus, utiStatus);
  const status: HealthStatus =
    resolvedTrafficLight === 'red' ? 'action' :
    resolvedTrafficLight === 'amber' ? 'monitor' : 'stable';

  return {
    status,
    lastPadChange,
    nextScheduledChange,
    minutesUntilNext,
    isOverdue,
    overdueMinutes,
    skinAlerts: alerts.filter(a => a.alert_type === 'skin_issue'),
    consumableAlerts: alerts.filter(a => a.alert_type === 'low_consumables'),
    utiAlerts: alerts.filter(a => a.alert_type === 'uti_positive'),
    performanceScore,
  };
}
