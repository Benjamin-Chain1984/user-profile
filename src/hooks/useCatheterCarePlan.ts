/**
 * Catheter Care Plan Hooks - Versioning, Acknowledgements, Publishing
 * Mirrors useBowelCarePlan / useOralHealthPlan patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addMonths, differenceInDays } from 'date-fns';
import { useClientIdOrActive } from '@/contexts/ActiveClientContext';

export interface CatheterCarePlan {
  id: string;
  client_id: string | null;
  status: 'draft' | 'published';
  version: number;
  plan_author: string | null;
  plan_author_phone: string | null;
  plan_author_email: string | null;
  date_developed: string | null;
  last_reviewed_date: string | null;
  next_review_due: string | null;
  prescribing_clinician: string | null;
  catheter_type: string | null;
  catheter_size_fr: string | null;
  balloon_size_ml: string | null;
  insertion_date: string | null;
  change_interval: string | null;
  responsible_clinician: string | null;
  hygiene_checklist: ChecklistItem[];
  bag_management_checklist: ChecklistItem[];
  drainage_monitoring_checklist: ChecklistItem[];
  fluid_advice_checklist: ChecklistItem[];
  leg_bag_change_frequency: string | null;
  night_bag_change_frequency: string | null;
  full_system_change_protocol: string | null;
  no_urine_hours_threshold: number;
  escalation_instructions: EscalationInstruction[];
  additional_instructions: string | null;
  enable_autonomic_dysreflexia: boolean;
  flush_prescribed: boolean;
  flush_solution_type: string | null;
  flush_solution_other: string | null;
  flush_volume_ml: number | null;
  flush_frequency: string | null;
  flush_custom_interval: string | null;
  flush_reason: string | null;
  flush_performer: string | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface ChecklistItem {
  id: string;
  label: string;
  enabled: boolean;
  period?: 'am' | 'pm' | 'as_required';
}

export interface EscalationInstruction {
  id: string;
  condition: string;
  enabled: boolean;
}

export interface CatheterCarePlanVersion {
  id: string;
  plan_id: string;
  version: number;
  snapshot: any;
  change_summary: string | null;
  change_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CatheterCarePlanAcknowledgement {
  id: string;
  plan_id: string;
  plan_version: number;
  user_id: string;
  acknowledged_at: string;
}

export type PlanReviewStatus = 'up_to_date' | 'review_due_soon' | 'review_overdue';

export interface PlanStatusInfo {
  reviewStatus: PlanReviewStatus;
  reviewMessage: string;
  needsAcknowledgement: boolean;
  acknowledgementMessage: string;
  daysUntilReview: number | null;
}

// Default checklist items
export const DEFAULT_HYGIENE_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Clean insertion (stoma) site daily', enabled: true },
  { id: '2', label: 'Use prescribed cleansing product', enabled: true },
  { id: '3', label: 'Dry thoroughly', enabled: true },
  { id: '4', label: 'Check securement device', enabled: true },
];

export const DEFAULT_BAG_MANAGEMENT_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Day bag attached', enabled: true },
  { id: '2', label: 'Night bag attached', enabled: true },
  { id: '3', label: 'Maintain closed system', enabled: true },
  { id: '4', label: 'Ensure bag below bladder level', enabled: true },
  { id: '5', label: 'Do not disconnect unless clinically required', enabled: true },
];

export const DEFAULT_DRAINAGE_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Monitor colour', enabled: true },
  { id: '2', label: 'Monitor clarity', enabled: true },
  { id: '3', label: 'Monitor volume', enabled: true },
  { id: '4', label: 'Check for kinks or blockage', enabled: true },
];

export const DEFAULT_FLUID_ADVICE_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Encourage hydration — refer to Hydration & Fluid Balance Module in IDEAL for daily target (mL)', enabled: true },
  { id: '2', label: 'Fluid restriction in place (if applicable) — refer to Hydration & Fluid Balance Module for max allowance', enabled: false },
  { id: '3', label: 'Monitor fluid intake against daily target (mL) as set in Hydration & Fluid Balance Module', enabled: true },
];

export const DEFAULT_ESCALATION_INSTRUCTIONS: EscalationInstruction[] = [
  { id: '1', condition: 'No urine draining for configured hours', enabled: true },
  { id: '2', condition: 'Severe lower abdominal pain', enabled: true },
  { id: '3', condition: 'Blood in urine (new onset)', enabled: true },
  { id: '4', condition: 'Fever or chills', enabled: true },
  { id: '5', condition: 'Leakage around catheter', enabled: true },
  { id: '6', condition: 'Catheter falls out', enabled: true },
  { id: '7', condition: 'Signs of infection', enabled: true },
];

export function useCatheterCarePlan(clientId?: string) {
  clientId = useClientIdOrActive(clientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['catheterCarePlan', clientId],
    queryFn: async () => {
      let query = supabase
        .from('catheter_care_plans')
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
        hygiene_checklist: (data.hygiene_checklist as unknown as ChecklistItem[]) || DEFAULT_HYGIENE_CHECKLIST,
        bag_management_checklist: (data.bag_management_checklist as unknown as ChecklistItem[]) || DEFAULT_BAG_MANAGEMENT_CHECKLIST,
        drainage_monitoring_checklist: (data.drainage_monitoring_checklist as unknown as ChecklistItem[]) || DEFAULT_DRAINAGE_CHECKLIST,
        fluid_advice_checklist: (data.fluid_advice_checklist as unknown as ChecklistItem[]) || DEFAULT_FLUID_ADVICE_CHECKLIST,
        escalation_instructions: (data.escalation_instructions as unknown as EscalationInstruction[]) || DEFAULT_ESCALATION_INSTRUCTIONS,
      } as CatheterCarePlan;
    },
  });

  const savePlan = useMutation({
    mutationFn: async ({ changeReason, changeSummary, ...updates }: Partial<CatheterCarePlan> & { changeReason?: string; changeSummary?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (plan?.id) {
        await supabase.from('catheter_care_plan_versions').insert({
          plan_id: plan.id,
          version: plan.version,
          snapshot: JSON.parse(JSON.stringify(plan)),
          change_summary: changeSummary || 'Plan updated',
          change_reason: changeReason || '',
          created_by: user.id,
        });

        const { data, error } = await supabase
          .from('catheter_care_plans')
          .update({
            ...updates,
            version: plan.version + 1,
            updated_by: user.id,
            hygiene_checklist: updates.hygiene_checklist ? JSON.parse(JSON.stringify(updates.hygiene_checklist)) : undefined,
            bag_management_checklist: updates.bag_management_checklist ? JSON.parse(JSON.stringify(updates.bag_management_checklist)) : undefined,
            drainage_monitoring_checklist: updates.drainage_monitoring_checklist ? JSON.parse(JSON.stringify(updates.drainage_monitoring_checklist)) : undefined,
            fluid_advice_checklist: updates.fluid_advice_checklist ? JSON.parse(JSON.stringify(updates.fluid_advice_checklist)) : undefined,
            escalation_instructions: updates.escalation_instructions ? JSON.parse(JSON.stringify(updates.escalation_instructions)) : undefined,
          })
          .eq('id', plan.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('catheter_care_plans')
          .insert({
            client_id: clientId || null,
            ...updates,
            hygiene_checklist: JSON.parse(JSON.stringify(updates.hygiene_checklist || DEFAULT_HYGIENE_CHECKLIST)),
            bag_management_checklist: JSON.parse(JSON.stringify(updates.bag_management_checklist || DEFAULT_BAG_MANAGEMENT_CHECKLIST)),
            drainage_monitoring_checklist: JSON.parse(JSON.stringify(updates.drainage_monitoring_checklist || DEFAULT_DRAINAGE_CHECKLIST)),
            fluid_advice_checklist: JSON.parse(JSON.stringify(updates.fluid_advice_checklist || DEFAULT_FLUID_ADVICE_CHECKLIST)),
            escalation_instructions: JSON.parse(JSON.stringify(updates.escalation_instructions || DEFAULT_ESCALATION_INSTRUCTIONS)),
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
      queryClient.invalidateQueries({ queryKey: ['catheterCarePlan', clientId] });
      queryClient.invalidateQueries({ queryKey: ['catheterCarePlanVersions'] });
      toast({ title: 'Plan saved', description: 'Urinary Catheter Care Plan has been updated.' });
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
        .from('catheter_care_plans')
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
      queryClient.invalidateQueries({ queryKey: ['catheterCarePlan', clientId] });
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

export function useCatheterCarePlanVersions(planId?: string) {
  return useQuery({
    queryKey: ['catheterCarePlanVersions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('catheter_care_plan_versions')
        .select('*')
        .eq('plan_id', planId)
        .order('version', { ascending: false });
      if (error) throw error;
      return data as CatheterCarePlanVersion[];
    },
    enabled: !!planId,
  });
}

export function useCatheterCarePlanAcknowledgements(planId?: string, planVersion?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['catheterCarePlanAcks', planId, planVersion],
    queryFn: async () => {
      if (!planId || !planVersion) return [];
      const { data, error } = await supabase
        .from('catheter_care_plan_acknowledgements')
        .select('*')
        .eq('plan_id', planId)
        .eq('plan_version', planVersion);
      if (error) throw error;
      return data as CatheterCarePlanAcknowledgement[];
    },
    enabled: !!planId && !!planVersion,
  });

  const acknowledge = useMutation({
    mutationFn: async () => {
      if (!user?.id || !planId || !planVersion) throw new Error('Missing data');
      const { data, error } = await supabase
        .from('catheter_care_plan_acknowledgements')
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
      queryClient.invalidateQueries({ queryKey: ['catheterCarePlanAcks', planId, planVersion] });
      toast({ title: 'Acknowledged', description: 'You have acknowledged the Urinary Catheter Care Plan.' });
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

export function useCatheterCarePlanStatus(plan: CatheterCarePlan | null | undefined): PlanStatusInfo {
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
