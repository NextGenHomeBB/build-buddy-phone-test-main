import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SearchChip({ children, active, onClick, className }: SearchChipProps) {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-105 whitespace-nowrap text-xs px-3 py-1.5",
        active && "bg-primary text-primary-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Badge>
  );
}