/**
 * Preview Banner - Shows when viewing app as a different role
 */

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRolePreview } from '@/contexts/RolePreviewContext';

export function PreviewBanner() {
  const { previewRole, isPreviewMode, clearPreview } = useRolePreview();

  if (!isPreviewMode) {
    return null;
  }

  const roleLabels = {
    none: '',
    worker: 'Support Worker',
    admin: 'Admin',
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Previewing as {roleLabels[previewRole]}
        </span>
        <span className="text-xs opacity-75">
          (This is a test view only — your actual role is unchanged)
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearPreview}
        className="h-7 px-2 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
      >
        <X className="h-4 w-4 mr-1" />
        Exit
      </Button>
    </div>
  );
}
