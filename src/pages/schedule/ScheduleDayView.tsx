import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, MapPin, ArrowLeft, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScheduleCategoryBadge } from '@/components/ui/ScheduleCategoryBadge';
import { useSchedule } from '@/hooks/schedule';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PasteScheduleModal } from '../schedule-planner/PasteScheduleModal';

export default function ScheduleDayView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();
  const { data: schedule, isLoading, error } = useSchedule(selectedDate);
  const { hasAdminAccess } = useRoleAccess();

  const groupedItems = schedule?.items.reduce((acc, item) => {
    const key = `${item.address}-${item.category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof schedule.items>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Error loading schedule: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <h1 className="text-3xl font-bold">Daily Schedule</h1>
            <p className="text-muted-foreground">
              View your work assignments for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasAdminAccess() && (
            <Button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Schedule
            </Button>
          )}
          
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
        </div>
      </div>

      {!schedule || Object.keys(groupedItems).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No Schedule Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              There are no work assignments for this date.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedItems).map(([key, items]) => {
            const firstItem = items[0];
            const allWorkers = items.flatMap(item => item.workers);
            
            return (
              <Card key={key} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">{firstItem.address}</CardTitle>
                        <ScheduleCategoryBadge category={firstItem.category} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {firstItem.start_time} - {firstItem.end_time}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Assigned Workers ({allWorkers.length})
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {allWorkers.map((worker) => (
                        <Badge 
                          key={`${worker.id}-${worker.user_id}`}
                          variant={worker.is_assistant ? "outline" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {worker.profiles.name}
                          {worker.is_assistant && (
                            <span className="text-xs opacity-70">(assist)</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                    
                    {allWorkers.length === 0 && (
                      <div className="text-sm text-muted-foreground italic">
                        No workers assigned to this location
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PasteScheduleModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
      />
    </div>
  );
}