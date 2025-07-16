import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Plus, FileText, Users, ArrowLeft, ExternalLink, Loader2, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSchedule, useUnassignedWorkers, useUpdateWorkerAssignment, useUpsertSchedule } from '@/hooks/schedule';
import { ScheduleCategoryBadge } from '@/components/ui/ScheduleCategoryBadge';
import { PasteScheduleModal } from './PasteScheduleModal';
import { ProjectScheduleAssignment } from '@/components/ProjectScheduleAssignment';
import { ProjectSelectionDialog } from '@/components/ProjectSelectionDialog';
import { WorkerTaskAssignment } from '@/components/WorkerTaskAssignment';
import { WorkerSelectSheet } from '@/components/WorkerSelectSheet';
import { AssignTreeSheet } from '@/components/AssignTreeSheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';

interface DraggableWorker {
  id: string;
  name: string;
  isAssistant?: boolean;
  scheduleItemId?: string;
}

// Draggable Worker Component
function DraggableWorkerBadge({ worker, isFromSchedule = false, scheduleItemId, onClick }: {
  worker: { user_id: string; name: string; is_assistant?: boolean; profiles?: { name: string } };
  isFromSchedule?: boolean;
  scheduleItemId?: string;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: worker.user_id,
    data: {
      userId: worker.user_id,
      name: worker.profiles?.name || worker.name,
      isAssistant: worker.is_assistant || false,
      scheduleItemId: scheduleItemId,
      type: isFromSchedule ? 'assigned-worker' : 'unassigned-worker'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = worker.profiles?.name || worker.name;

  // Separate click handler for the task assignment button
  const handleTaskClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Task assignment button clicked for worker:', worker);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      {/* Draggable Badge Area - Only this part has drag listeners */}
      <div
        {...attributes}
        {...listeners}
        className="flex-1"
      >
        <Badge
          variant={worker.is_assistant ? "outline" : isFromSchedule ? "default" : "secondary"}
          className="w-full p-3 cursor-grab hover:cursor-grabbing transition-all duration-300 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border-2 hover:border-blue-300 shadow-md hover:shadow-lg"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            {displayName}
            {worker.is_assistant && <span className="text-xs">🎯</span>}
            {isFromSchedule && scheduleItemId && <span className="text-xs">🔗</span>}
          </span>
        </Badge>
      </div>
      
      {/* Task Assignment Button - Separate from drag area */}
      {onClick && (
        <button
          onClick={handleTaskClick}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 rounded-full shrink-0 border-2 border-transparent hover:border-purple-300 shadow-sm hover:shadow-md"
          title="✨ Click to assign magical tasks!"
        >
          <Settings className="h-4 w-4 text-purple-600" />
        </button>
      )}
    </div>
  );
}

// Droppable Schedule Item Component
function DroppableScheduleItem({ item, onWorkerClick, onWorkerTaskAssign, unassignedWorkers, onWorkerAssign }: {
  item: any;
  onWorkerClick: (worker: any) => void;
  onWorkerTaskAssign: (worker: any, projectId?: string) => void;
  unassignedWorkers: any[];
  onWorkerAssign: (workerId: string, scheduleItemId: string) => void;
}) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: item.id,
    data: {
      type: 'schedule-item',
      scheduleItemId: item.id
    }
  });

  return (
    <div ref={setNodeRef}>
      <Card className={`h-fit transition-all duration-300 shadow-sm ${
        isOver 
          ? 'ring-4 ring-purple-400 bg-gradient-to-br from-purple-100 to-blue-100 shadow-2xl' 
          : 'hover:shadow-xl bg-gradient-to-br from-white to-gray-50 border-2 hover:border-purple-200'
      }`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">📍</span>
            <CardTitle className="text-base font-semibold text-gray-800 flex-1 min-w-0">{item.address}</CardTitle>
            <ScheduleCategoryBadge category={item.category} />
            {item.project_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (item.workers.length > 0) {
                    onWorkerClick(item);
                  }
                }}
                className="h-7 w-7 p-0 transition-all duration-300 hover:bg-purple-100 rounded-full"
                title="Assign tasks to workers"
              >
                <ExternalLink className="h-4 w-4 text-purple-600" />
              </Button>
            )}
          </div>
          {/* Mobile-friendly worker assignment */}
          <div className="block md:hidden">
            <WorkerSelectSheet 
              scheduleItemId={item.id}
              scheduleDate={item.selectedDate || new Date()}
            />
          </div>
          {/* Desktop dropdown fallback */}
          <div className="hidden md:block">
            <Select onValueChange={(workerId) => onWorkerAssign(workerId, item.id)}>
              <SelectTrigger className="w-full h-8 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <SelectValue placeholder="Assign Worker" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {unassignedWorkers.map((worker) => (
                  <SelectItem key={worker.user_id} value={worker.user_id}>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      {worker.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-purple-600 font-medium flex items-center gap-1">
            <span>⏰</span>
            {item.start_time} - {item.end_time}
          </div>
          {item.project_id && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
              <span>🏗️</span>
              Project linked - Tap workers for tasks
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 min-h-[120px] p-4">
        <SortableContext 
          items={item.workers.map((w: any) => w.user_id)}
          strategy={verticalListSortingStrategy}
        >
          {item.workers.map((worker: any) => (
            <DraggableWorkerBadge
              key={`${item.id}-${worker.user_id}`}
              worker={worker}
              isFromSchedule={true}
              scheduleItemId={item.id}
              onClick={() => {
                if (item.project_id) {
                  onWorkerTaskAssign(worker, item.project_id);
                }
              }}
            />
          ))}
        </SortableContext>
        
        {item.workers.length === 0 && (
          <div className="text-sm text-center py-8 border-3 border-dashed border-purple-300 rounded-xl transition-all duration-300 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-60 text-purple-400" />
            <div className="space-y-1">
              <p className="font-medium text-purple-600">🎯 Drop Zone Active!</p>
              <p className="text-xs text-purple-500">Drag workers here to assign them</p>
            </div>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
}

export default function SchedulePlanner() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [projectSelectionOpen, setProjectSelectionOpen] = useState(false);
  const [activeWorker, setActiveWorker] = useState<DraggableWorker | null>(null);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [projectAssignmentModal, setProjectAssignmentModal] = useState<{
    open: boolean;
    scheduleItem: any;
    workerIds: string[];
    workerNames: string[];
  }>({
    open: false,
    scheduleItem: null,
    workerIds: [],
    workerNames: []
  });
  const [workerTaskAssignmentModal, setWorkerTaskAssignmentModal] = useState<{
    open: boolean;
    worker: any;
    projectId?: string;
  }>({
    open: false,
    worker: null,
    projectId: undefined
  });
  const [assignTreeSheet, setAssignTreeSheet] = useState<{
    open: boolean;
    projectId: string;
    workerId: string;
    phaseDefault?: string;
  }>({
    open: false,
    projectId: '',
    workerId: '',
    phaseDefault: undefined
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: schedule, isLoading } = useSchedule(selectedDate);
  const { data: unassignedWorkers = [] } = useUnassignedWorkers(selectedDate);
  const updateWorkerAssignment = useUpdateWorkerAssignment();
  const upsertSchedule = useUpsertSchedule();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const debouncedUpdate = useDebouncedCallback(
    async (scheduleItemId: string, userId: string, isAssistant: boolean, action: 'assign' | 'unassign') => {
      await updateWorkerAssignment.mutateAsync({
        scheduleItemId,
        userId,
        isAssistant,
        action
      });
    },
    1000
  );

  // Create schedule from selected projects
  const createScheduleFromProjects = useCallback(async (selectedProjectIds: string[]) => {
    setIsCreatingSample(true);
    try {
      // Fetch selected projects from database
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, location, status')
        .in('id', selectedProjectIds)
        .in('status', ['planning', 'active']);

      if (error) throw error;

      if (!projects || projects.length === 0) {
        toast({
          title: "No valid projects found",
          description: "Selected projects may not be in active or planning status",
          variant: "destructive"
        });
        return;
      }

      const scheduleItems = projects.map((project, index) => ({
        address: project.location,
        category: index % 3 === 0 ? 'normal' as const : 
                 index % 3 === 1 ? 'materials' as const : 'specials' as const,
        startTime: index % 3 === 0 ? "09:00" : 
                  index % 3 === 1 ? "13:00" : "08:00",
        endTime: index % 3 === 0 ? "12:00" : 
                index % 3 === 1 ? "17:00" : "16:00",
        workers: [],
        projectId: project.id
      }));

      const scheduleData = {
        workDate: selectedDate,
        items: scheduleItems,
        absences: []
      };

      await upsertSchedule.mutateAsync(scheduleData);
      toast({
        title: "Schedule created from selected projects",
        description: `Created ${projects.length} schedule items from your selected projects`
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error creating schedule",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSample(false);
      setProjectSelectionOpen(false);
    }
  }, [selectedDate, upsertSchedule, toast]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    
    setActiveWorker({
      id: String(active.id),
      name: activeData.name,
      isAssistant: activeData.isAssistant,
      scheduleItemId: activeData.scheduleItemId
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorker(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    console.log('Drag end:', { activeData, overData, overId: over.id });

    // Handle drop on schedule item
    if (overData?.type === 'schedule-item') {
      const scheduleItemId = overData.scheduleItemId;
      const userId = activeData.userId;
      const isAssistant = activeData.isAssistant || false;

      toast({
        title: "Assigning worker...",
        description: `Moving ${activeData.name} to schedule item`
      });

      // If worker was previously assigned, unassign first
      if (activeData.scheduleItemId) {
        debouncedUpdate(activeData.scheduleItemId, userId, isAssistant, 'unassign');
      }

      // Assign to new schedule item
      debouncedUpdate(scheduleItemId, userId, isAssistant, 'assign');
      
      // Check if this schedule item has a project and trigger project assignment modal
      const targetItem = schedule?.items.find(item => item.id === scheduleItemId);
      if (targetItem?.project_id) {
        // Get all workers currently assigned to this schedule item
        setTimeout(() => {
          const currentWorkers = targetItem.workers.map(w => ({
            id: w.user_id,
            name: w.profiles.name
          }));
          
          // Add the newly assigned worker
          const newWorker = { id: userId, name: activeData.name };
          const allWorkers = [...currentWorkers, newWorker];
          
          setProjectAssignmentModal({
            open: true,
            scheduleItem: targetItem,
            workerIds: allWorkers.map(w => w.id),
            workerNames: allWorkers.map(w => w.name)
          });
        }, 1500); // Small delay to allow assignment to complete
      }
    }

    // Handle drop back to unassigned (if dragging from a schedule item)
    if (over.id === 'unassigned-workers' && activeData.scheduleItemId) {
      toast({
        title: "Unassigning worker...",
        description: `Moving ${activeData.name} back to unassigned`
      });
      debouncedUpdate(activeData.scheduleItemId, activeData.userId, activeData.isAssistant, 'unassign');
    }
  }, [debouncedUpdate, schedule?.items, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading schedule planner...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-[100dvh] overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b p-4 space-y-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Schedule Planner
                </h1>
              </div>
            </div>
          </div>
          
          {/* Horizontal Scrolling Button Row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="shrink-0 justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  📅 {format(selectedDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              onClick={() => setProjectSelectionOpen(true)}
              disabled={isCreatingSample}
              variant="outline"
              className="shrink-0"
            >
              {isCreatingSample ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create from Projects
            </Button>
            
            <Button 
              onClick={() => setPasteModalOpen(true)}
              className="shrink-0 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <FileText className="mr-2 h-4 w-4" />
              Paste Schedule
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Unassigned Workers - Collapsible on Mobile */}
            <div className="lg:col-span-3">
              <div className="block lg:hidden">
                <Accordion type="single" collapsible defaultValue="workers">
                  <AccordionItem value="workers">
                    <AccordionTrigger className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Available Workers
                        <Badge variant="secondary" className="bg-white/20 text-white">{unassignedWorkers.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        <SortableContext 
                          items={unassignedWorkers.map(w => w.user_id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {unassignedWorkers.map((worker) => (
                            <DraggableWorkerBadge
                              key={worker.user_id}
                              worker={worker}
                              isFromSchedule={false}
                           onClick={() => {
                             setWorkerTaskAssignmentModal({
                               open: true,
                               worker: worker,
                               projectId: undefined
                             });
                           }}
                            />
                          ))}
                        </SortableContext>
                        
                        {unassignedWorkers.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-blue-300 rounded-lg bg-white/30">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
                            <div className="space-y-1">
                              <p className="font-medium">All workers are busy!</p>
                              <p className="text-xs">{schedule?.items.length ? "Everyone's assigned" : "No workers available"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              {/* Desktop Workers Panel */}
              <div className="hidden lg:block">
                <Card className="h-full transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Available Workers
                      <Badge variant="secondary" className="bg-white/20 text-white">{unassignedWorkers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent 
                    className="space-y-3 min-h-[200px] p-4"
                    id="unassigned-workers"
                    data-droppable="true"
                  >
                    <SortableContext 
                      items={unassignedWorkers.map(w => w.user_id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {unassignedWorkers.map((worker) => (
                        <DraggableWorkerBadge
                          key={worker.user_id}
                          worker={worker}
                          isFromSchedule={false}
                         onClick={() => {
                           setWorkerTaskAssignmentModal({
                             open: true,
                             worker: worker,
                             projectId: undefined
                           });
                         }}
                        />
                      ))}
                    </SortableContext>
                    
                    {unassignedWorkers.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-blue-300 rounded-lg bg-white/30">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
                        <div className="space-y-1">
                          <p className="font-medium">All workers are busy!</p>
                          <p className="text-xs">{schedule?.items.length ? "Everyone's assigned" : "No workers available"}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Schedule Items */}
            <div className="lg:col-span-9 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SortableContext 
                  items={schedule?.items.map(item => item.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {schedule?.items.map((item) => (
                    <DroppableScheduleItem
                      key={item.id}
                      item={{...item, selectedDate}}
                      unassignedWorkers={unassignedWorkers}
                      onWorkerAssign={(workerId, scheduleItemId) => {
                        const worker = unassignedWorkers.find(w => w.user_id === workerId);
                        if (worker) {
                          toast({
                            title: "Assigning worker...",
                            description: `Assigning ${worker.name} to schedule item`
                          });
                          debouncedUpdate(scheduleItemId, workerId, false, 'assign');
                        }
                      }}
                      onWorkerClick={(itemOrWorker) => {
                        if (itemOrWorker.workers) {
                          // Clicked on item header
                          setProjectAssignmentModal({
                            open: true,
                            scheduleItem: itemOrWorker,
                            workerIds: itemOrWorker.workers.map((w: any) => w.user_id),
                            workerNames: itemOrWorker.workers.map((w: any) => w.profiles.name)
                          });
                        } else {
                          // Clicked on individual worker
                          setProjectAssignmentModal({
                            open: true,
                            scheduleItem: item,
                            workerIds: [itemOrWorker.workers[0].user_id],
                            workerNames: [itemOrWorker.workers[0].profiles.name]
                          });
                        }
                      }}
                      onWorkerTaskAssign={(worker, projectId) => {
                        if (projectId) {
                          setAssignTreeSheet({
                            open: true,
                            projectId: projectId,
                            workerId: worker.user_id,
                            phaseDefault: undefined
                          });
                        } else {
                          setWorkerTaskAssignmentModal({
                            open: true,
                            worker: worker,
                            projectId: projectId
                          });
                        }
                      }}
                    />
                  ))}
                </SortableContext>
                
                {(!schedule?.items || schedule.items.length === 0) && (
                  <Card className="col-span-1 lg:col-span-2 transition-all duration-300 border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-16 w-16 text-purple-400 mb-4" />
                      <h3 className="text-xl font-semibold text-purple-600 mb-2">Ready to Create?</h3>
                      <p className="text-sm text-muted-foreground mt-2 text-center mb-6 max-w-md">
                        Start building your schedule! Create schedule items from your projects.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          onClick={() => setProjectSelectionOpen(true)}
                          disabled={isCreatingSample}
                          size="lg"
                          className="transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                        >
                          {isCreatingSample ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Create from Projects
                        </Button>
                        <Button 
                          onClick={() => setPasteModalOpen(true)}
                          variant="outline"
                          size="lg"
                          className="transition-all duration-300 border-purple-300 hover:bg-purple-50"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Paste Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeWorker && (
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl border-2 border-white shadow-2xl">
            <div className="text-sm font-medium flex items-center gap-2 text-white">
              ✨ {activeWorker.name}
              {activeWorker.isAssistant && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                  🎯 assist
                </Badge>
              )}
              <span className="text-xs opacity-75">is flying! 🚀</span>
            </div>
          </div>
        )}
      </DragOverlay>

      {/* Project Selection Modal */}
      <ProjectSelectionDialog
        open={projectSelectionOpen}
        onOpenChange={setProjectSelectionOpen}
        onProjectsSelected={createScheduleFromProjects}
        isCreating={isCreatingSample}
      />

      {/* Paste Schedule Modal */}
      <PasteScheduleModal 
        open={pasteModalOpen}
        onOpenChange={setPasteModalOpen}
      />

      {/* Project Assignment Modal */}
      <ProjectScheduleAssignment
        scheduleItem={projectAssignmentModal.scheduleItem}
        workerIds={projectAssignmentModal.workerIds}
        workerNames={projectAssignmentModal.workerNames}
        open={projectAssignmentModal.open}
        onOpenChange={(open) => 
          setProjectAssignmentModal(prev => ({ ...prev, open }))
        }
      />

      {/* Worker Task Assignment Modal */}
      <WorkerTaskAssignment
        open={workerTaskAssignmentModal.open}
        onOpenChange={(open) => 
          setWorkerTaskAssignmentModal(prev => ({ ...prev, open }))
        }
        worker={workerTaskAssignmentModal.worker}
        projectId={workerTaskAssignmentModal.projectId}
      />

      {/* Assign Tree Sheet - New Phase-Aware Assignment */}
      <AssignTreeSheet
        open={assignTreeSheet.open}
        onOpenChange={(open) => 
          setAssignTreeSheet(prev => ({ ...prev, open }))
        }
        projectId={assignTreeSheet.projectId}
        workerId={assignTreeSheet.workerId}
        phaseDefault={assignTreeSheet.phaseDefault}
      />
    </DndContext>
  );
}
