/**
 * useRoleAccess - Hook for checking role-based permissions
 * Considers role preview state for testing
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRolePreview } from '@/contexts/RolePreviewContext';
import type { AppRole } from '@/services/auth/types';

export function useRoleAccess() {
  const { user, isAuthenticated } = useAuth();
  const { getEffectiveRole, isPreviewMode } = useRolePreview();

  const actualRoles = user?.roles ?? [];
  const effectiveRoles = getEffectiveRole(actualRoles);

  const hasRole = (role: AppRole): boolean => {
    return effectiveRoles.includes(role);
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some(role => effectiveRoles.includes(role));
  };

  const isAdmin = hasAnyRole(['admin', 'team_leader', 'clinician']);
  const isWorkerOnly = effectiveRoles.length > 0 && effectiveRoles.every(r => r === 'worker');
  const isStaff = hasAnyRole(['worker', 'team_leader', 'clinician', 'admin']);

  // Navigation sections accessible to workers
  const canAccessHome = isStaff;
  const canAccessResources = isStaff;
  const canAccessProfile = isAdmin; // Workers can't access profile config
  const canAccessModules = isAdmin; // Workers can't enable/disable modules
  const canAccessAdmin = hasRole('admin');

  // Module-level permissions
  const canAccessModuleSettings = isAdmin;
  const canLogData = isStaff; // All staff can log data
  const canViewHistory = isStaff; // All staff can view history
  const canExportReports = isStaff; // All staff can export reports
  const canEditConfiguration = isAdmin; // Only admins can edit config

  return {
    isAuthenticated,
    actualRoles,
    effectiveRoles,
    isPreviewMode,
    hasRole,
    hasAnyRole,
    isAdmin,
    isWorkerOnly,
    isStaff,
    // Navigation access
    canAccessHome,
    canAccessResources,
    canAccessProfile,
    canAccessModules,
    canAccessAdmin,
    // Module-level access
    canAccessModuleSettings,
    canLogData,
    canViewHistory,
    canExportReports,
    canEditConfiguration,
  };
}
