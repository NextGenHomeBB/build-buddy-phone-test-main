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
  useSensors
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Plus, FileText, Users, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSchedule, useUnassignedWorkers, useUpdateWorkerAssignment } from '@/hooks/schedule';
import { ScheduleCategoryBadge } from '@/components/ui/ScheduleCategoryBadge';
import { PasteScheduleModal } from './PasteScheduleModal';
import { ProjectScheduleAssignment } from '@/components/ProjectScheduleAssignment';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <Badge
        variant={worker.is_assistant ? "outline" : isFromSchedule ? "default" : "secondary"}
        className={`p-2 cursor-grab hover:bg-secondary/80 transition-colors block ${
          onClick ? 'cursor-pointer hover:opacity-80' : ''
        }`}
      >
        {displayName}
        {worker.is_assistant && " (assist)"}
        {isFromSchedule && scheduleItemId && " 🔗"}
      </Badge>
    </div>
  );
}

// Droppable Schedule Item Component
function DroppableScheduleItem({ item, onWorkerClick }: {
  item: any;
  onWorkerClick: (worker: any) => void;
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
      <Card className={`h-fit ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{item.address}</CardTitle>
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
                className="h-6 w-6 p-0"
                title="Assign tasks to workers"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.start_time} - {item.end_time}
          </div>
          {item.project_id && (
            <div className="text-xs text-muted-foreground">
              🏗️ Project linked - Click workers to assign tasks
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 min-h-[100px]">
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
                  onWorkerClick({ ...item, workers: [worker] });
                }
              }}
            />
          ))}
        </SortableContext>
        
        {item.workers.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-muted rounded-lg">
            Drop workers here
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
  const [activeWorker, setActiveWorker] = useState<DraggableWorker | null>(null);
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
  const navigate = useNavigate();

  const { data: schedule, isLoading } = useSchedule(selectedDate);
  const { data: unassignedWorkers = [] } = useUnassignedWorkers(selectedDate);
  const updateWorkerAssignment = useUpdateWorkerAssignment();

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

  const handleDragStart = useCallback((event: any) => {
    const { active } = event;
    const activeData = active.data.current;
    
    setActiveWorker({
      id: active.id,
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

    // Handle drop on schedule item
    if (overData?.type === 'schedule-item') {
      const scheduleItemId = overData.scheduleItemId;
      const userId = activeData.userId;
      const isAssistant = activeData.isAssistant || false;

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
      debouncedUpdate(activeData.scheduleItemId, activeData.userId, activeData.isAssistant, 'unassign');
    }
  }, [debouncedUpdate]);

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
        <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
              <h1 className="text-3xl font-bold">Schedule Planner</h1>
              <p className="text-muted-foreground">
                Drag and drop workers to assign them to schedule items
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button onClick={() => setPasteModalOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Paste Schedule
            </Button>
          </div>
        </div>

        {/* Planner Board */}
        <div className="grid grid-cols-12 gap-6 min-h-[600px]">
          {/* Unassigned Workers Column */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Unassigned Workers
                  <Badge variant="outline">{unassignedWorkers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent 
                className="space-y-2"
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
                    />
                  ))}
                </SortableContext>
                
                {unassignedWorkers.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    All workers are assigned
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Items Columns */}
          <div className="col-span-9">
            <div className="grid grid-cols-2 gap-4 h-full">
              <SortableContext 
                items={schedule?.items.map(item => item.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {schedule?.items.map((item) => (
                  <DroppableScheduleItem
                    key={item.id}
                    item={item}
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
                  />
                ))}
              </SortableContext>
              
              {(!schedule?.items || schedule.items.length === 0) && (
                <Card className="col-span-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No Schedule Items</h3>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Use the "Paste Schedule" button to import a schedule for this date.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeWorker && (
          <div className="p-2 bg-primary/10 rounded-lg border-2 border-primary shadow-lg">
            <div className="text-sm font-medium flex items-center gap-2">
              {activeWorker.name}
              {activeWorker.isAssistant && (
                <Badge variant="outline" className="text-xs">
                  assist
                </Badge>
              )}
            </div>
          </div>
        )}
      </DragOverlay>

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
    </DndContext>
  );
}