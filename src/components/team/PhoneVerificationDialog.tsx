/**
 * Phone Verification Dialog
 * Allows admins to verify team member phone numbers via SMS OTP
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Send, CheckCircle, Loader2 } from 'lucide-react';

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentPhone?: string | null;
  onVerified: () => void;
}

type Step = 'input' | 'verify' | 'success';

export function PhoneVerificationDialog({
  open,
  onOpenChange,
  userId,
  currentPhone,
  onVerified
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<Step>('input');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (open) {
      setStep('input');
      setPhone(currentPhone || '');
      setOtp('');
      setExpiresAt(null);
    }
  }, [open, currentPhone]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneDisplay = (phone: string): string => {
    // Format for display (Australian format)
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('61')) {
      return `+61 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, userId }
      });

      if (error) throw error;

      if (data.rateLimited) {
        toast.error(data.error);
        return;
      }

      if (data.success) {
        setExpiresAt(new Date(data.expiresAt));
        setStep('verify');
        setCountdown(60); // Can resend after 60 seconds
        toast.success('Verification code sent!');
      } else {
        toast.error(data.error || 'Failed to send code');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp, userId }
      });

      if (error) throw error;

      if (data.rateLimited) {
        toast.error(data.error);
        return;
      }

      if (data.success) {
        setStep('success');
        toast.success('Phone number verified!');
        setTimeout(() => {
          onVerified();
          onOpenChange(false);
        }, 1500);
      } else {
        toast.error(data.error || 'Invalid code');
        setOtp('');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Verification failed');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setOtp('');
    handleSendOtp();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Phone Verification
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Enter the mobile number to verify. An SMS with a verification code will be sent.'}
            {step === 'verify' && `Enter the 6-digit code sent to ${formatPhoneDisplay(phone)}`}
            {step === 'success' && 'Phone number has been verified successfully!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'input' && (
            <>
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Australian numbers will be automatically formatted to E.164
                </p>
              </div>

              <Button 
                onClick={handleSendOtp} 
                disabled={isLoading || !phone.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Code expires in 5 minutes
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                  className="flex-1"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Button>
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => setStep('input')}
                className="w-full"
              >
                Change phone number
              </Button>
            </>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Verified!
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {formatPhoneDisplay(phone)} is now verified and can receive SMS OTP for authentication.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
