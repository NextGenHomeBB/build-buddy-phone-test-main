import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ExternalLink, ArrowLeft, Trash2, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FeedbackStatusBadge } from '@/components/ui/FeedbackStatusBadge'
import { useFeedbackList, useUpdateFeedbackStatus } from '@/hooks/feedback'
import { format } from 'date-fns'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export default function FeedbackAdminList() {
  const navigate = useNavigate()
  const { data: feedbackList, isLoading, refetch } = useFeedbackList({ all: true })
  const updateStatus = useUpdateFeedbackStatus()
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStatusChange = (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    updateStatus.mutate({ id, status })
  }

  const handleSelectItem = (feedbackId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, feedbackId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== feedbackId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(feedbackList?.map(f => f.id) || [])
    } else {
      setSelectedItems([])
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .in('id', selectedItems)
      
      if (error) throw error
      
      toast({
        title: "Success",
        description: `Deleted ${selectedItems.length} feedback item(s)`,
      })
      
      setSelectedItems([])
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback items",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
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

      {selectedItems.length > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} item(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === feedbackList.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attachment</TableHead>
              <TableHead>Issue Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbackList.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(feedback.id)}
                    onCheckedChange={(checked) => handleSelectItem(feedback.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(feedback.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  User #{feedback.user_id.slice(0, 8)}
                </TableCell>
                <TableCell className="capitalize">
                  {feedback.category}
                </TableCell>
                <TableCell 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedFeedback(feedback)}
                >
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
                  {feedback.attachment_url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImage(feedback.attachment_url)}
                      className="h-8 px-2"
                    >
                      <Image className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">No image</span>
                  )}
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
                          Progress
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

      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedFeedback.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Category: <span className="capitalize">{selectedFeedback.category}</span></span>
                <span>Date: {format(new Date(selectedFeedback.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Feedback Attachment</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img 
                src={selectedImage} 
                alt="Feedback attachment" 
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}