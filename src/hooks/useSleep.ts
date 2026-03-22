/**
 * Sleep Chart Module Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateSleepStatus } from '@/utils/sleepStatusCalculator';
import type { SleepConfig, SleepEntry, AwakeningEvent } from '@/types/sleep';

const DEFAULT_CONFIG_VALUES = {
  min_expected_sleep_hours: 7,
  disruption_threshold: 3,
  poor_sleep_threshold_hours: 5,
  consecutive_disruption_alert_days: 3,
  max_sleep_threshold_hours: 12,
  consecutive_excessive_sleep_trigger: 2,
  escalation_recipients: [],
};

export function useSleepConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['sleepConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('sleep_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as SleepConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<SleepConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (config?.id) {
        const { data, error } = await supabase
          .from('sleep_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sleep_config')
          .insert({
            ...DEFAULT_CONFIG_VALUES,
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
      queryClient.invalidateQueries({ queryKey: ['sleepConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Sleep configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG_VALUES as unknown as SleepConfig),
    isLoading,
    error,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

export function useSleepEntries(clientId?: string, limit = 50) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['sleepEntries', clientId, limit],
    queryFn: async () => {
      let query = supabase
        .from('sleep_entries')
        .select('*')
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Normalize awakening_events from DB (JSONB comes as parsed JSON)
      return (data || []).map(row => ({
        ...row,
        awakening_events: Array.isArray(row.awakening_events) ? row.awakening_events : [],
      })) as unknown as SleepEntry[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Partial<SleepEntry>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const awakeningEvents: AwakeningEvent[] = entry.awakening_events || [];
      const awakeningCount = awakeningEvents.length || entry.number_of_awakenings || 0;

      const { data, error } = await supabase
        .from('sleep_entries')
        .insert([{
          bedtime: entry.bedtime,
          wake_time: entry.wake_time,
          estimated_hours_slept: entry.estimated_hours_slept ?? 0,
          number_of_awakenings: awakeningCount,
          awake_period_length: entry.awake_period_length,
          awakening_events: JSON.parse(JSON.stringify(awakeningEvents)),
          restlessness: entry.restlessness ?? false,
          day_nap: entry.day_nap ?? false,
          day_nap_duration_minutes: entry.day_nap_duration_minutes,
          day_nap_time: entry.day_nap_time,
          day_nap_behaviour_before: entry.day_nap_behaviour_before,
          day_nap_notes: entry.day_nap_notes,
          assistance_types: entry.assistance_types ?? [],
          assistance_other_text: entry.assistance_other_text,
          notes: entry.notes,
          event_occurred_at: entry.event_occurred_at || new Date().toISOString(),
          recorded_on_behalf_of_name: entry.recorded_on_behalf_of_name,
          recorded_on_behalf_of_role: entry.recorded_on_behalf_of_role,
          recorded_on_behalf_of_reason: entry.recorded_on_behalf_of_reason,
          client_id: clientId || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleepEntries', clientId] });
      queryClient.invalidateQueries({ queryKey: ['sleepStatus', clientId] });
      toast({ title: 'Sleep logged', description: 'Sleep entry has been recorded.' });
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
    isAdding: addEntry.isPending,
  };
}

export function useSleepStatus(clientId?: string) {
  const { config } = useSleepConfig(clientId);
  const { entries } = useSleepEntries(clientId);

  return calculateSleepStatus({
    entries,
    config: {
      min_expected_sleep_hours: config.min_expected_sleep_hours ?? 7,
      disruption_threshold: config.disruption_threshold ?? 3,
      poor_sleep_threshold_hours: config.poor_sleep_threshold_hours ?? 5,
      consecutive_disruption_alert_days: config.consecutive_disruption_alert_days ?? 3,
      max_sleep_threshold_hours: config.max_sleep_threshold_hours ?? 12,
      consecutive_excessive_sleep_trigger: config.consecutive_excessive_sleep_trigger ?? 2,
    },
  });
}
