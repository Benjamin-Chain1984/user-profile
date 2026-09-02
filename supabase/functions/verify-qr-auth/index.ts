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
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '+61' + digits.slice(1);
  }
  if (!phone.startsWith('+')) {
    return '+' + digits;
  }
  return phone;
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
  
  // Check clients table first
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id, preferred_name, short_bio, photo_url, status')
    .eq('poster_qr_token_hash', tokenHash)
    .eq('status', 'active')
    .maybeSingle();

  if (!clientError && clientData) {
    return {
      id: clientData.id,
      preferredName: clientData.preferred_name,
      shortBio: clientData.short_bio,
      photoUrl: clientData.photo_url,
      status: clientData.status,
      source: 'clients'
    };
  }

  // Check profiles table (profile-page QR codes)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('poster_qr_token_hash', tokenHash)
    .maybeSingle();

  if (!profileError && profileData) {
    return {
      id: profileData.id,
      preferredName: profileData.full_name,
      shortBio: null,
      photoUrl: null,
      status: 'active',
      source: 'profiles'
    };
  }

  return null;
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
    const { data: storedOtp, error: otpError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (otpError || !storedOtp) {
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
    if (storedOtp.otp_hash !== otp) {
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

    await supabase.from('phone_otps').update({ verified: true }).eq('phone', formattedPhone);

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
