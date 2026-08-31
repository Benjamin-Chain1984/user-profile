/**
 * Digital Bowel Care Plan Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addMonths, addDays } from 'date-fns';
import type {
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';
  BowelCarePlan,
  BowelCarePlanVersion,
  BowelCarePlanAcknowledgement,
  PlanStatusInfo,
  PlanReviewStatus,
} from '@/types/bowelCarePlan';

export function useBowelCarePlan(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['bowelCarePlan', clientId],
    queryFn: async () => {
      let query = supabase
        .from('bowel_care_plans')
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
      return data as unknown as BowelCarePlan | null;
    },
  });

  const savePlan = useMutation({
    mutationFn: async ({ changeReason, changeSummary, ...updates }: Partial<BowelCarePlan> & { changeReason?: string; changeSummary?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (plan?.id) {
        // Create version snapshot before updating
        const { error: versionError } = await supabase
          .from('bowel_care_plan_versions')
          .insert({
            plan_id: plan.id,
            version: plan.version,
            snapshot: JSON.parse(JSON.stringify(plan)),
            change_summary: changeSummary || 'Plan updated',
            change_reason: changeReason || '',
            created_by: user.id,
          });
        if (versionError) console.error('Version save error:', versionError);

        // Update plan with incremented version
        const { data, error } = await supabase
          .from('bowel_care_plans')
          .update({
            ...updates,
            version: plan.version + 1,
            updated_by: user.id,
            risk_entries: updates.risk_entries ? JSON.parse(JSON.stringify(updates.risk_entries)) : undefined,
            prn_escalation_steps: updates.prn_escalation_steps ? JSON.parse(JSON.stringify(updates.prn_escalation_steps)) : undefined,
            emergency_responses: updates.emergency_responses ? JSON.parse(JSON.stringify(updates.emergency_responses)) : undefined,
            equipment_checklist: updates.equipment_checklist ? JSON.parse(JSON.stringify(updates.equipment_checklist)) : undefined,
            normal_stool_bristol_types: updates.normal_stool_bristol_types,
          })
          .eq('id', plan.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('bowel_care_plans')
          .insert({
            client_id: clientId || null,
            ...updates,
            risk_entries: updates.risk_entries ? JSON.parse(JSON.stringify(updates.risk_entries)) : [],
            prn_escalation_steps: updates.prn_escalation_steps ? JSON.parse(JSON.stringify(updates.prn_escalation_steps)) : [],
            emergency_responses: updates.emergency_responses ? JSON.parse(JSON.stringify(updates.emergency_responses)) : [],
            equipment_checklist: updates.equipment_checklist ? JSON.parse(JSON.stringify(updates.equipment_checklist)) : undefined,
            normal_stool_bristol_types: updates.normal_stool_bristol_types,
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
      queryClient.invalidateQueries({ queryKey: ['bowelCarePlan', clientId] });
      queryClient.invalidateQueries({ queryKey: ['bowelCarePlanVersions'] });
      toast({ title: 'Plan saved', description: 'Bowel Care Plan has been updated.' });
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
        .from('bowel_care_plans')
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
      queryClient.invalidateQueries({ queryKey: ['bowelCarePlan', clientId] });
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

export function useBowelCarePlanVersions(planId?: string) {
  return useQuery({
    queryKey: ['bowelCarePlanVersions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('bowel_care_plan_versions')
        .select('*')
        .eq('plan_id', planId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as BowelCarePlanVersion[];
    },
    enabled: !!planId,
  });
}

export function useBowelCarePlanAcknowledgements(planId?: string, planVersion?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['bowelCarePlanAcks', planId, planVersion],
    queryFn: async () => {
      if (!planId || !planVersion) return [];
      const { data, error } = await supabase
        .from('bowel_care_plan_acknowledgements')
        .select('*')
        .eq('plan_id', planId)
        .eq('plan_version', planVersion);
      if (error) throw error;
      return data as BowelCarePlanAcknowledgement[];
    },
    enabled: !!planId && !!planVersion,
  });

  const acknowledge = useMutation({
    mutationFn: async () => {
      if (!user?.id || !planId || !planVersion) throw new Error('Missing data');
      const { data, error } = await supabase
        .from('bowel_care_plan_acknowledgements')
        .insert({
          plan_id: planId,
          plan_version: planVersion,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bowelCarePlanAcks', planId, planVersion] });
      toast({ title: 'Acknowledged', description: 'You have acknowledged the Bowel Care Plan.' });
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

export function useBowelCarePlanStatus(plan: BowelCarePlan | null | undefined): PlanStatusInfo {
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
    needsAcknowledgement: false, // determined by acknowledgement hook
    acknowledgementMessage: '',
    daysUntilReview,
  };
}
