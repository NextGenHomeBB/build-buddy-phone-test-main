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
        .select('*')
        .eq('is_template', true);

      if (checklistError) throw checklistError;

      if (!projectId) return allChecklists;

      // Get already assigned checklists for this project
      const { data: assignedChecklists, error: assignedError } = await supabase
        .from('project_checklists')
        .select('checklist_id')
        .eq('project_id', projectId);

      if (assignedError) throw assignedError;

      const assignedIds = assignedChecklists.map(pc => pc.checklist_id);
      
      // Return only unassigned checklists
      return allChecklists.filter(checklist => !assignedIds.includes(checklist.id));
    },
    enabled: !!projectId,
  });
}

export function useAssignChecklistToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, checklistId }: { projectId: string; checklistId: string }) => {
      const { data, error } = await supabase
        .from('project_checklists')
        .insert({
          project_id: projectId,
          checklist_id: checklistId,
          completed_items: {},
        })
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
      const { error } = await supabase
        .from('project_checklists')
        .delete()
        .eq('project_id', projectId)
        .eq('checklist_id', checklistId);

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