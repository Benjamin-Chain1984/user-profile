/**
 * Client Scan Page - /c/:token
 * 
 * Handles QR code scan flow with SMS OTP authentication:
 * 1. User scans QR code on client poster
 * 2. Validates token exists (no client data shown yet)
 * 3. Shows neutral auth prompt if not authenticated
 * 4. Stores token in sessionStorage for redirect after login
 * 5. After auth, resolves client and enforces authorization
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
import { 
  Loader2, 
  AlertTriangle, 
  QrCode, 
  Phone, 
  ArrowRight, 
  Send,
  CheckCircle,
  Shield,
  LogIn
} from 'lucide-react';
const idealLogo = '/logo-design-new.png';

// Session storage key for QR redirect
const QR_REDIRECT_KEY = 'ideal_qr_redirect';

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

type Step = 'checking' | 'login_prompt' | 'phone' | 'otp' | 'validating' | 'success' | 'error';

interface ErrorState {
  title: string;
  message: string;
  isTokenInvalid?: boolean;
}

export default function ClientScanPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, isStaff } = useAuth();
  
  const [step, setStep] = useState<Step>('checking');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Log QR scan attempt on mount
  useEffect(() => {
    if (token) {
      // Log QR scan attempt (anonymously - just that a scan happened)
      supabase.functions.invoke('qr-auth', {
        body: { 
          action: 'scan_attempt',
          clientToken: token 
        }
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
      // User is already authenticated and has staff role - validate token and grant access
      validateTokenAndGrantAccess();
    } else if (isAuthenticated && !isStaff) {
      // Authenticated but not staff - show error
      setErrorState({
        title: 'Access Denied',
        message: 'You do not have permission to access client records. Please contact your administrator.',
      });
      setStep('error');
    } else {
      // Not authenticated - show neutral login prompt
      // Store token for redirect after login
      sessionStorage.setItem(QR_REDIRECT_KEY, token);
      setStep('login_prompt');
    }
  }, [authLoading, isAuthenticated, isStaff, token]);

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
        setStep('success');
        // Clear the redirect storage
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
    // Store the full path for redirect after login
    navigate('/auth', { 
      state: { from: location },
      replace: true 
    });
  };

  const handleUsePhoneAuth = () => {
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
      const { data, error: fnError } = await supabase.functions.invoke('verify-qr-auth', {
        body: { 
          phone, 
          otp, 
          clientToken: token,
          userId: authState?.userId
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
        setStep('success');
        sessionStorage.removeItem(QR_REDIRECT_KEY);
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

  // Checking auth state
  if (step === 'checking' || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <img src={idealLogo} alt="IDEAL" className="h-14 w-auto" />
          </div>
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Verifying access...</p>
          </div>
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
                    Sending...
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
                      Verifying...
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
            <p className="text-muted-foreground">Accessing client record...</p>
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

  // Success - show client overview
  if (step === 'success' && client) {
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
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Access Granted</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Authenticated via SMS verification
              </p>
            </div>
          </div>

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
                  onClick={() => navigate(`/clients/${client.id}/log`)}
                >
                  <span className="text-lg">📝</span>
                  <span>New Entry</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/bowel`)}
                >
                  <span className="text-lg">🚽</span>
                  <span>Bowel</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/vitals`)}
                >
                  <span className="text-lg">❤️</span>
                  <span>Vitals</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate(`/clients/${client.id}/wounds`)}
                >
                  <span className="text-lg">🩹</span>
                  <span>Wounds</span>
                </Button>
              </div>

              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                View Full Profile
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
