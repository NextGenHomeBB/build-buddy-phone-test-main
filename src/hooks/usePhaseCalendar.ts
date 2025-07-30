import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCalendar } from './useCalendar';

export interface PhaseCalendarData {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  material_cost: number;
  labour_cost: number;
}

export function usePhaseCalendar(projectId: string) {
  const { data: phases, isLoading, error } = useQuery({
    queryKey: ['phases', projectId, 'calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, name, start_date, end_date, status, material_cost, labour_cost')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Transform data to include missing progress field
      return (data || []).map(phase => ({
        ...phase,
        progress: 0 // Default progress since it doesn't exist in schema
      })) as PhaseCalendarData[];
    },
  });

  // Transform phases for calendar events
  const calendarEvents = phases?.map(phase => ({
    id: phase.id,
    title: phase.name,
    start_date: phase.start_date,
    end_date: phase.end_date,
    type: 'phase' as const,
    color: getPhaseColor(phase.status),
  })) || [];

  const calendar = useCalendar(calendarEvents);

  const checkDateOverlap = (phaseId: string, startDate: string, endDate: string) => {
    if (!phases) return false;
    
    const otherPhases = phases.filter(p => p.id !== phaseId);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    return otherPhases.some(phase => {
      if (!phase.start_date || !phase.end_date) return false;
      
      const existingStart = new Date(phase.start_date);
      const existingEnd = new Date(phase.end_date);

      // Check if dates overlap
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
  };

  return {
    phases: phases || [],
    calendarEvents,
    calendar,
    isLoading,
    error,
    checkDateOverlap,
  };
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