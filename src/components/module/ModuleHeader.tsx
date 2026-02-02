/**
 * ModuleHeader - Standardized header for all clinical modules
 */

import { Button } from '@/components/ui/button';
import { FileDown, Plus } from 'lucide-react';
import { ReactNode } from 'react';

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  onExport?: () => void;
  exportLabel?: string;
  children?: ReactNode;
}

export function ModuleHeader({
  title,
  subtitle,
  icon,
  primaryAction,
  onExport,
  exportLabel = 'Export',
  children,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            {exportLabel}
          </Button>
        )}
        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            {primaryAction.icon || <Plus className="h-4 w-4 mr-2" />}
            {primaryAction.label}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
