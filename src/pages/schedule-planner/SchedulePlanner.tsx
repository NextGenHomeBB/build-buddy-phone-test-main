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
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
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
    if (overData?.type === 'unassigned' && activeData.scheduleItemId) {
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
                data-droppable="true"
                data-type="unassigned"
              >
                <SortableContext 
                  items={unassignedWorkers.map(w => w.user_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {unassignedWorkers.map((worker) => (
                    <Badge
                      key={worker.user_id}
                      variant="secondary"
                      className="p-2 cursor-grab hover:bg-secondary/80 transition-colors block"
                    >
                      {worker.name}
                    </Badge>
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
              {schedule?.items.map((item) => (
                <Card key={item.id} className="h-fit">
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
                                setProjectAssignmentModal({
                                  open: true,
                                  scheduleItem: item,
                                  workerIds: item.workers.map(w => w.user_id),
                                  workerNames: item.workers.map(w => w.profiles.name)
                                });
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
                  <CardContent 
                    className="space-y-2 min-h-[100px]"
                    data-droppable="true"
                    data-type="schedule-item"
                    data-schedule-item-id={item.id}
                  >
                    {item.workers.map((worker) => (
                      <Badge
                        key={`${item.id}-${worker.user_id}`}
                        variant={worker.is_assistant ? "outline" : "default"}
                        className={`p-2 transition-opacity block ${
                          item.project_id 
                            ? 'cursor-pointer hover:opacity-80 hover:bg-primary/80' 
                            : 'cursor-grab hover:opacity-80'
                        }`}
                        onClick={() => {
                          if (item.project_id) {
                            setProjectAssignmentModal({
                              open: true,
                              scheduleItem: item,
                              workerIds: [worker.user_id],
                              workerNames: [worker.profiles.name]
                            });
                          }
                        }}
                      >
                        {worker.profiles.name}
                        {worker.is_assistant && " (assist)"}
                        {item.project_id && " 🔗"}
                      </Badge>
                    ))}
                    
                    {item.workers.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed border-muted rounded-lg">
                        Drop workers here
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) || (
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