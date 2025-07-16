import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, Users, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectPhases, useTasksByPhase, useChecklistItems, useBulkAssign } from '@/hooks/useAssignTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AssignTreeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  workerId: string;
  phaseDefault?: string;
}

interface SelectedItems {
  taskIds: Set<string>;
  checklistItemIds: Set<string>;
  expandedTasks: Set<string>;
}

export function AssignTreeSheet({ 
  open, 
  onOpenChange, 
  projectId, 
  workerId, 
  phaseDefault 
}: AssignTreeSheetProps) {
  const isMobile = useIsMobile();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(phaseDefault || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<SelectedItems>({
    taskIds: new Set(),
    checklistItemIds: new Set(),
    expandedTasks: new Set(),
  });

  const { data: phases = [], isLoading: phasesLoading } = useProjectPhases(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksByPhase(selectedPhase || undefined);
  const bulkAssignMutation = useBulkAssign();

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.status.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Calculate selection counts
  const selectionCounts = useMemo(() => {
    const totalTasks = selected.taskIds.size;
    const totalChecklistItems = selected.checklistItemIds.size;
    const totalSelected = totalTasks + totalChecklistItems;
    
    return { totalTasks, totalChecklistItems, totalSelected };
  }, [selected]);

  // Handle phase selection - just set the selected phase for now
  const handlePhaseSelect = useCallback((phaseId: string) => {
    setSelectedPhase(phaseId);
  }, []);

  // Handle phase header click to select all tasks in phase
  const handlePhaseHeaderSelect = useCallback(() => {
    if (!selectedPhase || filteredTasks.length === 0) return;
    
    const allTaskIds = new Set(filteredTasks.map(task => task.id));
    setSelected(prev => ({
      ...prev,
      taskIds: new Set([...prev.taskIds, ...allTaskIds])
    }));
  }, [selectedPhase, filteredTasks]);

  // Handle task toggle
  const handleTaskToggle = useCallback((taskId: string, checklistItemIds: string[] = []) => {
    setSelected(prev => {
      const newTaskIds = new Set(prev.taskIds);
      const newChecklistItemIds = new Set(prev.checklistItemIds);
      
      if (newTaskIds.has(taskId)) {
        // Deselect task and its checklist items
        newTaskIds.delete(taskId);
        checklistItemIds.forEach(id => newChecklistItemIds.delete(id));
      } else {
        // Select task and its checklist items
        newTaskIds.add(taskId);
        checklistItemIds.forEach(id => newChecklistItemIds.add(id));
      }
      
      return {
        ...prev,
        taskIds: newTaskIds,
        checklistItemIds: newChecklistItemIds,
      };
    });
  }, []);

  // Handle checklist item toggle
  const handleChecklistItemToggle = useCallback((itemId: string) => {
    setSelected(prev => {
      const newChecklistItemIds = new Set(prev.checklistItemIds);
      
      if (newChecklistItemIds.has(itemId)) {
        newChecklistItemIds.delete(itemId);
      } else {
        newChecklistItemIds.add(itemId);
      }
      
      return {
        ...prev,
        checklistItemIds: newChecklistItemIds,
      };
    });
  }, []);

  // Handle task expansion
  const handleTaskExpand = useCallback((taskId: string) => {
    setSelected(prev => {
      const newExpandedTasks = new Set(prev.expandedTasks);
      
      if (newExpandedTasks.has(taskId)) {
        newExpandedTasks.delete(taskId);
      } else {
        newExpandedTasks.add(taskId);
      }
      
      return {
        ...prev,
        expandedTasks: newExpandedTasks,
      };
    });
  }, []);

  // Handle assignment
  const handleAssign = useCallback(async () => {
    if (selectionCounts.totalSelected === 0) return;

    try {
      await bulkAssignMutation.mutateAsync({
        workerId,
        taskIds: Array.from(selected.taskIds),
        checklistItemIds: Array.from(selected.checklistItemIds),
        projectId,
      });
      
      // Reset selections and close
      setSelected({
        taskIds: new Set(),
        checklistItemIds: new Set(),
        expandedTasks: new Set(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Assignment failed:', error);
    }
  }, [bulkAssignMutation, workerId, selected, projectId, selectionCounts.totalSelected, onOpenChange]);

  // Render phase list
  const PhaseList = () => (
    <div className="flex-1 min-w-0">
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Phases
          </h3>
          {selectedPhase && filteredTasks.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePhaseHeaderSelect}
              className="text-xs"
            >
              Select All ({filteredTasks.length})
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-2 space-y-1">
          {phasesLoading ? (
            <div className="p-4 text-muted-foreground">Loading phases...</div>
          ) : phases.length === 0 ? (
            <div className="p-4 text-muted-foreground">No phases found</div>
          ) : (
            phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => handlePhaseSelect(phase.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md min-h-11 transition-colors",
                  "hover:bg-muted/50",
                  selectedPhase === phase.id && "bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{phase.name}</span>
                  <Badge variant={phase.status === 'active' ? 'default' : 'secondary'}>
                    {phase.status}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render task list with search
  const TaskList = () => (
    <div className="flex-1 min-w-0 border-l">
      <div className="p-4 border-b space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Tasks
          {selectedPhase && (
            <Badge variant="secondary">
              {filteredTasks.length}
            </Badge>
          )}
        </h3>
        {selectedPhase && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>
      <ScrollArea className="h-[calc(100%-120px)]">
        <div className="p-2 space-y-1">
          {!selectedPhase ? (
            <div className="p-4 text-muted-foreground">Select a phase to view tasks</div>
          ) : tasksLoading ? (
            <div className="p-4 text-muted-foreground">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-4 text-muted-foreground">
              {searchQuery ? 'No tasks match your search' : 'No unassigned tasks in this phase'}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isSelected={selected.taskIds.has(task.id)}
                isExpanded={selected.expandedTasks.has(task.id)}
                onToggle={handleTaskToggle}
                onExpand={handleTaskExpand}
                selectedChecklistItems={selected.checklistItemIds}
                onChecklistItemToggle={handleChecklistItemToggle}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Main content
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex gap-2 min-h-0">
        <PhaseList />
        <TaskList />
      </div>
      
      {/* Footer */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Selected: {selectionCounts.totalTasks} tasks, {selectionCounts.totalChecklistItems} checklist items
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={selectionCounts.totalSelected === 0 || bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending ? "Assigning..." : `Assign (${selectionCounts.totalSelected})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Assign Tasks</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] h-[80vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Assign Tasks</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// Task item component with checklist expansion
function TaskItem({ 
  task, 
  isSelected, 
  isExpanded, 
  onToggle, 
  onExpand,
  selectedChecklistItems,
  onChecklistItemToggle 
}: {
  task: any;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: (taskId: string, checklistItemIds: string[]) => void;
  onExpand: (taskId: string) => void;
  selectedChecklistItems: Set<string>;
  onChecklistItemToggle: (itemId: string) => void;
}) {
  const { data: checklistItems = [] } = useChecklistItems(task.id);
  
  const handleTaskClick = () => {
    const checklistItemIds = checklistItems.map(item => item.id);
    onToggle(task.id, checklistItemIds);
  };

  return (
    <div className="border rounded-md">
      <div 
        className={cn(
          "flex items-center gap-3 p-3 min-h-11 cursor-pointer hover:bg-muted/50",
          isSelected && "bg-primary/10"
        )}
      >
        <div 
          onClick={handleTaskClick}
          className="flex items-center gap-3 flex-1"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-muted-foreground">
              Status: {task.status} • Priority: {task.priority}
            </div>
          </div>
        </div>
        
        {checklistItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExpand(task.id)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Badge variant="secondary" className="ml-1">
              {checklistItems.length}
            </Badge>
          </Button>
        )}
      </div>
      
      {isExpanded && checklistItems.length > 0 && (
        <div className="border-t bg-muted/20">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onChecklistItemToggle(item.id)}
              className={cn(
                "flex items-center gap-3 p-3 ml-6 cursor-pointer hover:bg-muted/50 min-h-11",
                selectedChecklistItems.has(item.id) && "bg-primary/10"
              )}
            >
              {selectedChecklistItems.has(item.id) ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}