/**
 * Urinary Catheter Management Module - Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CatheterConfig,
  CatheterChangeLog,
  FlushLog,
  StomaCheck,
  BagChangeLog,
  CatheterAlert,
  ConsumablesUsage,
  AutonomicRiskLog,
  CatheterType,
  BagType,
  ChangeReason,
  BagChangeReason,
  FlushSolution,
  StomaCondition,
  ADSymptom,
  ADAction,
  CATHETER_TYPE_CONFIG,
} from '@/types/catheter';
import { differenceInDays, differenceInHours, parseISO, addDays, addHours, format } from 'date-fns';

type HealthStatus = 'stable' | 'monitor' | 'action';

interface CatheterStatus {
  status: HealthStatus;
  daysUntilChange: number | null;
  isChangeOverdue: boolean;
  hoursUntilFlush: number | null;
  isFlushOverdue: boolean;
  lastStomaCheck: StomaCheck | null;
  stomaAlertActive: boolean;
  activeAlerts: CatheterAlert[];
  monthlyBagUsage: number;
  changeFrequencyDays: number;
}

export function useCatheterConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['catheter-config', clientId],
    queryFn: async () => {
      const query = supabase.from('catheter_config').select('*');
      if (clientId) {
        query.eq('client_id', clientId);
      } else {
        query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as CatheterConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (config: Partial<CatheterConfig>) => {
      const payload = {
        ...config,
        client_id: clientId || null,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (configQuery.data?.id) {
        const { error } = await supabase
          .from('catheter_config')
          .update(payload)
          .eq('id', configQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('catheter_config')
          .insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catheter-config', clientId] });
      toast({ title: 'Settings saved', description: 'Catheter configuration updated.' });
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

export function useCatheterChanges(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const changesQuery = useQuery({
    queryKey: ['catheter-changes', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_change_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CatheterChangeLog[];
    },
  });

  const addChange = useMutation({
    mutationFn: async (entry: {
      catheter_type: CatheterType;
      catheter_size?: string;
      change_reason: ChangeReason;
      notes?: string;
      event_occurred_at?: string;
      recorded_on_behalf_of_name?: string;
      recorded_on_behalf_of_role?: string;
      recorded_on_behalf_of_reason?: string;
    }) => {
      const { error } = await supabase.from('catheter_change_logs').insert({
        client_id: clientId || null,
        catheter_type: entry.catheter_type,
        catheter_size: entry.catheter_size || null,
        change_reason: entry.change_reason,
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
      queryClient.invalidateQueries({ queryKey: ['catheter-changes', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-status', clientId] });
      toast({ title: 'Catheter change logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    changes: changesQuery.data || [],
    loading: changesQuery.isLoading,
    addChange,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['catheter-changes', clientId] }),
  };
}

export function useFlushLogs(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['flush-logs', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_flush_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FlushLog[];
    },
  });

  const addFlush = useMutation({
    mutationFn: async (entry: {
      flush_volume_ml?: number;
      flush_solution?: FlushSolution;
      output_description?: string;
      notes?: string;
      event_occurred_at?: string;
      return_volume_ml?: number;
      flush_reason?: string;
      urine_appearance?: string;
      flow_after_flush?: string;
      person_response?: string;
      training_confirmed?: boolean;
      escalation_required?: boolean;
    }) => {
      const { error } = await supabase.from('catheter_flush_logs').insert({
        client_id: clientId || null,
        flush_volume_ml: entry.flush_volume_ml || null,
        flush_solution: entry.flush_solution || 'saline',
        output_description: entry.output_description || null,
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        return_volume_ml: entry.return_volume_ml || null,
        flush_reason: entry.flush_reason || null,
        urine_appearance: entry.urine_appearance || null,
        flow_after_flush: entry.flow_after_flush || null,
        person_response: entry.person_response || null,
        training_confirmed: entry.training_confirmed || false,
        escalation_required: entry.escalation_required || false,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flush-logs', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-status', clientId] });
      toast({ title: 'Flush logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const lastFlush = logsQuery.data?.[0] || null;

  return {
    logs: logsQuery.data || [],
    loading: logsQuery.isLoading,
    addFlush,
    lastFlush,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['flush-logs', clientId] }),
  };
}

export function useStomaChecks(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checksQuery = useQuery({
    queryKey: ['stoma-checks', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_stoma_checks')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StomaCheck[];
    },
  });

  const addCheck = useMutation({
    mutationFn: async (entry: {
      stoma_condition: StomaCondition;
      redness?: boolean;
      swelling?: boolean;
      pain?: boolean;
      leaking?: boolean;
      maceration?: boolean;
      granulation?: boolean;
      notes?: string;
      escalated_to_clinician?: boolean;
      escalation_notes?: string;
      event_occurred_at?: string;
    }) => {
      const { error } = await supabase.from('catheter_stoma_checks').insert({
        client_id: clientId || null,
        stoma_condition: entry.stoma_condition,
        redness: entry.redness || false,
        swelling: entry.swelling || false,
        pain: entry.pain || false,
        leaking: entry.leaking || false,
        maceration: entry.maceration || false,
        granulation: entry.granulation || false,
        notes: entry.notes || null,
        escalated_to_clinician: entry.escalated_to_clinician || false,
        escalation_notes: entry.escalation_notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stoma-checks', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-status', clientId] });
      toast({ title: 'Stoma check logged', description: 'Entry recorded successfully.' });
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
  const hasConcern = lastCheck && lastCheck.stoma_condition !== 'healthy';

  return {
    checks: checksQuery.data || [],
    loading: checksQuery.isLoading,
    addCheck,
    lastCheck,
    hoursSinceLastCheck,
    isOverdue,
    hasConcern,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['stoma-checks', clientId] }),
  };
}

export function useBagChanges(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const changesQuery = useQuery({
    queryKey: ['bag-changes', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_bag_change_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(100);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BagChangeLog[];
    },
  });

  const addChange = useMutation({
    mutationFn: async (entry: {
      bag_type: BagType;
      change_reason: BagChangeReason;
      notes?: string;
      event_occurred_at?: string;
    }) => {
      const { error } = await supabase.from('catheter_bag_change_logs').insert({
        client_id: clientId || null,
        bag_type: entry.bag_type,
        change_reason: entry.change_reason,
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bag-changes', clientId] });
      toast({ title: 'Bag change logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate monthly usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyChanges = (changesQuery.data || []).filter(c =>
    parseISO(c.event_occurred_at) >= monthStart
  );

  return {
    changes: changesQuery.data || [],
    loading: changesQuery.isLoading,
    addChange,
    monthlyUsage: monthlyChanges.length,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['bag-changes', clientId] }),
  };
}

export function useCatheterAlerts(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['catheter-alerts', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CatheterAlert[];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, reason }: { alertId: string; reason: string }) => {
      const { error } = await supabase
        .from('catheter_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolved_reason: reason,
        })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catheter-alerts', clientId] });
      toast({ title: 'Alert resolved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    alerts: alertsQuery.data || [],
    loading: alertsQuery.isLoading,
    resolveAlert,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['catheter-alerts', clientId] }),
  };
}

export function useAutonomicRiskLogs(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['autonomic-risk-logs', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_autonomic_risk_logs')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(50);
      if (clientId) {
        query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AutonomicRiskLog[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (entry: {
      symptoms: ADSymptom[];
      actions_taken: ADAction[];
      outcome?: string;
      escalated?: boolean;
      escalated_to?: string;
      notes?: string;
      event_occurred_at?: string;
    }) => {
      const { error } = await supabase.from('catheter_autonomic_risk_logs').insert({
        client_id: clientId || null,
        symptoms: entry.symptoms,
        actions_taken: entry.actions_taken,
        outcome: entry.outcome || null,
        escalated: entry.escalated || false,
        escalated_to: entry.escalated_to || null,
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autonomic-risk-logs', clientId] });
      toast({ title: 'AD event logged', description: 'Entry recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    logs: logsQuery.data || [],
    loading: logsQuery.isLoading,
    addLog,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['autonomic-risk-logs', clientId] }),
  };
}

/**
 * Parse a change_interval string from the Digital Care Plan into days.
 * Supports formats like "Every 4 weeks", "Every 28 days", "4 weeks", "28 days", etc.
 * Falls back to config.change_frequency_days if unable to parse.
 */
