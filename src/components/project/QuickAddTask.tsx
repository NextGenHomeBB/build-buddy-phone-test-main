import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateTask } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

interface QuickAddTaskProps {
  projectId: string;
  phaseId: string;
}

export function QuickAddTask({ projectId, phaseId }: QuickAddTaskProps) {
  const [title, setTitle] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { mutate: createTask, isPending } = useCreateTask();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    console.log('Quick adding task:', { title, projectId, phaseId });

    createTask({
      title: title.trim(),
      priority: 'medium',
      project_id: projectId,
      phase_id: phaseId,
    }, {
      onSuccess: (data) => {
        console.log('Quick task created:', data);
        toast({
          title: 'Added to checklist',
          description: `"${title}" has been added to the checklist`,
        });
        setTitle('');
        setIsVisible(false);
      },
      onError: (error) => {
        console.error('Error quick adding task:', error);
        toast({
          title: 'Error',
          description: 'Failed to add item. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Quick add item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter checklist item title..."
        disabled={isPending}
        autoFocus
        onBlur={() => {
          if (!title.trim()) {
            setIsVisible(false);
          }
        }}
      />
      <Button 
        type="submit" 
        size="sm" 
        disabled={isPending || !title.trim()}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}