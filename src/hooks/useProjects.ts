import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/supabaseService';

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
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
      // For now, return mock data - this would need to be implemented
      // when we add project phases functionality
      return null;
    },
    enabled: !!phaseId,
  });
}

/**
 * Hook to update checklist item
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
      // For now, return mock success - this would need to be implemented
      // when we add checklist functionality
      return { success: true };
    },
    onSuccess: (_, { phaseId }) => {
      // Invalidate phase query to refresh data
      queryClient.invalidateQueries({ queryKey: ['phases', phaseId] });
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
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // For now, return mock success - this would need to be implemented
      // when we add delete functionality
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}