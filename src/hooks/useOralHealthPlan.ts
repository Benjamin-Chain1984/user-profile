/**
 * Oral Health Care Plan Hooks - Versioning, Acknowledgements, Publishing
 * Mirrors useBowelCarePlan pattern
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addMonths, differenceInDays } from 'date-fns';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

export interface OralHealthPlan {
  id: string;
  client_id: string | null;
  status: 'draft' | 'published';
  version: number;
  plan_author: string | null;
  date_developed: string | null;
  last_reviewed_date: string | null;
  next_review_due: string | null;
  global_assistance_level: string | null;
  additional_instructions: string | null;
  dentist_instructions: string | null;
  plan_categories: PlanCategoryEntry[];
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PlanCategoryEntry {
  category: string;
  is_na: boolean;
  am_required: boolean;
  pm_required: boolean;
  products: string | null;
  cleaning_method: string | null;
  additional_instructions: string | null;
  assistance_level: string | null;
  dentist_instructions: string | null;
  display_order: number;
}

export interface OralHealthPlanVersion {
  id: string;
  plan_id: string;
  version: number;
  snapshot: any;
  change_summary: string | null;
  change_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface OralHealthPlanAcknowledgement {
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
  needsAcknowledgement: boolean;
  acknowledgementMessage: string;
  daysUntilReview: number | null;
}

export function useOralHealthCarePlan(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['oralHealthCarePlan', clientId],
    queryFn: async () => {
      let query = supabase
        .from('oral_health_plans')
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
        plan_categories: (data.plan_categories as unknown as PlanCategoryEntry[]) || [],
      } as OralHealthPlan;
    },
  });

  const savePlan = useMutation({
    mutationFn: async ({ changeReason, changeSummary, ...updates }: Partial<OralHealthPlan> & { changeReason?: string; changeSummary?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (plan?.id) {
        // Create version snapshot
        await supabase.from('oral_health_plan_versions').insert({
          plan_id: plan.id,
          version: plan.version,
          snapshot: JSON.parse(JSON.stringify(plan)),
          change_summary: changeSummary || 'Plan updated',
          change_reason: changeReason || '',
          created_by: user.id,
        });

        const { data, error } = await supabase
          .from('oral_health_plans')
          .update({
            ...updates,
            version: plan.version + 1,
            updated_by: user.id,
            plan_categories: updates.plan_categories ? JSON.parse(JSON.stringify(updates.plan_categories)) : undefined,
          })
          .eq('id', plan.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('oral_health_plans')
          .insert({
            client_id: clientId || null,
            ...updates,
            plan_categories: updates.plan_categories ? JSON.parse(JSON.stringify(updates.plan_categories)) : [],
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
      queryClient.invalidateQueries({ queryKey: ['oralHealthCarePlan', clientId] });
      queryClient.invalidateQueries({ queryKey: ['oralHealthPlanVersions'] });
      toast({ title: 'Plan saved', description: 'Digital Oral Health Care Plan has been updated.' });
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
        .from('oral_health_plans')
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
      queryClient.invalidateQueries({ queryKey: ['oralHealthCarePlan', clientId] });
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

export function useOralHealthPlanVersions(planId?: string) {
  return useQuery({
    queryKey: ['oralHealthPlanVersions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('oral_health_plan_versions')
        .select('*')
        .eq('plan_id', planId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as OralHealthPlanVersion[];
    },
    enabled: !!planId,
  });
}

export function useOralHealthPlanAcknowledgements(planId?: string, planVersion?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['oralHealthPlanAcks', planId, planVersion],
    queryFn: async () => {
      if (!planId || !planVersion) return [];
      const { data, error } = await supabase
        .from('oral_health_plan_acknowledgements')
        .select('*')
        .eq('plan_id', planId)
        .eq('plan_version', planVersion);
      if (error) throw error;
      return data as OralHealthPlanAcknowledgement[];
    },
    enabled: !!planId && !!planVersion,
  });

  const acknowledge = useMutation({
    mutationFn: async (notes?: string) => {
      if (!user?.id || !planId || !planVersion) throw new Error('Missing data');
      const { data, error } = await supabase
        .from('oral_health_plan_acknowledgements')
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
      queryClient.invalidateQueries({ queryKey: ['oralHealthPlanAcks', planId, planVersion] });
      toast({ title: 'Acknowledged', description: 'You have acknowledged the Digital Oral Health Care Plan.' });
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

export function useOralHealthPlanStatus(plan: OralHealthPlan | null | undefined): PlanStatusInfo {
  if (!plan || plan.status === 'draft') {
    return {
      reviewStatus: 'up_to_date',
      reviewMessage: 'No plan published yet',
      needsAcknowledgement: false,
      acknowledgementMessage: '',
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

  return {
    reviewStatus,
    reviewMessage,
    needsAcknowledgement: false,
    acknowledgementMessage: '',
    daysUntilReview,
  };
}
