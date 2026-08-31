/**
 * Health Monitoring Module Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateEntryStatuses } from '@/utils/vitalSignStatusCalculator';
import { computeHealthMonitoringStatus } from '@/utils/computeHealthMonitoringStatus';
import type {
  VitalSignEntry,
  VitalSignConfig,
  AlteredCriteria,
  VitalSignAlert,
  VitalSignActionLog,
  VitalType,
  HealthMonitoringStatusInfo,
} from '@/types/healthMonitoring';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

// Default config values
const DEFAULT_CONFIG: Partial<VitalSignConfig> = {
  temperature_enabled: true,
  bp_enabled: true,
  oxygen_enabled: true,
  heart_rate_enabled: true,
  respiratory_enabled: true,
  amber_recheck_hours: 2,
  escalation_recipients: [],
  enable_log_on_behalf: false,
};

// ==================== CONFIG HOOK ====================

export function useVitalSignConfig(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['vitalSignConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('vital_sign_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as VitalSignConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<VitalSignConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (config?.id) {
        const { data, error } = await supabase
          .from('vital_sign_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vital_sign_config')
          .insert({
            ...DEFAULT_CONFIG,
            ...updates,
            client_id: clientId || null,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Health monitoring configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG as VitalSignConfig),
    isLoading,
    error,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

// ==================== ENTRIES HOOK ====================

export function useVitalSignEntries(clientId?: string, limit = 50) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['vitalSignEntries', clientId, limit],
    queryFn: async () => {
      let query = supabase
        .from('vital_sign_entries')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VitalSignEntry[];
    },
  });

  // Fetch altered criteria for status calculations
  const { criteriaMap } = useAlteredCriteria(clientId);

  const addEntry = useMutation({
    mutationFn: async (entry: Partial<VitalSignEntry>) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Calculate statuses using altered criteria if configured
      const statuses = calculateEntryStatuses(entry, criteriaMap);

      const { data, error } = await supabase
        .from('vital_sign_entries')
        .insert([{
          temperature_celsius: entry.temperature_celsius,
          bp_systolic: entry.bp_systolic,
          bp_diastolic: entry.bp_diastolic,
          oxygen_saturation: entry.oxygen_saturation,
          heart_rate: entry.heart_rate,
          respiratory_rate: entry.respiratory_rate,
          ...statuses,
          symptoms: entry.symptoms || [],
          notes: entry.notes,
          event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
          recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name || null,
          recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role || null,
          recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason || null,
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignEntries', clientId] });
      queryClient.invalidateQueries({ queryKey: ['vitalSignStatus', clientId] });
      queryClient.invalidateQueries({ queryKey: ['vitalSignAlerts', clientId] });
      toast({ title: 'Entry logged', description: 'Vital signs have been recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, editReason, ...updates }: Partial<VitalSignEntry> & { id: string; editReason: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const statuses = calculateEntryStatuses(updates, criteriaMap);

      const { data, error } = await supabase
        .from('vital_sign_entries')
        .update({
          ...updates,
          ...statuses,
          edited_by: user.id,
          edited_at: new Date().toISOString(),
          edit_reason: editReason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignEntries', clientId] });
      queryClient.invalidateQueries({ queryKey: ['vitalSignStatus', clientId] });
      toast({ title: 'Entry updated', description: 'Vital signs have been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    entries,
    isLoading,
    error,
    addEntry: addEntry.mutate,
    updateEntry: updateEntry.mutate,
    isAdding: addEntry.isPending,
  };
}

// ==================== ALERTS HOOK ====================

export function useVitalSignAlerts(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['vitalSignAlerts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('vital_sign_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VitalSignAlert[];
    },
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<VitalSignAlert>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vital_sign_alerts')
        .insert([{
          alert_type: alert.alert_type || 'manual',
          vital_type: alert.vital_type,
          severity: alert.severity || 'amber',
          message: alert.message || '',
          recommended_action: alert.recommended_action,
          vital_entry_id: alert.vital_entry_id,
          is_trend_alert: alert.is_trend_alert || false,
          trend_data: alert.trend_data ? JSON.parse(JSON.stringify(alert.trend_data)) : null,
          metadata: JSON.parse(JSON.stringify(alert.metadata || {})),
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignAlerts', clientId] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({
      id,
      resolved_reason,
      action_taken,
      emergency_services_contacted,
      emergency_contact_time,
      outcome,
    }: {
      id: string;
      resolved_reason?: string;
      action_taken?: string;
      emergency_services_contacted?: boolean;
      emergency_contact_time?: string;
      outcome?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vital_sign_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolved_reason,
          action_taken,
          emergency_services_contacted,
          emergency_contact_time,
          outcome,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignAlerts', clientId] });
      toast({ title: 'Alert resolved', description: 'The alert has been marked as resolved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    alerts,
    isLoading,
    error,
    createAlert: createAlert.mutate,
    resolveAlert: resolveAlert.mutate,
  };
}

// ==================== ALTERED CRITERIA HOOK ====================

export function useAlteredCriteria(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: criteria = [], isLoading, error } = useQuery({
    queryKey: ['alteredCriteria', clientId],
    queryFn: async () => {
      let query = supabase
        .from('vital_sign_altered_criteria')
        .select('*')
        .eq('is_active', true);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AlteredCriteria[];
    },
  });

  const upsertCriteria = useMutation({
    mutationFn: async (criteriaData: Partial<AlteredCriteria> & { vital_type: VitalType }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if criteria already exists for this vital type
      const existing = criteria.find(c => c.vital_type === criteriaData.vital_type);

      if (existing) {
        const { data, error } = await supabase
          .from('vital_sign_altered_criteria')
          .update({
            ...criteriaData,
            updated_by: user.id,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vital_sign_altered_criteria')
          .insert([{
            ...criteriaData,
            client_id: clientId || null,
            created_by: user.id,
            updated_by: user.id,
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alteredCriteria', clientId] });
      toast({ title: 'Criteria saved', description: 'Altered criteria has been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const approveCriteria = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vital_sign_altered_criteria')
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alteredCriteria', clientId] });
      toast({ title: 'Criteria approved', description: 'Altered criteria is now active.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deactivateCriteria = useMutation({
    mutationFn: async (vitalType: VitalType) => {
      if (!user?.id) throw new Error('Not authenticated');

      const existing = criteria.find(c => c.vital_type === vitalType);
      if (!existing) return null;

      const { data, error } = await supabase
        .from('vital_sign_altered_criteria')
        .update({
          is_active: false,
          updated_by: user.id,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alteredCriteria', clientId] });
      toast({ title: 'Criteria disabled', description: 'Altered criteria has been deactivated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Convert to a map for easy lookup
  const criteriaMap = criteria.reduce((acc, c) => {
    acc[c.vital_type] = c;
    return acc;
  }, {} as Record<VitalType, AlteredCriteria | null>);

  return {
    criteria,
    criteriaMap,
    isLoading,
    error,
    upsertCriteria: upsertCriteria.mutate,
    approveCriteria: approveCriteria.mutate,
    deactivateCriteria: deactivateCriteria.mutate,
    isUpdating: upsertCriteria.isPending,
  };
}

// ==================== STATUS HOOK ====================

export function useHealthMonitoringStatus(clientId?: string): HealthMonitoringStatusInfo {
  clientId = useClientIdOrActive(clientId);
  const { entries } = useVitalSignEntries(clientId, 50);
  const { alerts } = useVitalSignAlerts(clientId);
  const { criteriaMap } = useAlteredCriteria(clientId);
  // IMPORTANT: use raw config from DB (not DEFAULT_CONFIG fallback) so frequency hours are always present
  const { data: rawConfig } = useQuery({
    queryKey: ['vitalSignConfig', clientId, 'raw'],
    queryFn: async () => {
      let query = supabase.from('vital_sign_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as import('@/types/healthMonitoring').VitalSignConfig | null;
    },
  });

  const computed = computeHealthMonitoringStatus({
    config: rawConfig ?? null,
    entries,
    alerts,
    alteredCriteriaMap: criteriaMap,
  });

  // Map computed result to the HealthMonitoringStatusInfo shape expected by existing UI
  const vitalStatuses: Record<import('@/types/healthMonitoring').VitalType, import('@/types/healthMonitoring').VitalStatus | null> = {
    temperature: computed.perVitalStatuses.find(v => v.vitalKey === 'temperature')?.statusColor ?? null,
    bp_systolic: computed.perVitalStatuses.find(v => v.vitalKey === 'bp')?.statusColor ?? null,
    bp_diastolic: computed.perVitalStatuses.find(v => v.vitalKey === 'bp')?.statusColor ?? null,
    oxygen: computed.perVitalStatuses.find(v => v.vitalKey === 'oxygen')?.statusColor ?? null,
    heart_rate: computed.perVitalStatuses.find(v => v.vitalKey === 'heart_rate')?.statusColor ?? null,
    respiratory: computed.perVitalStatuses.find(v => v.vitalKey === 'respiratory')?.statusColor ?? null,
  };

  return {
    status: computed.moduleStatus,
    message: computed.message,
    latestEntry: computed.latestEntry,
    activeAlerts: alerts,
    vitalStatuses,
    overdueVitals: computed.overdueVitals,
  };
}

// ==================== ACTION LOGS HOOK ====================

export function useVitalSignActionLogs(clientId?: string, alertId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['vitalSignActionLogs', clientId, alertId],
    queryFn: async () => {
      let query = supabase
        .from('vital_sign_action_logs')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .limit(50);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (alertId) {
        query = query.eq('alert_id', alertId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VitalSignActionLog[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (log: Partial<VitalSignActionLog>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vital_sign_action_logs')
        .insert([{
          action_type: log.action_type || 'recheck',
          action_description: log.action_description || '',
          contacted_person: log.contacted_person,
          contact_role: log.contact_role,
          contact_time: log.contact_time,
          advice_received: log.advice_received,
          outcome: log.outcome,
          follow_up_required: log.follow_up_required || false,
          follow_up_due_at: log.follow_up_due_at,
          alert_id: log.alert_id,
          vital_entry_id: log.vital_entry_id,
          event_occurred_at: log.event_occurred_at || new Date().toISOString(),
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitalSignActionLogs', clientId, alertId] });
      toast({ title: 'Action logged', description: 'Response has been documented.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    logs,
    isLoading,
    error,
    addLog: addLog.mutate,
    isAdding: addLog.isPending,
  };
}
