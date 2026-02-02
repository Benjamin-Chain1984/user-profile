/**
 * Role-Controlled Tab Trigger - Disables settings tab for non-admins
 */

import React from 'react';
import { TabsTrigger } from '@/components/ui/tabs';
import { Lock } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface RoleTabsTriggerProps {
  value: string;
  requiresAdmin?: boolean;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

export function RoleTabsTrigger({ 
  value, 
  requiresAdmin = false, 
  icon, 
  label,
  className = ''
}: RoleTabsTriggerProps) {
  const { isAdmin } = useRoleAccess();
  const hasAccess = !requiresAdmin || isAdmin;

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      toast({
        title: "Access Restricted",
        description: "Admin access required to view settings.",
        variant: "destructive",
      });
    }
  };

  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium opacity-50 cursor-not-allowed ${className}`}
              onClick={handleClick}
            >
              <Lock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Admin access required</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TabsTrigger value={value} className={`gap-2 ${className}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}
