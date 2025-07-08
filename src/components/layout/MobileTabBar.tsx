import { NavLink, useLocation } from "react-router-dom";

const tabItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: () => (
      <div className="h-6 w-6 rounded bg-primary/20 border border-primary/30" />
    ),
  },
  {
    title: "Projects",
    url: "/projects", 
    icon: () => (
      <div className="h-6 w-6 rounded bg-secondary/20 border border-secondary/30" />
    ),
  },
  {
    title: "Tasks",
    url: "/my-tasks",
    icon: () => (
      <div className="h-6 w-6 rounded bg-accent/20 border border-accent/30" />
    ),
  },
  {
    title: "Reports",
    url: "/reports",
    icon: () => (
      <div className="h-6 w-6 rounded bg-warning/20 border border-warning/30" />
    ),
  },
];

export function MobileTabBar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky bottom-0 z-30 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 safe-area-bottom">
        {tabItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-0 flex-1 transition-colors ${
              isActive(item.url)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <item.icon />
            <span className="text-xs font-medium mt-1 truncate">
              {item.title}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}