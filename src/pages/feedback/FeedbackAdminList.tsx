import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink } from 'lucide-react'
import { FeedbackStatusBadge } from '@/components/ui/FeedbackStatusBadge'
import { useFeedbackList, useUpdateFeedbackStatus } from '@/hooks/feedback'
import { format } from 'date-fns'

export default function FeedbackAdminList() {
  const { data: feedbackList, isLoading } = useFeedbackList({ all: true })
  const updateStatus = useUpdateFeedbackStatus()

  const handleStatusChange = (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    updateStatus.mutate({ id, status })
  }

  if (isLoading) {
    return <div>Loading feedback...</div>
  }

  if (!feedbackList || feedbackList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No feedback submissions found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feedback Administration</h1>
        <p className="text-muted-foreground">
          Manage all user feedback submissions
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbackList.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell>
                  {format(new Date(feedback.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  User #{feedback.user_id.slice(0, 8)}
                </TableCell>
                <TableCell className="capitalize">
                  {feedback.category}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="truncate font-medium" title={feedback.title}>
                      {feedback.title}
                    </div>
                    <div className="text-sm text-muted-foreground truncate" title={feedback.message}>
                      {feedback.message}
                    </div>
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
                        View
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No link</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={feedback.status}
                    onValueChange={(value) =>
                      handleStatusChange(feedback.id, value as 'open' | 'in_progress' | 'resolved')
                    }
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}