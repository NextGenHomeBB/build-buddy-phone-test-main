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
      <div className="space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6 md:pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="pt-1 xs:pt-2 sm:pt-3 md:pt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground truncate">
                My Tasks
              </h1>
              <p className="text-muted-foreground mt-0.5 xs:mt-1 text-xs xs:text-sm sm:text-sm md:text-base">
                Track your assigned tasks and progress
              </p>
            </div>
            <div className="hidden xs:flex items-center gap-1 xs:gap-2 flex-shrink-0 ml-2">
              <BarChart3 className="w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            <Card className="hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-gradient-to-br from-background to-muted/20 border-border/50 touch-manipulation">
              <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-xs sm:text-sm text-muted-foreground font-medium truncate">Total</p>
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-0.5 xs:mt-1">{stats.total}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Target className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary/70" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-gradient-to-br from-background to-green-50/50 border-green-200/30 touch-manipulation">
              <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-xs sm:text-sm text-muted-foreground font-medium truncate">Done</p>
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mt-0.5 xs:mt-1">{stats.completed}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-gradient-to-br from-background to-blue-50/50 border-blue-200/30 touch-manipulation">
              <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-xs sm:text-sm text-muted-foreground font-medium truncate">Active</p>
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mt-0.5 xs:mt-1">{stats.inProgress}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-gradient-to-br from-background to-red-50/50 border-red-200/30 touch-manipulation">
              <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs xs:text-xs sm:text-sm text-muted-foreground font-medium truncate">Overdue</p>
                    <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 mt-0.5 xs:mt-1">{taskCounts.overdue}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completion Progress */}
        {stats && (
          <Card className="hover:shadow-lg active:scale-[0.99] transition-all duration-200 bg-gradient-to-r from-background to-muted/20 border-border/50 touch-manipulation">
            <CardContent className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-2 xs:mb-3">
                <div className="flex items-center gap-1 xs:gap-2">
                  <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-foreground">Progress</span>
                </div>
                <span className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary">
                  {stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%
                </span>
              </div>
              <Progress 
                value={stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0} 
                className="h-1.5 xs:h-2 sm:h-3 md:h-4 lg:h-5" 
              />
              <div className="flex justify-between text-xs xs:text-xs sm:text-sm text-muted-foreground mt-1.5 xs:mt-2">
                <span>{stats.completed} completed</span>
                <span>{stats.total - stats.completed} remaining</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-1.5 xs:gap-2 sm:flex-row sm:gap-3 md:gap-4 lg:gap-5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 xs:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 xs:pl-10 h-9 xs:h-10 sm:h-11 md:h-12 text-xs xs:text-sm sm:text-base rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 touch-manipulation"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div className="flex gap-1.5 xs:gap-2 sm:gap-3 flex-shrink-0">
            <Select
              value={filters.priority?.[0] || 'all'}
              onValueChange={(value) => 
                setFilters({ 
                  ...filters, 
                  priority: value === 'all' ? undefined : [value as Task['priority']] 
                })
              }
            >
              <SelectTrigger className="w-20 xs:w-24 sm:w-32 md:w-36 lg:w-40 h-9 xs:h-10 sm:h-11 md:h-12 rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 touch-manipulation">
                <Filter className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border/50 min-w-[160px] xs:min-w-[180px]">
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50 rounded-lg border border-border/30">
            <TabsTrigger 
              value="all" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-3 sm:py-3 px-2 sm:px-4 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Target className="w-3 h-3 sm:hidden" />
              <span className="font-medium">All</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {taskCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-3 sm:py-3 px-2 sm:px-4 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Play className="w-3 h-3 sm:hidden" />
              <span className="font-medium">Active</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {taskCounts.active}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-3 sm:py-3 px-2 sm:px-4 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CheckCircle className="w-3 h-3 sm:hidden" />
              <span className="font-medium">Done</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {taskCounts.completed}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="overdue" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-3 sm:py-3 px-2 sm:px-4 rounded-md transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <AlertCircle className="w-3 h-3 sm:hidden" />
              <span className="font-medium">Overdue</span>
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {taskCounts.overdue}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3 sm:mt-4 md:mt-6">
            {isLoading ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-muted/20">
                    <CardHeader className="pb-2 sm:pb-3 md:pb-4">
                      <div className="h-3 sm:h-4 bg-muted rounded-md w-3/4 mb-2"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded-md w-1/2"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 sm:h-3 bg-muted rounded-md w-full mb-2"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded-md w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10">
                <CardContent className="py-12 sm:py-16 md:py-20 text-center">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-foreground">No tasks found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4 max-w-md mx-auto">
                    {activeTab === 'all' 
                      ? "You don't have any tasks assigned yet. Check back later or contact your project manager."
                      : `No ${activeTab} tasks at the moment. Great job staying on top of things!`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-420px)] sm:h-[calc(100vh-400px)] md:h-[calc(100vh-380px)] lg:h-[600px]">
                <div className="space-y-2 sm:space-y-3 md:space-y-4 pr-2 sm:pr-3 md:pr-4">
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
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Swipe Instructions */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-dashed border-primary/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2">
              <div className="hidden sm:block">
                <div className="flex items-center gap-1 text-primary/70">
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-center font-medium">
                💡 Swipe right on any task to move it to the next status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}