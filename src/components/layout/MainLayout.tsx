/**
 * Main Layout - Wraps protected pages with sidebar navigation
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ViewAsToggle } from './ViewAsToggle';
import { PreviewBanner } from './PreviewBanner';
const idealLogo = '/logo-design-new.png';

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
            <header className="h-14 flex-shrink-0 flex items-center justify-between border-b border-border px-4 bg-card gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <img 
                  src={idealLogo} 
                  alt="IDEAL" 
                  className="h-8 w-auto" 
                />
              </div>
              <ViewAsToggle />
            </header>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
