import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateTask } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, CheckCircle } from 'lucide-react';

interface AddTaskDialogProps {
  projectId: string;
  phaseId: string;
  children?: React.ReactNode;
}

export function AddTaskDialog({ projectId, phaseId, children }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimatedHours: '',
    category: '',
  });

  const { mutate: createTask, isPending } = useCreateTask();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    console.log('Creating task with data:', {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      estimated_hours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      project_id: projectId,
      phase_id: phaseId,
    });

    createTask({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      estimated_hours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      project_id: projectId,
      phase_id: phaseId,
    }, {
      onSuccess: (data) => {
        console.log('Task created successfully:', data);
        toast({
          title: 'Success',
          description: 'Checklist item added successfully',
          action: <CheckCircle className="h-4 w-4" />,
        });
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          estimatedHours: '',
          category: '',
        });
      },
      onError: (error) => {
        console.error('Error creating task:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to add checklist item. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Checklist Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Checklist Item Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter checklist item title"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Foundation, Electrical, Plumbing"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter checklist item description (optional)"
              disabled={isPending}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                setFormData(prev => ({ ...prev, priority: value }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
              placeholder="Enter estimated hours (optional)"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !formData.title.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Checklist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}