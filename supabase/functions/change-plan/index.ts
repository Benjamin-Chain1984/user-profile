/**
 * change-plan - switch the signed-in account owner's subscription between
 * plans (Starter <-> Professional). Applied immediately with Stripe
 * proration in both directions, per the agreed billing policy.
 *
 * The payments-webhook (customer.subscription.updated) syncs the new
 * price_id back into platform_subscriptions.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const ALLOWED_PRICE_IDS = ["ideal_starter_yearly", "ideal_professional_yearly"];

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const priceId = body?.priceId;
    const environment: StripeEnv = body?.environment;
    if (typeof priceId !== "string" || !ALLOWED_PRICE_IDS.includes(priceId)) {
      return json({ error: "Invalid priceId" }, 400);
    }
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    // Latest subscription row for this user/environment.
    const { data: sub } = await getSupabase()
      .from("platform_subscriptions")
      .select("stripe_subscription_id, price_id, status")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) {
      return json({ error: "No subscription found" }, 404);
    }
    if (sub.price_id === priceId) {
      return json({ error: "You are already on this plan" }, 400);
    }

    const stripe = createStripeClient(environment);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) return json({ error: "Price not found" }, 404);
    const newPrice = prices.data[0];

    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = stripeSub.items?.data?.[0]?.id;
    if (!itemId) return json({ error: "Subscription has no items" }, 500);

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{ id: itemId, price: newPrice.id }],
      // Immediate switch both ways; Stripe prorates the difference.
      proration_behavior: "create_prorations",
    });

    return json({ ok: true, priceId });
  } catch (e) {
    console.error("change-plan error:", e);
    return json({ error: e instanceof Error ? e.message : "Plan change failed" }, 500);
  }
});
