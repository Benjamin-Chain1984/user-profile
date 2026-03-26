/**
 * Client Scan Page - /c/:token
 * 
 * Handles QR code scan flow with trusted device + MFA logic:
 * 1. User scans QR code on client poster
 * 2. If logged in + trusted device + MFA current → seamless access (no OTP)
 * 3. If logged in but MFA expired → prompt SMS OTP, then re-trust device
 * 4. If not logged in → check for phone-auth session → or show login options
 * 5. After OTP verification, device is registered as trusted for 90 days
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { getDeviceId, getDeviceName } from '@/utils/deviceFingerprint';
import { 
  Loader2, 
  AlertTriangle, 
  QrCode, 
  Phone, 
  ArrowRight, 
  Send,
  CheckCircle,
  Shield,
  LogIn,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const idealLogo = '/Ideal-logo.png';
const QR_REDIRECT_KEY = 'ideal_qr_redirect';
const PHONE_SESSION_KEY = 'ideal_phone_session';

interface Client {
  id: string;
  preferredName: string;
  shortBio?: string;
  photoUrl?: string;
  status: string;
}

interface AuthState {
  userId?: string;
  userName?: string;
  roles?: string[];
}

interface PhoneSession {
  userId: string;
  userName: string;
  roles: string[];
  deviceId: string;
  verifiedAt: string;
}

type Step = 
  | 'checking' 
  | 'checking_device' 
  | 'login_prompt' 
  | 'mfa_required' 
  | 'phone' 
  | 'otp' 
  | 'validating' 
  | 'success' 
  | 'error';

interface ErrorState {
  title: string;
  message: string;
  isTokenInvalid?: boolean;
}

/**
 * Save phone-auth session after successful OTP verification
 */
