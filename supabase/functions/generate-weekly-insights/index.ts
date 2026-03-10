import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_id, enabled_modules } = await req.json();

    if (!client_id || !enabled_modules?.length) {
      return new Response(
        JSON.stringify({ insight_summary: "No significant health trends identified this week." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if existing insights are still valid (within 7 days)
    const { data: existing } = await supabase
      .from("weekly_health_insights")
      .select("*")
      .eq("client_id", client_id)
      .single();

    if (existing && new Date(existing.next_due_at) > new Date()) {
      return new Response(
        JSON.stringify({
          insight_summary: existing.insight_summary,
          generated_at: existing.generated_at,
          next_due_at: existing.next_due_at,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather data summaries from enabled modules (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dataSummaries: string[] = [];

    const moduleQueries: Record<string, () => Promise<string | null>> = {
      "constipation": async () => {
        const { data } = await supabase.from("bowel_log_entries").select("bristol_type, entry_time").eq("client_id", client_id).gte("entry_time", sevenDaysAgo);
        if (!data?.length) return "Bowel Care: No entries this week.";
        const types = data.map(d => d.bristol_type);
        return `Bowel Care: ${data.length} entries this week. Bristol types: ${types.join(", ")}.`;
      },
      "fluid-balance": async () => {
        const { data: intake } = await supabase.from("fluid_intake_entries").select("volume_ml, entry_date").eq("client_id", client_id).gte("entry_date", sevenDaysAgo.split("T")[0]);
        const { data: config } = await supabase.from("fluid_balance_config").select("target_daily_intake_ml").eq("client_id", client_id).single();
        if (!intake?.length) return "Fluid Balance: No intake logged this week.";
        const totalMl = intake.reduce((s, e) => s + (e.volume_ml || 0), 0);
        const days = new Set(intake.map(e => e.entry_date)).size;
        const target = config?.target_daily_intake_ml || 0;
        return `Fluid Balance: ${totalMl}ml total over ${days} days. Daily target: ${target}ml. Average: ${Math.round(totalMl / days)}ml/day.`;
      },
      "weight": async () => {
        const { data } = await supabase.from("weight_entries").select("weight_kg, bmi_value, bmi_category, event_occurred_at").eq("client_id", client_id).order("event_occurred_at", { ascending: false }).limit(3);
        if (!data?.length) return "Weight: No entries recorded recently.";
        const latest = data[0];
        return `Weight: Latest ${latest.weight_kg}kg (BMI: ${latest.bmi_value || "N/A"}, ${latest.bmi_category || "N/A"}). ${data.length} recent entries.`;
      },
      "sleep": async () => {
        const { data } = await supabase.from("sleep_entries").select("estimated_hours_slept, awakening_count, sleep_date").eq("client_id", client_id).gte("sleep_date", sevenDaysAgo.split("T")[0]);
        if (!data?.length) return "Sleep: No entries this week.";
        const avgHours = (data.reduce((s, e) => s + Number(e.estimated_hours_slept || 0), 0) / data.length).toFixed(1);
        const disrupted = data.filter(e => (e.awakening_count || 0) >= 3).length;
        return `Sleep: ${data.length} nights logged. Average ${avgHours} hours. ${disrupted} disrupted nights.`;
      },
      "epilepsy": async () => {
        const { data } = await supabase.from("seizure_events").select("id, event_occurred_at").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        if (!data?.length) return "Seizures: No events this week.";
        return `Seizures: ${data.length} event(s) recorded this week.`;
      },
      "pressure-area": async () => {
        const { data: checks } = await supabase.from("skin_check_sessions").select("overall_status, event_occurred_at").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        const { data: events } = await supabase.from("pressure_relief_events").select("id").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        const redChecks = checks?.filter(c => c.overall_status === "red").length || 0;
        return `Pressure Areas: ${checks?.length || 0} skin checks, ${events?.length || 0} repositioning events. ${redChecks} red findings.`;
      },
      "pain-check": async () => {
        const { data } = await supabase.from("abbey_pain_assessments").select("severity, total_score").eq("client_id", client_id).gte("created_at", sevenDaysAgo);
        if (!data?.length) return "Pain: No assessments this week.";
        const severe = data.filter(d => d.severity === "severe").length;
        return `Pain: ${data.length} assessments. ${severe} severe.`;
      },
      "enteral": async () => {
        const { data } = await supabase.from("enteral_feed_logs").select("total_volume_ml, feed_date").eq("client_id", client_id).gte("feed_date", sevenDaysAgo.split("T")[0]);
        if (!data?.length) return "Enteral Nutrition: No feeds logged this week.";
        return `Enteral Nutrition: ${data.length} feed logs this week.`;
      },
      "continence": async () => {
        const { data } = await supabase.from("continence_pad_changes").select("pad_condition, event_occurred_at").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        if (!data?.length) return "Continence: No pad changes logged this week.";
        return `Continence: ${data.length} pad changes this week.`;
      },
      "health-monitoring": async () => {
        const { data } = await supabase.from("vital_sign_entries").select("overall_status, event_occurred_at").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        if (!data?.length) return "Health Monitoring: No vital signs recorded this week.";
        const red = data.filter(d => d.overall_status === "red").length;
        const amber = data.filter(d => d.overall_status === "amber").length;
        return `Health Monitoring: ${data.length} readings. ${red} red, ${amber} amber.`;
      },
      "health-prevention": async () => {
        return null; // Long-term tracking, not weekly
      },
      "catheter": async () => {
        const { data: changes } = await supabase.from("catheter_change_logs").select("id").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        const { data: flushes } = await supabase.from("catheter_flush_logs").select("id, escalation_required").eq("client_id", client_id).gte("event_occurred_at", sevenDaysAgo);
        return `Catheter: ${changes?.length || 0} changes, ${flushes?.length || 0} flushes this week.`;
      },
      "oral-health": async () => {
        const { data } = await supabase.from("oral_health_assessments").select("overall_status").eq("client_id", client_id).gte("created_at", sevenDaysAgo);
        if (!data?.length) return null;
        return `Oral Health: ${data.length} assessments this week. Statuses: ${data.map(d => d.overall_status).join(", ")}.`;
      },
    };

    for (const moduleId of enabled_modules) {
      const queryFn = moduleQueries[moduleId];
      if (queryFn) {
        const result = await queryFn();
        if (result) dataSummaries.push(result);
      }
    }

    if (dataSummaries.length === 0) {
      const summary = "No significant health trends identified this week.";
      await upsertInsight(supabase, client_id, summary, enabled_modules);
      return new Response(
        JSON.stringify({ insight_summary: summary, generated_at: new Date().toISOString(), cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI to generate summary
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a health data summariser for disability support workers. Generate a brief weekly health summary as bullet points (using • character). 

Rules:
- Use simple, non-clinical language
- Each bullet should be one short sentence
- Focus on patterns, trends, and notable observations
- Do NOT diagnose or prescribe
- Do NOT use medical jargon
- Maximum 6 bullet points
- If data looks stable, say so positively
- Highlight anything that changed or needs attention
- Start each bullet with • character
- Return ONLY the bullet points, nothing else`,
          },
          {
            role: "user",
            content: `Here is the health data for the past 7 days:\n\n${dataSummaries.join("\n")}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim() || "No significant health trends identified this week.";

    await upsertInsight(supabase, client_id, summary, enabled_modules);

    return new Response(
      JSON.stringify({
        insight_summary: summary,
        generated_at: new Date().toISOString(),
        next_due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-weekly-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function upsertInsight(supabase: any, clientId: string, summary: string, enabledModules: string[]) {
  const now = new Date().toISOString();
  const nextDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("weekly_health_insights").upsert(
    {
      client_id: clientId,
      insight_summary: summary,
      generated_at: now,
      next_due_at: nextDue,
      enabled_modules: enabledModules,
    },
    { onConflict: "client_id" }
  );
}
