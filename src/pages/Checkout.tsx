/**
 * Checkout - subscribe to an IDEAL plan with embedded payment form.
 */

import { useMemo } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Seo } from '@/components/marketing/Seo';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { plans } from '@/data/marketing';
import { PLAN_PRICE_IDS, type PlanId } from '@/hooks/usePlatformSubscription';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  const planId = (searchParams.get('plan') ?? 'starter') as PlanId;
  const plan = useMemo(() => plans.find((p) => p.id === planId), [planId]);
  const priceId = PLAN_PRICE_IDS[planId];

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to={`/signup?plan=${planId}`} replace />;
  }

  if (!plan || !priceId) {
    return <Navigate to="/pricing" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Checkout | IDEAL clinical monitoring"
        description="Subscribe to IDEAL and activate clinical monitoring for your team."
        path="/checkout"
        noindex
      />
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/pricing">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden /> Back to pricing
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h1 className="display-2">Subscribe to {plan.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="font-display text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className="pb-1 text-sm text-muted-foreground">{plan.cadence}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">
              Prices are in AUD. Tax is calculated at checkout based on your location.
            </p>
          </div>

          <StripeEmbeddedCheckout
            priceId={priceId}
            quantity={1}
            customerEmail={user?.email}
            userId={user?.id}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    </div>
  );
}
