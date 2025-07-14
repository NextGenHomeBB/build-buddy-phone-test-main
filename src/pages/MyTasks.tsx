import { useState, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks, useTaskStats, Task, TaskFilters } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Eye,
  BarChart3,
  TrendingUp,
  Target
} from 'lucide-react';
import { format, isToday, isPast, differenceInDays } from 'date-fns';

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

function TaskCard({ task, onStatusUpdate }: { task: Task; onStatusUpdate: (taskId: string, status: Task['status']) => void }) {
  const { toast } = useToast();
  
  const handleSwipeRight = () => {
    if (task.status !== 'completed') {
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
    if (task.status === 'todo') {
      onStatusUpdate(task.id, 'in-progress');
      toast({
        title: "Task Started",
        description: "Task is now in progress!",
      });
    }
  };

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== 'completed') {
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
      {...swipeHandlers}
      className={`relative cursor-pointer hover:shadow-md transition-all duration-200 ${
        isOverdue ? 'border-red-200 bg-red-50' : ''
      } ${isDueToday ? 'border-orange-200 bg-orange-50' : ''}`}
    >
      {/* Play Button Overlay */}
      {task.status === 'todo' && (
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
      
      {/* Complete Button Overlay */}
      {task.status === 'in-progress' && (
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
      </CardContent>
    </Card>
  );
}

export default function MyTasks() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [activeTab, setActiveTab] = useState('all');
  
  const { tasks, isLoading, markCompleted, updateStatus, isUpdating } = useTasks(filters);
  const { data: stats } = useTaskStats();
  const { toast } = useToast();

  const handleStatusUpdate = async (taskId: string, status: Task['status']) => {
    try {
      await updateStatus(taskId, status);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    switch (activeTab) {
      case 'active':
        filtered = tasks.filter(task => ['todo', 'in-progress', 'review'].includes(task.status));
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'completed');
        break;
      case 'overdue':
        filtered = tasks.filter(task => 
          task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
        );
        break;
    }
    
    return filtered;
  }, [tasks, activeTab]);

  const taskCounts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter(task => ['todo', 'in-progress', 'review'].includes(task.status)).length,
    completed: tasks.filter(task => task.status === 'completed').length,
    overdue: tasks.filter(task => 
      task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
    ).length,
  }), [tasks]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your assigned tasks and progress
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">0</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completion Progress */}
        {stats && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%</span>
              </div>
              <Progress value={stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filters.priority?.[0] || 'all'}
              onValueChange={(value) => 
                setFilters({ 
                  ...filters, 
                  priority: value === 'all' ? undefined : [value as Task['priority']] 
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({taskCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              Active ({taskCounts.active})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Done ({taskCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              Overdue ({taskCounts.overdue})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You don't have any tasks assigned yet."
                      : `No ${activeTab} tasks at the moment.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {filteredTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={{
                        ...task,
                        projectId: task.project_id,
                        projectName: task.project?.name || 'Unknown Project',
                        phaseId: task.phase_id,
                        phaseName: task.phase?.name,
                        assignedTo: task.assigned_to,
                        assignedBy: task.assigned_by,
                        dueDate: task.due_date,
                        createdAt: task.created_at,
                        updatedAt: task.updated_at,
                        estimatedHours: task.estimated_hours,
                        actualHours: task.actual_hours,
                        comments: (task.comments || []).map((comment: any) => ({
                          id: comment.id,
                          taskId: comment.task_id,
                          user: comment.user?.name || 'Unknown User',
                          message: comment.message,
                          createdAt: comment.created_at
                        }))
                      }} 
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Swipe Instructions */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 Swipe right on any task to move it to the next status
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}