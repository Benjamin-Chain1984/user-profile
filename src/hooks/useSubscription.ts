/**
 * useSubscription - Hook for managing individual NDIS subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from 'sonner';
import type { Subscription, Invoice, BillingCycle, SubscriptionStatus, BILLING_PRICES } from '@/types/subscription';

const BILLING_PRICES_MAP = {
  monthly: { amount: 3182, gst: 318, total: 3500 },
  quarterly: { amount: 9091, gst: 909, total: 10000 },
  annual: { amount: 31818, gst: 3182, total: 35000 },
} as const;

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  updateBillingCycle: (cycle: BillingCycle) => Promise<boolean>;
  getAccessLevel: () => 'full' | 'readonly' | 'none';
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { profile } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', profile.id)
        .maybeSingle();

      if (subError) throw subError;

      if (subData) {
        setSubscription({
          id: subData.id,
          clientId: subData.client_id,
          status: subData.status as SubscriptionStatus,
          billingCycle: subData.billing_cycle as BillingCycle,
          subscriptionType: subData.subscription_type,
          currentPeriodStart: subData.current_period_start,
          currentPeriodEnd: subData.current_period_end,
          trialEndsAt: subData.trial_ends_at,
          gracePeriodEndsAt: subData.grace_period_ends_at,
          createdAt: subData.created_at,
          updatedAt: subData.updated_at,
        });

        // Fetch invoices for this subscription
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('subscription_id', subData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (invError) throw invError;

        if (invData) {
          setInvoices(invData.map(inv => ({
            id: inv.id,
            subscriptionId: inv.subscription_id,
            clientId: inv.client_id,
            invoiceNumber: inv.invoice_number,
            billingPeriodStart: inv.billing_period_start,
            billingPeriodEnd: inv.billing_period_end,
            amountCents: inv.amount_cents,
            gstCents: inv.gst_cents,
            totalCents: inv.total_cents,
            status: inv.status as Invoice['status'],
            billingEntity: inv.billing_entity,
            dueDate: inv.due_date,
            paidAt: inv.paid_at,
            createdAt: inv.created_at,
            updatedAt: inv.updated_at,
          })));
        }
      } else {
        // No subscription exists - create a trial subscription
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            client_id: profile.id,
            status: 'trial',
            billing_cycle: 'monthly',
            subscription_type: 'Low Cost Assistive Technology – Individual Subscription',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating subscription:', createError);
          // Don't throw - just set null subscription
          setSubscription(null);
        } else if (newSub) {
          setSubscription({
            id: newSub.id,
            clientId: newSub.client_id,
            status: newSub.status as SubscriptionStatus,
            billingCycle: newSub.billing_cycle as BillingCycle,
            subscriptionType: newSub.subscription_type,
            currentPeriodStart: newSub.current_period_start,
            currentPeriodEnd: newSub.current_period_end,
            trialEndsAt: newSub.trial_ends_at,
            gracePeriodEndsAt: newSub.grace_period_ends_at,
            createdAt: newSub.created_at,
            updatedAt: newSub.updated_at,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const updateBillingCycle = useCallback(async (cycle: BillingCycle): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          billing_cycle: cycle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      setSubscription(prev => prev ? { ...prev, billingCycle: cycle } : null);
      toast.success('Billing cycle updated');
      return true;
    } catch (err) {
      console.error('Error updating billing cycle:', err);
      toast.error('Failed to update billing cycle');
      return false;
    }
  }, [subscription]);

  const getAccessLevel = useCallback((): 'full' | 'readonly' | 'none' => {
    if (!subscription) return 'full'; // Default to full if no subscription record

    const accessMap: Record<SubscriptionStatus, 'full' | 'readonly' | 'none'> = {
      trial: 'full',
      active: 'full',
      grace_period: 'full',
      restricted: 'readonly',
      suspended: 'none',
    };

    return accessMap[subscription.status];
  }, [subscription]);

  return {
    subscription,
    invoices,
    isLoading,
    error,
    updateBillingCycle,
    getAccessLevel,
    refreshSubscription: fetchSubscription,
  };
}
