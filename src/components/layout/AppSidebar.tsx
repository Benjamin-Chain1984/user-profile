/**
 * App Sidebar - Main navigation for the application
 * Uses role-based access control with preview support
 */

import { Home, Users, LogOut, Lock, ChevronRight } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { toast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: Home, requiresAdmin: false },
];

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  requiresAdmin: boolean;
  children?: { title: string; url: string }[];
}

const adminItems: AdminNavItem[] = [
  {
    title: 'Admin',
    url: '/admin',
    icon: Users,
    requiresAdmin: true,
    children: [
      { title: 'Clients', url: '/admin' },
      { title: 'My Team', url: '/admin/team' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { canAccessAdmin } = useRoleAccess();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => location.pathname === path;

  const handleRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Access Restricted",
      description: "You don't have access to this section.",
      variant: "destructive",
    });
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section - always visible but disabled for non-admins */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                if (!canAccessAdmin) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={handleRestrictedClick}
                            className="flex items-center gap-3 opacity-50 cursor-not-allowed"
                          >
                            <Lock className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Admin access required</p>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                if (!item.children) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink to={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const isGroupActive = item.children.some((child) => isActive(child.url));

                return (
                  <Collapsible
                    key={item.title}
                    open={isGroupActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={isGroupActive}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton asChild isActive={isActive(child.url)}>
                              <NavLink to={child.url} className="flex items-center gap-2">
                                <span>{child.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="text-sm text-muted-foreground mb-2 truncate">
          {user?.email}
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
