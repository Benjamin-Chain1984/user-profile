/**
 * Send OTP Edge Function
 * Sends a 6-digit OTP via Twilio SMS for phone verification
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
    const { phone, userId } = await req.json();
    
    if (!phone) {
      console.error('Missing phone number');
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneE164(phone);
    console.log(`Sending OTP to phone: ${formattedPhone.slice(0, 6)}****`);

    // Check rate limiting
    const { data: rateLimit, error: rlError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', formattedPhone)
      .eq('action', 'otp_send')
      .maybeSingle();

    if (rlError) {
      console.error('Rate limit check error:', rlError);
    }

    if (rateLimit) {
      // Check if locked
      if (rateLimit.locked_until && new Date(rateLimit.locked_until) > new Date()) {
        console.log('Rate limited - locked until:', rateLimit.locked_until);
        return new Response(
          JSON.stringify({ 
            error: 'Too many attempts. Please try again later.',
            lockedUntil: rateLimit.locked_until,
            rateLimited: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check attempt count in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (new Date(rateLimit.first_attempt_at) > tenMinutesAgo && rateLimit.attempt_count >= 3) {
        // Lock for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockUntil })
          .eq('id', rateLimit.id);

        console.log('Locking user for 15 minutes');
        return new Response(
          JSON.stringify({ 
            error: 'Too many attempts. Locked for 15 minutes.',
            lockedUntil: lockUntil,
            rateLimited: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update attempt count
      await supabase
        .from('rate_limits')
        .update({ 
          attempt_count: rateLimit.attempt_count + 1,
          locked_until: null
        })
        .eq('id', rateLimit.id);
    } else {
      // Create rate limit record
      await supabase
        .from('rate_limits')
        .insert({
          identifier: formattedPhone,
          action: 'otp_send',
          attempt_count: 1,
          first_attempt_at: new Date().toISOString()
        });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database (we'll need a table for this)
    // For now, we'll use the rate_limits table metadata or create one
    const { error: storeError } = await supabase
      .from('phone_otps')
      .upsert({
        phone: formattedPhone,
        otp_hash: otp, // In production, hash this
        expires_at: expiresAt.toISOString(),
        user_id: userId || null,
        verified: false
      }, { onConflict: 'phone' });

    if (storeError) {
      console.error('Error storing OTP:', storeError);
      // Table might not exist, continue anyway for demo
    }

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

    const smsBody = `Your IDEAL verification code is: ${otp}. This code expires in 5 minutes.`;

    console.log('Sending SMS via Twilio...');
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
        JSON.stringify({ error: 'Failed to send SMS. Please check the phone number.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioData = await twilioResponse.json();
    console.log('SMS sent successfully, SID:', twilioData.sid);

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_actor_user_id: userId || null,
      p_action: 'OTP_SENT',
      p_metadata_json: { phone: formattedPhone.slice(0, 6) + '****' }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
