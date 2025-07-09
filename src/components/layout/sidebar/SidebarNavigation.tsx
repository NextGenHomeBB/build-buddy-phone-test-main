import { NavLink } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
}

interface SidebarNavigationProps {
  items: NavigationItem[];
  collapsed: boolean;
  getNavClasses: (active: boolean) => string;
}

export function SidebarNavigation({ items, collapsed, getNavClasses }: SidebarNavigationProps) {
  return (
    <SidebarGroup className="px-2 py-4">
      {!collapsed && (
        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
          Navigation
        </SidebarGroupLabel>
      )}
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
  );
}