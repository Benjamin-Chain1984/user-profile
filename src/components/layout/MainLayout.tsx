/**
 * Main Layout - Wraps protected pages with sidebar navigation
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ViewAsToggle } from './ViewAsToggle';
import { PreviewBanner } from './PreviewBanner';
import { useProfile } from '@/contexts/ProfileContext';
import { UserRound } from 'lucide-react';
const idealLogo = '/Ideal-logo.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile } = useProfile();
  const showClientChip = profile && profile.id !== '1' && profile.fullName !== 'Loading...';

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex w-full flex-col">
        <PreviewBanner />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
        <div className="flex-1 flex flex-col min-h-0">
            <header className="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between border-b border-border px-3 sm:px-4 lg:px-6 bg-card gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <SidebarTrigger className="shrink-0" />
                <img
                  src={idealLogo}
                  alt="IDEAL"
                  className="h-8 sm:h-10 lg:h-12 w-auto shrink-0"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {showClientChip && (
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs sm:text-sm font-medium max-w-[140px] sm:max-w-[220px]">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{profile.fullName}</span>
                  </div>
                )}
                <ViewAsToggle />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
