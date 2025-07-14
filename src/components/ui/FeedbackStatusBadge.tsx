import { Badge } from '@/components/ui/badge'

interface FeedbackStatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved'
}

export function FeedbackStatusBadge({ status }: FeedbackStatusBadgeProps) {
  const variants = {
    open: 'default',
    in_progress: 'secondary', 
    resolved: 'outline'
  } as const

  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved'
  }

  return (
    <Badge variant={variants[status]} className="capitalize">
      {labels[status]}
    </Badge>
  )
}