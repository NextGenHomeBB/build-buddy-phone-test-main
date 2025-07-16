import { useState, useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/TaskCard';
import { SearchChip } from '@/components/ui/SearchChip';
import { WorkerQuickTasks } from '@/components/WorkerQuickTasks';
import { useToast } from '@/hooks/use-toast';
import { useTasks, useTaskStats, Task, TaskFilters } from '@/hooks/useTasks';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Target,
  Zap
} from 'lucide-react';
import { isPast } from 'date-fns';

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    tasks: Task[];
    columnCount: number;
    onStatusUpdate: (taskId: string, status: Task['status']) => void;
  };
}

function GridCell({ columnIndex, rowIndex, style, data }: GridCellProps) {
  const { tasks, columnCount, onStatusUpdate } = data;
  const index = rowIndex * columnCount + columnIndex;
  const task = tasks[index];

  if (!task) return null;

  return (
    <div style={style} className="p-8">
      <TaskCard 
        task={task}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
}


export default function MyTasks() {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'done' | 'overdue'>('all');
  
  const { tasks, isLoading, updateStatus } = useTasks(filters);
  const { data: stats } = useTaskStats();
  const { toast } = useToast();

  const handleStatusUpdate = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      await updateStatus(taskId, status);
      toast({
        title: "Task Updated",
        description: `Task status changed to ${status.replace('-', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  }, [updateStatus, toast]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    switch (activeFilter) {
      case 'active':
        filtered = tasks.filter(task => ['todo', 'in-progress', 'review'].includes(task.status));
        break;
      case 'done':
        filtered = tasks.filter(task => task.status === 'completed');
        break;
      case 'overdue':
        filtered = tasks.filter(task => 
          task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'
        );
        break;
    }
    
    return filtered;
  }, [tasks, activeFilter]);

  const statusCounts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter(task => ['todo', 'in-progress', 'review'].includes(task.status)).length,
    done: tasks.filter(task => task.status === 'completed').length,
    overdue: tasks.filter(task => 
      task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'
    ).length,
  }), [tasks]);

  return (
    <AppLayout>
      <div className="h-[100dvh] flex flex-col bg-background">
        {/* Sticky header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-semibold text-foreground">My Tasks</h1>
              <p className="text-sm text-muted-foreground">
                Track your assigned tasks and progress
              </p>
            </div>
            <WorkerQuickTasks>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg"
                title="View My Quick Assigned Tasks"
              >
                <Zap className="w-5 h-5 text-primary" />
              </Button>
            </WorkerQuickTasks>
          </div>

          {/* Search + filter chips */}
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                className="pl-10 h-9 text-sm border-border"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'active', 'done', 'overdue'] as const).map(filter => (
              <SearchChip
                key={filter}
                active={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter[0].toUpperCase() + filter.slice(1)} ({statusCounts[filter]})
              </SearchChip>
            ))}
          </div>
        </header>

        {/* Virtualized grid */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse h-32">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <Card className="border-dashed border-2 w-full max-w-md">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeFilter === 'all' 
                      ? "You don't have any tasks assigned yet."
                      : `No ${activeFilter} tasks at the moment.`}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <AutoSizer>
              {({ height, width }) => {
                const columnCount = width < 640 ? 1 : width < 1024 ? 2 : 3;
                const columnWidth = width / columnCount;
                const rowHeight = 240; // Significantly increased height for maximum spacing
                const rowCount = Math.ceil(filteredTasks.length / columnCount);

                return (
                  <Grid
                    columnCount={columnCount}
                    columnWidth={columnWidth}
                    height={height}
                    rowCount={rowCount}
                    rowHeight={rowHeight}
                    width={width}
                    itemData={{
                      tasks: filteredTasks,
                      columnCount,
                      onStatusUpdate: handleStatusUpdate,
                    }}
                  >
                    {GridCell}
                  </Grid>
                );
              }}
            </AutoSizer>
          )}
        </div>

        {/* Swipe hint */}
        <div className="p-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            💡 Swipe right on any task to move it to the next status
          </p>
        </div>
      </div>
    </AppLayout>
  );
}