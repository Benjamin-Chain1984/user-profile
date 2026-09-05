/**
 * Weight & BMI Hook - Data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  WeightBmiConfig, 
  WeightEntry, 
  WeightBmiAlert,
  WeightStatusInfo,
  BmiCategory
} from '@/types/weightBmi';
import { calculateWeightBmiStatus, calculateBmi, getBmiCategory, applyConfiguredBmi } from '@/utils/weightBmiCalculator';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

const DEFAULT_CONFIG: Partial<WeightBmiConfig> = {
  monitoring_frequency: 'weekly',
  enable_rapid_change_alert: true,
  rapid_change_threshold_kg: 2.0,
  rapid_change_window_days: 7,
  height_method: 'standing',
  height_is_estimate: false,
  enable_trend_graph: true,
  escalation_recipients: [],
  overdue_escalation_cycles: 2,
  target_range_alert_severity: 'amber'
};

export function useWeightBmi(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [config, setConfig] = useState<WeightBmiConfig | null>(null);
  const [alerts, setAlerts] = useState<WeightBmiAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusInfo, setStatusInfo] = useState<WeightStatusInfo | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setEntries([]);
      setConfig(null);
      setAlerts([]);
      setStatusInfo(calculateWeightBmiStatus([], null, []));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_undone', false)
        .order('event_occurred_at', { ascending: false })
        .limit(100);

      if (entriesError) throw entriesError;

      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('weight_bmi_config')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (configError) throw configError;

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('weight_bmi_alerts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Type cast the data
      const typedConfig = configData as unknown as WeightBmiConfig | null;
      const typedEntries = applyConfiguredBmi(
        (entriesData || []) as unknown as WeightEntry[],
        typedConfig
      );
      const typedAlerts = (alertsData || []) as unknown as WeightBmiAlert[];

      setEntries(typedEntries);
      setConfig(typedConfig);
      setAlerts(typedAlerts);

      // Calculate status
      const status = calculateWeightBmiStatus(typedEntries, typedConfig, typedAlerts);
      setStatusInfo(status);
    } catch (error) {
      console.error('Error fetching weight data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load weight data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  // Log new weight entry
  const logWeight = useCallback(async (data: {
    weight_kg: number;
    event_occurred_at?: string;
    time_of_day?: string;
    meal_timing?: string;
    wheelchair_context?: string;
    notes?: string;
    recorded_on_behalf_of_name?: string;
    recorded_on_behalf_of_role?: string;
    recorded_on_behalf_of_reason?: string;
  }) => {
    if (!user?.id || !clientId) return false;

    try {
      // Calculate BMI if height is configured
      let bmiValue: number | null = null;
      let bmiCategory: BmiCategory | null = null;
      let heightUsed: number | null = null;

      if (config?.height_cm) {
        heightUsed = config.height_cm;
        bmiValue = Math.round(calculateBmi(data.weight_kg, config.height_cm) * 10) / 10;
        bmiCategory = getBmiCategory(bmiValue);
      }

      const { error } = await supabase
        .from('weight_entries')
        .insert({
          client_id: clientId,
          weight_kg: data.weight_kg,
          event_occurred_at: data.event_occurred_at || new Date().toISOString(),
          time_of_day: data.time_of_day || null,
          meal_timing: data.meal_timing || null,
          wheelchair_context: data.wheelchair_context || null,
          notes: data.notes || null,
          bmi_value: bmiValue,
          bmi_category: bmiCategory,
          height_used_cm: heightUsed,
          recorded_on_behalf_of_name: data.recorded_on_behalf_of_name || null,
          recorded_on_behalf_of_role: data.recorded_on_behalf_of_role || null,
          recorded_on_behalf_of_reason: data.recorded_on_behalf_of_reason || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Weight Logged',
        description: bmiValue 
          ? `Weight ${data.weight_kg}kg recorded. BMI: ${bmiValue}`
          : `Weight ${data.weight_kg}kg recorded successfully`
      });

      await fetchData();
      return true;
    } catch (error) {
      console.error('Error logging weight:', error);
      toast({
        title: 'Error',
        description: 'Failed to log weight entry',
        variant: 'destructive'
      });
      return false;
    }
  }, [user?.id, clientId, config, toast, fetchData]);

  // Save config
  const saveConfig = useCallback(async (data: Partial<WeightBmiConfig>) => {
    if (!user?.id || !clientId) return false;

    try {
      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from('weight_bmi_config')
          .update({
            ...data,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('weight_bmi_config')
          .insert({
            ...DEFAULT_CONFIG,
            ...data,
            client_id: clientId,
            created_by: user.id
          });

        if (error) throw error;
      }

      // Recalculate BMI on existing entries so they match the configured height
      const effectiveHeight = (data.height_cm ?? config?.height_cm) || null;
      if (effectiveHeight && effectiveHeight > 0) {
        const { data: existing } = await supabase
          .from('weight_entries')
          .select('id, weight_kg, bmi_value, height_used_cm')
          .eq('client_id', clientId)
          .eq('is_undone', false);

        const stale = (existing || []).filter(
          e => e.height_used_cm !== effectiveHeight || e.bmi_value == null
        );

        for (const entry of stale) {
          const bmi = Math.round(calculateBmi(entry.weight_kg, effectiveHeight) * 10) / 10;
          await supabase
            .from('weight_entries')
            .update({
              bmi_value: bmi,
              bmi_category: getBmiCategory(bmi),
              height_used_cm: effectiveHeight,
            })
            .eq('id', entry.id);
        }
      }

      toast({
        title: 'Settings Saved',
        description: 'Weight monitoring settings have been updated'
      });

      await fetchData();
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
      return false;
    }
  }, [user?.id, clientId, config, toast, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('weight-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_entries' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_bmi_alerts' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    entries,
    config,
    alerts,
    loading,
    statusInfo,
    logWeight,
    saveConfig,
    refetch: fetchData
  };
}

// Simplified hook for status only (used by dashboard tiles)
export function useWeightBmiStatus(clientId?: string): WeightStatusInfo | null {
  clientId = useClientIdOrActive(clientId);
  const { statusInfo } = useWeightBmi(clientId);
  return statusInfo;
}
