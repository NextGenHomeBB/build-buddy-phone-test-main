import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScheduleCategoryBadgeProps {
  category: 'normal' | 'materials' | 'storingen' | 'specials';
  className?: string;
}

const categoryConfig = {
  normal: {
    label: 'Normal',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  materials: {
    label: 'Materials',
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  storingen: {
    label: 'Emergency',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  specials: {
    label: 'Special',
    variant: 'secondary' as const,
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  }
};

export function ScheduleCategoryBadge({ category, className }: ScheduleCategoryBadgeProps) {
  const config = categoryConfig[category];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}