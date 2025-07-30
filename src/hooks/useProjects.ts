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
    queryFn: async () => {
      console.log('🎣 useProject hook executing for:', id);
      try {
        const result = await projectService.getProject(id);
        console.log('✅ useProject success:', result?.name);
        return result;
      } catch (error) {
        console.error('❌ useProject error:', error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
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
      console.log('🔄 Fetching phase data for:', phaseId);
      
      const { data: phase, error: phaseError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        console.error('❌ Phase fetch error:', phaseError);
        throw phaseError;
      }
      if (!phase) return null;

      console.log('✅ Phase data fetched:', { 
        id: phase.id, 
        name: phase.name, 
        budget: phase.budget,
        material_cost: phase.material_cost,
        labour_cost: phase.labour_cost
      });

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
        estimatedHours: undefined,
      }));

      return {
        ...phase,
        startDate: phase.start_date,
        endDate: phase.end_date,
        checklist,
      };
    },
    enabled: !!phaseId,
    staleTime: 0, // Don't use stale data
    gcTime: 0, // Don't cache for debugging
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

      // Skip progress update since function doesn't exist

      // Check if all checklist items are completed and auto-update phase status
      if (completed) {
        // Get all tasks for this phase
        const { data: allTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('phase_id', phaseId);

        if (!tasksError && allTasks) {
          // Check if all tasks are completed
          const allCompleted = allTasks.every(task => task.status === 'completed');
          
          if (allCompleted && allTasks.length > 0) {
            // Auto-update phase status to completed
            const { error: phaseError } = await supabase
              .from('project_phases')
              .update({ status: 'completed' })
              .eq('id', phaseId);
            
            if (phaseError) {
              console.warn('Failed to auto-update phase status:', phaseError);
            }
          }
        }
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          project_id: taskData.project_id,
          phase_id: taskData.phase_id,
          organization_id: user.user_metadata?.organization_id,
          status: 'todo',
        })
        .select()
        .single();

      if (error) throw error;

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