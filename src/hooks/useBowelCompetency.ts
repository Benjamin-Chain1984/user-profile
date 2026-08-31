/**
 * Bowel Care Competency Check Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addMonths, differenceInDays } from 'date-fns';
import type { CompetencyAttempt, CompetencyConfig, CompetencyAnswer, CompetencyStatus, StaffCompetencyInfo } from '@/types/bowelCompetency';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

const DEFAULT_CONFIG: Partial<CompetencyConfig> = {
  pass_threshold_percent: 80,
  validity_months: 12,
  expiry_warning_days: 30,
};

export function useBowelCompetencyConfig(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['bowelCompetencyConfig', clientId],
    queryFn: async () => {
      let query = supabase.from('bowel_competency_config').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as CompetencyConfig | null;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<CompetencyConfig>) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (config?.id) {
        const { data, error } = await supabase
          .from('bowel_competency_config')
          .update({ ...updates, updated_by: user.id })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('bowel_competency_config')
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
      queryClient.invalidateQueries({ queryKey: ['bowelCompetencyConfig', clientId] });
      toast({ title: 'Settings saved', description: 'Competency configuration updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    config: config || (DEFAULT_CONFIG as CompetencyConfig),
    isLoading,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

export function useBowelCompetencyAttempts(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['bowelCompetencyAttempts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_competency_attempts')
        .select('*')
        .order('completed_at', { ascending: false });
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CompetencyAttempt[];
    },
  });

  const submitAttempt = useMutation({
    mutationFn: async (params: {
      answers: CompetencyAnswer[];
      score: number;
      totalQuestions: number;
      passed: boolean;
      validityMonths: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const validUntil = addMonths(new Date(), params.validityMonths).toISOString();
      const { data, error } = await supabase
        .from('bowel_competency_attempts')
        .insert({
          staff_user_id: user.id,
          client_id: clientId || null,
          score: params.score,
          total_questions: params.totalQuestions,
          passed: params.passed,
          valid_until: validUntil,
          answers_snapshot: JSON.parse(JSON.stringify(params.answers)),
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Audit log
      await supabase.from('audit_events').insert({
        actor_user_id: user.id,
        action: 'DATA_LOGGED',
        client_id: clientId || null,
        metadata_json: {
          moduleName: 'Bowel Care',
          entryType: 'competency_check',
          score: params.score,
          totalQuestions: params.totalQuestions,
          passed: params.passed,
        },
      });

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bowelCompetencyAttempts', clientId] });
      toast({
        title: vars.passed ? 'Competency Passed ✅' : 'Competency Not Passed',
        description: vars.passed
          ? `You scored ${vars.score}/${vars.totalQuestions}. Valid for ${vars.validityMonths} months.`
          : `You scored ${vars.score}/${vars.totalQuestions}. Please review and retake.`,
        variant: vars.passed ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Current user's latest valid attempt
  const currentUserAttempt = attempts.find(a => a.staff_user_id === user?.id);
  const currentUserValid = currentUserAttempt
    ? currentUserAttempt.passed && !currentUserAttempt.invalidated && new Date(currentUserAttempt.valid_until) > new Date()
    : false;

  return {
    attempts,
    isLoading,
    submitAttempt: submitAttempt.mutate,
    isSubmitting: submitAttempt.isPending,
    currentUserAttempt,
    currentUserValid,
  };
}

export function useStaffCompetencyStatus(clientId?: string, expiryWarningDays = 30): {
  clientId = useClientIdOrActive(clientId);
  staffStatuses: StaffCompetencyInfo[];
  isLoading: boolean;
  completedCount: number;
  totalStaff: number;
  overdueCount: number;
  expiringSoonCount: number;
} {
  const { data: attempts = [] } = useQuery({
    queryKey: ['bowelCompetencyAttempts', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_competency_attempts')
        .select('*')
        .order('completed_at', { ascending: false });
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CompetencyAttempt[];
    },
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['team-members-competency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const now = new Date();

  const staffStatuses: StaffCompetencyInfo[] = profiles.map(profile => {
    const staffAttempts = attempts.filter(a => a.staff_user_id === profile.id && a.passed);
    const latest = staffAttempts[0];

    let status: CompetencyStatus = 'not_completed';
    if (latest) {
      if (latest.invalidated) {
        status = 'invalidated';
      } else {
        const validUntil = new Date(latest.valid_until);
        const daysLeft = differenceInDays(validUntil, now);
        if (daysLeft < 0) {
          status = 'expired';
        } else if (daysLeft <= expiryWarningDays) {
          status = 'expiring_soon';
        } else {
          status = 'completed';
        }
      }
    }

    return {
      staffId: profile.id,
      staffName: profile.full_name || 'Unknown',
      status,
      lastCompletedAt: latest?.completed_at || null,
      validUntil: latest?.valid_until || null,
      score: latest?.score ?? null,
      passed: !!latest?.passed,
    };
  });

  const completedCount = staffStatuses.filter(s => s.status === 'completed').length;
  const overdueCount = staffStatuses.filter(s => s.status === 'expired' || s.status === 'not_completed' || s.status === 'invalidated').length;
  const expiringSoonCount = staffStatuses.filter(s => s.status === 'expiring_soon').length;

  return {
    staffStatuses,
    isLoading,
    completedCount,
    totalStaff: profiles.length,
    overdueCount,
    expiringSoonCount,
  };
}
