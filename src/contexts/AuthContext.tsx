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

function loadPhoneSession(): PhoneSession | null {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function phoneSessionToAuthSession(ps: PhoneSession): AuthSession {
  return {
    accessToken: `phone-session-${ps.deviceId}`,
    expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
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
      setSession(currentSession);
    } catch (err) {
      console.error('Error refreshing session:', err);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener first
    const unsubscribe = authService.onAuthStateChange((newSession, rolesLoaded) => {
      if (mounted) {
        setSession(newSession);
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
