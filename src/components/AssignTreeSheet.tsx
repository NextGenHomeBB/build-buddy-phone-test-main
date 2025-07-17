import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, Users, CheckSquare, Square, ArrowLeft, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvailableProjects, useProjectPhases, useTasksByPhase, useChecklistItems, useBulkAssign } from '@/hooks/useAssignTasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DrillStack } from './DrillStack';

interface AssignTreeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string; // Made optional for multi-project support
  workerId: string;
  phaseDefault?: string;
}

interface SelectedItems {
  taskIds: Set<string>;
  checklistItemIds: Set<string>;
  expandedTasks: Set<string>;
}

type DrillLevel = 0 | 1 | 2 | 3; // 0: Projects, 1: Phases, 2: Tasks, 3: Checklist Items

export function AssignTreeSheet({ 
  open, 
  onOpenChange, 
  projectId, 
  workerId, 
  phaseDefault 
}: AssignTreeSheetProps) {
  const isMobile = useIsMobile();
  
  // Determine initial level based on whether projectId is provided
  const getInitialLevel = (): DrillLevel => {
    if (!projectId) return 0; // Start with project selection
    if (phaseDefault) return 2; // Go directly to tasks if phase is specified
    return 1; // Start with phases
  };
  
  const [currentLevel, setCurrentLevel] = useState<DrillLevel>(getInitialLevel());
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(phaseDefault || null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<SelectedItems>({
    taskIds: new Set(),
    checklistItemIds: new Set(),
    expandedTasks: new Set(),
  });

  const { data: projects = [], isLoading: projectsLoading } = useAvailableProjects();
  const { data: phases = [], isLoading: phasesLoading } = useProjectPhases(selectedProject || undefined);
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

  // Handle project selection - drill to phase level
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    setCurrentLevel(1);
  }, []);

  // Handle phase selection - drill to task level
  const handlePhaseSelect = useCallback((phaseId: string) => {
    setSelectedPhase(phaseId);
    setCurrentLevel(2);
  }, []);

  // Handle task selection - drill to checklist level
  const handleTaskSelect = useCallback((taskId: string) => {
    setSelectedTask(taskId);
    setCurrentLevel(3);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentLevel === 3) {
      setCurrentLevel(2);
      setSelectedTask(null);
    } else if (currentLevel === 2) {
      setCurrentLevel(1);
      setSelectedPhase(null);
    } else if (currentLevel === 1) {
      setCurrentLevel(0);
      setSelectedProject(null);
    }
  }, [currentLevel]);

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
        projectId: selectedProject || projectId || '',
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
  }, [bulkAssignMutation, workerId, selected, selectedProject, projectId, selectionCounts.totalSelected, onOpenChange]);

  // Render project list
  const ProjectList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Building className="w-4 h-4" />
          Select Project
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {projectsLoading ? (
            <div className="p-4 text-muted-foreground">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-muted-foreground">No active projects found</div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md min-h-11 transition-colors",
                  "hover:bg-muted/50 flex items-center justify-between"
                )}
              >
                <div className="flex-1">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: {project.status}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render phase list
  const PhaseList = () => {
    const currentProject = projects.find(p => p.id === selectedProject);
    
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            {!projectId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h3 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {currentProject?.name} - Phases
            </h3>
          </div>
        </div>
      <ScrollArea className="flex-1">
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
                  "hover:bg-muted/50 flex items-center justify-between"
                )}
              >
                <div className="flex-1">
                  <div className="font-medium">{phase.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: {phase.status}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      </div>
    );
  };

  // Render task list with search
  const TaskList = () => {
    const currentPhase = phases.find(p => p.id === selectedPhase);
    
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-medium flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              {currentPhase?.name} - Tasks
              <Badge variant="secondary">
                {filteredTasks.length}
              </Badge>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePhaseHeaderSelect}
              disabled={filteredTasks.length === 0}
            >
              Select All
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {tasksLoading ? (
              <div className="p-4 text-muted-foreground">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-4 text-muted-foreground">
                {searchQuery ? 'No tasks match your search' : 'No unassigned tasks in this phase'}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItemDrill
                  key={task.id}
                  task={task}
                  isSelected={selected.taskIds.has(task.id)}
                  onToggle={handleTaskToggle}
                  onSelect={handleTaskSelect}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Render checklist items
  const ChecklistList = () => {
    const currentTask = filteredTasks.find(t => t.id === selectedTask);
    const { data: checklistItems = [] } = useChecklistItems(selectedTask || '');
    
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-medium flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              {currentTask?.title} - Checklist
              <Badge variant="secondary">
                {checklistItems.length}
              </Badge>
            </h3>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {checklistItems.length === 0 ? (
              <div className="p-4 text-muted-foreground">No checklist items for this task</div>
            ) : (
              checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleChecklistItemToggle(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/50 min-h-11",
                    selected.checklistItemIds.has(item.id) && "bg-primary/10"
                  )}
                >
                  {selected.checklistItemIds.has(item.id) ? (
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
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Main content with drill stack
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative overflow-hidden">
        <DrillStack level={0} isActive={currentLevel === 0}>
          <ProjectList />
        </DrillStack>
        <DrillStack level={1} isActive={currentLevel === 1}>
          <PhaseList />
        </DrillStack>
        <DrillStack level={2} isActive={currentLevel === 2}>
          <TaskList />
        </DrillStack>
        <DrillStack level={3} isActive={currentLevel === 3}>
          <ChecklistList />
        </DrillStack>
      </div>
      
      {/* Footer */}
      <div className="border-t p-3 sm:p-4 flex-shrink-0 bg-background">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground flex-1 min-w-0">
            <span className="truncate">
              Selected: {selectionCounts.totalTasks} tasks, {selectionCounts.totalChecklistItems} items
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={selectionCounts.totalSelected === 0 || bulkAssignMutation.isPending}
              size="sm"
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
        <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <SheetTitle>Assign Tasks</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0">
            {content}
          </div>
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

// Simplified task item for drill-down navigation
function TaskItemDrill({ 
  task, 
  isSelected, 
  onToggle,
  onSelect
}: {
  task: any;
  isSelected: boolean;
  onToggle: (taskId: string, checklistItemIds: string[]) => void;
  onSelect: (taskId: string) => void;
}) {
  const { data: checklistItems = [] } = useChecklistItems(task.id);
  
  const handleTaskToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const checklistItemIds = checklistItems.map(item => item.id);
    onToggle(task.id, checklistItemIds);
  };

  const handleTaskClick = () => {
    if (checklistItems.length > 0) {
      onSelect(task.id);
    } else {
      // If no checklist items, just toggle the task
      const checklistItemIds = checklistItems.map(item => item.id);
      onToggle(task.id, checklistItemIds);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-md min-h-11 cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/10"
      )}
      onClick={handleTaskClick}
    >
      <div 
        onClick={handleTaskToggle}
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
      
      <div className="flex items-center gap-2">
        {checklistItems.length > 0 && (
          <Badge variant="secondary">
            {checklistItems.length} items
          </Badge>
        )}
        {checklistItems.length > 0 && (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}