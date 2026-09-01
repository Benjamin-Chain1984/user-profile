/**
 * PlatformPlanSection - organisation plan management for account owners.
 *
 * Business rules:
 * - Upgrades and downgrades apply immediately in both directions;
 *   Stripe prorates the difference (via the change-plan edge function).
 * - Cancellations take effect at the end of the paid period; until then
 *   access continues (surfaced here as "Cancels on …").
 * - Payment method / invoice changes go through the Stripe billing portal.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, ArrowUpCircle, ArrowDownCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformSubscription, PLAN_PRICE_IDS, type PlanId } from '@/hooks/usePlatformSubscription';
import { getStripeEnvironment } from '@/lib/stripe';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PLAN_LABELS: Record<PlanId, string> = {
  starter: 'IDEAL Starter',
  professional: 'IDEAL Professional',
};

const PLAN_PRICES: Record<PlanId, string> = {
  starter: 'A$999/year',
  professional: 'A$2,499/year',
};

export function PlatformPlanSection() {
  const { isAdmin } = useRoleAccess();
  const { subscription, isActive, isLoading, refresh } = usePlatformSubscription();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  if (!isAdmin) return null;

  const currentPlan = subscription?.plan ?? null;

  const changePlan = async (plan: PlanId) => {
    setIsChanging(true);
    try {
      const { error } = await supabase.functions.invoke('change-plan', {
        body: { priceId: PLAN_PRICE_IDS[plan], environment: getStripeEnvironment() },
      });
      if (error) throw error;
      toast.success(`Plan changed to ${PLAN_LABELS[plan]}. Proration applied immediately.`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Plan change failed. Please try again.');
    } finally {
      setIsChanging(false);
      setPendingPlan(null);
    }
  };

  const openPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      if (error || !data?.url) throw error ?? new Error('No portal URL returned');
      window.open(data.url, '_blank', 'noopener');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open the billing portal.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Organisation Plan</CardTitle>
        </div>
        <CardDescription>
          Your IDEAL platform subscription. Plan changes apply immediately with prorated billing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isActive && subscription ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <p className="font-semibold text-foreground">
                  {currentPlan ? PLAN_LABELS[currentPlan] : 'Active plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan ? PLAN_PRICES[currentPlan] : ''}
                  {subscription.currentPeriodEnd &&
                    ` · ${subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} ${format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy')}`}
                </p>
              </div>
              {subscription.cancelAtPeriodEnd ? (
                <Badge variant="outline" className="border-warning/30 text-warning">Cancels at period end</Badge>
              ) : (
                <Badge variant="outline" className="border-success/30 text-success">Active</Badge>
              )}
            </div>

            {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-warning">
                  Your subscription ends on {format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy')}.
                  You keep full access until then for you and your team.
                </p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(PLAN_LABELS) as PlanId[])
                .filter((plan) => plan !== currentPlan)
                .map((plan) => {
                  const isUpgrade = plan === 'professional';
                  const Icon = isUpgrade ? ArrowUpCircle : ArrowDownCircle;
                  return (
                    <Button
                      key={plan}
                      variant="outline"
                      onClick={() => setPendingPlan(plan)}
                      disabled={isChanging}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {isUpgrade ? 'Upgrade' : 'Switch'} to {PLAN_LABELS[plan]}
                    </Button>
                  );
                })}
              <Button variant="outline" onClick={openPortal} disabled={isPortalLoading}>
                {isPortalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage billing & invoices
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">No active organisation plan.</p>
            <Button asChild className="mt-3">
              <Link to="/pricing">View plans</Link>
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={pendingPlan !== null} onOpenChange={(open) => !open && setPendingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingPlan ? PLAN_LABELS[pendingPlan] : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The change applies immediately. Stripe prorates the difference — you'll be charged or
              credited for the remainder of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChanging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isChanging}
              onClick={(e) => {
                e.preventDefault();
                if (pendingPlan) changePlan(pendingPlan);
              }}
            >
              {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm plan change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
