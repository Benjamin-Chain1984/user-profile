/**
 * CheckoutReturn - shown after the embedded payment form completes.
 */

import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Seo } from '@/components/marketing/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformSubscription } from '@/hooks/usePlatformSubscription';

export default function CheckoutReturnPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { isActive, refresh } = usePlatformSubscription();

  // The subscription row arrives via webhook moments after payment.
  useEffect(() => {
    if (isActive) return;
    const interval = setInterval(refresh, 3000);
    const stop = setTimeout(() => clearInterval(interval), 30000);
    return () => { clearInterval(interval); clearTimeout(stop); };
  }, [isActive, refresh]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Seo
        title="Subscription confirmed | IDEAL"
        description="Your IDEAL subscription is being activated."
        path="/checkout/return"
        noindex
      />
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-success" aria-hidden />
            )}
          </div>
          <CardTitle>{isActive ? 'Subscription active' : 'Finalising your subscription'}</CardTitle>
          <CardDescription>
            {sessionId
              ? isActive
                ? 'Payment received. Your workspace is ready to set up.'
                : 'Payment received. Activating your workspace — this only takes a moment.'
              : 'No payment session was found. If you were charged, contact support and we will sort it out.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" disabled={!isActive}>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/pricing">Back to pricing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
