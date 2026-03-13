/**
 * QR Auth Edge Function
 * Validates a user's phone is verified in the system and sends OTP for QR-based access.
 * Supports trusted device checks to skip OTP when MFA is still current.
 * Also handles scan attempt logging.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { phone, clientToken, action, deviceId, deviceName } = body;

    // Handle scan attempt logging
    if (action === 'scan_attempt') {
      console.log('QR scan attempt logged');
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: null,
        p_action: 'QR_SCAN_ATTEMPT',
        p_metadata_json: { 
          tokenPrefix: clientToken?.slice(0, 8) + '...',
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ success: true, logged: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle trusted device check (pre-authenticated user with device ID)
    if (action === 'check_trusted_device') {
      console.log('Checking trusted device for pre-authenticated user');
      
      const authHeader = req.headers.get('Authorization');
      let currentUserId: string | null = null;

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
        if (!claimsError && claims.user) {
          currentUserId = claims.user.id;
        }
      }

      if (!currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!deviceId) {
        return new Response(
          JSON.stringify({ trusted: false, reason: 'no_device_id' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user has staff role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId);

      if (!userRoles?.length) {
        return new Response(
          JSON.stringify({ error: 'No staff role assigned', code: 'NO_ROLE' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check trusted device
      const { data: device } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle();

      if (!device) {
        return new Response(
          JSON.stringify({ trusted: false, reason: 'device_not_trusted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if device trust has expired
      if (new Date(device.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ trusted: false, reason: 'mfa_expired', expiredAt: device.expires_at }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check MFA dates on profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_mfa_verified_at, next_mfa_due_at, full_name')
        .eq('id', currentUserId)
        .single();

      if (profile?.next_mfa_due_at && new Date(profile.next_mfa_due_at) < new Date()) {
        return new Response(
          JSON.stringify({ trusted: false, reason: 'mfa_expired', expiredAt: profile.next_mfa_due_at }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Device is trusted and MFA is current - update last_seen
      await supabase
        .from('trusted_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', device.id);

      // Validate client token if provided
      let client = null;
      if (clientToken) {
        const tokenHash = await hashToken(clientToken);
        
        // Check clients table first
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, preferred_name, short_bio, photo_url, status')
          .eq('poster_qr_token_hash', tokenHash)
          .eq('status', 'active')
          .maybeSingle();

        if (clientData) {
          client = {
            id: clientData.id,
            preferredName: clientData.preferred_name,
            shortBio: clientData.short_bio,
            photoUrl: clientData.photo_url,
            status: clientData.status
          };
        } else {
          // Check profiles table (profile-page QR codes)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('poster_qr_token_hash', tokenHash)
            .maybeSingle();

          if (profileData) {
            client = {
              id: profileData.id,
              preferredName: profileData.full_name,
              shortBio: null,
              photoUrl: null,
              status: 'active'
            };
          }
        }

        if (!client) {
          return new Response(
            JSON.stringify({ 
              error: 'This QR code is invalid or has been replaced.',
              invalidToken: true 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        // Log access
        await supabase.from('qr_access_logs').insert({
          user_id: currentUserId,
          client_id: client.id,
          device_id: deviceId,
          access_method: 'trusted_device'
        });

        await supabase.rpc('log_audit_event', {
          p_actor_user_id: currentUserId,
          p_action: 'CLIENT_ACCESS_GRANTED',
          p_client_id: client.id,
          p_metadata_json: { 
            method: 'trusted_device',
            clientName: client.preferredName,
            deviceId: deviceId.slice(0, 8) + '...'
          }
        });
      }

      return new Response(
        JSON.stringify({ 
          trusted: true,
          success: true,
          userId: currentUserId,
          userName: profile?.full_name,
          roles: userRoles.map(r => r.role),
          client,
          mfaExpiresAt: profile?.next_mfa_due_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Standard phone OTP flow
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    console.log(`QR Auth request for phone: ${formattedPhone.slice(0, 6)}****`);

    await supabase.rpc('log_audit_event', {
      p_actor_user_id: null,
      p_action: 'LOGIN_REQUIRED_FROM_QR',
      p_metadata_json: { 
        phone: formattedPhone.slice(0, 6) + '****',
        tokenPrefix: clientToken?.slice(0, 8) + '...'
      }
    });

    // Check if phone is verified
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, is_active, verified_phone, phone_verified_at')
      .eq('verified_phone', formattedPhone)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Unable to verify phone number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: null,
        p_action: 'CLIENT_ACCESS_DENIED',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          reason: 'phone_not_registered',
          tokenPrefix: clientToken?.slice(0, 8) + '...'
        }
      });
      return new Response(
        JSON.stringify({ 
          error: 'This phone number is not registered in the system. Please contact your administrator.',
          code: 'PHONE_NOT_REGISTERED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.phone_verified_at) {
      return new Response(
        JSON.stringify({ 
          error: 'Your phone number has not been verified. Please contact your administrator.',
          code: 'PHONE_NOT_VERIFIED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'Your account is inactive. Please contact your administrator.',
          code: 'ACCOUNT_INACTIVE'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user has a valid role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id);

    if (rolesError || !userRoles?.length) {
      return new Response(
        JSON.stringify({ 
          error: 'You do not have permission to access client records. Please contact your administrator.',
          code: 'NO_ROLE'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('action', 'qr_auth')
      .maybeSingle();

    if (rateLimit) {
      if (rateLimit.locked_until && new Date(rateLimit.locked_until) > new Date()) {
        return new Response(
          JSON.stringify({ 
            error: 'Too many attempts. Please try again later.',
            rateLimited: true,
            lockedUntil: rateLimit.locked_until
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (new Date(rateLimit.first_attempt_at) > tenMinutesAgo && rateLimit.attempt_count >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockUntil })
          .eq('id', rateLimit.id);
        return new Response(
          JSON.stringify({ 
            error: 'Too many attempts. Locked for 15 minutes.',
            rateLimited: true,
            lockedUntil: lockUntil
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('rate_limits')
        .update({ attempt_count: rateLimit.attempt_count + 1 })
        .eq('id', rateLimit.id);
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          identifier: formattedPhone,
          action: 'qr_auth',
          attempt_count: 1,
          first_attempt_at: new Date().toISOString()
        });
    }

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await supabase
      .from('phone_otps')
      .upsert({
        phone: formattedPhone,
        otp_hash: otp,
        expires_at: expiresAt.toISOString(),
        user_id: profile.id,
        verified: false
      }, { onConflict: 'phone' });

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const smsBody = `Your IDEAL access code is: ${otp}. This code expires in 5 minutes. Do not share this code.`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: smsBody,
      }),
    });

    if (!twilioResponse.ok) {
      const twilioError = await twilioResponse.text();
      console.error('Twilio error:', twilioError);
      return new Response(
        JSON.stringify({ error: 'Failed to send verification code. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.rpc('log_audit_event', {
      p_actor_user_id: profile.id,
      p_action: 'OTP_SENT',
      p_metadata_json: { 
        phone: formattedPhone.slice(0, 6) + '****',
        method: 'qr_auth',
        tokenPrefix: clientToken?.slice(0, 8) + '...'
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification code sent',
        expiresAt: expiresAt.toISOString(),
        userId: profile.id,
        userName: profile.full_name,
        roles: userRoles.map(r => r.role)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in qr-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
