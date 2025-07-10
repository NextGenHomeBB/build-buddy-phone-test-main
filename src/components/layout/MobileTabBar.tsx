import { NavLink, useLocation } from "react-router-dom";
import { Home, FolderOpen, CheckSquare, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";

export function MobileTabBar() {
  const location = useLocation();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  
  const projectCount = projects?.length || 0;
  const taskCount = tasks?.filter(task => task.status !== 'completed').length || 0;

  const tabItems = [
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
      badge: projectCount > 0 ? projectCount.toString() : null,
    },
    {
      title: "Tasks",
      url: "/my-tasks",
      icon: CheckSquare,
      badge: taskCount > 0 ? taskCount.toString() : null,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      badge: null,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 shadow-lg">
      <div className="flex items-center justify-around py-1 px-2 safe-area-bottom">
        {tabItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={`relative flex flex-col items-center justify-center py-2 px-2 rounded-xl min-w-0 flex-1 transition-all duration-200 active:scale-95 ${
              isActive(item.url)
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center rounded-full"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 truncate transition-colors ${
              isActive(item.url) ? "text-primary" : ""
            }`}>
              {item.title}
            </span>
            
            {/* Active indicator */}
            {isActive(item.url) && (
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </NavLink>
        ))}
      </div>
      
      {/* Safe area bottom for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}