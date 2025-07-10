import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePhaseCalendar } from '@/hooks/usePhaseCalendar';
import { usePhasePlanningMutation } from '@/services/phasePlanning.service';
import { Calendar, GanttChart, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SelectPhaseDialog } from '@/components/project/SelectPhaseDialog';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface PhaseCalendarProps {
  projectId: string;
}

export function PhaseCalendar({ projectId }: PhaseCalendarProps) {
  const [activeTab, setActiveTab] = useState<'gantt' | 'month'>('gantt');
  const [ganttView, setGanttView] = useState<'day' | 'week' | 'month'>('week');
  
  const { phases, calendar, isLoading, checkDateOverlap } = usePhaseCalendar(projectId);
  const phasePlanningMutation = usePhasePlanningMutation();
  const { toast } = useToast();
  const { canAddPhase } = useRoleAccess();
  const queryClient = useQueryClient();

  // Simple Gantt representation using HTML/CSS
  const ganttPhases = phases.filter(phase => phase.start_date && phase.end_date);

  const deletePhase = useMutation({
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId, 'calendar'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'phases'] });
      toast({
        title: "Phase deleted",
        description: "Phase has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete phase",
        variant: "destructive",
      });
    },
  });

  const handleDeletePhase = (phaseId: string) => {
    deletePhase.mutate(phaseId);
  };

  const handleDateChange = (phaseId: string, newStartDate: string, newEndDate: string) => {
    // Check for overlaps
    if (checkDateOverlap(phaseId, newStartDate, newEndDate)) {
      toast({
        title: "Date overlap detected",
        description: "This phase overlaps with another phase. Please adjust the dates.",
        variant: "destructive",
      });
      return;
    }

    // Update dates
    phasePlanningMutation.mutate({
      phaseId,
      startDate: newStartDate,
      endDate: newEndDate,
      projectId,
    });
  };

  const handleCalendarDateClick = (date: Date, phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase || !phase.start_date || !phase.end_date) return;

    const currentStart = new Date(phase.start_date);
    const currentEnd = new Date(phase.end_date);
    const duration = currentEnd.getTime() - currentStart.getTime();
    
    const newStart = format(date, 'yyyy-MM-dd');
    const newEnd = format(addDays(date, Math.ceil(duration / (1000 * 60 * 60 * 24))), 'yyyy-MM-dd');

    // Check for overlaps
    if (checkDateOverlap(phaseId, newStart, newEnd)) {
      toast({
        title: "Date overlap detected",
        description: "Moving this phase would cause it to overlap with another phase.",
        variant: "destructive",
      });
      return;
    }

    phasePlanningMutation.mutate({
      phaseId,
      startDate: newStart,
      endDate: newEnd,
      projectId,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Phase Planning
          </CardTitle>
          {canAddPhase() && (
            <SelectPhaseDialog projectId={projectId}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Choose Phase
              </Button>
            </SelectPhaseDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gantt' | 'month')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <GanttChart className="h-4 w-4" />
              Gantt View
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Month View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGanttView('day')}
                    className={cn(ganttView === 'day' && "bg-primary text-primary-foreground")}
                  >
                    Day
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGanttView('week')}
                    className={cn(ganttView === 'week' && "bg-primary text-primary-foreground")}
                  >
                    Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGanttView('month')}
                    className={cn(ganttView === 'month' && "bg-primary text-primary-foreground")}
                  >
                    Month
                  </Button>
                </div>
              </div>

              {ganttPhases.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 border-b">
                    <div className="grid grid-cols-[200px_1fr] gap-4">
                      <div className="font-medium">Phase</div>
                      <div className="font-medium">Timeline</div>
                    </div>
                  </div>
                  <div className="divide-y">
                     {ganttPhases.map(phase => (
                       <GanttRow 
                         key={phase.id} 
                         phase={phase} 
                         onDateChange={handleDateChange}
                         onDelete={handleDeletePhase}
                         view={ganttView}
                       />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No phases with dates found. Add start and end dates to phases to see them in the Gantt chart.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="month" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {format(calendar.currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={calendar.prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={calendar.goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={calendar.nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {calendar.calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[100px] p-2 border rounded-lg transition-colors",
                      day.isCurrentMonth ? "bg-background" : "bg-muted/50",
                      day.isToday && "bg-primary/5 border-primary"
                    )}
                  >
                    <div className="text-sm font-medium mb-1">{day.dayNumber}</div>
                    <div className="space-y-1">
                      {day.events.map(event => {
                        const phase = phases.find(p => p.id === event.id);
                        if (!phase) return null;
                        
                        return (
                          <div
                            key={event.id}
                            className="cursor-pointer"
                            onClick={() => handleCalendarDateClick(day.date, event.id)}
                          >
                            <Badge
                              variant="secondary"
                              className="text-xs w-full justify-start truncate"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              {event.title}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface GanttRowProps {
  phase: any;
  onDateChange: (phaseId: string, startDate: string, endDate: string) => void;
  onDelete: (phaseId: string) => void;
  view: string;
}

function GanttRow({ phase, onDateChange, onDelete, view }: GanttRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState(phase.start_date);
  const [endDate, setEndDate] = useState(phase.end_date);

  const handleSave = () => {
    if (startDate && endDate) {
      onDateChange(phase.id, startDate, endDate);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setStartDate(phase.start_date);
    setEndDate(phase.end_date);
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 p-4 hover:bg-muted/50">
      <div className="space-y-1">
        <div className="font-medium truncate">{phase.name}</div>
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{ backgroundColor: getPhaseColor(phase.status) + '20', color: getPhaseColor(phase.status) }}
        >
          {phase.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-sm border rounded"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-sm border rounded"
            />
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onDelete(phase.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer flex-1"
              onClick={() => setIsEditing(true)}
            >
              <div className="text-sm text-muted-foreground">
                {format(new Date(phase.start_date), 'MMM dd')} - {format(new Date(phase.end_date), 'MMM dd')}
              </div>
              <div className="flex-1 bg-muted rounded h-4 relative overflow-hidden">
                <div 
                  className="h-full rounded transition-all"
                  style={{ 
                    backgroundColor: getPhaseColor(phase.status),
                    width: `${phase.progress}%`
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                  {phase.progress}%
                </div>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onDelete(phase.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getPhaseColor(status: string): string {
  switch (status) {
    case 'planning': return '#6b7280';
    case 'active': return '#3b82f6';
    case 'completed': return '#10b981';
    case 'on-hold': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
}