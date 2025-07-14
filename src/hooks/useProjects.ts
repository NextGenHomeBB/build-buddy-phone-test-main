import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch all projects (admin/manager view)
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
}

/**
 * Hook to fetch accessible projects based on user role and permissions
 */
export function useAccessibleProjects() {
  return useQuery({
    queryKey: ['accessible-projects'],
    queryFn: () => {
      console.log('🎣 useAccessibleProjects hook executing');
      return projectService.getAccessibleProjects();
    },
    retry: 1,
    staleTime: 0, // Always refetch for debugging
  });
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch phases for a project
 */
export function useProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'phases'],
    queryFn: async () => {
      const project = await projectService.getProject(projectId);
      return project?.phases || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch a single phase by ID
 */
export function usePhase(phaseId: string) {
  return useQuery({
    queryKey: ['phases', phaseId],
    queryFn: async () => {
      const { data: phase, error: phaseError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('id', phaseId)
        .single();

      if (phaseError) throw phaseError;
      if (!phase) return null;

      // Fetch tasks for this phase
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at');

      if (tasksError) throw tasksError;

      // Transform tasks to checklist items format
      const checklist = (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        completed: task.status === 'completed',
        completedBy: task.assigned_to || undefined,
        completedAt: task.updated_at,
        priority: task.priority === 'urgent' ? 'high' : task.priority as 'low' | 'medium' | 'high',
        category: 'General',
        estimatedHours: task.estimated_hours ? Number(task.estimated_hours) : undefined,
      }));

      return {
        ...phase,
        startDate: phase.start_date,
        endDate: phase.end_date,
        checklist,
      };
    },
    enabled: !!phaseId,
  });
}

/**
 * Hook to update checklist item with optimistic updates
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phaseId, itemId, completed, completedBy }: { 
      phaseId: string; 
      itemId: string; 
      completed: boolean; 
      completedBy?: string; 
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: completed ? 'completed' : 'todo',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Update phase progress after task completion
      const { error: progressError } = await supabase.rpc('update_phase_progress', {
        phase_id_param: phaseId
      });
      
      if (progressError) throw progressError;

      return data;
    },
    onMutate: async ({ phaseId, itemId, completed, completedBy }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['phases', phaseId] });

      // Snapshot the previous value
      const previousPhase = queryClient.getQueryData(['phases', phaseId]);

      // Optimistically update the cache
      queryClient.setQueryData(['phases', phaseId], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          checklist: old.checklist.map((item: any) => 
            item.id === itemId 
              ? { 
                  ...item, 
                  completed,
                  completedBy: completed ? completedBy : undefined,
                  completedAt: completed ? new Date().toISOString() : undefined,
                }
              : item
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousPhase };
    },
    onError: (err, { phaseId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['phases', phaseId], context?.previousPhase);
    },
    onSettled: async (_, __, { phaseId }) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['phases', phaseId] });
      
      // Also invalidate project phases queries to update the overview page
      const phase = queryClient.getQueryData(['phases', phaseId]) as any;
      if (phase?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['projects', phase.project_id, 'phases'] });
        queryClient.invalidateQueries({ queryKey: ['projects', phase.project_id] });
      }
    },
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: any) =>
      projectService.createProject(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      projectService.updateProject(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      estimated_hours?: number;
      project_id: string;
      phase_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          status: 'todo',
        })
        .select()
        .single();

      if (error) throw error;

      // Update phase progress after task creation
      if (taskData.phase_id) {
        const { error: progressError } = await supabase.rpc('update_phase_progress', {
          phase_id_param: taskData.phase_id
        });
        
        if (progressError) throw progressError;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Task creation success, invalidating queries for:', data);
      
      // Invalidate phase queries to refresh checklist
      if (data.phase_id) {
        queryClient.invalidateQueries({ queryKey: ['phases', data.phase_id] });
        queryClient.refetchQueries({ queryKey: ['phases', data.phase_id] });
      }
      
      // Invalidate project queries
      queryClient.invalidateQueries({ queryKey: ['projects', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project_id, 'phases'] });
      
      // Force immediate refetch of the phase data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['phases', data.phase_id] });
      }, 100);
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['accessible-projects'] });
    },
  });
}