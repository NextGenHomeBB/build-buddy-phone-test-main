import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Data hooks for the phase-aware assign tasks workflow

export function useProjectPhases(projectId?: string) {
  return useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, name, status')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useTasksByPhase(phaseId?: string) {
  return useQuery({
    queryKey: ['tasks-by-phase', phaseId],
    queryFn: async () => {
      if (!phaseId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .eq('phase_id', phaseId)
        .in('status', ['todo', 'in-progress'])
        .is('assigned_to', null)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!phaseId,
  });
}

export function useChecklistItems(taskId?: string) {
  return useQuery({
    queryKey: ['checklist-items', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('checklist_items')
        .select('id, title, description, is_done')
        .eq('task_id', taskId)
        .eq('is_done', false)
        .is('assignee_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export interface BulkAssignPayload {
  workerId: string;
  taskIds: string[];
  checklistItemIds: string[];
  projectId: string;
}

export function useBulkAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkAssignPayload) => {
      console.log('🎯 Bulk assigning:', payload);
      
      const { data, error } = await supabase.functions.invoke('assign_bulk', {
        body: payload
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tasks-by-phase'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-tasks'] });
      
      toast({
        title: "Assignment Successful",
        description: `Assigned ${variables.taskIds.length} tasks and ${variables.checklistItemIds.length} checklist items successfully`,
      });
    },
    onError: (error) => {
      console.error('❌ Bulk assign error:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign tasks and checklist items. Please try again.",
        variant: "destructive",
      });
    },
  });
}