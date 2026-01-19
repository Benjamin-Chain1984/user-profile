/**
 * Verify QR Auth OTP Edge Function
 * Validates OTP for QR-based client access
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Hash token for lookup
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { phone, otp, clientToken, userId } = await req.json();

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
          JSON.stringify({ 
            error: 'Too many failed attempts. Please try again later.',
            rateLimited: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (new Date(rateLimit.first_attempt_at) > tenMinutesAgo && rateLimit.attempt_count >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockUntil })
          .eq('id', rateLimit.id);

        return new Response(
          JSON.stringify({ 
            error: 'Too many failed attempts. Locked for 30 minutes.',
            rateLimited: true
          }),
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
      console.error('OTP not found:', otpError);
      return new Response(
        JSON.stringify({ error: 'No verification code found. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(storedOtp.expires_at) < new Date()) {
      console.log('OTP expired');
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****', 
          reason: 'expired',
          method: 'qr_auth'
        }
      });

      return new Response(
        JSON.stringify({ error: 'Code has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    if (storedOtp.otp_hash !== otp) {
      console.log('Invalid OTP');

      // Track failed attempt
      if (rateLimit) {
        await supabase
          .from('rate_limits')
          .update({ attempt_count: rateLimit.attempt_count + 1 })
          .eq('id', rateLimit.id);
      } else {
        await supabase
          .from('rate_limits')
          .insert({
            identifier: formattedPhone,
            action: 'qr_verify',
            attempt_count: 1,
            first_attempt_at: new Date().toISOString()
          });
      }

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****', 
          reason: 'invalid_code',
          method: 'qr_auth'
        }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid verification code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid! Mark as used
    console.log('QR auth OTP verified successfully');

    await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('phone', formattedPhone);

    // Validate the client token if provided
    let client = null;
    if (clientToken) {
      const tokenHash = await hashToken(clientToken);
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, preferred_name, short_bio, photo_url, status')
        .eq('poster_qr_token_hash', tokenHash)
        .eq('status', 'active')
        .maybeSingle();

      if (clientError || !clientData) {
        console.log('Invalid or expired client token');
        return new Response(
          JSON.stringify({ 
            error: 'This QR code is invalid or has been replaced. Please contact your administrator.',
            code: 'INVALID_CLIENT_TOKEN'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      client = {
        id: clientData.id,
        preferredName: clientData.preferred_name,
        shortBio: clientData.short_bio,
        photoUrl: clientData.photo_url,
        status: clientData.status
      };

      // Log successful access
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: storedOtp.user_id,
        p_action: 'CLIENT_ACCESS',
        p_client_id: client.id,
        p_metadata_json: { 
          phone: formattedPhone.slice(0, 6) + '****',
          method: 'qr_auth',
          clientName: client.preferredName
        }
      });
    }

    // Log successful login
    await supabase.rpc('log_audit_event', {
      p_actor_user_id: storedOtp.user_id,
      p_action: 'LOGIN_SUCCESS',
      p_metadata_json: { 
        phone: formattedPhone.slice(0, 6) + '****',
        method: 'qr_auth'
      }
    });

    // Clear rate limits
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', formattedPhone)
      .in('action', ['qr_auth', 'qr_verify']);

    // Get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', storedOtp.user_id);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', storedOtp.user_id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Access granted',
        userId: storedOtp.user_id,
        userName: profile?.full_name,
        roles: userRoles?.map(r => r.role) || [],
        client
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
