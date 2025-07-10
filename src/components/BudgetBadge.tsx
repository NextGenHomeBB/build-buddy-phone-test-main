import { Badge } from '@/components/ui/badge';
import { Euro } from 'lucide-react';

interface BudgetBadgeProps {
  amount: number;
  className?: string;
}

export function BudgetBadge({ amount, className }: BudgetBadgeProps) {
  const isNegative = amount < 0;
  
  return (
    <Badge 
      variant={isNegative ? "destructive" : "secondary"}
      className={`flex items-center gap-1 ${className}`}
    >
      <Euro className="h-3 w-3" />
      <span className="font-medium">
        {amount >= 0 ? '+' : ''}{amount.toFixed(0)}
      </span>
      <span className="text-xs opacity-75">remaining</span>
    </Badge>
  );
}