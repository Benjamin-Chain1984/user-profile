/**
 * Main Layout - Wraps protected pages with sidebar navigation
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ViewAsToggle } from './ViewAsToggle';
import { PreviewBanner } from './PreviewBanner';
const idealLogo = '/logo_design.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        <PreviewBanner />
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card gap-3">
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
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
