import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function createPortalSession(options: {
  authHeader: string | null;
  returnUrl?: string;
  environment: StripeEnv;
}) {
  const token = options.authHeader?.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? "");
  if (authError || !user) throw new Error("Unauthorized");

  const { data: sub } = await supabase
    .from("platform_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .eq("environment", options.environment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub?.stripe_customer_id) throw new Error("No subscription found");

  const stripe = createStripeClient(options.environment);
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id as string,
    ...(options.returnUrl && { return_url: options.returnUrl }),
  });
  return portal.url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { environment, returnUrl } = body ?? {};
    if (environment !== 'sandbox' && environment !== 'live') {
      return new Response(JSON.stringify({ error: 'Invalid environment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = await createPortalSession({
      authHeader: req.headers.get('Authorization'),
      returnUrl: typeof returnUrl === 'string' ? returnUrl : undefined,
      environment,
    });
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = (e as Error).message;
    return new Response(JSON.stringify({ error: message }), {
      status: message === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
