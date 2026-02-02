import { Home, User, Settings, BookOpen, Lock } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home, requiresAdmin: false },
  { id: 'profile', label: 'Profile', icon: User, requiresAdmin: true },
  { id: 'modules', label: 'Modules', icon: Settings, requiresAdmin: true },
  { id: 'resources', label: 'Resources', icon: BookOpen, requiresAdmin: false },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { isAdmin, canAccessProfile, canAccessModules } = useRoleAccess();

  const canAccessTab = (tabId: string): boolean => {
    switch (tabId) {
      case 'home':
        return true;
      case 'resources':
        return true;
      case 'profile':
        return canAccessProfile;
      case 'modules':
        return canAccessModules;
      default:
        return false;
    }
  };

  const handleTabClick = (tabId: string) => {
    if (!canAccessTab(tabId)) {
      toast({
        title: "Access Restricted",
        description: "You don't have access to this section.",
        variant: "destructive",
      });
      return;
    }
    onTabChange(tabId);
  };

  return (
    <TooltipProvider>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasAccess = canAccessTab(tab.id);
            
            const buttonContent = (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 sm:gap-1 py-2 sm:py-3 px-1 sm:px-2 transition-colors touch-manipulation active:scale-95 ${
                  isActive 
                    ? 'text-primary' 
                    : hasAccess
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                {hasAccess ? (
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                ) : (
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );

            if (!hasAccess) {
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin access required</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
