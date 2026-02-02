/**
 * View As Toggle - Admin-only dropdown to preview as different roles
 */

import { Eye, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePreview } from '@/contexts/RolePreviewContext';

export function ViewAsToggle() {
  const { user } = useAuth();
  const { previewRole, isPreviewMode, setPreviewRole, clearPreview, hasAdminAccess } = useRolePreview();

  // Only show for actual admins (not preview admins)
  const isActualAdmin = user?.roles?.includes('admin') || 
                        user?.roles?.includes('team_leader') || 
                        user?.roles?.includes('clinician');

  if (!isActualAdmin) {
    return null;
  }

  const roleLabels = {
    none: 'Actual Role',
    worker: 'Support Worker',
    admin: 'Admin',
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isPreviewMode ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View as:</span>
            <span className="font-medium">{roleLabels[previewRole]}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setPreviewRole('admin')}
            className={previewRole === 'admin' ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span>Admin</span>
              <span className="text-xs text-muted-foreground">Full access to all features</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setPreviewRole('worker')}
            className={previewRole === 'worker' ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span>Support Worker</span>
              <span className="text-xs text-muted-foreground">Limited to Home & Resources</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearPreview}>
            <X className="h-4 w-4 mr-2" />
            Exit Preview Mode
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
