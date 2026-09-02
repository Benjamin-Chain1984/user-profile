/**
 * Auth Context - Provides authentication state throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, type AuthSession, type AuthUser, type AppRole } from '@/services/auth';

const PHONE_SESSION_KEY = 'ideal_phone_session';

interface PhoneSession {
  userId: string;
  userName: string;
  roles: string[];
  deviceId: string;
  verifiedAt: string;
}

const PHONE_SESSION_VALID_MS = 180 * 24 * 60 * 60 * 1000; // 6 months

function loadPhoneSession(): PhoneSession | null {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhoneSession;
    const verifiedAt = parsed.verifiedAt ? new Date(parsed.verifiedAt).getTime() : 0;
    if (!verifiedAt || Date.now() - verifiedAt > PHONE_SESSION_VALID_MS) {
      localStorage.removeItem(PHONE_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function phoneSessionToAuthSession(ps: PhoneSession): AuthSession {
  return {
    accessToken: `phone-session-${ps.deviceId}`,
    expiresAt: new Date(ps.verifiedAt).getTime() + PHONE_SESSION_VALID_MS,
    user: {
      id: ps.userId,
      fullName: ps.userName,
      isActive: true,
      roles: ps.roles as AppRole[],
    },
  };
}

interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await authService.getSession();
      if (currentSession) {
        setSession(currentSession);
      } else {
        // Fallback: check for phone-auth session from QR scan flow
        const phoneSession = loadPhoneSession();
        if (phoneSession) {
          setSession(phoneSessionToAuthSession(phoneSession));
        } else {
          setSession(null);
        }
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      // Still check phone session on error
      const phoneSession = loadPhoneSession();
      if (phoneSession) {
        setSession(phoneSessionToAuthSession(phoneSession));
      } else {
        setSession(null);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener first
    const unsubscribe = authService.onAuthStateChange((newSession, rolesLoaded) => {
      if (mounted) {
        if (newSession) {
          setSession(newSession);
        } else {
          // Fallback to phone session if Supabase session is null
          const phoneSession = loadPhoneSession();
          setSession(phoneSession ? phoneSessionToAuthSession(phoneSession) : null);
        }
        // Only stop loading once roles are fully loaded
        if (rolesLoaded) {
          setIsLoading(false);
        }
      }
    });

    // Then check for existing session with timeout to prevent hanging
    const sessionTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[AuthContext] Session check timed out, proceeding as unauthenticated');
        setIsLoading(false);
      }
    }, 5000);

    refreshSession()
      .catch((err) => {
        console.error('[AuthContext] Session refresh failed:', err);
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(sessionTimeout);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(sessionTimeout);
      unsubscribe();
    };
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    localStorage.removeItem(PHONE_SESSION_KEY);
    setSession(null);
  }, []);

  const hasRole = useCallback((role: AppRole): boolean => {
    return session?.user?.roles?.includes(role) ?? false;
  }, [session]);

  const isStaff = session?.user?.roles?.some(
    (r) => ['worker', 'team_leader', 'clinician', 'admin'].includes(r)
  ) ?? false;

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: !!session,
    isStaff,
    hasRole,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
