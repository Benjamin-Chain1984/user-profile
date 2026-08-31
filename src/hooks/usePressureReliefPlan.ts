/**
 * Pressure Relief Plan Hooks - Versioning, Acknowledgements, Publishing
 * Mirrors useOralHealthPlan pattern
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addMonths, differenceInDays } from 'date-fns';
import type { PressureReliefPlan, RotationPosition, WeeklyRotationSequence } from '@/types/pressureArea';
import { normalizeRotationSequence } from '@/types/pressureArea';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

export interface PressureReliefPlanVersion {
  id: string;
  plan_id: string;
  version: number;
  snapshot: any;
  change_summary: string | null;
  change_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PressureReliefPlanAcknowledgement {
  id: string;
  plan_id: string;
  plan_version: number;
  user_id: string;
  acknowledged_at: string;
  notes: string | null;
}

export type PlanReviewStatus = 'up_to_date' | 'review_due_soon' | 'review_overdue';

export interface PlanStatusInfo {
  reviewStatus: PlanReviewStatus;
  reviewMessage: string;
  daysUntilReview: number | null;
}

export function usePressureReliefPlan(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['pressureReliefPlan', clientId],
    queryFn: async () => {
      let query = supabase
        .from('pressure_relief_plans')
        .select('*')
        .in('status', ['draft', 'published'])
        .order('version', { ascending: false })
        .limit(1);

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        rotation_sequence: normalizeRotationSequence(data.rotation_sequence),
        high_risk_areas: data.high_risk_areas || [],
        escalation_rules: (data.escalation_rules as Record<string, unknown>) || {},
        skin_check_schedule: (data.skin_check_schedule as Record<string, any>) || {},
      } as unknown as PressureReliefPlan;
    },
  });

  const savePlan = useMutation({
    mutationFn: async ({ changeReason, changeSummary, ...updates }: Partial<PressureReliefPlan> & { changeReason?: string; changeSummary?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (plan?.id) {
        await supabase.from('pressure_relief_plan_versions').insert({
          plan_id: plan.id,
          version: plan.version,
          snapshot: JSON.parse(JSON.stringify(plan)),
          change_summary: changeSummary || 'Plan updated',
          change_reason: changeReason || '',
          created_by: user.id,
        });

        const { data, error } = await supabase
          .from('pressure_relief_plans')
          .update({
            ...updates,
            version: plan.version + 1,
            updated_by: user.id,
            rotation_sequence: updates.rotation_sequence ? JSON.parse(JSON.stringify(updates.rotation_sequence)) : undefined,
            escalation_rules: updates.escalation_rules ? JSON.parse(JSON.stringify(updates.escalation_rules)) : undefined,
            skin_check_schedule: updates.skin_check_schedule ? JSON.parse(JSON.stringify(updates.skin_check_schedule)) : undefined,
          } as any)
          .eq('id', plan.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('pressure_relief_plans')
          .insert({
            client_id: clientId || null,
            ...updates,
            rotation_sequence: updates.rotation_sequence ? JSON.parse(JSON.stringify(updates.rotation_sequence)) : [],
            escalation_rules: updates.escalation_rules ? JSON.parse(JSON.stringify(updates.escalation_rules)) : {},
            skin_check_schedule: updates.skin_check_schedule ? JSON.parse(JSON.stringify(updates.skin_check_schedule)) : {},
            created_by: user.id,
            updated_by: user.id,
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressureReliefPlan', clientId] });
      queryClient.invalidateQueries({ queryKey: ['pressureReliefPlanVersions'] });
      toast({ title: 'Plan saved', description: 'Digital Pressure Relief Plan has been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const publishPlan = useMutation({
    mutationFn: async () => {
      if (!user?.id || !plan?.id) throw new Error('No plan to publish');
      const reviewDue = addMonths(new Date(), 12).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pressure_relief_plans')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_by: user.id,
          last_reviewed_date: new Date().toISOString().split('T')[0],
          next_review_due: reviewDue,
          updated_by: user.id,
        })
        .eq('id', plan.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressureReliefPlan', clientId] });
      toast({ title: 'Plan published', description: 'Staff must now acknowledge the plan.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    plan,
    isLoading,
    savePlan: savePlan.mutate,
    publishPlan: publishPlan.mutate,
    isSaving: savePlan.isPending,
    isPublishing: publishPlan.isPending,
  };
}

export function usePressureReliefPlanVersions(planId?: string) {
  return useQuery({
    queryKey: ['pressureReliefPlanVersions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('pressure_relief_plan_versions')
        .select('*')
        .eq('plan_id', planId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as PressureReliefPlanVersion[];
    },
    enabled: !!planId,
  });
}

export function usePressureReliefPlanAcknowledgements(planId?: string, planVersion?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['pressureReliefPlanAcks', planId, planVersion],
    queryFn: async () => {
      if (!planId || !planVersion) return [];
      const { data, error } = await supabase
        .from('pressure_relief_plan_acknowledgements')
        .select('*')
        .eq('plan_id', planId)
        .eq('plan_version', planVersion);
      if (error) throw error;
      return data as PressureReliefPlanAcknowledgement[];
    },
    enabled: !!planId && !!planVersion,
  });

  const acknowledge = useMutation({
    mutationFn: async (notes?: string) => {
      if (!user?.id || !planId || !planVersion) throw new Error('Missing data');
      const { data, error } = await supabase
        .from('pressure_relief_plan_acknowledgements')
        .insert({
          plan_id: planId,
          plan_version: planVersion,
          user_id: user.id,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pressureReliefPlanAcks', planId, planVersion] });
      toast({ title: 'Acknowledged', description: 'You have acknowledged the Digital Pressure Relief Plan.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const hasCurrentUserAcknowledged = acknowledgements.some(a => a.user_id === user?.id);

  return {
    acknowledgements,
    hasCurrentUserAcknowledged,
    acknowledge: acknowledge.mutate,
    isAcknowledging: acknowledge.isPending,
  };
}

export function usePressureReliefPlanStatus(plan: PressureReliefPlan | null | undefined): PlanStatusInfo {
  if (!plan || plan.status === 'draft') {
    return {
      reviewStatus: 'up_to_date',
      reviewMessage: 'No plan published yet',
      daysUntilReview: null,
    };
  }

  const now = new Date();
  let reviewStatus: PlanReviewStatus = 'up_to_date';
  let reviewMessage = 'Plan is up to date';
  let daysUntilReview: number | null = null;

  if (plan.next_review_due) {
    const reviewDate = new Date(plan.next_review_due);
    daysUntilReview = differenceInDays(reviewDate, now);

    if (daysUntilReview < 0) {
      reviewStatus = 'review_overdue';
      reviewMessage = `Plan review is overdue by ${Math.abs(daysUntilReview)} days`;
    } else if (daysUntilReview <= 30) {
      reviewStatus = 'review_due_soon';
      reviewMessage = `Plan review due in ${daysUntilReview} days`;
    }
  }

  return { reviewStatus, reviewMessage, daysUntilReview };
}
