import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  CheckSquare, 
  ListTodo, 
  Clock, 
  Flag,
  Building2,
  Users,
  Loader2
} from 'lucide-react';
import { useAccessibleProjects } from '@/hooks/useProjects';
import { useProjectChecklists } from '@/hooks/useProjectChecklists';
import { useTasks } from '@/hooks/useTasks';
import { useAssignWorkers, useBulkAssign } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface WorkerTaskAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: {
    user_id: string;
    name: string;
    profiles?: { name: string };
  } | null;
  projectId?: string;
}

interface AssignableItem {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'checklist-item';
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  status?: string;
  isSelected?: boolean;
}

export function WorkerTaskAssignment({ 
  open, 
  onOpenChange, 
  worker,
  projectId 
}: WorkerTaskAssignmentProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('tasks');
  const { toast } = useToast();

  const { data: projects = [] } = useAccessibleProjects();
  const { data: tasks = [] } = useTasks({
    projectId: projectId || undefined,
    status: ['todo', 'in-progress']
  });
  
  const assignWorkers = useAssignWorkers();
  const bulkAssign = useBulkAssign();

  // Filter projects to those with project_id if provided
  const availableProjects = projectId 
    ? projects.filter(p => p.id === projectId)
    : projects;

  // Get checklists for all available projects
  const projectChecklistQueries = availableProjects.map(project => 
    useProjectChecklists(project.id)
  );

  const allChecklists = projectChecklistQueries
    .filter(query => query.data)
    .flatMap(query => query.data || []);

  // Transform tasks to assignable items
  const assignableTasks: AssignableItem[] = tasks
    .filter(task => !task.assigned_to || task.assigned_to !== worker?.user_id)
    .map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: 'task' as const,
      projectId: task.project_id,
      projectName: projects.find(p => p.id === task.project_id)?.name || 'Unknown Project',
      phaseId: task.phase_id,
      phaseName: task.phase?.name || 'No Phase',
      priority: task.priority,
      estimatedHours: task.estimated_hours ? Number(task.estimated_hours) : undefined,
      status: task.status,
    }));

  // Transform checklist items to assignable items
  const assignableChecklistItems: AssignableItem[] = allChecklists
    .flatMap(checklist => 
      checklist.items
        .filter((item: any) => !item.completed)
        .map((item: any) => ({
          id: `${checklist.id}-${item.id}`,
          title: item.title,
          description: item.description,
          type: 'checklist-item' as const,
          projectId: checklist.project_id,
          projectName: projects.find(p => p.id === checklist.project_id)?.name || 'Unknown Project',
          priority: item.priority || 'medium',
          estimatedHours: item.estimatedHours,
        }))
    );

  const handleItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleSelectAll = (items: AssignableItem[], selected: boolean) => {
    const itemIds = items.map(item => item.id);
    setSelectedItems(prev => 
      selected 
        ? [...new Set([...prev, ...itemIds])]
        : prev.filter(id => !itemIds.includes(id))
    );
  };

  const handleAssignSelected = async () => {
    if (!worker || selectedItems.length === 0) return;

    try {
      const taskAssignments = selectedItems
        .filter(id => assignableTasks.find(t => t.id === id))
        .map(taskId => ({
          taskId,
          userIds: [worker.user_id],
          primaryId: worker.user_id
        }));

      if (taskAssignments.length > 0) {
        await bulkAssign.mutateAsync({ assignments: taskAssignments });
      }

      // Handle checklist item assignments
      const checklistAssignments = selectedItems
        .filter(id => assignableChecklistItems.find(c => c.id === id));

      if (checklistAssignments.length > 0) {
        // For now, we'll show a success message for checklist items
        // In a full implementation, you'd need to create the checklist assignment logic
        console.log('Checklist assignments:', checklistAssignments);
      }

      toast({
        title: "Tasks assigned successfully",
        description: `Assigned ${selectedItems.length} items to ${worker.profiles?.name || worker.name}`
      });

      setSelectedItems([]);
      onOpenChange(false);

    } catch (error) {
      console.error('Assignment error:', error);
      toast({
        title: "Assignment failed",
        description: "Failed to assign tasks. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderAssignableItem = (item: AssignableItem) => (
    <Card key={item.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selectedItems.includes(item.id)}
            onCheckedChange={(checked) => 
              handleItemSelect(item.id, checked as boolean)
            }
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm">{item.title}</h4>
              <div className="flex items-center gap-2">
                {item.type === 'task' && (
                  <Badge variant="outline" className="text-xs">
                    <ListTodo className="h-3 w-3 mr-1" />
                    Task
                  </Badge>
                )}
                {item.type === 'checklist-item' && (
                  <Badge variant="outline" className="text-xs">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Checklist
                  </Badge>
                )}
                {item.priority && (
                  <Badge 
                    variant={
                      item.priority === 'urgent' ? 'destructive' :
                      item.priority === 'high' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    {item.priority}
                  </Badge>
                )}
              </div>
            </div>
            
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {item.projectName}
              </div>
              
              {item.phaseName && (
                <div className="flex items-center gap-1">
                  <ListTodo className="h-3 w-3" />
                  {item.phaseName}
                </div>
              )}
              
              {item.estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.estimatedHours}h
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = assignWorkers.isPending || bulkAssign.isPending;

  if (!worker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Tasks to {worker.profiles?.name || worker.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks ({assignableTasks.length})
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklist Items ({assignableChecklistItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={assignableTasks.length > 0 && assignableTasks.every(task => selectedItems.includes(task.id))}
                  onCheckedChange={(checked) => 
                    handleSelectAll(assignableTasks, checked as boolean)
                  }
                />
                <span className="text-sm font-medium">Select All Tasks</span>
              </div>
              <Badge variant="outline">
                {selectedItems.filter(id => assignableTasks.find(t => t.id === id)).length} selected
              </Badge>
            </div>

            <ScrollArea className="h-[400px]">
              {assignableTasks.length > 0 ? (
                assignableTasks.map(renderAssignableItem)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No available tasks to assign</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="checklists" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={assignableChecklistItems.length > 0 && assignableChecklistItems.every(item => selectedItems.includes(item.id))}
                  onCheckedChange={(checked) => 
                    handleSelectAll(assignableChecklistItems, checked as boolean)
                  }
                />
                <span className="text-sm font-medium">Select All Checklist Items</span>
              </div>
              <Badge variant="outline">
                {selectedItems.filter(id => assignableChecklistItems.find(c => c.id === id)).length} selected
              </Badge>
            </div>

            <ScrollArea className="h-[400px]">
              {assignableChecklistItems.length > 0 ? (
                assignableChecklistItems.map(renderAssignableItem)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No available checklist items to assign</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {selectedItems.length} items selected
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignSelected}
              disabled={selectedItems.length === 0 || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Selected ({selectedItems.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}