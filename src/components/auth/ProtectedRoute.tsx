/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Respects role preview for testing
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { AccessDeniedPage } from './AccessDeniedPage';
import type { AppRole } from '@/services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requireStaff?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireStaff = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isStaff, hasRole, isPreviewMode, effectiveRoles } = useRoleAccess();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the intended destination for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireStaff && !isStaff) {
    return (
      <AccessDeniedPage message="You don't have permission to access this area." />
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDeniedPage 
        message={`You need ${requiredRole} permissions to access this page.`} 
      />
    );
  }

  return <>{children}</>;
}
