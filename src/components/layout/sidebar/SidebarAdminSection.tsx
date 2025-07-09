import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
}

interface SidebarAdminSectionProps {
  items: AdminItem[];
  collapsed: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  getNavClasses: (active: boolean) => string;
}

export function SidebarAdminSection({ 
  items, 
  collapsed, 
  expanded, 
  onToggleExpanded, 
  getNavClasses 
}: SidebarAdminSectionProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarGroup className="px-2">
      <div className="mb-2">
        {!collapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="w-full justify-between h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Administration</span>
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="h-8" /> // Spacer for collapsed state
        )}
      </div>
      
      {(expanded || collapsed) && (
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {items.map((item) => (
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
  );
}