import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { FeedbackStatusBadge } from '@/components/ui/FeedbackStatusBadge'
import { useFeedbackList } from '@/hooks/feedback'
import { format } from 'date-fns'

export function MyFeedbackList() {
  const { data: feedbackList, isLoading } = useFeedbackList()

  if (isLoading) {
    return <div>Loading your feedback...</div>
  }

  if (!feedbackList || feedbackList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>You haven't submitted any feedback yet.</p>
        <p>Use the "Submit Feedback" tab to share your thoughts with us.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Issue Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedbackList.map((feedback) => (
          <TableRow key={feedback.id}>
            <TableCell>
              {format(new Date(feedback.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="capitalize">
              {feedback.category}
            </TableCell>
            <TableCell>
              <div className="max-w-xs truncate" title={feedback.title}>
                {feedback.title}
              </div>
            </TableCell>
            <TableCell>
              <FeedbackStatusBadge status={feedback.status as 'open' | 'in_progress' | 'resolved'} />
            </TableCell>
            <TableCell>
              {feedback.external_issue_url ? (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2"
                >
                  <a
                    href={feedback.external_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Issue
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">No link</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}