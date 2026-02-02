/**
 * Restricted Section Component
 * Wraps content that should be disabled for non-admin users
 * Uses role preview for testing
 */

import { ReactNode } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RestrictedSectionProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'team_leader' | 'clinician' | 'worker';
  message?: string;
}

export function RestrictedSection({ 
  children, 
  requiredRole = 'admin',
  message = 'Admin access required'
}: RestrictedSectionProps) {
  const { hasRole } = useRoleAccess();
  const hasAccess = hasRole(requiredRole);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-not-allowed">
            <div className="opacity-50 pointer-events-none select-none">
              {children}
            </div>
            <div className="absolute inset-0 bg-muted/30 rounded-lg" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
