/**
 * Role Preview Context - Allows admins to preview app as different roles
 * This only changes UI permissions for testing, never modifies database roles
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppRole } from '@/services/auth/types';

type PreviewRole = 'none' | 'worker' | 'admin';

interface RolePreviewContextType {
  /** The role being previewed (or 'none' for actual role) */
  previewRole: PreviewRole;
  /** Whether currently in preview mode */
  isPreviewMode: boolean;
  /** Set the preview role - admins only */
  setPreviewRole: (role: PreviewRole) => void;
  /** Clear the preview and return to actual role */
  clearPreview: () => void;
  /** Get effective role (preview or actual) */
  getEffectiveRole: (actualRoles: AppRole[]) => AppRole[];
  /** Check if user has admin access (considering preview) */
  hasAdminAccess: (actualRoles: AppRole[]) => boolean;
  /** Check if user is support worker (considering preview) */
  isWorkerOnly: (actualRoles: AppRole[]) => boolean;
}

const RolePreviewContext = createContext<RolePreviewContextType | undefined>(undefined);

export function RolePreviewProvider({ children }: { children: React.ReactNode }) {
  const [previewRole, setPreviewRoleState] = useState<PreviewRole>('none');

  const isPreviewMode = previewRole !== 'none';

  const setPreviewRole = useCallback((role: PreviewRole) => {
    setPreviewRoleState(role);
    // Store in sessionStorage so it persists across page navigations but not sessions
    if (role === 'none') {
      sessionStorage.removeItem('rolePreview');
    } else {
      sessionStorage.setItem('rolePreview', role);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewRoleState('none');
    sessionStorage.removeItem('rolePreview');
  }, []);

  const getEffectiveRole = useCallback((actualRoles: AppRole[]): AppRole[] => {
    if (previewRole === 'none') {
      return actualRoles;
    }
    // Return simulated roles based on preview
    if (previewRole === 'worker') {
      return ['worker'];
    }
    if (previewRole === 'admin') {
      return ['admin'];
    }
    return actualRoles;
  }, [previewRole]);

  const hasAdminAccess = useCallback((actualRoles: AppRole[]): boolean => {
    const effectiveRoles = getEffectiveRole(actualRoles);
    return effectiveRoles.includes('admin') || effectiveRoles.includes('team_leader') || effectiveRoles.includes('clinician');
  }, [getEffectiveRole]);

  const isWorkerOnly = useCallback((actualRoles: AppRole[]): boolean => {
    const effectiveRoles = getEffectiveRole(actualRoles);
    return effectiveRoles.length > 0 && 
           effectiveRoles.every(r => r === 'worker');
  }, [getEffectiveRole]);

  // Initialize from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem('rolePreview') as PreviewRole;
    if (stored && (stored === 'worker' || stored === 'admin')) {
      setPreviewRoleState(stored);
    }
  }, []);

  // Also check URL params for preview
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('rolePreview');
    if (roleParam === 'worker' || roleParam === 'admin') {
      setPreviewRoleState(roleParam);
      sessionStorage.setItem('rolePreview', roleParam);
    }
  }, []);

  const value: RolePreviewContextType = {
    previewRole,
    isPreviewMode,
    setPreviewRole,
    clearPreview,
    getEffectiveRole,
    hasAdminAccess,
    isWorkerOnly,
  };

  return (
    <RolePreviewContext.Provider value={value}>
      {children}
    </RolePreviewContext.Provider>
  );
}

export function useRolePreview() {
  const context = useContext(RolePreviewContext);
  if (context === undefined) {
    throw new Error('useRolePreview must be used within a RolePreviewProvider');
  }
  return context;
}
