
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ScheduleItem } from '@/hooks/schedule';

interface ProjectScheduleAssignmentProps {
  scheduleItem: ScheduleItem | null;
  workerIds: string[];
  workerNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProjectDetails {
  id: string;
  name: string;
  location: string;
  manager: { name: string } | null;
  phases: Array<{
    id: string;
    name: string;
    status: string;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assigned_to: string | null;
    }>;
  }>;
}

export function ProjectScheduleAssignment({
  scheduleItem,
  workerIds,
  workerNames,
  open,
  onOpenChange
}: ProjectScheduleAssignmentProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchProjectDetails = async () => {
    if (!scheduleItem?.project_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          location,
          manager:profiles!projects_manager_id_fkey(name),
          project_phases(
            id,
            name,
            status,
            tasks(
              id,
              title,
              status,
              priority,
              assigned_to
            )
          )
        `)
        .eq('id', scheduleItem.project_id)
        .single();

      if (error) throw error;
      setProjectDetails({
        ...data,
        phases: data.project_phases
      });
      
      // Auto-select unassigned tasks
      const unassignedTasks = data.project_phases
        .flatMap(phase => phase.tasks)
        .filter(task => !task.assigned_to && task.status === 'todo')
        .map(task => task.id);
      
      setSelectedTasks(new Set(unassignedTasks));
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTasksMutation = useMutation({
    mutationFn: async () => {
      const tasksToAssign = Array.from(selectedTasks);
      
      if (tasksToAssign.length === 0 || workerIds.length === 0) return;

      // Distribute tasks among workers
      const assignments = tasksToAssign.map((taskId, index) => ({
        taskId,
        userId: workerIds[index % workerIds.length],
        isPrimary: index < workerIds.length
      }));

      // Update tasks and create task_workers entries
      for (const assignment of assignments) {
        // Update task assigned_to
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            assigned_to: assignment.userId,
            assigned_by: (await supabase.auth.getUser()).data.user?.id 
          })
          .eq('id', assignment.taskId);

        if (taskError) throw taskError;

        // Create task_workers entry
        const { error: workerError } = await supabase
          .from('task_workers')
          .insert({
            task_id: assignment.taskId,
            user_id: assignment.userId,
            is_primary: assignment.isPrimary
          });

        if (workerError) throw workerError;

        // Send notification via edge function
        await supabase.functions.invoke('notify_task_assignment', {
          body: {
            task_id: assignment.taskId,
            user_id: assignment.userId,
            is_primary: assignment.isPrimary,
            schedule_context: {
              address: scheduleItem?.address,
              date: scheduleItem?.start_time,
              category: scheduleItem?.category
            }
          }
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Assigned ${selectedTasks.size} tasks to ${workerNames.join(', ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error assigning tasks:', error);
      toast({
        title: "Error",
        description: "Failed to assign tasks",
        variant: "destructive",
      });
    }
  });

  const handleOpen = (open: boolean) => {
    onOpenChange(open);
    if (open && scheduleItem?.project_id) {
      fetchProjectDetails();
    }
    if (!open) {
      setProjectDetails(null);
      setSelectedTasks(new Set());
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in-progress': return 'secondary';
      case 'review': return 'outline';
      case 'completed': return 'destructive';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open && !!scheduleItem} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {scheduleItem?.address || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {scheduleItem?.start_time || 'N/A'} - {scheduleItem?.end_time || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Assigned: {workerNames.join(', ') || 'None'}
            </span>
          </div>
        </div>

        {!scheduleItem?.project_id ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No Project Linked</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This schedule item is not linked to a project, so no tasks can be assigned.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading project details...</div>
          </div>
        ) : projectDetails ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{projectDetails.name}</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📍 {projectDetails.location}</div>
                  {projectDetails.manager && (
                    <div>👨‍💼 Manager: {projectDetails.manager.name}</div>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Tasks</h3>
                <Badge variant="outline">
                  {selectedTasks.size} selected
                </Badge>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                {projectDetails.phases.map(phase => (
                  <div key={phase.id} className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      {phase.name}
                      <Badge variant="outline" className="text-xs">
                        {phase.status}
                      </Badge>
                    </h4>
                    
                    <div className="space-y-2 ml-4">
                      {phase.tasks.map(task => (
                        <div
                          key={task.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTasks.has(task.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleTaskSelection(task.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                              <Badge variant={getStatusColor(task.status)} className="text-xs">
                                {task.status}
                              </Badge>
                              {selectedTasks.has(task.id) && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                          {task.assigned_to && (
                            <div className="text-xs text-muted-foreground">
                              Already assigned
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {phase.tasks.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No tasks in this phase
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedTasks.size} tasks will be assigned to {workerNames.length} workers
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => assignTasksMutation.mutate()}
                  disabled={selectedTasks.size === 0 || assignTasksMutation.isPending}
                >
                  {assignTasksMutation.isPending ? 'Assigning...' : 'Assign Tasks'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Project Not Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Could not load project details for this schedule item.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
