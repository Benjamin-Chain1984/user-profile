/**
 * Supabase Auth Provider Implementation
 * This is the default provider when using Lovable Cloud.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  AuthAdapter, 
  AuthSession, 
  AuthUser, 
  AppRole, 
  SignInResult, 
  OtpResult 
} from '../types';

/**
 * Convert Supabase session to our AuthSession type
 */
function toAuthSession(session: any, roles: AppRole[] = []): AuthSession | null {
  if (!session?.user) return null;
  
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at || Date.now() / 1000 + 3600,
    user: {
      id: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      fullName: session.user.user_metadata?.full_name,
      isActive: true,
      roles,
    },
  };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  private cachedRoles: Map<string, AppRole[]> = new Map();

  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    
    const roles = await this.getUserRoles(session.user.id);
    return toAuthSession(session, roles);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async signOut(): Promise<void> {
    this.cachedRoles.clear();
    await supabase.auth.signOut();
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // CRITICAL: Never use async directly in onAuthStateChange callback
        // to prevent deadlocks. Defer async operations with setTimeout.
        if (session?.user) {
          // First, immediately provide session without roles to unblock UI
          callback(toAuthSession(session, []));
          
          // Then fetch roles asynchronously and update
          setTimeout(() => {
            this.getUserRoles(session.user.id).then((roles) => {
              callback(toAuthSession(session, roles));
            });
          }, 0);
        } else {
          callback(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }

  async signInWithEmail(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const roles = await this.getUserRoles(data.user.id);
    return {
      success: true,
      session: toAuthSession(data.session, roles) || undefined,
    };
  }

  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<SignInResult> {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user && !data.session) {
      return { 
        success: true, 
        requiresVerification: true,
      };
    }

    const roles = data.user ? await this.getUserRoles(data.user.id) : [];
    return {
      success: true,
      session: toAuthSession(data.session, roles) || undefined,
    };
  }

  async signInWithPhoneOtp(phone: string): Promise<OtpResult> {
    // Call edge function to handle rate limiting and OTP sending
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.rateLimited) {
      return { 
        success: false, 
        rateLimited: true, 
        lockedUntil: new Date(data.lockedUntil),
        error: 'Too many attempts. Please try again later.',
      };
    }

    return { success: true };
  }

  async verifyPhoneOtp(phone: string, code: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const roles = data.user ? await this.getUserRoles(data.user.id) : [];
    return {
      success: true,
      session: toAuthSession(data.session, roles) || undefined,
    };
  }

  isPasskeySupported(): boolean {
    return typeof window !== 'undefined' && 
           'PublicKeyCredential' in window &&
           typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  }

  async signInWithPasskey(): Promise<SignInResult> {
    // WebAuthn implementation would go here
    // For now, return not supported
    return { 
      success: false, 
      error: 'Passkey authentication not yet configured. Please use email or phone.',
    };
  }

  async registerPasskey(): Promise<{ success: boolean; error?: string }> {
    // WebAuthn registration would go here
    return { 
      success: false, 
      error: 'Passkey registration not yet configured.',
    };
  }

  async getUserRoles(userId: string): Promise<AppRole[]> {
    // Check cache first
    const cached = this.cachedRoles.get(userId);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    const roles = (data || []).map((r) => r.role as AppRole);
    this.cachedRoles.set(userId, roles);
    return roles;
  }

  async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(role);
  }

  async isStaff(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.some((r) => ['worker', 'team_leader', 'clinician', 'admin'].includes(r));
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthAdapter();
