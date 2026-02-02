/**
 * ModuleTabs - Standardized tab layout for all clinical modules
 * Tabs: Tracking | Trends | Settings (Admin only)
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleTabsTrigger } from '@/components/ui/role-tabs-trigger';
import { Clock, TrendingUp, Settings, FileText } from 'lucide-react';
import { ReactNode } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface ModuleTabsProps {
  defaultTab?: string;
  trackingContent: ReactNode;
  trendsContent: ReactNode;
  settingsContent: ReactNode;
  exportContent?: ReactNode;
  className?: string;
}

export function ModuleTabs({
  defaultTab = 'tracking',
  trackingContent,
  trendsContent,
  settingsContent,
  exportContent,
  className,
}: ModuleTabsProps) {
  const { isAdmin } = useRoleAccess();
  const tabCount = exportContent ? 4 : 3;

  return (
    <Tabs defaultValue={defaultTab} className={`space-y-4 ${className || ''}`}>
      <TabsList className={`grid w-full grid-cols-${tabCount} lg:w-auto lg:inline-flex`}>
        <TabsTrigger value="tracking" className="gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Tracking</span>
        </TabsTrigger>
        <TabsTrigger value="trends" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Trends</span>
        </TabsTrigger>
        {exportContent && (
          <TabsTrigger value="export" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        )}
        <RoleTabsTrigger
          value="settings"
          requiresAdmin
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
        />
      </TabsList>

      <TabsContent value="tracking" className="space-y-4">
        {trackingContent}
      </TabsContent>

      <TabsContent value="trends">
        {trendsContent}
      </TabsContent>

      {exportContent && (
        <TabsContent value="export">
          {exportContent}
        </TabsContent>
      )}

      {isAdmin && (
        <TabsContent value="settings">
          {settingsContent}
        </TabsContent>
      )}
    </Tabs>
  );
}
