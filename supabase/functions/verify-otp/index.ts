/**
 * Verify OTP Edge Function
 * Validates the OTP and marks the phone as verified
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format phone to E.164 if needed
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

    // Get request body
    const { phone, otp, userId } = await req.json();
    
    if (!phone || !otp) {
      console.error('Missing phone or OTP');
      return new Response(
        JSON.stringify({ error: 'Phone and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    console.log(`Verifying OTP for phone: ${formattedPhone.slice(0, 6)}****`);

    // Check rate limiting for verification attempts
    const { data: rateLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('action', 'otp_verify')
      .maybeSingle();

    if (rateLimit) {
      if (rateLimit.locked_until && new Date(rateLimit.locked_until) > new Date()) {
        console.log('Verification rate limited');
        return new Response(
          JSON.stringify({ 
            error: 'Too many verification attempts. Please try again later.',
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

        console.log('Locking verification for 30 minutes');
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
      
      // Log failed attempt
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****', reason: 'not_found' }
      });

      return new Response(
        JSON.stringify({ error: 'No OTP found. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiry
    if (new Date(storedOtp.expires_at) < new Date()) {
      console.log('OTP expired');
      
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****', reason: 'expired' }
      });

      return new Response(
        JSON.stringify({ error: 'OTP has expired. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check already verified
    if (storedOtp.verified) {
      console.log('OTP already verified');
      return new Response(
        JSON.stringify({ error: 'This code has already been used.' }),
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
            action: 'otp_verify',
            attempt_count: 1,
            first_attempt_at: new Date().toISOString()
          });
      }

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId || null,
        p_action: 'OTP_VERIFY_FAIL',
        p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****', reason: 'invalid_code' }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid verification code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid! Mark as verified
    console.log('OTP verified successfully');

    await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('phone', formattedPhone);

    // Update the user's profile with verified phone
    if (userId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verified_phone: formattedPhone,
          phone_verified_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }

      // Log phone verification
      await supabase.rpc('log_audit_event', {
        p_actor_user_id: userId,
        p_action: 'PHONE_VERIFIED',
        p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****' }
      });
    }

    // Clear rate limits
    await supabase
      .from('rate_limits')
      .delete()
      .eq('identifier', formattedPhone)
      .eq('action', 'otp_verify');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone number verified successfully',
        phone: formattedPhone
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
