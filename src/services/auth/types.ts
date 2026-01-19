/**
 * Auth Abstraction Layer Types
 * This allows swapping auth providers without rewriting the app.
 */

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  isActive: boolean;
  roles: AppRole[];
}

export type AppRole = 'worker' | 'team_leader' | 'clinician' | 'admin';

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: AuthUser;
}

export interface SignInResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  requiresVerification?: boolean;
}

export interface OtpResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
  lockedUntil?: Date;
}

export interface PasskeyCredential {
  id: string;
  rawId: ArrayBuffer;
  response: AuthenticatorAssertionResponse;
}

/**
 * Auth Provider Adapter Interface
 * Implement this interface for different auth providers (Supabase, Auth0, Firebase, etc.)
 */
export interface AuthAdapter {
  // Session Management
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  
  // Email/Password Auth
  signInWithEmail(email: string, password: string): Promise<SignInResult>;
  signUpWithEmail(email: string, password: string, fullName?: string): Promise<SignInResult>;
  
  // Phone/OTP Auth
  signInWithPhoneOtp(phone: string): Promise<OtpResult>;
  verifyPhoneOtp(phone: string, code: string): Promise<SignInResult>;
  
  // Passkey/WebAuthn Auth (optional)
  isPasskeySupported(): boolean;
  signInWithPasskey(): Promise<SignInResult>;
  registerPasskey(): Promise<{ success: boolean; error?: string }>;
  
  // User Management
  getUserRoles(userId: string): Promise<AppRole[]>;
  hasRole(userId: string, role: AppRole): Promise<boolean>;
  isStaff(userId: string): Promise<boolean>;
}
