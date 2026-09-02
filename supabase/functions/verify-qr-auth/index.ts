/**
 * Verify QR Auth OTP Edge Function
 * Validates OTP for QR-based client access.
 * On successful verification, registers device as trusted and sets 6-month (180-day) MFA window.
 * Also handles token-only validation for pre-authenticated users.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MFA_VALIDITY_DAYS = 180; // 6 months

function formatPhoneE164(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0011')) digits = digits.slice(4);
  else if (digits.startsWith('011')) digits = digits.slice(3);
  if (digits.startsWith('61')) {
    // Australian country code: drop a trunk "0" typed after +61 (e.g. +61 0407...)
    let rest = digits.slice(2).replace(/^0+/, '');
    digits = '61' + rest;
  } else if (digits.startsWith('0')) {
    digits = '61' + digits.replace(/^0+/, '');
  } else if (digits.length === 9 && digits.startsWith('4')) {
    digits = '61' + digits;
  }
  return '+' + digits;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function resolveClient(supabase: any, clientToken: string) {
  const tokenHash = await hashToken(clientToken);

  // Each client record owns a unique poster QR token. Tokens are ONLY resolved
  // against the clients table so a QR code can never open another profile.
  const { data: clientData } = await supabase
    .from('clients')
    .select('id, preferred_name, photo_url, status')
    .eq('poster_qr_token_hash', tokenHash)
    .eq('status', 'active')
    .maybeSingle();

  if (!clientData) return null;

  return {
    id: clientData.id,
    preferredName: clientData.preferred_name,
    shortBio: null,
    photoUrl: clientData.photo_url,
    status: clientData.status,
    source: 'clients' as const,
  };
}

/**
 * QR access requires BOTH a verified phone/trusted session AND an explicit
 * client assignment (Admin > My Team checkbox). Admins always have access.
 */
async function hasClientAccess(supabase: any, userId: string, clientId: string) {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if ((roles || []).some((r: any) => r.role === 'admin')) return true;

  const { data: access } = await supabase
    .from('client_staff_access')
    .select('id')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .maybeSingle();

  return !!access;
}

