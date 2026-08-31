import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AbbeyPainConfig, AssessmentTrigger } from '@/types/painAssessment';
import { useToast } from '@/hooks/use-toast';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

interface UpdateConfigData {
  assessment_triggers?: AssessmentTrigger[];
  custom_trigger_text?: string | null;
  mild_reassess_hours?: number;
  moderate_reassess_hours?: number;
  severe_reassess_hours?: number;
  mild_alert_recipients?: string[];
  moderate_alert_recipients?: string[];
  severe_alert_recipients?: string[];
}

const DEFAULT_CONFIG: Omit<AbbeyPainConfig, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> = {
  client_id: null,
  assessment_triggers: ['daily'],
  custom_trigger_text: null,
  mild_reassess_hours: 4,
  moderate_reassess_hours: 2,
  severe_reassess_hours: 1,
  mild_alert_recipients: ['supervisor'],
  moderate_alert_recipients: ['supervisor', 'nurse'],
  severe_alert_recipients: ['supervisor', 'nurse', 'family', 'gp'],
  enabled_tools: ['abbey', 'painad'],
  default_tool: 'abbey',
};

export function usePainConfig(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const [config, setConfig] = useState<AbbeyPainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('abbey_pain_config')
        .select('*');

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        setConfig(data as unknown as AbbeyPainConfig);
      } else {
        // Return default config if none exists
        setConfig(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching pain config:', err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates: UpdateConfigData): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (config?.id) {
        // Update existing config
        const { error: updateError } = await supabase
          .from('abbey_pain_config')
          .update({
            ...updates,
            updated_by: userData.user?.id,
          })
          .eq('id', config.id);

        if (updateError) throw updateError;
      } else {
        // Create new config
        const { error: insertError } = await supabase
          .from('abbey_pain_config')
          .insert({
            ...DEFAULT_CONFIG,
            ...updates,
            client_id: clientId || null,
            created_by: userData.user?.id,
            updated_by: userData.user?.id,
          });

        if (insertError) throw insertError;
      }

      await fetchConfig();
      
      toast({
        title: 'Configuration Saved',
        description: 'Pain assessment settings have been updated',
      });

      return true;
    } catch (err) {
      console.error('Error saving config:', err);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getEffectiveConfig = (): AbbeyPainConfig => {
    if (config) return config;
    return {
      id: '',
      ...DEFAULT_CONFIG,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
    };
  };

  useEffect(() => {
    fetchConfig();
  }, [clientId]);

  return {
    config,
    loading,
    error,
    saveConfig,
    getEffectiveConfig,
    refresh: fetchConfig,
  };
}
