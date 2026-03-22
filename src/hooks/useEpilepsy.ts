/**
 * Epilepsy & Seizure Monitoring Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateEpilepsyStatus } from '@/utils/epilepsyStatusCalculator';
import type {
  EpilepsyConfig,
  SeizureEvent,
  SeizureAction,
  EpilepsyAlert,
  EpilepsyStatusInfo,
} from '@/types/epilepsy';

const DEFAULT_CONFIG: Partial<EpilepsyConfig> = {
  enable_seizure_monitoring: true,
  expected_seizure_frequency: 'unknown',
  rescue_medication_prescribed: false,
  call_000_after_minutes: 5,
  cluster_seizure_count: 2,
  cluster_seizure_hours: 24,
  max_seizures_24h: 3,
  duration_threshold_minutes: 5,
  amber_seizure_count: 2,
  amber_seizure_window: 24,
  amber_seizure_window_unit: 'hours',
  red_seizure_count: 3,
  red_seizure_window: 24,
  red_seizure_window_unit: 'hours',
  escalation_recipients: [],
};

export function useEpilepsyConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['epilepsyConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('epilepsy_config').select('*');
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as EpilepsyConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<EpilepsyConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (config?.id) {
        const { data, error } = await supabase
          .from('epilepsy_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('epilepsy_config')
          .insert({ ...DEFAULT_CONFIG, ...updates, client_id: clientId || null, created_by: user.id, updated_by: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epilepsyConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Epilepsy configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG as EpilepsyConfig),
    isLoading,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

export function useSeizureEvents(clientId?: string, limit = 100) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['seizureEvents', clientId, limit],
    queryFn: async () => {
      let query = supabase
        .from('seizure_events')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return data as SeizureEvent[];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (entry: Partial<SeizureEvent>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('seizure_events')
        .insert([{
          event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
          duration_minutes: entry.duration_minutes ?? 0,
          duration_seconds: entry.duration_seconds ?? 0,
          seizure_category: entry.seizure_category || 'unknown',
          seizure_type: entry.seizure_type || 'unknown',
          triggers: entry.triggers || [],
          trigger_other: entry.trigger_other || null,
          recovery: entry.recovery || [],
          recovery_notes: entry.recovery_notes || null,
          observation_type: entry.observation_type || 'observed',
          notes: entry.notes || null,
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizureEvents', clientId] });
      queryClient.invalidateQueries({ queryKey: ['epilepsyAlerts', clientId] });
      queryClient.invalidateQueries({ queryKey: ['epilepsyStatus', clientId] });
      toast({ title: 'Seizure logged', description: 'Seizure event has been recorded.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { events, isLoading, addEvent: addEvent.mutate, isAdding: addEvent.isPending };
}

export function useSeizureActions(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['seizureActions', clientId],
    queryFn: async () => {
      let query = supabase
        .from('seizure_actions')
        .select('*')
        .eq('is_undone', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return data as SeizureAction[];
    },
  });

  const addAction = useMutation({
    mutationFn: async (entry: Partial<SeizureAction>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('seizure_actions')
        .insert([{ ...entry, client_id: clientId || null, created_by: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seizureActions', clientId] });
      toast({ title: 'Action recorded', description: 'Seizure action has been documented.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { actions, isLoading, addAction: addAction.mutate, isAdding: addAction.isPending };
}

export function useEpilepsyAlerts(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['epilepsyAlerts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('epilepsy_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return data as EpilepsyAlert[];
    },
  });

  const createAlert = useMutation({
    mutationFn: async (alert: Partial<EpilepsyAlert>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('epilepsy_alerts')
        .insert([{
          alert_type: alert.alert_type || 'seizure_threshold',
          severity: alert.severity || 'amber',
          message: alert.message || '',
          metadata: alert.metadata ? JSON.parse(JSON.stringify(alert.metadata)) : {},
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epilepsyAlerts', clientId] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('epilepsy_alerts')
        .update({ resolved_at: new Date().toISOString(), resolved_by: user.id, resolved_reason: notes })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epilepsyAlerts', clientId] });
      toast({ title: 'Alert resolved' });
    },
  });

  return { alerts, isLoading, createAlert: createAlert.mutate, resolveAlert: resolveAlert.mutate };
}

export function useEpilepsyStatus(clientId?: string): EpilepsyStatusInfo {
  const { events } = useSeizureEvents(clientId);
  const { config } = useEpilepsyConfig(clientId);
  const { alerts } = useEpilepsyAlerts(clientId);

  return calculateEpilepsyStatus({
    events,
    config: config || null,
    alerts,
  });
}