function parseChangeIntervalToDays(interval: string | null | undefined): number | null {
  if (!interval) return null;
  const normalized = interval.toLowerCase().trim();
  
  // Try to extract number + unit
  const match = normalized.match(/(\d+)\s*(week|wk|day|month)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('week') || unit === 'wk') return num * 7;
    if (unit.startsWith('day')) return num;
    if (unit.startsWith('month')) return num * 30;
  }
  
  return null;
}

/**
 * Parse a flush_frequency string from the Digital Care Plan into hours.
 */
function parseFlushFrequencyToHours(frequency: string | null | undefined, customInterval: string | null | undefined): number | null {
  if (!frequency) return null;
  switch (frequency) {
    case 'daily': return 24;
    case 'twice_daily': return 12;
    case 'custom': {
      // Try to parse custom interval (e.g. "every 10 days", "every 3 days")
      if (!customInterval) return null;
      const match = customInterval.toLowerCase().match(/(\d+)\s*(day|hour|hr)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('day')) return num * 24;
        if (unit.startsWith('hour') || unit === 'hr') return num;
      }
      return null;
    }
    case 'prn': return null; // As needed, no schedule
    default: return null;
  }
}

export function useCatheterStatus(clientId?: string): CatheterStatus & { loading: boolean } {
  const { config, loading: configLoading } = useCatheterConfig(clientId);
  const { changes, loading: changesLoading } = useCatheterChanges(clientId);
  const { lastFlush, loading: flushLoading } = useFlushLogs(clientId);
  const { lastCheck: lastStomaCheck, hasConcern, loading: stomaLoading } = useStomaChecks(clientId);
  const { alerts, loading: alertsLoading } = useCatheterAlerts(clientId);
  const { monthlyUsage } = useBagChanges(clientId);

  // Import care plan as single source of truth
  const planQuery = useQuery({
    queryKey: ['catheterCarePlan-status', clientId],
    queryFn: async () => {
      let query = supabase
        .from('catheter_care_plans')
        .select('change_interval, flush_prescribed, flush_frequency, flush_custom_interval')
        .in('status', ['draft', 'published'])
        .order('version', { ascending: false })
        .limit(1);
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const plan = planQuery.data;

  const now = new Date();
  const lastChange = changes[0] || null;

  // Derive change frequency: Care Plan is source of truth, fall back to config
  const planChangeDays = parseChangeIntervalToDays(plan?.change_interval);
  const changeFrequencyDays = planChangeDays ?? (config?.change_frequency_days || 0);

  // Calculate days until next catheter change
  let daysUntilChange: number | null = null;
  let isChangeOverdue = false;

  if (lastChange && changeFrequencyDays > 0) {
    const lastChangeDate = parseISO(lastChange.event_occurred_at);
    const nextChangeDate = addDays(lastChangeDate, changeFrequencyDays);
    daysUntilChange = differenceInDays(nextChangeDate, now);
    isChangeOverdue = daysUntilChange < 0;
  }

  // Derive flush frequency: Care Plan is source of truth, fall back to config
  const planFlushHours = plan?.flush_prescribed
    ? parseFlushFrequencyToHours(plan.flush_frequency, plan.flush_custom_interval)
    : null;
  const flushFrequencyHours = planFlushHours ?? (config?.flush_frequency_hours || null);

  // Calculate hours until next flush
  let hoursUntilFlush: number | null = null;
  let isFlushOverdue = false;

  if (flushFrequencyHours && lastFlush) {
    const lastFlushTime = parseISO(lastFlush.event_occurred_at);
    const nextFlushTime = addHours(lastFlushTime, flushFrequencyHours);
    hoursUntilFlush = differenceInHours(nextFlushTime, now);
    isFlushOverdue = hoursUntilFlush < 0;
  }

  // Determine overall status
  let status: HealthStatus = 'stable';

  if (isChangeOverdue || isFlushOverdue || (hasConcern && lastStomaCheck)) {
    status = 'action';
  } else if ((daysUntilChange !== null && daysUntilChange <= 3) || 
             (hoursUntilFlush !== null && hoursUntilFlush <= 6)) {
    status = 'monitor';
  }

  return {
    status,
    daysUntilChange,
    isChangeOverdue,
    hoursUntilFlush,
    isFlushOverdue,
    lastStomaCheck,
    stomaAlertActive: hasConcern || false,
    activeAlerts: alerts,
    monthlyBagUsage: monthlyUsage,
    changeFrequencyDays,
    loading: configLoading || changesLoading || flushLoading || stomaLoading || alertsLoading || planQuery.isLoading,
  };
}
