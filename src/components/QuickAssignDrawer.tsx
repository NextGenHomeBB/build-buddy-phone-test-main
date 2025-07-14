import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { taskService } from '@/services/taskService';
import { useBulkAssign } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, CheckSquare, UserPlus, Zap } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';

interface Worker {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project: { name: string } | null;
  phase: { name: string } | null;
  priority: string;
}

interface QuickAssignDrawerProps {
  projectId?: string;
  children: React.ReactNode;
}

const TaskRow = ({ index, style, data }: { 
  index: number; 
  style: any; 
  data: { tasks: Task[]; selectedTasks: Set<string>; onTaskToggle: (id: string) => void; } 
}) => {
  const task = data.tasks[index];
  const isSelected = data.selectedTasks.has(task.id);

  return (
    <div style={style} className="px-4 py-2">
      <div 
        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
        }`}
        onClick={() => data.onTaskToggle(task.id)}
      >
        <Checkbox checked={isSelected} onChange={() => {}} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{task.title}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {task.project?.name} {task.phase && `• ${task.phase.name}`}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {task.priority}
        </Badge>
      </div>
    </div>
  );
};

export function QuickAssignDrawer({ projectId, children }: QuickAssignDrawerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch unassigned tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['unassigned-tasks', projectId],
    queryFn: () => taskService.getUnassignedTasks(projectId),
    enabled: open
  });

  // Fetch project workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // First get user IDs from user_project_role
      const { data: roleData, error: roleError } = await supabase
        .from('user_project_role')
        .select('user_id')
        .eq('project_id', projectId);

      if (roleError) throw roleError;
      
      const userIds = roleData.map(r => r.user_id);
      if (userIds.length === 0) return [];

      // Then get profile data for those users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, role')
        .in('user_id', userIds);

      if (error) throw error;
      return data;
    },
    enabled: open && !!projectId
  });

  const bulkAssignMutation = useBulkAssign();

  const filteredWorkers = useMemo(() => {
    if (!searchQuery) return workers;
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

  const handleTaskToggle = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTasks(new Set(tasks.map(task => task.id)));
  }, [tasks]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const handleAssign = async () => {
    if (!selectedWorker || selectedTasks.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select tasks and a worker to assign them to.",
        variant: "destructive",
      });
      return;
    }

    try {
      const assignments = Array.from(selectedTasks).map(taskId => ({
        taskId,
        userIds: [selectedWorker.id],
        primaryId: selectedWorker.id
      }));

      await bulkAssignMutation.mutateAsync({ assignments });

      toast({
        title: "Tasks Assigned",
        description: `Successfully assigned ${selectedTasks.size} tasks to ${selectedWorker.name}`,
      });

      setSelectedTasks(new Set());
      setSelectedWorker(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const taskRowData = useMemo(() => ({
    tasks,
    selectedTasks,
    onTaskToggle: handleTaskToggle
  }), [tasks, selectedTasks, handleTaskToggle]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Assign Tasks
          </SheetTitle>
          <SheetDescription>
            Bulk assign unassigned tasks to workers efficiently
          </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 h-full">
          {/* Left Panel - Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Unassigned Tasks</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  disabled={tasks.length === 0}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAll}
                  disabled={selectedTasks.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium">All Tasks Assigned</h4>
                <p className="text-muted-foreground">
                  No unassigned tasks found for this project.
                </p>
              </div>
            ) : (
            <List
              height={400}
              width="100%"
              itemCount={tasks.length}
              itemSize={80}
              itemData={taskRowData}
            >
              {TaskRow}
            </List>
            )}

            {selectedTasks.size > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="hidden lg:block" />

          {/* Right Panel - Workers */}
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Worker</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search workers..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="h-80">
              {workersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No workers found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedWorker?.id === worker.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={worker.avatar_url || ''} />
                        <AvatarFallback>
                          {worker.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {worker.role}
                        </p>
                      </div>
                      {selectedWorker?.id === worker.id && (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedWorker && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Selected:</span> {selectedWorker.name}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedTasks.size === 0 || !selectedWorker || bulkAssignMutation.isPending}
            className="min-w-24"
          >
            {bulkAssignMutation.isPending ? (
              <>Assigning...</>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign {selectedTasks.size > 0 ? `(${selectedTasks.size})` : ''}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}