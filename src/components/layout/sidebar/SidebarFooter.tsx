interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  return (
    <div className="mt-auto p-4 border-t border-border/50">
      {!collapsed && (
        <div className="text-xs text-muted-foreground text-center">
          Version 2.1.0
        </div>
      )}
    </div>
  );
}