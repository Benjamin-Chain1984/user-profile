/**
 * QR Auth Edge Function
 * Validates a user's phone is verified in the system and sends OTP for QR-based access
 * Also handles scan attempt logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone to E.164 if needed
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { phone, clientToken, action } = body;

    // Handle scan attempt logging (anonymous - just logs that a scan occurred)
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

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    console.log(`QR Auth request for phone: ${formattedPhone.slice(0, 6)}****`);

    // Log that login was required from QR
    await supabase.rpc('log_audit_event', {
      p_actor_user_id: null,
      p_action: 'LOGIN_REQUIRED_FROM_QR',
      p_metadata_json: { 
        phone: formattedPhone.slice(0, 6) + '****',
        tokenPrefix: clientToken?.slice(0, 8) + '...'
      }
    });

    // Step 1: Check if phone is verified in the system
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
      console.log('Phone not found in verified profiles');
      // Log failed access attempt
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
      console.log('Phone not verified');
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: profile.id,
        p_action: 'CLIENT_ACCESS_DENIED',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          reason: 'phone_not_verified'
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Your phone number has not been verified. Please contact your administrator.',
          code: 'PHONE_NOT_VERIFIED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.is_active) {
      console.log('User account inactive');
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: profile.id,
        p_action: 'CLIENT_ACCESS_DENIED',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          reason: 'account_inactive'
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Your account is inactive. Please contact your administrator.',
          code: 'ACCOUNT_INACTIVE'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check user has a valid role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id);

    if (rolesError || !userRoles?.length) {
      console.log('User has no roles');
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: profile.id,
        p_action: 'CLIENT_ACCESS_DENIED',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          reason: 'no_role_assigned'
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'You do not have permission to access client records. Please contact your administrator.',
          code: 'NO_ROLE'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Check rate limiting
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('action', 'qr_auth')
      .maybeSingle();

    if (rateLimit) {
      if (rateLimit.locked_until && new Date(rateLimit.locked_until) > new Date()) {
        console.log('Rate limited - locked until:', rateLimit.locked_until);
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

    // Step 4: Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
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
      console.error('Twilio credentials not configured');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const smsBody = `Your IDEAL access code is: ${otp}. This code expires in 5 minutes. Do not share this code.`;

    console.log('Sending QR auth OTP via Twilio...');
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

    console.log('OTP sent successfully');

    // Log audit event
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
