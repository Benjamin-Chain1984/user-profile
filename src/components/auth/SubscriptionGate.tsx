/**
 * SubscriptionGate - paywall for the authenticated app.
 *
 * Business rules (agreed billing policy):
 * - Purchase: unlocks the workspace and starts guided onboarding.
 * - Cancel: access continues until the end of the paid period
 *   (handled by isActive / has_active_platform_subscription).
 * - Staff access: suspended for everyone when the organisation's
 *   subscription lapses — staff inherit access only while an admin who
 *   granted them client access holds an active plan.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformSubscription } from '@/hooks/usePlatformSubscription';
import { getStripeEnvironment } from '@/lib/stripe';
import { OnboardingDialog } from './OnboardingDialog';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, hasRole } = useAuth();
  const { isActive, isLoading } = usePlatformSubscription();
  const [orgAccess, setOrgAccess] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasLegacyClients, setHasLegacyClients] = useState<boolean | null>(null);


  const isAdmin = hasRole('admin');

  // Staff: resolve org-level access via the granting admin's subscription.
  useEffect(() => {
    if (isAdmin || !user?.id) return;
    let cancelled = false;
    supabase
      .rpc('has_org_platform_access', {
        user_uuid: user.id,
        check_env: getStripeEnvironment(),
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        setOrgAccess(error ? false : Boolean(data));
      });
    return () => { cancelled = true; };
  }, [isAdmin, user?.id]);

  // Admins with a fresh active plan get the guided onboarding once.
  useEffect(() => {
    if (!isAdmin || !isActive || !user?.id) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setShowOnboarding(!data?.onboarding_completed_at);
      });
    return () => { cancelled = true; };
  }, [isAdmin, isActive, user?.id]);

  // Legacy workspaces: admins who already created client profiles before the
  // paywall existed keep access to those records without a paid plan.
  useEffect(() => {
    if (!isAdmin || !user?.id) return;
    let cancelled = false;
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (cancelled) return;
        setHasLegacyClients(!error && (count ?? 0) > 0);
      });
    return () => { cancelled = true; };
  }, [isAdmin, user?.id]);

  const handleOnboardingClose = useCallback(() => setShowOnboarding(false), []);

  if (isAdmin) {
    if (isLoading || hasLegacyClients === null) return <LoadingScreen />;
    if (isActive || hasLegacyClients) {
      return (
        <>
          {isActive && showOnboarding && <OnboardingDialog key={String(showOnboarding)} />}
          {isActive && showOnboarding && <OnboardingDismiss onDone={handleOnboardingClose} />}
          {children}
        </>
      );
    }
    return <Paywall />;
  }


  // Staff / other roles
  if (orgAccess === null) return <LoadingScreen />;
  if (orgAccess) return <>{children}</>;
  return <SuspendedScreen />;
}

/** Re-check onboarding completion so the dialog unmounts once finished. */
function OnboardingDismiss({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`onboarding-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if ((payload.new as { onboarding_completed_at?: string | null })?.onboarding_completed_at) {
            onDone();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, onDone]);
  return null;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function Paywall() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <CardTitle>Choose a plan to continue</CardTitle>
          <CardDescription>
            Your IDEAL workspace needs an active subscription before clinical monitoring can be used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/checkout?plan=starter">Subscribe now</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/pricing">Compare plans</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SuspendedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-warning/10">
            <Lock className="h-5 w-5 text-warning" aria-hidden />
          </div>
          <CardTitle>Workspace access suspended</CardTitle>
          <CardDescription>
            Your organisation's IDEAL subscription is no longer active, so access is paused for all
            team members. Please contact your account administrator to renew.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Back to site</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
