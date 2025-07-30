import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItemAssignment {
  itemId: string;
  assignedTo: string;
}

export function useBulkAssignChecklistItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (assignments: ChecklistItemAssignment[]) => {
      const results = [];
      
      for (const { itemId, assignedTo } of assignments) {
        const { data, error } = await supabase
          .from('checklist_items')
          .update({
            assigned_to: assignedTo,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
          .select();
        
        if (error) {
          throw new Error(`Failed to assign item ${itemId}: ${error.message}`);
        }
        
        results.push(data);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-checklist-items'] });
      
      toast({
        title: "Assignments completed",
        description: "Checklist items have been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: `Failed to assign checklist items: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}

export function useBulkUnassignChecklistItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update({
          assigned_to: null,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-checklist-items'] });
      
      toast({
        title: "Items unassigned",
        description: "Checklist items have been unassigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unassignment failed",
        description: `Failed to unassign checklist items: ${error.message}`,
        variant: "destructive",
      });
    }
  });
}