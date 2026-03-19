/**
 * Bowel Care Module Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateBowelCareStatus, toBowelCareStatusInfo } from '@/utils/bowelCareStatusCalculator';
import type {
  BowelCareConfig,
  PrnMedication,
  BowelLogEntry,
  PrnAdministration,
  BowelCareAlert,
  EscalationRecord,
  BowelCareStatus,
  BowelCareStatusInfo,
  BowelIndicators,
} from '@/types/bowelCare';

// Default config values
const DEFAULT_CONFIG: Partial<BowelCareConfig> = {
  no_bm_days_threshold: 3,
  type1_consecutive_days_threshold: 2,
  monitor_hours_after_prn: 6,
  no_bm_after_prn_hours_escalation: 12,
  prn_dose_lookback_window_hours: 48,
  max_prn_doses_in_window: 3,
  max_prn_doses_per_24h: 2,
  diarrhoea_type67_count_threshold: 3,
  diarrhoea_hours_window: 48,
  escalation_recipients: ['supervisor', 'nurse'],
  enable_log_on_behalf: false,
  amber_no_bm_days_threshold: 2,
  red_no_bm_days_threshold: 3,
  amber_type1_consecutive_days: 1,
  red_type1_consecutive_days: 2,
  amber_diarrhoea_count: 1,
  red_diarrhoea_count: 3,
};

export function useBowelCareConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['bowelCareConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('bowel_care_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as BowelCareConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<BowelCareConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (config?.id) {
        const { data, error } = await supabase
          .from('bowel_care_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('bowel_care_config')
          .insert({
            ...DEFAULT_CONFIG,
            ...updates,
            client_id: clientId,
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
      queryClient.invalidateQueries({ queryKey: ['bowelCareConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Bowel care configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG as BowelCareConfig),
    isLoading,
    error,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

export function usePrnMedications(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading, error } = useQuery({
    queryKey: ['prnMedications', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_prn_medications')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PrnMedication[];
    },
    enabled: !!clientId,
  });

  const addMedication = useMutation({
    mutationFn: async (med: Partial<PrnMedication>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_prn_medications')
        .insert([{
          medication_name: med.medication_name || '',
          dose_instructions: med.dose_instructions || '',
          route: med.route,
          notes: med.notes,
          client_id: clientId,
          created_by: user.id,
          updated_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prnMedications', clientId] });
      toast({ title: 'Medication added', description: 'PRN medication has been configured.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMedication = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PrnMedication> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_prn_medications')
        .update({ ...updates, updated_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prnMedications', clientId] });
      toast({ title: 'Medication updated', description: 'PRN medication has been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const removeMedication = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bowel_prn_medications')
        .update({ is_active: false, updated_by: user.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prnMedications', clientId] });
      toast({ title: 'Medication removed', description: 'PRN medication has been deactivated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    medications,
    isLoading,
    error,
    addMedication: addMedication.mutate,
    updateMedication: updateMedication.mutate,
    removeMedication: removeMedication.mutate,
    isAdding: addMedication.isPending,
  };
}

export function useBowelLogs(clientId?: string, limit = 50) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['bowelLogs', clientId, limit],
    queryFn: async () => {
      let query = supabase
        .from('bowel_log_entries')
        .select('*')
        .order('event_occurred_at', { ascending: false })
        .limit(limit);
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BowelLogEntry[];
    },
  });

  const addLog = useMutation({
    mutationFn: async (entry: Partial<BowelLogEntry>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_log_entries')
        .insert([{
          bristol_type: entry.bristol_type ?? 0,
          stool_size: entry.stool_size,
          observed_status: entry.observed_status || 'observed',
          indicators: JSON.parse(JSON.stringify(entry.indicators || {})),
          notes: entry.notes,
          event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
          recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name || null,
          recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role || null,
          recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason || null,
          client_id: clientId,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bowelLogs', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCareStatus', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCareAlerts', clientId] });
      toast({ title: 'Entry logged', description: 'Bowel movement has been recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, editReason, ...updates }: Partial<BowelLogEntry> & { id: string; editReason: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_log_entries')
        .update({
          bristol_type: updates.bristol_type,
          stool_size: updates.stool_size,
          observed_status: updates.observed_status,
          indicators: updates.indicators ? JSON.parse(JSON.stringify(updates.indicators)) : undefined,
          notes: updates.notes,
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
      queryClient.invalidateQueries({ queryKey: ['bowelLogs', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCareStatus', clientId] });
      toast({ title: 'Entry updated', description: 'Bowel log has been updated.' });
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
    updateLog: updateLog.mutate,
    isAdding: addLog.isPending,
  };
}

export function usePrnAdministrations(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: administrations = [], isLoading, error } = useQuery({
    queryKey: ['prnAdministrations', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_prn_administrations')
        .select('*')
        .order('administration_time', { ascending: false })
        .limit(50);
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PrnAdministration[];
    },
  });

  const recordAdministration = useMutation({
    mutationFn: async (admin: Partial<PrnAdministration>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_prn_administrations')
        .insert([{
          medication_id: admin.medication_id,
          medication_name: admin.medication_name || '',
          dose_given: admin.dose_given || '',
          prior_bristol_type: admin.prior_bristol_type,
          monitoring_end_time: admin.monitoring_end_time,
          notes: admin.notes,
          client_id: clientId,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prnAdministrations', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCareStatus', clientId] });
      toast({ title: 'PRN recorded', description: 'Laxative administration has been logged.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const recordOutcome = useMutation({
    mutationFn: async ({ id, ...outcome }: { id: string; bowel_motion_occurred: boolean; outcome_bristol_type?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_prn_administrations')
        .update({
          ...outcome,
          outcome_recorded_at: new Date().toISOString(),
          edited_by: user.id,
          edited_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prnAdministrations', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCareStatus', clientId] });
      toast({ title: 'Outcome recorded', description: 'PRN monitoring outcome has been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    administrations,
    isLoading,
    error,
    recordAdministration: recordAdministration.mutate,
    recordOutcome: recordOutcome.mutate,
    isRecording: recordAdministration.isPending,
  };
}

export function useBowelCareAlerts(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['bowelCareAlerts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_care_alerts')
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
      return data as BowelCareAlert[];
    },
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<BowelCareAlert>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_care_alerts')
        .insert([{
          alert_type: alert.alert_type || 'constipation_threshold',
          severity: alert.severity || 'amber',
          message: alert.message || '',
          metadata: alert.metadata ? JSON.parse(JSON.stringify(alert.metadata)) : {},
          client_id: clientId,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bowelCareAlerts', clientId] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_care_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bowelCareAlerts', clientId] });
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

export function useBowelCareStatus(clientId?: string) {
  const { config } = useBowelCareConfig(clientId);
  const { logs } = useBowelLogs(clientId, 50);
  const { alerts } = useBowelCareAlerts(clientId);

  const [statusInfo, setStatusInfo] = useState<BowelCareStatusInfo>({
    status: 'ideal',
    message: 'Regular bowel pattern',
    daysSinceLastBm: null,
    lastBristolType: null,
    activeAlerts: [],
  });

  useEffect(() => {
    // Use the centralized status calculator for single source of truth
    const calculated = calculateBowelCareStatus(
      logs as { id: string; bristol_type: number; entry_time: string; event_occurred_at: string | null; indicators?: BowelIndicators }[],
      config,
      alerts
    );
    
    setStatusInfo(toBowelCareStatusInfo(calculated, alerts));
  }, [logs, alerts, config]);

  return statusInfo;
}

export function useEscalationRecords(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['escalationRecords', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bowel_escalation_records')
        .select('*')
        .eq('client_id', clientId || '')
        .order('contact_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as EscalationRecord[];
    },
    enabled: !!clientId,
  });

  const recordEscalation = useMutation({
    mutationFn: async (record: Partial<EscalationRecord>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bowel_escalation_records')
        .insert([{
          escalation_reason: record.escalation_reason || '',
          contacted_person: record.contacted_person || '',
          contact_role: record.contact_role,
          advice_received: record.advice_received,
          alert_id: record.alert_id,
          client_id: clientId,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalationRecords', clientId] });
      toast({ title: 'Escalation recorded', description: 'Contact details have been logged.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    records,
    isLoading,
    error,
    recordEscalation: recordEscalation.mutate,
    isRecording: recordEscalation.isPending,
  };
}
