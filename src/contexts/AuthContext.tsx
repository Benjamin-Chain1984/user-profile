/**
 * Auth Context - Provides authentication state throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService, type AuthSession, type AuthUser, type AppRole } from '@/services/auth';

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
    // Set up auth state listener first
    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });

    // Then check for existing session
    refreshSession().finally(() => setIsLoading(false));

    return unsubscribe;
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
