import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useAvailableChecklists(projectId?: string) {
  return useQuery({
    queryKey: ['available-checklists', projectId],
    queryFn: async () => {
      // Get all checklist templates
      const { data: allChecklists, error: checklistError } = await supabase
        .from('checklists')
        .select('*');

      if (checklistError) throw checklistError;

      // Since project_checklists table doesn't exist, return all checklists
      return allChecklists || [];
    },
    enabled: !!projectId,
  });
}

export function useAssignChecklistToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, checklistId }: { projectId: string; checklistId: string }) => {
      // Since project_checklists table doesn't exist, we'll update the checklist directly
      const { data, error } = await supabase
        .from('checklists')
        .update({ project_id: projectId })
        .eq('id', checklistId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['available-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-checklist-items'] });
      toast({
        title: "Success",
        description: "Checklist assigned to project successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign checklist to project",
        variant: "destructive",
      });
    },
  });
}

export function useUnassignChecklistFromProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, checklistId }: { projectId: string; checklistId: string }) => {
      // Since project_checklists table doesn't exist, we'll clear the project_id
      const { error } = await supabase
        .from('checklists')
        .update({ project_id: null })
        .eq('id', checklistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['available-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-checklist-items'] });
      toast({
        title: "Success",
        description: "Checklist removed from project successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove checklist from project",
        variant: "destructive",
      });
    },
  });
}