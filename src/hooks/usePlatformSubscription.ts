/**
 * usePlatformSubscription - reads the signed-in user's paid platform plan.
 * Client-side result is for UX gating only; sensitive checks stay server-side.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getStripeEnvironment } from '@/lib/stripe';

export type PlanId = 'starter' | 'professional';

export const PLAN_PRICE_IDS: Record<PlanId, string> = {
  starter: 'ideal_starter_yearly',
  professional: 'ideal_professional_yearly',
};

export const PRICE_ID_TO_PLAN: Record<string, PlanId> = {
  ideal_starter_yearly: 'starter',
  ideal_professional_yearly: 'professional',
};

export interface PlatformSubscription {
  id: string;
  status: string;
  priceId: string;
  plan: PlanId | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

function isActive(sub: PlatformSubscription | null): boolean {
  if (!sub) return false;
  const endsInFuture = !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date();
  if (['active', 'trialing', 'past_due'].includes(sub.status)) return endsInFuture;
  if (sub.status === 'canceled') return endsInFuture;
  return false;
}

export function usePlatformSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('environment', getStripeEnvironment())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setSubscription(
        data
          ? {
              id: data.id,
              status: data.status,
              priceId: data.price_id,
              plan: PRICE_ID_TO_PLAN[data.price_id] ?? null,
              currentPeriodEnd: data.current_period_end,
              cancelAtPeriodEnd: data.cancel_at_period_end,
            }
          : null
      );
    } catch (err) {
      console.error('Error loading platform subscription:', err);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`platform-subscriptions-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_subscriptions', filter: `user_id=eq.${user.id}` },
        () => { fetchSubscription(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchSubscription]);

  return {
    subscription,
    isActive: isActive(subscription),
    isLoading,
    refresh: fetchSubscription,
  };
}
