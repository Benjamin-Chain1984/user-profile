import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyInsight {
  insight_summary: string;
  generated_at: string;
  next_due_at: string;
  cached: boolean;
}

export function useWeeklyInsights(clientId?: string, enabledModuleIds?: string[]) {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!clientId || !enabledModuleIds?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First check if we have a cached insight that's still valid AND matches enabled modules
      const { data: cached } = await supabase
        .from('weekly_health_insights')
        .select('*')
        .eq('client_id', clientId)
        .single();

      const cachedModules = (cached?.enabled_modules as string[] | null) ?? [];
      const sameModules =
        cachedModules.length === enabledModuleIds.length &&
        [...cachedModules].sort().join(',') === [...enabledModuleIds].sort().join(',');

      if (cached && sameModules && new Date(cached.next_due_at) > new Date()) {
        setInsight({
          insight_summary: cached.insight_summary,
          generated_at: cached.generated_at,
          next_due_at: cached.next_due_at,
          cached: true,
        });
        setLoading(false);
        return;
      }

      // Otherwise call the edge function to generate new insights
      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-weekly-insights',
        {
          body: { client_id: clientId, enabled_modules: enabledModuleIds },
        }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        setError(data.error);
      } else {
        setInsight(data);
      }
    } catch (err) {
      console.error('Weekly insights error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [clientId, enabledModuleIds]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insight, loading, error, refetch: fetchInsights };
}
