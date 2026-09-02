import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, role, phone } = await req.json();

    if (!email || !fullName || !role) {
      return new Response(JSON.stringify({ error: "email, fullName, and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user via admin API (auto-confirms email for team invites)
    const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
    let userId: string | null = null;
    let existingUser = false;

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() ?? "";
      const isDuplicate =
        msg.includes("already been registered") ||
        msg.includes("already exists") ||
        msg.includes("duplicate");

      if (!isDuplicate) throw createError;

      // Idempotent: reuse the existing auth user and (re)link them to the team
      const { data: list } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find(
        (u) => u.email?.toLowerCase() === String(email).toLowerCase()
      );

      if (!found) {
        return new Response(
          JSON.stringify({
            error:
              "This email is already registered but the account could not be found. Please contact support.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = found.id;
      existingUser = true;
    } else {
      userId = newUser.user.id;
    }


    // Update profile with phone if provided
    if (phone) {
      await adminClient
        .from("profiles")
        .update({ verified_phone: phone, full_name: fullName })
        .eq("id", userId);
    }

    // Assign role (idempotent)
    await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    // Log audit event
    await adminClient.rpc("log_audit_event", {
      p_actor_user_id: caller.id,
      p_action: existingUser ? "TEAM_MEMBER_LINKED" : "TEAM_MEMBER_INVITED",
      p_metadata_json: { targetUserId: userId, fullName, role, email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        existingUser,
        message: existingUser
          ? `${fullName} already had an account, so we linked it to your team with the ${role} role. They keep their existing password.`
          : `Team member ${fullName} created. They can sign in with email: ${email} and temporary password. They should change their password on first login.`,
        tempPassword: existingUser ? null : tempPassword,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }

    );
  } catch (error) {
    console.error("Error inviting team member:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
