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
      <div className="space-y-4 md:space-y-6 px-2 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track your assigned tasks and progress
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Overdue</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">0</p>
                  </div>
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completion Progress */}
        {stats && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">Completion Rate</span>
                <span className="text-xs sm:text-sm text-muted-foreground font-semibold">
                  {stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0}%
                </span>
              </div>
              <Progress 
                value={stats ? Math.round((stats.completed / stats.total) * 100) || 0 : 0} 
                className="h-2 sm:h-3" 
              />
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 text-sm sm:text-base"
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
              <SelectTrigger className="w-full sm:w-32">
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger 
              value="all" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <span className="hidden sm:inline">All</span>
              <span className="sm:hidden">All</span>
              <span className="text-xs">({taskCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <span>Active</span>
              <span className="text-xs">({taskCounts.active})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Done</span>
              <span className="sm:hidden">Done</span>
              <span className="text-xs">({taskCounts.completed})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="overdue" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3"
            >
              <span>Overdue</span>
              <span className="text-xs">({taskCounts.overdue})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-2 sm:h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 sm:py-12 text-center">
                  <Target className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground px-4">
                    {activeTab === 'all' 
                      ? "You don't have any tasks assigned yet."
                      : `No ${activeTab} tasks at the moment.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-500px)] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-4">
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
    </AppLayout>
  );
}