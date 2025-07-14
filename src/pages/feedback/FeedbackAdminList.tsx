import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FeedbackStatusBadge } from '@/components/ui/FeedbackStatusBadge'
import { useFeedbackList, useUpdateFeedbackStatus } from '@/hooks/feedback'
import { format } from 'date-fns'

export default function FeedbackAdminList() {
  const navigate = useNavigate()
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
      <div className="container mx-auto py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Feedback Administration</h1>
          <p className="text-muted-foreground">
            Manage all user feedback submissions
          </p>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          <p>No feedback submissions found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
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
                      <SelectItem value="open" className="text-red-600 focus:text-red-700">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Open
                        </span>
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-yellow-600 focus:text-yellow-700">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          In Progress
                        </span>
                      </SelectItem>
                      <SelectItem value="resolved" className="text-green-600 focus:text-green-700">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Resolved
                        </span>
                      </SelectItem>
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