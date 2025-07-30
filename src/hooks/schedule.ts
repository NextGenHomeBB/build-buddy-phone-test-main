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
      // Get schedule for the specific date
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('work_date', dateStr)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      let scheduleId = scheduleData?.id;
      
      // If no schedule exists for this date, return empty structure
      if (!scheduleData) {
        return {
          id: 'temp-' + dateStr,
          work_date: dateStr,
          created_by: '',
          items: [],
        } as Schedule;
      }

      // Get schedule items with workers
      const { data: itemsData, error: itemsError } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('schedule_id', scheduleId);

      if (itemsError) throw itemsError;

      // Get workers for each schedule item separately
      const items = await Promise.all((itemsData || []).map(async (item) => {
        const { data: workersData } = await supabase
          .from('schedule_item_workers')
          .select(`
            id,
            user_id,
            is_assistant
          `)
          .eq('schedule_item_id', item.id);

        // Get profile names for workers
        const workers = await Promise.all((workersData || []).map(async (worker) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', worker.user_id)
            .maybeSingle();

          return {
            id: worker.id,
            user_id: worker.user_id,
            is_assistant: worker.is_assistant,
            profiles: {
              name: profileData?.name || 'Unknown'
            }
          };
        }));

        return {
          ...item,
          workers
        };
      }));

      return {
        ...scheduleData,
        items
      } as Schedule;
    }
  });
}

export function useUpsertSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: ScheduleEntry) => {
      const { work_date, tasks } = scheduleData;

      // Create or get existing schedule
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('work_date', work_date)
        .maybeSingle();

      let scheduleId = existingSchedule?.id;

      if (!scheduleId) {
        const { data: newSchedule, error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            work_date,
            created_by: (await supabase.auth.getUser()).data.user?.id || ''
          })
          .select('id')
          .single();

        if (scheduleError) throw scheduleError;
        scheduleId = newSchedule.id;
      }

      // For now, create placeholder schedule items from tasks
      // This is a basic implementation - in a real scenario you'd have more detailed scheduling logic
      const scheduleItems = tasks.map((task, index) => ({
        schedule_id: scheduleId,
        project_id: null, // Would need to get from task
        address: `Task ${task.task_id}`,
        category: 'normal' as const,
        start_time: `${8 + index}:00:00`,
        end_time: `${8 + index + task.estimated_hours}:00:00`
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('schedule_items')
        .insert(scheduleItems)
        .select('id');

      if (itemsError) throw itemsError;

      // Assign workers to schedule items
      if (createdItems && tasks.length > 0) {
        const workerAssignments = tasks.map((task, index) => ({
          schedule_item_id: createdItems[index]?.id,
          user_id: task.assigned_user_id,
          is_assistant: false
        })).filter(assignment => assignment.schedule_item_id);

        if (workerAssignments.length > 0) {
          const { error: assignmentError } = await supabase
            .from('schedule_item_workers')
            .insert(workerAssignments);

          if (assignmentError) throw assignmentError;
        }
      }

      return { id: scheduleId };
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
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
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

      // Get schedule for the date to find assigned workers
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('id')
        .eq('work_date', dateStr)
        .maybeSingle();

      let assignedWorkerIds: string[] = [];

      if (scheduleData) {
        // Get all assigned workers for this schedule
        const { data: assignedWorkers } = await supabase
          .from('schedule_item_workers')
          .select('user_id, schedule_items!inner(schedule_id)')
          .eq('schedule_items.schedule_id', scheduleData.id);

        assignedWorkerIds = assignedWorkers?.map(w => w.user_id) || [];
      }

      // Filter out assigned workers
      const unassignedProfiles = (allProfiles || []).filter(
        profile => !assignedWorkerIds.includes(profile.id)
      );

      return unassignedProfiles.map(profile => ({
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
      if (action === 'assign') {
        const { error } = await supabase
          .from('schedule_item_workers')
          .insert({
            schedule_item_id: scheduleItemId,
            user_id: userId,
            is_assistant: isAssistant
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schedule_item_workers')
          .delete()
          .eq('schedule_item_id', scheduleItemId)
          .eq('user_id', userId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers'] });
    }
  });
}