/**
 * Main Layout - Wraps protected pages with sidebar navigation
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import idealLogo from '@/assets/ideal-logo.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card gap-3">
            <SidebarTrigger />
            <img 
              src={idealLogo} 
              alt="IDEAL" 
              className="h-8 w-auto" 
            />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
