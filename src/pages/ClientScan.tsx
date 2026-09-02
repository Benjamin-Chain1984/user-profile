/**
 * Client Scan Page - /c/:token
 * 
 * Handles QR code scan flow with trusted device + MFA logic:
 * 1. User scans QR code on client poster
 * 2. If logged in + trusted device + MFA current → seamless access (no OTP)
 * 3. If logged in but MFA expired → prompt SMS OTP, then re-trust device
 * 4. If not logged in → check for phone-auth session → or show login options
 * 5. After OTP verification, device is registered as trusted for 6 months
 * 6. Optional biometric (Face ID / fingerprint) unlock protects the saved session
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { getDeviceId, getDeviceName } from '@/utils/deviceFingerprint';
import { useActiveClient } from '@/contexts/ActiveClientContext';
import {
  isBiometricAvailable,
  isBiometricEnrolledFor,
  enrolBiometric,
  verifyBiometric,
} from '@/utils/biometric';
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
  Smartphone,
  Fingerprint,
  ScanFace
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
  source?: 'clients' | 'profiles';
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
  | 'biometric_unlock' 
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

async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.clone().json() as { error?: string };
      if (payload.error) return payload.error;
    } catch {
      // Fall through to the SDK error message.
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
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
  const { setActiveClient } = useActiveClient();
  
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
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [pendingPhoneSession, setPendingPhoneSession] = useState<PhoneSession | null>(null);
  const [offerBiometric, setOfferBiometric] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Detect platform biometric support once
  useEffect(() => {
    isBiometricAvailable().then(setBiometricSupported).catch(() => setBiometricSupported(false));
  }, []);

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

  // Runs the initial routing decision exactly once. Without this guard, an auth
  // token refresh (e.g. after switching to the SMS app and back) re-ran the
  // effect and threw the user out of the code-entry step.
  const flowStartedRef = useRef(false);

  // Main flow: check auth state and proceed accordingly
  useEffect(() => {
    if (authLoading) return;
    if (flowStartedRef.current) return;
    flowStartedRef.current = true;


    if (!token) {
      setErrorState({
        title: 'Invalid Link',
        message: 'This QR code link is malformed. Please scan a valid poster QR code.',
      });
      setStep('error');
      return;
    }

    if (isAuthenticated && isStaff) {
      // Supabase-authenticated staff — biometric gate (if enrolled) then trusted device
      if (isBiometricEnrolledFor(user?.id)) {
        setPendingPhoneSession(null);
        setStep('biometric_unlock');
      } else {
        checkTrustedDevice();
      }
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
        if (isBiometricEnrolledFor(phoneSession.userId)) {
          setPendingPhoneSession(phoneSession);
          setStep('biometric_unlock');
        } else {
          checkTrustedDeviceWithSession(phoneSession);
        }
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
      setError(await getFunctionErrorMessage(err, 'Failed to send verification code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (completedCode?: string) => {
    if (isLoading) return;

    // InputOTP calls onComplete in the same event as its final onChange. Use
    // the completed value directly instead of the previous React state value.
    const code = completedCode ?? otp;
    if (code.length !== 6) {
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
          otp: code,
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

        if (data.userId && biometricSupported && !isBiometricEnrolledFor(data.userId)) {
          setOfferBiometric(true);
        }

        setStep('success');
      } else {
        setError(data.error || 'Invalid verification code');
        setOtp('');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(await getFunctionErrorMessage(err, 'Verification failed'));
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

  // Hand the scanned client over to the app so the dashboard opens on them
  useEffect(() => {
    if (step === 'success' && client && client.source !== 'profiles') {
      setActiveClient(client.id, client.preferredName);
    }
  }, [step, client, setActiveClient]);

  const handleBiometricUnlock = async () => {
    setBiometricBusy(true);
    setError(null);
    const result = await verifyBiometric();
    setBiometricBusy(false);
    if (!result.success) {
      setError(result.error || 'Biometric check failed. Use text verification instead.');
      return;
    }
    if (pendingPhoneSession) {
      checkTrustedDeviceWithSession(pendingPhoneSession);
    } else {
      checkTrustedDevice();
    }
  };

  const handleEnrolBiometric = async () => {
    const userId = authState?.userId || user?.id;
    if (!userId) return;
    setBiometricBusy(true);
    const result = await enrolBiometric(userId, authState?.userName || user?.fullName);
    setBiometricBusy(false);
    if (!result.success) {
      setError(result.error || 'Could not set up biometric unlock.');
      return;
    }
    setOfferBiometric(false);
  };

  // Auto-redirect to client dashboard on success
  useEffect(() => {
    if (offerBiometric) return;
    if (step === 'success' && client) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, client, navigate]);

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

  // Biometric unlock — fast local gate for an already-verified device
  if (step === 'biometric_unlock') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ScanFace className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Unlock to Continue</CardTitle>
              <CardDescription>
                Use Face ID, Touch ID or your fingerprint to open this client record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Button onClick={handleBiometricUnlock} className="w-full" size="lg" disabled={biometricBusy}>
                {biometricBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Waiting for biometrics…
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Unlock
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError(null);
                  setStep('mfa_required');
                }}
              >
                Use text verification instead
              </Button>
            </CardContent>
          </Card>
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
                    After verification, this device will stay verified for <strong>6 months</strong> — no repeat codes needed.
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
                  onComplete={(completedCode) => void handleVerifyOtp(completedCode)}
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
                  onClick={() => void handleVerifyOtp()}
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

  if (step === 'success' && client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Access Granted</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {accessMethod === 'trusted_device'
                  ? 'Recognised device — verified for 6 months'
                  : 'Verified by text message'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {client.photoUrl ? (
              <img 
                src={client.photoUrl} 
                alt={client.preferredName} 
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {client.preferredName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-left">
              <p className="text-xl font-semibold">{client.preferredName}</p>
              {client.shortBio && (
                <p className="text-sm text-muted-foreground">{client.shortBio}</p>
              )}
            </div>
          </div>

          {offerBiometric ? (
            <Card className="text-left">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ScanFace className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Turn on biometric unlock</CardTitle>
                    <CardDescription className="text-xs">
                      Next scans open with Face ID or your fingerprint — no codes for 6 months.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button className="w-full" onClick={handleEnrolBiometric} disabled={biometricBusy}>
                  {biometricBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up…
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Enable Biometric Unlock
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setOfferBiometric(false)}>
                  Not now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Redirecting to {client.preferredName}'s profile…
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Go to Dashboard Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {authState?.roles && authState.roles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Access level: {authState.roles.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