async function registerTrustedDevice(
  supabase: any, 
  userId: string, 
  deviceId: string, 
  deviceName?: string
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MFA_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  const nextMfaDue = expiresAt.toISOString();

  // Upsert trusted device
  await supabase
    .from('trusted_devices')
    .upsert({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName || 'Unknown Device',
      is_active: true,
      trusted_at: now.toISOString(),
      last_seen_at: now.toISOString(),
      expires_at: nextMfaDue,
      revoked_at: null
    }, { onConflict: 'user_id,device_id' });

  // Update profile MFA fields
  await supabase
    .from('profiles')
    .update({
      last_mfa_verified_at: now.toISOString(),
      next_mfa_due_at: nextMfaDue
    })
    .eq('id', userId);

  return { expiresAt: nextMfaDue };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { phone, otp, clientToken, userId, action, deviceId, deviceName } = body;

    // Handle token-only validation for pre-authenticated users
    if (action === 'validate_token') {
      console.log('Validating token for pre-authenticated user');
      
      const authHeader = req.headers.get('Authorization');
      let currentUserId: string | null = null;
      let currentUserName: string | null = null;
      let currentUserRoles: string[] = [];

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
        
        if (!claimsError && claims.user) {
          currentUserId = claims.user.id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', currentUserId)
            .single();
          
          currentUserName = profile?.full_name || claims.user.email || null;
          
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUserId);
          
          currentUserRoles = roles?.map(r => r.role) || [];
        }
      }

      if (!currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (currentUserRoles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to access client records.', code: 'NO_ROLE' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!clientToken) {
        return new Response(
          JSON.stringify({ error: 'Client token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const client = await resolveClient(supabase, clientToken);
      if (!client) {
        await supabase.rpc('log_audit_event', {
          p_actor_user_id: currentUserId,
          p_action: 'QR_TOKEN_INVALID',
          p_metadata_json: { tokenPrefix: clientToken?.slice(0, 8) + '...' }
        });
        return new Response(
          JSON.stringify({ error: 'This QR code is invalid or has been replaced.', invalidToken: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!(await hasClientAccess(supabase, currentUserId, client.id))) {
        await supabase.rpc('log_audit_event', {
          p_actor_user_id: currentUserId,
          p_action: 'CLIENT_ACCESS_DENIED',
          p_client_id: client.id,
          p_metadata_json: { reason: 'not_assigned_to_client', method: 'pre_authenticated' }
        });
        return new Response(
          JSON.stringify({
            error: `You are not assigned to ${client.preferredName}'s record. Ask an administrator to grant access under Admin > My Team.`,
            code: 'NOT_ASSIGNED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: currentUserId,
        p_action: 'CLIENT_ACCESS_GRANTED',
        p_client_id: client.id,
        p_metadata_json: { method: 'pre_authenticated', clientName: client.preferredName }
      });

      return new Response(
        JSON.stringify({ 
          success: true, message: 'Access granted',
          userId: currentUserId, userName: currentUserName,
          roles: currentUserRoles, client
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Standard OTP verification flow
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: 'Phone and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    console.log(`Verifying QR auth OTP for: ${formattedPhone.slice(0, 6)}****`);

    // Check rate limiting
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('action', 'qr_verify')
      .maybeSingle();

    if (rateLimit) {
      if (rateLimit.locked_until && new Date(rateLimit.locked_until) > new Date()) {
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Please try again later.', rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (new Date(rateLimit.first_attempt_at) > tenMinutesAgo && rateLimit.attempt_count >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await supabase.from('rate_limits').update({ locked_until: lockUntil }).eq('id', rateLimit.id);
        return new Response(
          JSON.stringify({ error: 'Too many failed attempts. Locked for 30 minutes.', rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get stored OTP
    let { data: storedOtp } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', formattedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback: match on the last 9 digits to tolerate legacy/mis-normalised rows
    if (!storedOtp) {
      const last9 = formattedPhone.replace(/\D/g, '').slice(-9);
      const { data: candidates } = await supabase
        .from('phone_otps')
        .select('*')
        .like('phone', `%${last9}`)
        .order('created_at', { ascending: false })
        .limit(1);
      storedOtp = candidates?.[0] ?? null;
    }

    if (!storedOtp) {
      return new Response(
        JSON.stringify({ error: 'No verification code found. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(storedOtp.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Code has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    if (String(storedOtp.otp_hash).trim() !== String(otp).trim()) {
      if (rateLimit) {
        await supabase.from('rate_limits').update({ attempt_count: rateLimit.attempt_count + 1 }).eq('id', rateLimit.id);
      } else {
        await supabase.from('rate_limits').insert({
          identifier: formattedPhone, action: 'qr_verify',
          attempt_count: 1, first_attempt_at: new Date().toISOString()
        });
      }

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****', reason: 'invalid_code', method: 'qr_auth' }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid verification code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid!
    console.log('QR auth OTP verified successfully');

    await supabase.from('phone_otps').update({ verified: true }).eq('id', storedOtp.id);

    // Register trusted device if deviceId provided
    let mfaExpiresAt: string | undefined;
    if (deviceId && storedOtp.user_id) {
      const result = await registerTrustedDevice(supabase, storedOtp.user_id, deviceId, deviceName);
      mfaExpiresAt = result.expiresAt;
      console.log(`Trusted device registered, MFA valid until: ${mfaExpiresAt}`);
    }

    // Validate client token
    let client = null;
    if (clientToken) {
      client = await resolveClient(supabase, clientToken);
      if (!client) {
        return new Response(
          JSON.stringify({ error: 'This QR code is invalid or has been replaced.', invalidToken: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!(await hasClientAccess(supabase, storedOtp.user_id, client.id))) {
        await supabase.rpc('log_audit_event', {
          p_actor_user_id: storedOtp.user_id,
          p_action: 'CLIENT_ACCESS_DENIED',
          p_client_id: client.id,
          p_metadata_json: { reason: 'not_assigned_to_client', method: 'qr_auth_otp' }
        });
        return new Response(
          JSON.stringify({
            error: `You are not assigned to ${client.preferredName}'s record. Ask an administrator to grant access under Admin > My Team.`,
            code: 'NOT_ASSIGNED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log access
      await supabase.from('qr_access_logs').insert({
        user_id: storedOtp.user_id,
        client_id: client.id,
        device_id: deviceId || null,
        access_method: 'otp'
      });

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: storedOtp.user_id,
        p_action: 'CLIENT_ACCESS_GRANTED',
        p_client_id: client.id,
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          method: 'qr_auth_otp', clientName: client.preferredName,
          deviceTrusted: !!deviceId
        }
      });
    }

    await supabase.rpc('log_audit_event', {
      p_actor_user_id: storedOtp.user_id,
      p_action: 'LOGIN_SUCCESS',
      p_metadata_json: { 
        phone: formattedPhone.slice(0, 6) + '****',
        method: 'qr_auth', deviceTrusted: !!deviceId
      }
    });

    // Clear rate limits
    await supabase.from('rate_limits').delete()
      .eq('identifier', formattedPhone)
      .in('action', ['qr_auth', 'qr_verify']);

    // Get user info
    const { data: userRoles } = await supabase
      .from('user_roles').select('role').eq('user_id', storedOtp.user_id);
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', storedOtp.user_id).single();

    return new Response(
      JSON.stringify({ 
        success: true, message: 'Access granted',
        userId: storedOtp.user_id, userName: profile?.full_name,
        roles: userRoles?.map(r => r.role) || [],
        client, mfaExpiresAt,
        deviceTrusted: !!deviceId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-qr-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