function savePhoneSession(session: PhoneSession): void {
  try {
    localStorage.setItem(PHONE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[QR] Failed to save phone session:', e);
  }
}

/**
 * Load saved phone-auth session (if any)
 */
function loadPhoneSession(): PhoneSession | null {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear phone-auth session
 */
function clearPhoneSession(): void {
  localStorage.removeItem(PHONE_SESSION_KEY);
}

export default function ClientScanPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, isStaff, user, refreshSession } = useAuth();
  
  const [step, setStep] = useState<Step>('checking');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [mfaExpiresAt, setMfaExpiresAt] = useState<string | null>(null);
  const [accessMethod, setAccessMethod] = useState<string>('otp');

  // Log QR scan attempt on mount
  useEffect(() => {
    if (token) {
      supabase.functions.invoke('qr-auth', {
        body: { action: 'scan_attempt', clientToken: token }
      }).catch(console.error);
    }
  }, [token]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Main flow: check auth state and proceed accordingly
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setErrorState({
        title: 'Invalid Link',
        message: 'This QR code link is malformed. Please scan a valid poster QR code.',
      });
      setStep('error');
      return;
    }

    if (isAuthenticated && isStaff) {
      // Supabase-authenticated staff — check trusted device
      checkTrustedDevice();
    } else if (isAuthenticated && !isStaff) {
      setErrorState({
        title: 'Access Denied',
        message: 'You do not have permission to access client records. Please contact your administrator.',
      });
      setStep('error');
    } else {
      // Not Supabase-authenticated — check for saved phone session
      const phoneSession = loadPhoneSession();
      if (phoneSession) {
        console.log('[QR] Found saved phone session, checking trusted device...');
        checkTrustedDeviceWithSession(phoneSession);
      } else {
        sessionStorage.setItem(QR_REDIRECT_KEY, token);
        setStep('login_prompt');
      }
    }
  }, [authLoading, isAuthenticated, isStaff, token]);

  const checkTrustedDevice = async () => {
    setStep('checking_device');
    
    try {
      const deviceId = getDeviceId();
      
      // Include userId from auth context or phone session for non-Supabase auth flows
      const currentUserId = user?.id || loadPhoneSession()?.userId;
      
      const { data, error: fnError } = await supabase.functions.invoke('qr-auth', {
        body: { 
          action: 'check_trusted_device',
          clientToken: token,
          deviceId,
          userId: currentUserId
        }
      });

      if (fnError) throw fnError;

      if (data.trusted && data.success) {
        setClient(data.client);
        setAuthState({
          userId: data.userId,
          userName: data.userName,
          roles: data.roles
        });
        setMfaExpiresAt(data.mfaExpiresAt);
        setAccessMethod('trusted_device');
        setStep('success');
        sessionStorage.removeItem(QR_REDIRECT_KEY);
        return;
      }

      if (data.invalidToken) {
        setErrorState({
          title: 'QR Code Replaced',
          message: 'This QR code has been replaced or is no longer valid. Please ask an admin to print the latest poster.',
          isTokenInvalid: true,
        });
        setStep('error');
        return;
      }

      // Device not trusted or MFA expired
      setStep('mfa_required');
    } catch (err: any) {
      console.error('Trusted device check failed:', err);
      validateTokenAndGrantAccess();
    }
  };

  /**
   * Check trusted device using a saved phone session (no Supabase Auth).
   * Passes userId in the request body instead of relying on auth header.
   */
  const checkTrustedDeviceWithSession = async (session: PhoneSession) => {
    setStep('checking_device');
    
    try {
      const deviceId = getDeviceId();
      
      // If device ID changed, session is invalid
      if (deviceId !== session.deviceId) {
        console.log('[QR] Device ID mismatch, clearing phone session');
        clearPhoneSession();
        sessionStorage.setItem(QR_REDIRECT_KEY, token!);
        setStep('login_prompt');
        return;
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('qr-auth', {
        body: { 
          action: 'check_trusted_device',
          clientToken: token,
          deviceId,
          userId: session.userId
        }
      });

      if (fnError) throw fnError;

      if (data.trusted && data.success) {
        setClient(data.client);
        setAuthState({
          userId: data.userId,
          userName: data.userName,
          roles: data.roles
        });
        setMfaExpiresAt(data.mfaExpiresAt);
        setAccessMethod('trusted_device');
        setStep('success');
        sessionStorage.removeItem(QR_REDIRECT_KEY);
        return;
      }

      if (data.invalidToken) {
        setErrorState({
          title: 'QR Code Replaced',
          message: 'This QR code has been replaced or is no longer valid. Please ask an admin to print the latest poster.',
          isTokenInvalid: true,
        });
        setStep('error');
        return;
      }

      // Device trust expired — need re-verification
      // Pre-fill auth state from session
      setAuthState({
        userId: session.userId,
        userName: session.userName,
        roles: session.roles
      });
      setStep('mfa_required');
    } catch (err: any) {
      console.error('Phone session device check failed:', err);
      clearPhoneSession();
      sessionStorage.setItem(QR_REDIRECT_KEY, token!);
      setStep('login_prompt');
    }
  };

  const validateTokenAndGrantAccess = async () => {
    setStep('validating');
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-qr-auth', {
        body: { 
          action: 'validate_token',
          clientToken: token
        }
      });

      if (fnError) throw fnError;

      if (data.invalidToken) {
        setErrorState({
          title: 'QR Code Replaced',
          message: 'This QR code has been replaced or is no longer valid. Please ask an admin to print the latest poster.',
          isTokenInvalid: true,
        });
        setStep('error');
        return;
      }

      if (data.success && data.client) {
        setClient(data.client);
        setAuthState({
          userId: data.userId,
          userName: data.userName,
          roles: data.roles
        });
        setAccessMethod('pre_authenticated');
        setStep('success');
        sessionStorage.removeItem(QR_REDIRECT_KEY);
      } else {
        setErrorState({
          title: 'Access Error',
          message: data.error || 'Unable to access client record.',
        });
        setStep('error');
      }
    } catch (err: any) {
      console.error('Token validation error:', err);
      setErrorState({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
      setStep('error');
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth', { 
      state: { from: location },
      replace: true 
    });
  };

  const handleUsePhoneAuth = () => {
    setStep('phone');
  };

  const handleMfaRefresh = () => {
    setStep('phone');
  };

  const formatPhoneDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('61')) {
      return `+61 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    return phone;
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('qr-auth', {
        body: { phone, clientToken: token }
      });

      if (fnError) throw fnError;

      if (data.rateLimited) {
        setError(data.error);
        return;
      }

      if (data.success) {
        setAuthState({
          userId: data.userId,
          userName: data.userName,
          roles: data.roles
        });
        setStep('otp');
        setCountdown(60);
      } else {
        setError(data.error || 'Unable to send verification code');
        if (data.code === 'PHONE_NOT_REGISTERED' || data.code === 'NO_ROLE') {
          setErrorState({
            title: 'Access Denied',
            message: data.error || 'You do not have permission to access client records.',
          });
          setStep('error');
        }
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();

      const { data, error: fnError } = await supabase.functions.invoke('verify-qr-auth', {
        body: { 
          phone, 
          otp, 
          clientToken: token,
          userId: authState?.userId,
          deviceId,
          deviceName
        }
      });

      if (fnError) throw fnError;

      if (data.rateLimited) {
        setError(data.error);
        return;
      }

      if (data.invalidToken) {
        setErrorState({
          title: 'QR Code Replaced',
          message: 'This QR code has been replaced or is no longer valid. Please ask an admin to print the latest poster.',
          isTokenInvalid: true,
        });
        setStep('error');
        return;
      }

      if (data.success) {
        setClient(data.client);
        setAuthState({
          userId: data.userId,
          userName: data.userName,
          roles: data.roles
        });
        setMfaExpiresAt(data.mfaExpiresAt);
        setAccessMethod(data.deviceTrusted ? 'otp_device_trusted' : 'otp');
        sessionStorage.removeItem(QR_REDIRECT_KEY);

        // Save phone session so the 3-month trusted device window works on re-scan
        if (data.userId && data.deviceTrusted) {
          savePhoneSession({
            userId: data.userId,
            userName: data.userName || '',
            roles: data.roles || [],
            deviceId,
            verifiedAt: new Date().toISOString()
          });
          // Sync AuthContext immediately so protected routes don't redirect to /auth
          await refreshSession();
          console.log('[QR] Phone session saved for trusted device reuse');
        }

        setStep('success');
      } else {
        setError(data.error || 'Invalid verification code');
        setOtp('');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Verification failed');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setOtp('');
    setError(null);
    handleSendOtp();
  };

  // === RENDER STEPS ===

  // Checking auth state
  if (step === 'checking' || step === 'checking_device' || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              {step === 'checking_device' ? 'Checking your device…' : 'Verifying access…'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MFA Required - device not trusted or MFA expired
  if (step === 'mfa_required') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle>Security Check Required</CardTitle>
              <CardDescription>
                Your verification has expired or this is a new device. Please verify by text message to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(user?.fullName || authState?.userName) && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-medium text-foreground">{user?.fullName || authState?.userName}</p>
                </div>
              )}

              <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    After verification, this device will stay verified for <strong>3 months</strong> — no repeat codes needed.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleMfaRefresh}
                className="w-full"
                size="lg"
              >
                <Phone className="w-4 h-4 mr-2" />
                Verify by Text Message
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Only authorized staff with a verified phone number can access client records.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Neutral login prompt - no client data shown
  if (step === 'login_prompt') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Client Record Access</CardTitle>
              <CardDescription>
                You're opening a client record. Please sign in to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In with Email
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                onClick={handleUsePhoneAuth}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Phone className="w-4 h-4 mr-2" />
                Verify with Phone SMS
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Only authorized staff with a verified phone number can access client records.
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Protected health information. Authorized personnel only.
          </p>
        </div>
      </div>
    );
  }

  // Phone input step
  if (step === 'phone') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>
                Enter your registered mobile number to receive a verification code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+61 400 000 000"
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must be verified by your administrator
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleSendOtp} 
                disabled={isLoading || !phone.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setStep('login_prompt')}
                className="w-full"
              >
                Back to sign in options
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Protected health information. Authorized personnel only.
          </p>
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {formatPhoneDisplay(phone)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authState?.userName && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Signing in as</p>
                  <p className="font-medium text-foreground">{authState.userName}</p>
                </div>
              )}

              <div className="flex justify-center">
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
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Code expires in 5 minutes
              </p>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

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
                      Verifying…
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError(null);
                }}
                className="w-full"
              >
                Change phone number
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Validating token after auth
  if (step === 'validating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Accessing client record…</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error' && errorState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-destructive/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">{errorState.title}</CardTitle>
              <CardDescription className="text-base">
                {errorState.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {errorState.isTokenInvalid ? (
                <p className="text-xs text-center text-muted-foreground">
                  The poster QR code in this room may be outdated. Please request a new poster from your administrator.
                </p>
              ) : (
                <>
                  <Button 
                    onClick={() => {
                      setStep('login_prompt');
                      setErrorState(null);
                      setError(null);
                      setPhone('');
                    }} 
                    className="w-full" 
                    variant="outline"
                  >
                    Try Again
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    If you believe this is an error, please contact your administrator.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success - show client overview with working navigation
  if (step === 'success' && client) {
    const formatMfaExpiry = () => {
      if (!mfaExpiresAt) return null;
      const date = new Date(mfaExpiresAt);
      return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <img src={idealLogo} alt="IDEAL" className="h-10 w-auto" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {authState?.userName}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Exit
              </Button>
            </div>
          </div>

          {/* Access Granted Banner */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">Access Granted</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {accessMethod === 'trusted_device' 
                  ? 'Authenticated via trusted device' 
                  : 'Authenticated via SMS verification'}
              </p>
            </div>
            {accessMethod === 'trusted_device' && (
              <ShieldCheck className="w-5 h-5 text-green-600" />
            )}
          </div>

          {/* Device trust info */}
          {mfaExpiresAt && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                This device is verified until <strong>{formatMfaExpiry()}</strong>. No repeat codes needed until then.
              </p>
            </div>
          )}

          {/* Client Card */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                {client.photoUrl ? (
                  <img 
                    src={client.photoUrl} 
                    alt={client.preferredName} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {client.preferredName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{client.preferredName}</CardTitle>
                  {client.shortBio && (
                    <CardDescription className="mt-1">{client.shortBio}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/module/constipation')}
                >
                  <span className="text-lg">🚽</span>
                  <span>Bowel Care</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/module/health-monitoring')}
                >
                  <span className="text-lg">❤️</span>
                  <span>Vitals</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/module/pressure-area')}
                >
                  <span className="text-lg">🩹</span>
                  <span>Pressure Area</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/module/fluid-balance')}
                >
                  <span className="text-lg">💧</span>
                  <span>Fluids</span>
                </Button>
              </div>

              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => navigate('/')}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Role info */}
          {authState?.roles && authState.roles.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Access level: {authState.roles.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
