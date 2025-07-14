import { useState, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StackedAvatars } from '@/components/ui/StackedAvatars';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Eye,
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { Task } from '@/hooks/useTasks';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  review: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

const statusIcons = {
  todo: Clock,
  'in-progress': Play,
  review: Eye,
  completed: CheckCircle,
};

interface TaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: Task['status']) => void;
}

export function TaskCard({ task, onStatusUpdate }: TaskCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if current user is primary worker or assigned
  const isPrimaryWorker = task.workers?.some(w => w.id === user?.id && w.is_primary) || task.assignedTo === user?.id;
  const isAssigned = task.workers?.some(w => w.id === user?.id) || task.assignedTo === user?.id;
  
  const handleSwipeRight = () => {
    // Only primary worker can swipe to change status
    if (task.status !== 'completed' && isPrimaryWorker) {
      const nextStatus = task.status === 'todo' ? 'in-progress' : 
                        task.status === 'in-progress' ? 'review' : 'completed';
      onStatusUpdate(task.id, nextStatus);
      toast({
        title: "Task Updated",
        description: `Task moved to ${nextStatus.replace('-', ' ')}`,
      });
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'todo' && isPrimaryWorker) {
      onStatusUpdate(task.id, 'in-progress');
      toast({
        title: "Task Started",
        description: "Task is now in progress!",
      });
    }
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== 'completed' && isPrimaryWorker) {
      onStatusUpdate(task.id, 'completed');
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed!",
      });
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedRight: handleSwipeRight,
    trackMouse: true,
    delta: 50,
  });

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const StatusIcon = statusIcons[task.status];

  return (
    <Card 
      {...(isPrimaryWorker ? swipeHandlers : {})}
      className={`relative cursor-pointer hover:shadow-md transition-all duration-200 ${
        isOverdue ? 'border-red-200 bg-red-50' : ''
      } ${isDueToday ? 'border-orange-200 bg-orange-50' : ''} ${
        !isAssigned ? 'opacity-75' : ''
      }`}
    >
      {/* Play Button Overlay - only for primary worker */}
      {task.status === 'todo' && isPrimaryWorker && (
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePlayClick}
            className="h-8 w-8 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            <Play className="h-4 w-4 text-primary" fill="currentColor" />
          </Button>
        </div>
      )}
      
      {/* Complete Button Overlay - only for primary worker */}
      {task.status === 'in-progress' && isPrimaryWorker && (
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCompleteClick}
            className="h-8 w-8 p-0 rounded-full bg-green-100 hover:bg-green-200"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground truncate">
              {task.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {task.projectName} {task.phaseName && `• ${task.phaseName}`}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge className={priorityColors[task.priority]} variant="outline">
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status]} variant="outline">
              <StatusIcon className="w-3 h-3 mr-1" />
              {task.status.replace('-', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Workers Display */}
        {task.workers && task.workers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Assigned:</span>
            <StackedAvatars workers={task.workers} maxVisible={3} size="sm" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : 'text-muted-foreground'
              }`}>
                <Calendar className="w-4 h-4" />
                <span>
                  {isToday(new Date(task.dueDate)) 
                    ? 'Due Today' 
                    : format(new Date(task.dueDate), 'MMM d')}
                </span>
              </div>
            )}
            
            {task.estimatedHours && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>
          
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Assignment Status for non-assigned users */}
        {!isAssigned && (
          <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
            You are not assigned to this task
          </div>
        )}
      </CardContent>
    </Card>
  );
}