import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { navigationItems, adminItems } from "./sidebar/navigationItems";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarAdminSection } from "./sidebar/SidebarAdminSection";
import { SidebarFooter } from "./sidebar/SidebarFooter";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasAdminAccess, canViewReports, hasFullAccess } = useRoleAccess();
  const [adminExpanded, setAdminExpanded] = useState(
    adminItems.some(item => item.url === currentPath)
  );
  
  const collapsed = state === "collapsed";

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
        <SidebarHeader collapsed={collapsed} />
        
        <SidebarNavigation 
          items={filteredNavItems}
          collapsed={collapsed}
          getNavClasses={getNavClasses}
        />

        {hasFullAccess() && (
          <SidebarAdminSection
            items={adminItems}
            collapsed={collapsed}
            expanded={adminExpanded}
            onToggleExpanded={() => setAdminExpanded(!adminExpanded)}
            getNavClasses={getNavClasses}
          />
        )}

        <SidebarFooter collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
}