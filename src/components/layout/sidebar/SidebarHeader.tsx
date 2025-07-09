interface SidebarHeaderProps {
  collapsed: boolean;
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps) {
  return (
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
  );
}