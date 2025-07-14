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

export function useSchedule(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['schedule', dateStr],
    queryFn: async () => {
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id,
          work_date,
          created_by,
          schedule_items (
            id,
            project_id,
            address,
            category,
            start_time,
            end_time,
            schedule_item_workers (
              id,
              user_id,
              is_assistant,
              profiles (
                name
              )
            )
          )
        `)
        .eq('work_date', dateStr)
        .single();

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        throw scheduleError;
      }

      if (!schedule) {
        return null;
      }

      return {
        ...schedule,
        items: schedule.schedule_items.map((item: any) => ({
          ...item,
          workers: item.schedule_item_workers
        }))
      } as Schedule;
    }
  });
}

export function useUpsertSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ParsedSchedule) => {
      const dateStr = format(data.workDate, 'yyyy-MM-dd');

      // First, upsert the schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .upsert({
          work_date: dateStr,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }, { 
          onConflict: 'work_date' 
        })
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Delete existing items for this schedule
      await supabase
        .from('schedule_items')
        .delete()
        .eq('schedule_id', schedule.id);

      // Insert new items
      for (const item of data.items) {
        const { data: scheduleItem, error: itemError } = await supabase
          .from('schedule_items')
          .insert({
            schedule_id: schedule.id,
            project_id: item.projectId || null,
            address: item.address,
            category: item.category,
            start_time: item.startTime,
            end_time: item.endTime
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Insert workers for this item
        if (item.workers.length > 0) {
          // First, get user IDs from profiles by name
          const workerNames = item.workers.map(w => w.name);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('name', workerNames);

          const workerInserts = item.workers
            .map(worker => {
              const profile = profiles?.find(p => p.name === worker.name);
              if (!profile) return null;
              
              return {
                schedule_item_id: scheduleItem.id,
                user_id: profile.user_id,
                is_assistant: worker.isAssistant
              };
            })
            .filter(Boolean);

          if (workerInserts.length > 0) {
            const { error: workersError } = await supabase
              .from('schedule_item_workers')
              .insert(workerInserts);

            if (workersError) throw workersError;
          }
        }
      }

      // Handle absences
      if (data.absences.length > 0) {
        const absenceNames = data.absences.map(a => a.workerName);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('name', absenceNames);

        const absenceInserts = data.absences
          .map(absence => {
            const profile = profiles?.find(p => p.name === absence.workerName);
            if (!profile) return null;
            
            return {
              work_date: dateStr,
              user_id: profile.user_id,
              reason: absence.reason
            };
          })
          .filter(Boolean);

        if (absenceInserts.length > 0) {
          await supabase
            .from('absences')
            .upsert(absenceInserts, { 
              onConflict: 'work_date,user_id' 
            });
        }
      }

      return schedule;
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.workDate, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['schedule', dateStr] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-workers', dateStr] });
    }
  });
}

export function useUnassignedWorkers(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['unassigned-workers', dateStr],
    queryFn: async () => {
      // Get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('role', 'worker');

      if (profilesError) throw profilesError;

      // Get assigned workers for this date
      const { data: assignedWorkers, error: assignedError } = await supabase
        .from('schedule_item_workers')
        .select(`
          user_id,
          schedule_item_id,
          schedule_items!inner (
            schedule_id,
            schedules!inner (
              work_date
            )
          )
        `)
        .eq('schedule_items.schedules.work_date', dateStr);

      if (assignedError) throw assignedError;

      // Get workers on absence for this date
      const { data: absentWorkers, error: absenceError } = await supabase
        .from('absences')
        .select('user_id')
        .eq('work_date', dateStr);

      if (absenceError) throw absenceError;

      const assignedUserIds = new Set(assignedWorkers?.map(w => w.user_id) || []);
      const absentUserIds = new Set(absentWorkers?.map(w => w.user_id) || []);

      return allProfiles?.filter(profile => 
        !assignedUserIds.has(profile.user_id) && 
        !absentUserIds.has(profile.user_id)
      ).map(profile => ({
        user_id: profile.user_id,
        name: profile.name
      })) || [];
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