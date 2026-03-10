import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getNextSunday(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id, enabled_modules } = await req.json();

    if (!client_id || !enabled_modules?.length) {
      return new Response(
        JSON.stringify({
          insight_summary: "No significant health trends identified this week.",
          next_due_at: getNextSunday().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if existing insights are still valid
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

    // Helper: query with client_id OR null (for profiles without client association)
    const clientFilter = (query: any) => {
      return query.or(`client_id.eq.${client_id},client_id.is.null`);
    };

    const moduleQueries: Record<string, () => Promise<string | null>> = {
      constipation: async () => {
        const { data } = await clientFilter(
          supabase.from("bowel_log_entries").select("bristol_type, entry_time, stool_size, observed_status").gte("entry_time", sevenDaysAgo)
        );
        const { data: alerts } = await clientFilter(
          supabase.from("bowel_care_alerts").select("alert_type, severity, message").gte("created_at", sevenDaysAgo).is("resolved_at", null)
        );
        if (!data?.length && !alerts?.length) return "Bowel Care: No entries this week — monitoring gap.";
        const types = data?.map((d: any) => d.bristol_type) || [];
        const hardStools = types.filter((t: number) => t <= 2).length;
        const looseStools = types.filter((t: number) => t >= 6).length;
        let summary = `Bowel Care: ${data?.length || 0} entries. Bristol types: ${types.join(", ")}.`;
        if (hardStools > 0) summary += ` ${hardStools} hard stool(s) (Type 1-2).`;
        if (looseStools > 0) summary += ` ${looseStools} loose stool(s) (Type 6-7).`;
        if (alerts?.length) summary += ` ${alerts.length} active alert(s): ${alerts.map((a: any) => a.message).join("; ")}.`;
        return summary;
      },
      "fluid-balance": async () => {
        const { data: intake } = await clientFilter(
          supabase.from("fluid_intake_entries").select("volume_ml, entry_date").gte("entry_date", sevenDaysAgo.split("T")[0])
        );
        const { data: config } = await supabase
          .from("fluid_balance_config")
          .select("target_daily_intake_ml")
          .or(`client_id.eq.${client_id},client_id.is.null`)
          .single();
        const { data: symptoms } = await clientFilter(
          supabase.from("fluid_symptom_checks").select("symptoms").gte("created_at", sevenDaysAgo)
        );
        if (!intake?.length) return "Fluid Balance: No intake logged this week — monitoring gap.";
        const totalMl = intake.reduce((s: number, e: any) => s + (e.volume_ml || 0), 0);
        const days = new Set(intake.map((e: any) => e.entry_date)).size;
        const target = config?.target_daily_intake_ml || 0;
        const avgDaily = Math.round(totalMl / days);
        let summary = `Fluid Balance: ${totalMl}ml over ${days} days. Average: ${avgDaily}ml/day. Target: ${target}ml.`;
        if (target > 0 && avgDaily < target) summary += ` BELOW TARGET on average.`;
        const belowDays = target > 0 ? intake.reduce((acc: any, e: any) => { acc[e.entry_date] = (acc[e.entry_date] || 0) + (e.volume_ml || 0); return acc; }, {} as Record<string, number>) : {};
        const daysBelow = Object.values(belowDays).filter((v: any) => v < target).length;
        if (daysBelow > 0) summary += ` Below target on ${daysBelow} of ${days} days.`;
        if (symptoms?.length) summary += ` ${symptoms.length} symptom check(s) logged.`;
        return summary;
      },
      weight: async () => {
        const { data } = await clientFilter(
          supabase.from("weight_entries").select("weight_kg, bmi_value, bmi_category, event_occurred_at").order("event_occurred_at", { ascending: false }).limit(5)
        );
        const { data: alerts } = await clientFilter(
          supabase.from("weight_bmi_alerts").select("alert_type, severity").gte("created_at", sevenDaysAgo).is("resolved_at", null)
        );
        if (!data?.length) return "Weight: No entries recorded recently.";
        const latest = data[0];
        let summary = `Weight: Latest ${latest.weight_kg}kg (BMI: ${latest.bmi_value || "N/A"}, ${latest.bmi_category || "N/A"}).`;
        if (data.length >= 2) {
          const change = (latest.weight_kg - data[data.length - 1].weight_kg).toFixed(1);
          summary += ` Change: ${Number(change) > 0 ? "+" : ""}${change}kg over recent entries.`;
        }
        if (alerts?.length) summary += ` ${alerts.length} active weight alert(s).`;
        return summary;
      },
      sleep: async () => {
        const { data } = await clientFilter(
          supabase.from("sleep_entries").select("estimated_hours_slept, number_of_awakenings, restlessness, event_occurred_at").gte("event_occurred_at", sevenDaysAgo)
        );
        if (!data?.length) return "Sleep: No entries this week — monitoring gap.";
        const avgHours = (data.reduce((s: number, e: any) => s + Number(e.estimated_hours_slept || 0), 0) / data.length).toFixed(1);
        const disrupted = data.filter((e: any) => (e.number_of_awakenings || 0) >= 3).length;
        const restless = data.filter((e: any) => e.restlessness).length;
        let summary = `Sleep: ${data.length} nights logged. Average ${avgHours} hours.`;
        if (disrupted > 0) summary += ` ${disrupted} nights with 3+ awakenings.`;
        if (restless > 0) summary += ` ${restless} restless nights.`;
        if (Number(avgHours) < 6) summary += ` CONCERN: Average sleep below 6 hours.`;
        return summary;
      },
      epilepsy: async () => {
        const { data } = await clientFilter(
          supabase.from("seizure_events").select("id, seizure_type, duration_seconds, emergency_medication_given, event_occurred_at").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: alerts } = await clientFilter(
          supabase.from("epilepsy_alerts").select("alert_type, severity").gte("created_at", sevenDaysAgo).is("resolved_at", null)
        );
        if (!data?.length && !alerts?.length) return "Seizures: No events this week.";
        let summary = `Seizures: ${data?.length || 0} event(s) this week.`;
        if (data?.length) {
          const emergencyMeds = data.filter((d: any) => d.emergency_medication_given).length;
          if (emergencyMeds > 0) summary += ` CONCERN: Emergency medication given ${emergencyMeds} time(s).`;
          const types = [...new Set(data.map((d: any) => d.seizure_type).filter(Boolean))];
          if (types.length) summary += ` Types: ${types.join(", ")}.`;
        }
        if (alerts?.length) summary += ` ${alerts.length} active alert(s).`;
        return summary;
      },
      "pressure-area": async () => {
        const { data: checks } = await clientFilter(
          supabase.from("skin_check_sessions").select("overall_status, event_occurred_at").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: events } = await clientFilter(
          supabase.from("pressure_relief_events").select("id").gte("event_occurred_at", sevenDaysAgo)
        );
        const redChecks = checks?.filter((c: any) => c.overall_status === "red").length || 0;
        const amberChecks = checks?.filter((c: any) => c.overall_status === "amber").length || 0;
        let summary = `Pressure Areas: ${checks?.length || 0} skin checks, ${events?.length || 0} repositioning events.`;
        if (redChecks > 0) summary += ` CONCERN: ${redChecks} red finding(s).`;
        if (amberChecks > 0) summary += ` ${amberChecks} amber finding(s).`;
        if (!checks?.length) summary += ` No skin checks recorded — monitoring gap.`;
        return summary;
      },
      "pain-check": async () => {
        const { data } = await clientFilter(
          supabase.from("abbey_pain_assessments").select("severity, total_score, pain_type").gte("created_at", sevenDaysAgo)
        );
        if (!data?.length) return "Pain: No assessments this week.";
        const severe = data.filter((d: any) => d.severity === "severe").length;
        const moderate = data.filter((d: any) => d.severity === "moderate").length;
        let summary = `Pain: ${data.length} assessments.`;
        if (severe > 0) summary += ` CONCERN: ${severe} severe.`;
        if (moderate > 0) summary += ` ${moderate} moderate.`;
        const avgScore = (data.reduce((s: number, d: any) => s + d.total_score, 0) / data.length).toFixed(1);
        summary += ` Average score: ${avgScore}.`;
        return summary;
      },
      enteral: async () => {
        const { data } = await clientFilter(
          supabase.from("enteral_feed_logs").select("total_volume_ml, feed_date").gte("feed_date", sevenDaysAgo.split("T")[0])
        );
        const { data: stomaChecks } = await clientFilter(
          supabase.from("enteral_stoma_checks").select("status_level, findings").gte("event_occurred_at", sevenDaysAgo)
        );
        if (!data?.length) return "Enteral Nutrition: No feeds logged this week — monitoring gap.";
        let summary = `Enteral Nutrition: ${data.length} feed logs.`;
        if (stomaChecks?.length) {
          const concerns = stomaChecks.filter((s: any) => s.status_level !== "green");
          if (concerns.length) summary += ` CONCERN: ${concerns.length} stoma check(s) with issues.`;
        }
        return summary;
      },
      continence: async () => {
        const { data } = await clientFilter(
          supabase.from("continence_pad_changes").select("pad_condition, event_occurred_at").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: skinChecks } = await clientFilter(
          supabase.from("continence_skin_checks").select("skin_condition, escalated_to_clinician").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: utiTests } = await clientFilter(
          supabase.from("continence_uti_tests").select("test_result, symptoms").gte("test_date", sevenDaysAgo.split("T")[0])
        );
        if (!data?.length) return "Continence: No pad changes logged this week.";
        const soaked = data.filter((d: any) => d.pad_condition === "soaked").length;
        let summary = `Continence: ${data.length} pad changes.`;
        if (soaked > 0) summary += ` ${soaked} soaked pad(s).`;
        if (skinChecks?.length) {
          const escalated = skinChecks.filter((s: any) => s.escalated_to_clinician).length;
          const poorSkin = skinChecks.filter((s: any) => s.skin_condition !== "healthy" && s.skin_condition !== "intact").length;
          if (poorSkin > 0) summary += ` CONCERN: ${poorSkin} skin check(s) with issues.`;
          if (escalated > 0) summary += ` ${escalated} escalated to clinician.`;
        }
        if (utiTests?.length) {
          const positive = utiTests.filter((u: any) => u.test_result === "positive").length;
          if (positive > 0) summary += ` CONCERN: ${positive} positive UTI test(s).`;
        }
        return summary;
      },
      "health-monitoring": async () => {
        const { data } = await clientFilter(
          supabase.from("vital_sign_entries").select("overall_status, event_occurred_at").gte("event_occurred_at", sevenDaysAgo)
        );
        if (!data?.length) return "Health Monitoring: No vital signs recorded this week — monitoring gap.";
        const red = data.filter((d: any) => d.overall_status === "red").length;
        const amber = data.filter((d: any) => d.overall_status === "amber").length;
        let summary = `Health Monitoring: ${data.length} readings.`;
        if (red > 0) summary += ` CONCERN: ${red} red reading(s).`;
        if (amber > 0) summary += ` ${amber} amber reading(s).`;
        if (red === 0 && amber === 0) summary += ` All within normal range.`;
        return summary;
      },
      "health-prevention": async () => {
        const { data: screenings } = await clientFilter(
          supabase.from("cancer_screening_records").select("screening_type, status, next_due_date").order("created_at", { ascending: false })
        );
        const { data: vaccinations } = await clientFilter(
          supabase.from("vaccination_records").select("vaccine_name, status, next_due_date").order("created_at", { ascending: false })
        );
        const { data: assessments } = await clientFilter(
          supabase.from("annual_health_assessment_records").select("next_due_date, date_completed").order("date_completed", { ascending: false }).limit(1)
        );
        const now = new Date();
        const overdue: string[] = [];
        screenings?.forEach((s: any) => { if (s.next_due_date && new Date(s.next_due_date) < now) overdue.push(`${s.screening_type} screening`); });
        vaccinations?.forEach((v: any) => { if (v.next_due_date && new Date(v.next_due_date) < now) overdue.push(`${v.vaccine_name} vaccination`); });
        if (assessments?.[0]?.next_due_date && new Date(assessments[0].next_due_date) < now) overdue.push("annual health assessment");
        if (overdue.length) return `Health Prevention: CONCERN: ${overdue.length} overdue item(s): ${overdue.join(", ")}.`;
        if (!screenings?.length && !vaccinations?.length && !assessments?.length) return null;
        return `Health Prevention: All screenings and vaccinations up to date.`;
      },
      catheter: async () => {
        const { data: changes } = await clientFilter(
          supabase.from("catheter_change_logs").select("id").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: flushes } = await clientFilter(
          supabase.from("catheter_flush_logs").select("id, escalation_required, urine_appearance").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: stomaChecks } = await clientFilter(
          supabase.from("catheter_stoma_checks").select("status_level, escalated_to_clinician").gte("event_occurred_at", sevenDaysAgo)
        );
        const { data: alerts } = await clientFilter(
          supabase.from("catheter_alerts").select("alert_type, severity").gte("created_at", sevenDaysAgo).is("resolved_at", null)
        );
        let summary = `Catheter: ${changes?.length || 0} changes, ${flushes?.length || 0} flushes.`;
        const escalations = flushes?.filter((f: any) => f.escalation_required).length || 0;
        const bloodUrine = flushes?.filter((f: any) => f.urine_appearance === "blood").length || 0;
        if (escalations > 0) summary += ` CONCERN: ${escalations} flush escalation(s).`;
        if (bloodUrine > 0) summary += ` CONCERN: Blood in urine noted ${bloodUrine} time(s).`;
        if (stomaChecks?.length) {
          const issues = stomaChecks.filter((s: any) => s.status_level !== "green").length;
          if (issues > 0) summary += ` ${issues} stoma check(s) with concerns.`;
        }
        if (alerts?.length) summary += ` ${alerts.length} active alert(s).`;
        return summary;
      },
      "oral-health": async () => {
        const { data } = await clientFilter(
          supabase.from("oral_health_assessments").select("overall_status").gte("created_at", sevenDaysAgo)
        );
        if (!data?.length) return null;
        const concerns = data.filter((d: any) => d.overall_status !== "healthy" && d.overall_status !== "green").length;
        let summary = `Oral Health: ${data.length} assessments.`;
        if (concerns > 0) summary += ` CONCERN: ${concerns} with issues.`;
        return summary;
      },
      iddsi: async () => {
        const { data } = await clientFilter(
          supabase.from("mealtime_observations").select("severity, event_occurred_at, signs_observed").gte("event_occurred_at", sevenDaysAgo)
        );
        if (!data?.length) return "IDDSI: No mealtime observations this week.";
        const redObs = data.filter((d: any) => d.severity === "red").length;
        const amberObs = data.filter((d: any) => d.severity === "amber").length;
        let summary = `IDDSI: ${data.length} mealtime observations.`;
        if (redObs > 0) summary += ` CONCERN: ${redObs} red observation(s) — swallowing safety risk.`;
        if (amberObs > 0) summary += ` ${amberObs} amber observation(s).`;
        return summary;
      },
    };

    for (const moduleId of enabled_modules) {
      const queryFn = moduleQueries[moduleId];
      if (queryFn) {
        const result = await queryFn();
        if (result) dataSummaries.push(result);
      }
    }

    const nextDue = getNextSunday().toISOString();

    if (dataSummaries.length === 0) {
      const summary = "No significant health trends identified this week.";
      await upsertInsight(supabase, client_id, summary, enabled_modules, nextDue);
      return new Response(
        JSON.stringify({ insight_summary: summary, generated_at: new Date().toISOString(), next_due_at: nextDue, cached: false }),
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

    await upsertInsight(supabase, client_id, summary, enabled_modules, nextDue);

    return new Response(
      JSON.stringify({
        insight_summary: summary,
        generated_at: new Date().toISOString(),
        next_due_at: nextDue,
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

async function upsertInsight(supabase: any, clientId: string, summary: string, enabledModules: string[], nextDue: string) {
  const now = new Date().toISOString();

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
