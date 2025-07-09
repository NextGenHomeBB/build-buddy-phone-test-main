import { useState } from "react";
import { ChevronDown, ChevronRight, Home, FolderOpen, CheckSquare, BarChart3, Users, Settings, Shield } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    badge: null,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
    badge: "12",
  },
  {
    title: "My Tasks",
    url: "/my-tasks",
    icon: CheckSquare,
    badge: "3",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    badge: null,
  },
];

const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
    badge: "5",
  },
  {
    title: "User Access",
    url: "/admin/access",
    icon: Shield,
    badge: null,
  },
  {
    title: "Project Settings",
    url: "/admin/projects",
    icon: Settings,
    badge: null,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasAdminAccess, canViewReports, hasFullAccess } = useRoleAccess();
  const [adminExpanded, setAdminExpanded] = useState(
    adminItems.some(item => item.url === currentPath)
  );
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (active: boolean) =>
    active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors";

  // Filter navigation items based on role
  const filteredNavItems = navigationItems.filter(item => {
    if (item.url === "/reports") {
      return canViewReports();
    }
    return true; // Show all other nav items
  });

  return (
    <Sidebar 
      className={`${collapsed ? "w-16" : "w-72"} transition-all duration-300 ease-in-out`}
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">PG</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Phase-Gate</span>
                <div className="text-xs text-muted-foreground">Keeper</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">PG</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-2 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${getNavClasses(isActive)}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto text-xs h-5 px-1.5 bg-primary/20 text-primary border-primary/30"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only visible for admins */}
        {hasFullAccess() && (
          <SidebarGroup className="px-2">
            <div className="mb-2">
              {!collapsed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className="w-full justify-between h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <span>Administration</span>
                  {adminExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="h-8" /> // Spacer for collapsed state
              )}
            </div>
            
            {(adminExpanded || collapsed) && (
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="w-full">
                        <NavLink
                          to={item.url}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${getNavClasses(isActive)}`
                          }
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {item.badge && (
                                <Badge 
                                  variant="outline" 
                                  className="ml-auto text-xs h-5 px-1.5"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-border/50">
          {!collapsed && (
            <div className="text-xs text-muted-foreground text-center">
              Version 2.1.0
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}