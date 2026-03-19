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
  CatheterBagConfig,
  CatheterType,
  BagType,
  BagCondition,
  ChangeReason,
  BagChangeReason,
  BagChangeFrequency,
  FlushSolution,
  StomaCondition,
  StomaFinding,
  StomaPainLevel,
  StomaDressingStatus,
  StomaStatusLevel,
  StomaEscalationType,
  ADSymptom,
  ADAction,
  CATHETER_TYPE_CONFIG,
} from '@/types/catheter';
import { STOMA_FINDINGS, STOMA_PAIN_LEVELS } from '@/types/catheter';
import { differenceInDays, differenceInHours, parseISO, addDays, addHours, format } from 'date-fns';

type HealthStatus = 'stable' | 'monitor' | 'action';

interface CatheterStatus {
  status: HealthStatus;
  daysUntilChange: number | null;
  isChangeOverdue: boolean;
  daysUntilFlush: number | null;
  isFlushOverdue: boolean;
  lastStomaCheck: StomaCheck | null;
  stomaAlertActive: boolean;
  stomaStatus: 'green' | 'amber' | 'red';
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
        .select('*, profiles:created_by(full_name)')
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

export function calculateStomaStatusLevel(
  findings: StomaFinding[],
  painLevel: StomaPainLevel,
  hoursSinceLastCheck: number | null
): StomaStatusLevel {
  // Red triggers
  const redFindings: StomaFinding[] = ['leakage_around_catheter', 'swelling', 'bleeding', 'pus_discharge', 'strong_odour', 'skin_breakdown'];
  const hasRedFinding = findings.some(f => redFindings.includes(f));
  const hasRedPain = painLevel === 'moderate_pain' || painLevel === 'severe_pain';

  if (hasRedFinding || hasRedPain) return 'red';

  // Amber triggers
  const amberFindings: StomaFinding[] = ['mild_redness', 'slight_tenderness', 'minor_crusting', 'moisture_around_site'];
  const hasAmberFinding = findings.some(f => amberFindings.includes(f));
  const hasAmberPain = painLevel === 'mild_discomfort';
  const missedCheck = hoursSinceLastCheck !== null && hoursSinceLastCheck > 24;

  if (hasAmberFinding || hasAmberPain || missedCheck) return 'amber';

  return 'green';
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
        .select('*, profiles:created_by(full_name)')
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
      findings: StomaFinding[];
      pain_level: StomaPainLevel;
      dressing_status: StomaDressingStatus;
      status_level: StomaStatusLevel;
      redness?: boolean;
      swelling?: boolean;
      pain?: boolean;
      leaking?: boolean;
      maceration?: boolean;
      granulation?: boolean;
      notes?: string;
      escalated_to_clinician?: boolean;
      escalation_notes?: string;
      escalation_type?: StomaEscalationType;
      action_taken?: string;
      event_occurred_at?: string;
    }) => {
      const { error } = await supabase.from('catheter_stoma_checks').insert({
        client_id: clientId || null,
        stoma_condition: entry.stoma_condition,
        findings: entry.findings,
        pain_level: entry.pain_level,
        dressing_status: entry.dressing_status,
        status_level: entry.status_level,
        redness: entry.redness || false,
        swelling: entry.swelling || false,
        pain: entry.pain || false,
        leaking: entry.leaking || false,
        maceration: entry.maceration || false,
        granulation: entry.granulation || false,
        notes: entry.notes || null,
        escalated_to_clinician: entry.escalated_to_clinician || false,
        escalation_notes: entry.escalation_notes || null,
        escalation_type: entry.escalation_type || null,
        action_taken: entry.action_taken || null,
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
  const isOverdue = hoursSinceLastCheck !== null && hoursSinceLastCheck > 24;
  const isOverdue48 = hoursSinceLastCheck !== null && hoursSinceLastCheck > 48;

  // Calculate current status from last check + time gap
  const lastFindings: StomaFinding[] = (lastCheck?.findings as StomaFinding[]) || [];
  const lastPainLevel: StomaPainLevel = (lastCheck?.pain_level as StomaPainLevel) || 'none';
  const currentStatus: StomaStatusLevel = lastCheck
    ? calculateStomaStatusLevel(lastFindings, lastPainLevel, hoursSinceLastCheck)
    : hoursSinceLastCheck === null
      ? 'green' // No checks yet, no alert
      : isOverdue48 ? 'red' : isOverdue ? 'amber' : 'green';

  const hasConcern = currentStatus !== 'green';

  // Status message
  const statusMessage = currentStatus === 'red'
    ? 'Concerning stoma findings. Escalate to Registered Nurse or GP immediately.'
    : currentStatus === 'amber'
      ? 'Monitor closely. Recheck within 24 hours. Escalate if symptoms worsen.'
      : 'Site healthy';

  return {
    checks: checksQuery.data || [],
    loading: checksQuery.isLoading,
    addCheck,
    lastCheck,
    hoursSinceLastCheck,
    isOverdue,
    isOverdue48,
    hasConcern,
    currentStatus,
    statusMessage,
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
        .select('*, profiles:created_by(full_name)')
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
      condition?: BagCondition;
      tubing_changed?: boolean;
      notes?: string;
      event_occurred_at?: string;
    }) => {
      // 1. Log the bag change
      const { error } = await supabase.from('catheter_bag_change_logs').insert({
        client_id: clientId || null,
        bag_type: entry.bag_type,
        change_reason: entry.change_reason,
        condition: entry.condition || null,
        tubing_changed: entry.tubing_changed || false,
        notes: entry.notes || null,
        event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
        created_by: user?.id,
      });
      if (error) throw error;

      // 2. Auto-decrement stock for this bag type
      const { data: bagConfig } = await supabase
        .from('catheter_bag_config')
        .select('id, stock_level, low_stock_threshold, bag_type')
        .eq('bag_type', entry.bag_type)
        .eq('is_active', true)
        .maybeSingle();

      if (bagConfig && bagConfig.stock_level > 0) {
        const newStock = bagConfig.stock_level - 1;
        await supabase
          .from('catheter_bag_config')
          .update({ stock_level: newStock, updated_by: user?.id })
          .eq('id', bagConfig.id);

        // 3. Check low stock threshold → create alert
        if (newStock <= bagConfig.low_stock_threshold) {
          const bagLabel = entry.bag_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          await supabase.from('catheter_alerts').insert({
            client_id: clientId || null,
            alert_type: 'low_consumables',
            severity: 'amber',
            message: `${bagLabel} stock running low (${newStock} remaining).`,
            metadata: { bag_type: entry.bag_type, stock_level: newStock, threshold: bagConfig.low_stock_threshold },
            created_by: user?.id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bag-changes', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-bag-config', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-alerts', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheter-status', clientId] });
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

  // Last bag change
  const lastBagChange = changesQuery.data?.[0] || null;

  return {
    changes: changesQuery.data || [],
    loading: changesQuery.isLoading,
    addChange,
    monthlyUsage: monthlyChanges.length,
    lastBagChange,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['bag-changes', clientId] }),
  };
}

// ── Catheter Bag Config (Stock Management) ──────────────────────

export function useCatheterBagConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['catheter-bag-config', clientId],
    queryFn: async () => {
      const query = supabase
        .from('catheter_bag_config')
        .select('*')
        .eq('is_active', true)
        .order('bag_type');
      if (clientId) {
        query.eq('client_id', clientId);
      } else {
        query.is('client_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CatheterBagConfig[];
    },
  });

  const upsertBagConfig = useMutation({
    mutationFn: async (configs: {
      bag_type: string;
      stock_level: number;
      low_stock_threshold: number;
      change_frequency: BagChangeFrequency | null;
      change_frequency_days: number | null;
      is_active: boolean;
    }[]) => {
      for (const cfg of configs) {
        const { data: existing } = await supabase
          .from('catheter_bag_config')
          .select('id')
          .eq('client_id', clientId || '')
          .eq('bag_type', cfg.bag_type)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('catheter_bag_config')
            .update({
              stock_level: cfg.stock_level,
              low_stock_threshold: cfg.low_stock_threshold,
              change_frequency: cfg.change_frequency,
              change_frequency_days: cfg.change_frequency_days,
              is_active: cfg.is_active,
              updated_by: user?.id,
            })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('catheter_bag_config')
            .insert({
              client_id: clientId || null,
              bag_type: cfg.bag_type,
              stock_level: cfg.stock_level,
              low_stock_threshold: cfg.low_stock_threshold,
              change_frequency: cfg.change_frequency,
              change_frequency_days: cfg.change_frequency_days,
              is_active: cfg.is_active,
              created_by: user?.id,
            });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catheter-bag-config', clientId] });
      toast({ title: 'Bag configuration saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ bagConfigId, newStock }: { bagConfigId: string; newStock: number }) => {
      const { error } = await supabase
        .from('catheter_bag_config')
        .update({ stock_level: newStock, updated_by: user?.id })
        .eq('id', bagConfigId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catheter-bag-config', clientId] });
    },
  });

  // Calculate stock statuses
  const stockItems = (configQuery.data || []).map(cfg => {
    const isLow = cfg.stock_level <= cfg.low_stock_threshold;
    const isMedium = !isLow && cfg.stock_level <= cfg.low_stock_threshold * 2;
    const status: 'good' | 'medium' | 'low' = isLow ? 'low' : isMedium ? 'medium' : 'good';
    return { ...cfg, status };
  });

  const hasLowStock = stockItems.some(s => s.status === 'low');

  return {
    configs: configQuery.data || [],
    stockItems,
    hasLowStock,
    loading: configQuery.isLoading,
    upsertBagConfig,
    updateStock,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['catheter-bag-config', clientId] }),
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
  
  // Handle compound values like "prn, custom" — check if 'custom' is included
  const normalizedFreq = frequency.toLowerCase();
  
  if (normalizedFreq === 'daily') return 24;
  if (normalizedFreq === 'twice_daily') return 12;
  
  // If frequency contains 'custom', try to parse the custom interval
  if (normalizedFreq.includes('custom') || normalizedFreq === 'custom') {
    if (!customInterval) return null;
    const ci = customInterval.toLowerCase().trim();
    
    // Handle single-word intervals
    if (ci === 'weekly') return 7 * 24;
    if (ci === 'daily') return 24;
    if (ci === 'fortnightly') return 14 * 24;
    
    // Handle "every X days/hours" patterns
    const match = ci.match(/(\d+)\s*(day|hour|hr|week|wk)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('day')) return num * 24;
      if (unit.startsWith('hour') || unit === 'hr') return num;
      if (unit.startsWith('week') || unit === 'wk') return num * 7 * 24;
    }
    return null;
  }
  
  if (normalizedFreq === 'prn' || normalizedFreq === 'as_needed') return null; // No schedule
  
  return null;
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
      // Prefer published plan; fall back to draft
      let query = supabase
        .from('catheter_care_plans')
        .select('change_interval, flush_prescribed, flush_frequency, flush_custom_interval')
        .order('version', { ascending: false })
        .limit(1);
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      // Try published first
      const { data: published } = await query.eq('status', 'published').maybeSingle();
      if (published) return published;

      // Fall back to draft
      let draftQuery = supabase
        .from('catheter_care_plans')
        .select('change_interval, flush_prescribed, flush_frequency, flush_custom_interval')
        .eq('status', 'draft')
        .order('version', { ascending: false })
        .limit(1);
      if (clientId) {
        draftQuery = draftQuery.eq('client_id', clientId);
      } else {
        draftQuery = draftQuery.is('client_id', null);
      }
      const { data: draft } = await draftQuery.maybeSingle();
      return draft;
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

  // Calculate days until next flush
  let daysUntilFlush: number | null = null;
  let isFlushOverdue = false;

  if (flushFrequencyHours && lastFlush) {
    const lastFlushTime = parseISO(lastFlush.event_occurred_at);
    const nextFlushTime = addHours(lastFlushTime, flushFrequencyHours);
    daysUntilFlush = differenceInDays(nextFlushTime, now);
    isFlushOverdue = daysUntilFlush < 0;
  }

  // Determine per-tile statuses, then resolve highest
  // Catheter Change tile status
  const changeStatus: HealthStatus = isChangeOverdue ? 'action'
    : (daysUntilChange !== null && daysUntilChange <= 3) ? 'monitor' : 'stable';

  // Flush tile status
  const flushStatus: HealthStatus = isFlushOverdue ? 'action'
    : (daysUntilFlush !== null && daysUntilFlush <= 1) ? 'monitor' : 'stable';

  // Stoma tile status — use actual stoma level (green/amber/red)
  const stomaCurrentStatus = lastStomaCheck ? (hasConcern ? 
    // Map the stoma's own currentStatus to HealthStatus
    (() => {
      const checks = [lastStomaCheck];
      const findings: StomaFinding[] = (checks[0]?.findings as StomaFinding[]) || [];
      const painLevel: StomaPainLevel = (checks[0]?.pain_level as StomaPainLevel) || 'none';
      const stomaLevel = calculateStomaStatusLevel(findings, painLevel, 
        differenceInHours(new Date(), parseISO(checks[0].event_occurred_at)));
      return stomaLevel;
    })() : 'green') : 'green';

  const stomaHealthStatus: HealthStatus = stomaCurrentStatus === 'red' ? 'action'
    : stomaCurrentStatus === 'amber' ? 'monitor' : 'stable';

  // Resolve highest: Red > Amber > Green
  let status: HealthStatus = 'stable';
  if ([changeStatus, flushStatus, stomaHealthStatus].includes('action')) {
    status = 'action';
  } else if ([changeStatus, flushStatus, stomaHealthStatus].includes('monitor')) {
    status = 'monitor';
  }

  return {
    status,
    daysUntilChange,
    isChangeOverdue,
    daysUntilFlush,
    isFlushOverdue,
    lastStomaCheck,
    stomaAlertActive: hasConcern || false,
    stomaStatus: stomaCurrentStatus as 'green' | 'amber' | 'red',
    activeAlerts: alerts,
    monthlyBagUsage: monthlyUsage,
    changeFrequencyDays,
    loading: configLoading || changesLoading || flushLoading || stomaLoading || alertsLoading || planQuery.isLoading,
  };
}
