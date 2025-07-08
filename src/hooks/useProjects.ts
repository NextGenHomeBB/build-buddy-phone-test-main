import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { Project, Phase } from '@/mocks/projects';

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
    queryFn: () => projectService.getProjectPhases(projectId),
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch a single phase by ID
 */
export function usePhase(phaseId: string) {
  return useQuery({
    queryKey: ['phases', phaseId],
    queryFn: () => projectService.getPhase(phaseId),
    enabled: !!phaseId,
  });
}

/**
 * Hook to update checklist item
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId, itemId, completed, completedBy }: { 
      phaseId: string; 
      itemId: string; 
      completed: boolean; 
      completedBy?: string; 
    }) => projectService.updateChecklistItem(phaseId, itemId, completed, completedBy),
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
    mutationFn: (projectData: Omit<Project, 'id' | 'phases' | 'materials' | 'labour' | 'documents' | 'activities'>) =>
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
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
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
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}