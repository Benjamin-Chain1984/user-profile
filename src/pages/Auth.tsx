/**
 * Auth Page - Login and Signup
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth';
import { auditService } from '@/services/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, Smartphone, KeyRound } from 'lucide-react';
const idealLogo = '/Ideal-logo.png';

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = emailSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const phoneSchema = z.object({
  phone: z.string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'Please enter the 6-digit code'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Get the redirect destination. Prefer ?next= (used by OAuth consent) so
  // MCP OAuth returns the user to /.lovable/oauth/consent after sign-in.
  const nextParam = new URLSearchParams(location.search).get('next');
  const isSafeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//');
  const from = (isSafeNext && nextParam) || (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    setPasskeySupported(authService.isPasskeySupported());
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '' },
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  const handleEmailLogin = async (data: EmailFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authService.signInWithEmail(data.email, data.password);
      
      if (result.success) {
        await auditService.logEvent('LOGIN_SUCCESS');
        toast({ title: 'Welcome back!', description: 'You have been signed in.' });
        navigate(from, { replace: true });
      } else {
        await auditService.logEvent('LOGIN_FAIL', undefined, { error: result.error });
        toast({ 
          title: 'Sign in failed', 
          description: result.error || 'Please check your credentials.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authService.signUpWithEmail(data.email, data.password, data.fullName);
      
      if (result.success) {
        if (result.requiresVerification) {
          toast({ 
            title: 'Check your email', 
            description: 'We sent you a verification link.' 
          });
        } else {
          await auditService.logEvent('LOGIN_SUCCESS');
          toast({ title: 'Welcome!', description: 'Your account has been created.' });
          navigate(from, { replace: true });
        }
      } else {
        toast({ 
          title: 'Sign up failed', 
          description: result.error || 'Please try again.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneOtp = async (data: PhoneFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authService.signInWithPhoneOtp(data.phone);
      
      if (result.success) {
        await auditService.logEvent('OTP_SENT', undefined, { phone: data.phone.slice(-4) });
        setPhoneNumber(data.phone);
        setShowOtpInput(true);
        toast({ title: 'Code sent', description: 'Check your phone for the verification code.' });
      } else {
        if (result.rateLimited) {
          toast({ 
            title: 'Too many attempts', 
            description: `Please wait and try again later.`, 
            variant: 'destructive' 
          });
        } else {
          toast({ 
            title: 'Failed to send code', 
            description: result.error || 'Please try again.', 
            variant: 'destructive' 
          });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authService.verifyPhoneOtp(phoneNumber, data.code);
      
      if (result.success) {
        await auditService.logEvent('LOGIN_SUCCESS');
        toast({ title: 'Welcome!', description: 'You have been signed in.' });
        navigate(from, { replace: true });
      } else {
        await auditService.logEvent('OTP_VERIFY_FAIL', undefined, { phone: phoneNumber.slice(-4) });
        toast({ 
          title: 'Invalid code', 
          description: 'Please check the code and try again.', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await authService.signInWithPasskey();
      
      if (result.success) {
        await auditService.logEvent('LOGIN_SUCCESS', undefined, { method: 'passkey' });
        navigate(from, { replace: true });
      } else {
        toast({ 
          title: 'Passkey login failed', 
          description: result.error, 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={idealLogo} alt="IDEAL" className="h-16 w-auto" />
        </div>

        {/* Auth Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Staff Sign In</CardTitle>
            <CardDescription>
              Sign in to access client records securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth Method Tabs */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={authMode === 'email' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setAuthMode('email'); setShowOtpInput(false); }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant={authMode === 'phone' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setAuthMode('phone'); setShowOtpInput(false); }}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Phone
              </Button>
            </div>

            {/* Passkey Button */}
            {passkeySupported && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePasskeyLogin}
                disabled={isSubmitting}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Sign in with Passkey
              </Button>
            )}

            {authMode === 'email' && (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-4">
                  <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          {...emailForm.register('email')}
                        />
                      </div>
                      {emailForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...emailForm.register('password')}
                        />
                      </div>
                      {emailForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{emailForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-4">
                  <form onSubmit={signupForm.handleSubmit(handleEmailSignup)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          placeholder="Your name"
                          className="pl-10"
                          {...signupForm.register('fullName')}
                        />
                      </div>
                      {signupForm.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          {...signupForm.register('email')}
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signupPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...signupForm.register('password')}
                        />
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...signupForm.register('confirmPassword')}
                        />
                      </div>
                      {signupForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {authMode === 'phone' && !showOtpInput && (
              <form onSubmit={phoneForm.handleSubmit(handlePhoneOtp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      className="pl-10"
                      {...phoneForm.register('phone')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter in E.164 format (e.g., +1234567890)</p>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
                </Button>
              </form>
            )}

            {authMode === 'phone' && showOtpInput && (
              <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                    {...otpForm.register('code')}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code sent to {phoneNumber.slice(-4).padStart(phoneNumber.length, '•')}
                  </p>
                  {otpForm.formState.errors.code && (
                    <p className="text-sm text-destructive">{otpForm.formState.errors.code.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowOtpInput(false)}
                >
                  Change phone number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Protected health information. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
