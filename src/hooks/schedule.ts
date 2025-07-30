import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { ParsedSchedule } from '@/lib/parseDagschema';

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  project_id?: string;
  address: string;
  category: 'normal' | 'materials' | 'storingen' | 'specials';
  start_time: string;
  end_time: string;
  workers: Array<{
    id: string;
    user_id: string;
    is_assistant: boolean;
    profiles: {
      name: string;
    };
  }>;
}

export interface Schedule {
  id: string;
  work_date: string;
  created_by: string;
  items: ScheduleItem[];
}

export interface UnassignedWorker {
  user_id: string;
  name: string;
}

export interface ScheduleEntry {
  work_date: string;
  tasks: Array<{
    task_id: string;
    assigned_user_id: string;
    estimated_hours: number;
  }>;
}

export function useSchedule(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['schedule', dateStr],
    queryFn: async () => {
      // Schedule tables don't exist yet - return empty data structure
      return {
        id: 'temp-' + dateStr,
        work_date: dateStr,
        created_by: '',
        items: [],
      } as Schedule;
    }
  });
}

export function useUpsertSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: ScheduleEntry) => {
      // Schedule tables don't exist yet - skip creation
      return { id: Math.random().toString() };
    },
    onSuccess: (_, variables) => {
      const dateStr = variables.work_date;
      queryClient.invalidateQueries({ queryKey: ['schedule', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers', dateStr] });
    }
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // Schedule tables don't exist yet - skip deletion
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers'] });
    }
  });
}

export function useUnassignedWorkers(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['unassigned-workers', dateStr],
    queryFn: async () => {
      // Get all profiles with worker role
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'worker');

      if (profilesError) throw profilesError;

      // Since schedule tables don't exist, return all workers as unassigned
      return (allProfiles || []).map(profile => ({
        user_id: profile.id,
        name: profile.name || 'Unknown',
        profiles: {
          name: profile.name || 'Unknown'
        }
      })) as UnassignedWorker[];
    }
  });
}

export function useNewItemsPreview() {
  return useMutation({
    mutationFn: async (data: ParsedSchedule) => {
      // Return empty preview since schedule functionality isn't implemented
      return {
        newProjects: [],
        newWorkers: [],
        existingProjects: [],
        existingWorkers: []
      };
    }
  });
}

export function useUpdateWorkerAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleItemId,
      userId,
      isAssistant = false,
      action
    }: {
      scheduleItemId: string;
      userId: string;
      isAssistant?: boolean;
      action: 'assign' | 'unassign';
    }) => {
      // Schedule tables don't exist yet - skip assignment
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers'] });
    }
  });
}