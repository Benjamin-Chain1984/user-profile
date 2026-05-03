/**
 * Main Layout - Wraps protected pages with sidebar navigation
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ViewAsToggle } from './ViewAsToggle';
import { PreviewBanner } from './PreviewBanner';
const idealLogo = '/Ideal-logo.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
              <div className="shrink-0">
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
