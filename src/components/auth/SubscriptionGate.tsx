/**
 * SubscriptionGate - paywall for the authenticated app.
 * Account owners (admins) need an active paid plan; staff invited by an
 * admin inherit access so bedside workflows are never blocked.
 */

import { Link } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformSubscription } from '@/hooks/usePlatformSubscription';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { hasRole } = useAuth();
  const { isActive, isLoading } = usePlatformSubscription();

  const requiresPlan = hasRole('admin');

  if (!requiresPlan || isActive) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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
