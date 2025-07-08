import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
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

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: () => (
      <div className="h-4 w-4 rounded bg-primary/20 border border-primary/30" />
    ),
  },
  {
    title: "Projects",
    url: "/projects",
    icon: () => (
      <div className="h-4 w-4 rounded bg-secondary/20 border border-secondary/30" />
    ),
  },
  {
    title: "My Tasks",
    url: "/my-tasks",
    icon: () => (
      <div className="h-4 w-4 rounded bg-accent/20 border border-accent/30" />
    ),
  },
  {
    title: "Reports",
    url: "/reports",
    icon: () => (
      <div className="h-4 w-4 rounded bg-warning/20 border border-warning/30" />
    ),
  },
];

const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: () => (
      <div className="h-4 w-4 rounded bg-destructive/20 border border-destructive/30" />
    ),
  },
  {
    title: "Project Settings",
    url: "/admin/projects",
    icon: () => (
      <div className="h-4 w-4 rounded bg-muted-foreground/20 border border-muted-foreground/30" />
    ),
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [adminExpanded, setAdminExpanded] = useState(false);
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (active: boolean) =>
    active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-72"}>
      <SidebarContent className="bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PG</span>
              </div>
              <span className="font-semibold text-foreground">Phase-Gate</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => getNavClasses(isActive)}
                    >
                      <item.icon />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup className="px-2">
          <div
            className={`flex items-center justify-between px-2 py-1 text-sm font-medium text-muted-foreground ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {!collapsed && <span>Administration</span>}
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAdminExpanded(!adminExpanded)}
                className="h-6 w-6 p-0"
              >
                {adminExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          
          {(adminExpanded || collapsed) && (
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => getNavClasses(isActive)}
                      >
                        <item.icon />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}