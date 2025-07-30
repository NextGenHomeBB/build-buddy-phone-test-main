import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShiftData {
  id: string;
  start_time: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  user_id: string;
  project_id?: string;
}

export interface ShiftSummary {
  totalHours: number;
  breakHours: number;
  workingHours: number;
  projects: Array<{
    id: string;
    name: string;
    hours: number;
  }>;
}

export function useActiveShift() {
  return useQuery({
    queryKey: ['activeShift'],
    queryFn: async () => {
      // Use time_entries table instead of timesheets
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .is('end_ts', null)
        .gte('start_ts', `${today}T00:00:00Z`)
        .lt('start_ts', `${today}T23:59:59Z`)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('start_ts', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      return data?.[0] ? {
        id: data[0].id,
        start_time: data[0].start_ts,
        end_time: data[0].end_ts,
        break_start: null,
        break_end: null,
        user_id: data[0].user_id,
        project_id: data[0].project_id
      } as ShiftData : null;
    }
  });
}

export function useShiftSummary(date: Date) {
  const dateStr = date.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['shiftSummary', dateStr],
    queryFn: async () => {
      // Get time entries for the date
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          projects(id, name)
        `)
        .gte('start_ts', `${dateStr}T00:00:00Z`)
        .lt('start_ts', `${dateStr}T23:59:59Z`)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Calculate totals - simplified since we don't have proper time tracking structure
      const totalHours = (entries || []).reduce((total, entry) => {
        if (entry.end_ts) {
          const hours = (new Date(entry.end_ts).getTime() - new Date(entry.start_ts).getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0);

      // Group by projects
      const projectMap = new Map();
      (entries || []).forEach(entry => {
        if (entry.project_id && entry.projects) {
          const hours = entry.end_ts ? 
            (new Date(entry.end_ts).getTime() - new Date(entry.start_ts).getTime()) / (1000 * 60 * 60) : 0;
          
          if (projectMap.has(entry.project_id)) {
            projectMap.get(entry.project_id).hours += hours;
          } else {
            projectMap.set(entry.project_id, {
              id: entry.project_id,
              name: entry.projects.name,
              hours
            });
          }
        }
      });

      return {
        totalHours,
        breakHours: 0, // Not tracked in current schema
        workingHours: totalHours,
        projects: Array.from(projectMap.values())
      } as ShiftSummary;
    }
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId?: string) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.data.user.id,
          start_ts: new Date().toISOString(),
          project_id: projectId,
          organization_id: '00000000-0000-0000-0000-000000000000', // Default org
          entry_type: 'labour'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      queryClient.invalidateQueries({ queryKey: ['shiftSummary'] });
    }
  });
}

export function useEndShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          end_ts: new Date().toISOString()
        })
        .eq('id', shiftId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      queryClient.invalidateQueries({ queryKey: ['shiftSummary'] });
    }
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      // Break functionality not supported in current schema
      throw new Error('Break tracking not available in current schema');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    }
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shiftId: string) => {
      // Break functionality not supported in current schema
      throw new Error('Break tracking not available in current schema');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
    }
  });
}