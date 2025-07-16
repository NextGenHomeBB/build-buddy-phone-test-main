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
import { TaskCard } from '@/components/TaskCard';
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
  low: 'bg-primary/10 text-primary border-primary/20',
  medium: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  urgent: 'bg-destructive text-destructive-foreground border-destructive',
};

const statusColors = {
  todo: 'bg-muted text-muted-foreground border-muted',
  'in-progress': 'bg-primary/10 text-primary border-primary/20',
  review: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  completed: 'bg-green-500/10 text-green-700 border-green-500/20',
};

const statusIcons = {
  todo: Clock,
  'in-progress': Play,
  review: Eye,
  completed: CheckCircle,
};


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
      <div className="min-h-screen w-full">
        <div className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  My Tasks
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Track your assigned tasks and progress
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-muted rounded-lg flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-1">
              <Card className="hover:shadow-md transition-shadow bg-card border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Total</p>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.total}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow bg-card border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Done</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow bg-card border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Active</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow bg-card border-border">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground font-medium mb-1">Overdue</p>
                      <p className="text-2xl sm:text-3xl font-bold text-red-600">{taskCounts.overdue}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Completion Progress */}
          {stats && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm sm:text-base font-medium text-foreground">Progress</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-primary">
                    {stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0} 
                  className="h-3 sm:h-4 mb-2" 
                />
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>{stats.completed} completed</span>
                  <span>{stats.total - stats.completed} remaining</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                className="pl-10 h-11 text-sm sm:text-base rounded-lg border-border"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="flex gap-3">
              <Select
                value={filters.priority?.[0] || 'all'}
                onValueChange={(value) => 
                  setFilters({ 
                    ...filters, 
                    priority: value === 'all' ? undefined : [value as Task['priority']] 
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-40 h-11 rounded-lg border-border">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🔵 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-12 p-1 bg-muted rounded-lg">
              <TabsTrigger 
                value="all" 
                className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md transition-all"
              >
                <Target className="w-4 h-4 sm:hidden" />
                <span className="font-medium">All</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                  {taskCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md transition-all"
              >
                <Play className="w-4 h-4 sm:hidden" />
                <span className="font-medium">Active</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                  {taskCounts.active}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md transition-all"
              >
                <CheckCircle className="w-4 h-4 sm:hidden" />
                <span className="font-medium">Done</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                  {taskCounts.completed}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="overdue" 
                className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md transition-all"
              >
                <AlertCircle className="w-4 h-4 sm:hidden" />
                <span className="font-medium">Overdue</span>
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                  {taskCounts.overdue}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="min-h-[50vh]">
                {isLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-3">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="h-3 bg-muted rounded w-full mb-2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="py-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Target className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {activeTab === 'all' 
                          ? "You don't have any tasks assigned yet. Check back later or contact your project manager."
                          : `No ${activeTab} tasks at the moment. Great job staying on top of things!`}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pb-6">
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
                           approved_at: task.approved_at,
                           approved_by: task.approved_by,
                           signature_url: task.signature_url,
                           workers: (task.workers || []).map((worker: any) => ({
                             id: worker.user_profile?.id || worker.user_id || 'unknown',
                             name: worker.user_profile?.name || 'Unknown Worker',
                             avatar_url: worker.user_profile?.avatar_url || null,
                             is_primary: worker.is_primary || false
                           })),
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
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Swipe Instructions */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                💡 Swipe right on any task to move it to the next status
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}