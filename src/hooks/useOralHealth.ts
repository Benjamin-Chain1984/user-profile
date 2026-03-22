/**
 * Oral Health Care Module Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type {
  OralHealthConfig,
  OralHealthPlanCategory,
  OralHealthTaskLog,
  OralHealthAssessment,
  OralHealthAlert,
  OralHealthCategory,
  AssistanceLevel,
  AssessmentFrequency,
  MouthAnnotation,
} from '@/types/oralHealth';

const DEFAULT_CONFIG: Partial<OralHealthConfig> = {
  enable_compliance_monitoring: false,
  assessment_frequency: 'weekly' as AssessmentFrequency,
  consecutive_missed_tasks_alert: 2,
  escalation_recipients: ['supervisor', 'nurse'],
  global_assistance_level: 'supervision' as AssistanceLevel,
};

export function useOralHealthConfig(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['oralHealthConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('oral_health_config').select('*');
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as OralHealthConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<OralHealthConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (config?.id) {
        const { data, error } = await supabase
          .from('oral_health_config')
          .update({ ...updates, updated_by: user.id } as any)
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('oral_health_config')
          .insert({ ...DEFAULT_CONFIG, ...updates, client_id: clientId, created_by: user.id, updated_by: user.id } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oralHealthConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Oral health configuration updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG as OralHealthConfig),
    isLoading,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

export function useOralHealthPlan(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['oralHealthPlan', clientId],
    queryFn: async () => {
      let query = supabase.from('oral_health_plan_categories').select('*').order('display_order');
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return data as OralHealthPlanCategory[];
    },
  });

  const savePlan = useMutation({
    mutationFn: async (planCategories: Partial<OralHealthPlanCategory>[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Delete existing and re-insert
      if (clientId) {
        await supabase.from('oral_health_plan_categories').delete().eq('client_id', clientId);
      } else {
        await supabase.from('oral_health_plan_categories').delete().is('client_id', null);
      }
      const rows = planCategories.map((c, i) => ({
        category: c.category,
        am_required: c.am_required ?? true,
        pm_required: c.pm_required ?? true,
        products: c.products || null,
        cleaning_method: c.cleaning_method || null,
        additional_instructions: c.additional_instructions || null,
        assistance_level: c.assistance_level || null,
        dentist_instructions: c.dentist_instructions || null,
        display_order: i,
        client_id: clientId || null,
        created_by: user.id,
        updated_by: user.id,
      }));
      const { data, error } = await supabase.from('oral_health_plan_categories').insert(rows as any).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oralHealthPlan', clientId] });
      toast({ title: 'Plan saved', description: 'Oral health care plan updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { categories, isLoading, savePlan: savePlan.mutate, isSaving: savePlan.isPending };
}

export function useOralHealthTaskLogs(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['oralHealthTaskLogs', clientId],
    queryFn: async () => {
      let query = supabase.from('oral_health_task_logs').select('*').eq('is_undone', false).order('log_date', { ascending: false }).limit(100);
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as (OralHealthTaskLog & { staff_name?: string | null })[];

      // Fetch staff names from profiles
      const userIds = [...new Set(data.map((d: any) => d.created_by).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name]));
        }
      }

      return data.map((d: any) => ({
        ...d,
        staff_name: profileMap[d.created_by] || null,
      })) as (OralHealthTaskLog & { staff_name?: string | null })[];
    },
  });

  const logTask = useMutation({
    mutationFn: async (entry: { period: 'am' | 'pm'; completed: boolean; notes?: string; log_date?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('oral_health_task_logs')
        .insert({
          period: entry.period,
          completed: entry.completed,
          notes: entry.notes || null,
          log_date: entry.log_date || new Date().toISOString().split('T')[0],
          client_id: clientId || null,
          created_by: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oralHealthTaskLogs', clientId] });
      toast({ title: 'Logged', description: 'Oral health task recorded.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { logs, isLoading, logTask: logTask.mutate, isLogging: logTask.isPending };
}

export function useOralHealthAssessments(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['oralHealthAssessments', clientId],
    queryFn: async () => {
      let query = supabase.from('oral_health_assessments').select('*').eq('is_undone', false).order('created_at', { ascending: false }).limit(50);
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        mouth_annotations: (d.mouth_annotations || []) as MouthAnnotation[],
      })) as OralHealthAssessment[];
    },
  });

  const submitAssessment = useMutation({
    mutationFn: async (assessment: Partial<OralHealthAssessment>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('oral_health_assessments')
        .insert({
          ...assessment,
          mouth_annotations: JSON.parse(JSON.stringify(assessment.mouth_annotations || [])),
          client_id: clientId || null,
          created_by: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oralHealthAssessments', clientId] });
      toast({ title: 'Assessment saved', description: 'Oral health assessment recorded.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { assessments, isLoading, submitAssessment: submitAssessment.mutate, isSubmitting: submitAssessment.isPending };
}

export function useOralHealthAlerts(clientId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['oralHealthAlerts', clientId],
    queryFn: async () => {
      let query = supabase.from('oral_health_alerts').select('*').is('resolved_at', null).order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      else query = query.is('client_id', null);
      const { data, error } = await query;
      if (error) throw error;
      return data as OralHealthAlert[];
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('oral_health_alerts')
        .update({ resolved_at: new Date().toISOString(), resolved_by: user.id, resolved_reason: notes } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oralHealthAlerts', clientId] });
      toast({ title: 'Alert resolved' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { alerts, isLoading, resolveAlert: resolveAlert.mutate };
}
